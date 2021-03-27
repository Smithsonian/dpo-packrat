/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import { eSystemObjectType, ObjectGraphDataEntry } from '../../../db';
import { SolrClient } from './SolrClient';

export class IndexSolr {
    private objectGraphDatabase: DBAPI.ObjectGraphDatabase = new DBAPI.ObjectGraphDatabase();
    private hierarchyNameMap: Map<number, string> = new Map<number, string>(); // map of idSystemObject -> object name
    private static fullIndexUnderway: boolean = false;

    private countUnit:                  number = 0;
    private countProject:               number = 0;
    private countSubject:               number = 0;
    private countItem:                  number = 0;
    private countCaptureData:           number = 0;
    private countModel:                 number = 0;
    private countScene:                 number = 0;
    private countIntermediaryFile:      number = 0;
    private countProjectDocumentation:  number = 0;
    private countAsset:                 number = 0;
    private countAssetVersion:          number = 0;
    private countActor:                 number = 0;
    private countStakeholder:           number = 0;
    private countUnknown:               number = 0;

    async fullIndexProfiled(): Promise<boolean> {
        LOG.logger.info('****************************************');
        LOG.logger.info('IndexSolr.fullIndexProfiled() starting');
        return new Promise<boolean>((resolve) => {
            const inspector = require('inspector');
            const fs = require('fs');
            const session = new inspector.Session();
            session.connect();

            session.post('Profiler.enable', async () => {
                session.post('Profiler.start', async () => {
                    LOG.logger.info('IndexSolr.fullIndexProfiled() fullIndex() starting');
                    const retValue: boolean = await this.fullIndex();
                    LOG.logger.info('IndexSolr.fullIndexProfiled() fullIndex() complete');
                    resolve(retValue);

                    // some time later...
                    session.post('Profiler.stop', (err, { profile }) => {
                        // Write profile to disk, upload, etc.
                        if (!err) {
                            LOG.logger.info('IndexSolr.fullIndexProfiled() writing profile');
                            fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
                        }
                        LOG.logger.info('IndexSolr.fullIndexProfiled() writing profile ending');
                    });
                });
            });
        });
    }

    async fullIndex(): Promise<boolean> {
        if (IndexSolr.fullIndexUnderway) {
            LOG.logger.error('IndexSolr.fullIndex() already underway; exiting this additional request early');
            return false;
        }

        let retValue: boolean = false;
        try {
            IndexSolr.fullIndexUnderway = true;
            retValue = await this.fullIndexWorker();
        } finally {
            IndexSolr.fullIndexUnderway = false;
        }
        return retValue;
    }

    // TODO: test! Integrate potentially with TBD audit interface, providing a path for system object creation and updates to flow through to Solr
    async indexObject(idSystemObject: number): Promise<boolean> {
        // Compute full object graph for object
        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eAll, 32, this.objectGraphDatabase);
        if (!await OG.fetch()) {
            LOG.logger.error(`IndexSolr.indexObject failed fetching ObjectGraph for ${idSystemObject}`);
            return false;
        }
        const OGDE: ObjectGraphDataEntry | undefined = this.objectGraphDatabase.objectMap.get(idSystemObject);
        if (!OGDE) {
            LOG.logger.error('IndexSolr.indexObject failed fetching ObjectGraphDataEntry from ObjectGraphDatabase');
            return false;
        }

        const doc: any = {};
        if (await this.handleObject(doc, OGDE)) {
            const solrClient: SolrClient = new SolrClient(null, null, null);
            try {
                solrClient._client.add([doc], undefined, function (err, obj) { if (err) LOG.logger.error('IndexSolr.indexObject adding record', err); else obj; });
                solrClient._client.commit(undefined, function (err, obj) { if (err) LOG.logger.error('IndexSolr.indexObject -> commit()', err); else obj; });
            } catch (error) {
                LOG.logger.error(`IndexSolr.indexObject ${idSystemObject} failed`, error);
                return false;
            }
        } else
            LOG.logger.error('IndexSolr.indexObject failed in handleObject');

        return true;
    }

    private async fullIndexWorker(): Promise<boolean> {
        const solrClient: SolrClient = new SolrClient(null, null, null);
        if (!(await this.objectGraphDatabase.fetch())) {
            LOG.logger.error('IndexSolr.fullIndex failed on ObjectGraphDatabase.fetch()');
            return false;
        }

        let documentCount: number = 0;
        let docs: any[] = [];
        for (const objectGraphDataEntry of this.objectGraphDatabase.objectMap.values()) {
            const doc: any = {};
            if (await this.handleObject(doc, objectGraphDataEntry)) {
                docs.push(doc);

                if (docs.length >= 1000) {
                    try {
                        solrClient._client.add(docs, undefined, function (err, obj) { if (err) LOG.logger.error('IndexSolr.fullIndex adding cached records', err); else obj; });
                        solrClient._client.commit(undefined, function (err, obj) { if (err) LOG.logger.error('IndexSolr.fullIndex -> commit()', err); else obj; });
                    } catch (error) {
                        LOG.logger.error('IndexSolr.fullIndexWorker failed', error);
                        return false;
                    }
                    documentCount += docs.length;
                    LOG.logger.info(`IndexSolr.fullIndex committed ${documentCount} total documents`);
                    docs = [];
                }
            } else
                LOG.logger.error('IndexSolr.fullIndex failed in handleObject');
        }

        if (docs.length > 0) {
            try {
                solrClient._client.add(docs, undefined, function (err, obj) { if (err) LOG.logger.error('IndexSolr.fullIndex adding cached records', err); else obj; });
                solrClient._client.commit(undefined, function (err, obj) { if (err) LOG.logger.error('IndexSolr.fullIndex -> commit()', err); else obj; });
            } catch (error) {
                LOG.logger.error('IndexSolr.fullIndexWorker failed', error);
                return false;
            }
            documentCount += docs.length;
        }

        LOG.logger.info(`IndexSolr.fullIndex indexed units: ${this.countUnit}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed projects: ${this.countProject}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed subjects: ${this.countSubject}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed items: ${this.countItem}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed capture data: ${this.countCaptureData}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed models: ${this.countModel}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed scenes: ${this.countScene}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed intermediary files: ${this.countIntermediaryFile}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed project documentation: ${this.countProjectDocumentation}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed assets: ${this.countAsset}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed asset versions: ${this.countAssetVersion}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed actors: ${this.countActor}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed stakeholders: ${this.countStakeholder}`);
        LOG.logger.info(`IndexSolr.fullIndex indexed unknown: ${this.countUnknown}`);
        LOG.logger.info(`IndexSolr.fullIndex committed ${documentCount} total documents`);
        return true;
    }

    private async handleObject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        await this.extractCommonFields(doc, objectGraphDataEntry);

        switch (objectGraphDataEntry.systemObjectIDType.eObjectType) {
            case eSystemObjectType.eUnit:                   return await this.handleUnit(doc, objectGraphDataEntry);
            case eSystemObjectType.eProject:                return await this.handleProject(doc, objectGraphDataEntry);
            case eSystemObjectType.eSubject:                return await this.handleSubject(doc, objectGraphDataEntry);
            case eSystemObjectType.eItem:                   return await this.handleItem(doc, objectGraphDataEntry);
            case eSystemObjectType.eCaptureData:            return await this.handleCaptureData(doc, objectGraphDataEntry);
            case eSystemObjectType.eModel:                  return await this.handleModel(doc, objectGraphDataEntry);
            case eSystemObjectType.eScene:                  return await this.handleScene(doc, objectGraphDataEntry);
            case eSystemObjectType.eIntermediaryFile:       return await this.handleIntermediaryFile(doc, objectGraphDataEntry);
            case eSystemObjectType.eProjectDocumentation:   return await this.handleProjectDocumentation(doc, objectGraphDataEntry);
            case eSystemObjectType.eAsset:                  return await this.handleAsset(doc, objectGraphDataEntry);
            case eSystemObjectType.eAssetVersion:           return await this.handleAssetVersion(doc, objectGraphDataEntry);
            case eSystemObjectType.eActor:                  return await this.handleActor(doc, objectGraphDataEntry);
            case eSystemObjectType.eStakeholder:            return await this.handleStakeholder(doc, objectGraphDataEntry);

            default:
            case eSystemObjectType.eUnknown:                return await this.handleUnknown(doc, objectGraphDataEntry);
        }
    }

    private async extractCommonFields(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<void> {
        const OGDEH: DBAPI.ObjectGraphDataEntryHierarchy = objectGraphDataEntry.extractHierarchy();

        doc.idSystemObject = OGDEH.idSystemObject;
        doc.CommonRetired = OGDEH.retired;
        doc.CommonObjectType = DBAPI.SystemObjectTypeToName(OGDEH.eObjectType);
        doc.CommonOTNumber = OGDEH.eObjectType;
        doc.CommonidObject = OGDEH.idObject;
        doc.CommonIdentifier = await this.computeIdentifiers(objectGraphDataEntry.systemObjectIDType.idSystemObject);

        doc.HierarchyParentID = OGDEH.parents.length == 0 ? [0] : OGDEH.parents;
        doc.HierarchyChildrenID = OGDEH.children.length == 0 ? [0] : OGDEH.children;
        doc.HierarchyAncestorID = OGDEH.ancestors.length == 0 ? [0] : OGDEH.ancestors;

        let nameArray: string[] = [];
        let idArray: number[] = [];

        for (const objInfo of OGDEH.units) {
            let name: string | undefined = this.hierarchyNameMap.get(objInfo.idSystemObject);
            if (!name) {
                const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(objInfo.idObject);
                if (unit) {
                    name = unit.Abbreviation || 'Unknown';
                    this.hierarchyNameMap.set(objInfo.idSystemObject, name);
                } else {
                    name = 'Unknown';
                    LOG.logger.error(`Unable to compute Unit for ${JSON.stringify(objInfo)}`);
                }
            }
            nameArray.push(name);
            idArray.push(objInfo.idSystemObject);
        }
        if (nameArray.length > 0) {
            doc.HierarchyUnit = nameArray;
            doc.HierarchyUnitID = idArray;
            nameArray = [];
            idArray = [];
        }

        for (const objInfo of OGDEH.projects) {
            let name: string | undefined = this.hierarchyNameMap.get(objInfo.idSystemObject);
            if (!name) {
                const project: DBAPI.Project | null = await DBAPI.Project.fetch(objInfo.idObject);
                if (project) {
                    name = project.Name;
                    this.hierarchyNameMap.set(objInfo.idSystemObject, name);
                } else {
                    name = 'Unknown';
                    LOG.logger.error(`Unable to compute Project for ${JSON.stringify(objInfo)}`);
                }
            }
            nameArray.push(name);
            idArray.push(objInfo.idSystemObject);
        }
        if (nameArray.length > 0) {
            doc.HierarchyProject = nameArray;
            doc.HierarchyProjectID = idArray;
            nameArray = [];
            idArray = [];
        }

        for (const objInfo of OGDEH.subjects) {
            let name: string | undefined = this.hierarchyNameMap.get(objInfo.idSystemObject);
            if (!name) {
                const subject: DBAPI.Subject | null = await DBAPI.Subject.fetch(objInfo.idObject);
                if (subject) {
                    name = subject.Name;
                    this.hierarchyNameMap.set(objInfo.idSystemObject, name);
                } else {
                    name = 'Unknown';
                    LOG.logger.error(`Unable to compute Subject for ${JSON.stringify(objInfo)}`);
                }
            }
            nameArray.push(name);
            idArray.push(objInfo.idSystemObject);
        }
        if (nameArray.length > 0) {
            doc.HierarchySubject = nameArray;
            doc.HierarchySubjectID = idArray;
            nameArray = [];
            idArray = [];
        }

        for (const objInfo of OGDEH.items) {
            let name: string | undefined = this.hierarchyNameMap.get(objInfo.idSystemObject);
            if (!name) {
                const item: DBAPI.Item | null = await DBAPI.Item.fetch(objInfo.idObject);
                if (item) {
                    name = item.Name;
                    this.hierarchyNameMap.set(objInfo.idSystemObject, name);
                } else {
                    name = 'Unknown';
                    LOG.logger.error(`Unable to compute Item for ${JSON.stringify(objInfo)}`);
                }
            }
            nameArray.push(name);
            idArray.push(objInfo.idSystemObject);
        }
        if (nameArray.length > 0) {
            doc.HierarchyItem = nameArray;
            doc.HierarchyItemID = idArray;
            nameArray = [];
            idArray = [];
        }

        const ChildrenObjectTypes: string[] = [];
        for (const childrenObjectType of OGDEH.childrenObjectTypes)
            ChildrenObjectTypes.push(DBAPI.SystemObjectTypeToName(childrenObjectType));
        doc.ChildrenObjectTypes = ChildrenObjectTypes;

        let VocabList: string[] = [];
        VocabList = await this.computeVocabularyTerms(OGDEH.childrenCaptureMethods);
        doc.ChildrenCaptureMethods = VocabList;
        VocabList = [];

        VocabList = await this.computeVocabularyTerms(OGDEH.childrenVariantTypes);
        doc.ChildrenVariantTypes = VocabList;
        VocabList = [];

        VocabList = await this.computeVocabularyTerms(OGDEH.childrenModelPurposes);
        doc.ChildrenModelPurposes = VocabList;
        VocabList = [];

        VocabList = await this.computeVocabularyTerms(OGDEH.childrenModelFileTypes);
        doc.ChildrenModelFileTypes = VocabList;
        VocabList = [];
    }

    private async computeVocabulary(idVocabulary: number): Promise<string | undefined> {
        const vocab: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(idVocabulary);
        return vocab ? vocab.Term : undefined;
    }

    private async computeVocabularyTerms(IDs: number[]): Promise<string[]> {
        const retValue: string[] = [];
        for (const ID of IDs) {
            const vocab: string | undefined = await this.computeVocabulary(ID);
            if (vocab) retValue.push(vocab);
        }
        return retValue;
    }

    private async handleUnit(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!unit) {
            LOG.logger.error(`IndexSolr.handleUnit failed to compute unit from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = unit.Name;
        doc.UnitAbbreviation = unit.Abbreviation;
        doc.UnitARKPrefix = unit.ARKPrefix;
        this.countUnit++;
        return true;
    }

    private async handleProject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const project: DBAPI.Project | null = await DBAPI.Project.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!project) {
            LOG.logger.error(`IndexSolr.handleProject failed to compute project from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = project.Name;
        doc.CommonDescription = project.Description;
        this.countProject++;
        return true;
    }

    private async handleSubject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const subject: DBAPI.Subject | null = await DBAPI.Subject.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!subject) {
            LOG.logger.error(`IndexSolr.handleSubject failed to compute subject from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        doc.CommonName = subject.Name;
        if (subject.idIdentifierPreferred) {
            const ID: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(subject.idIdentifierPreferred);
            if (ID)
                doc.SubjectIdentifierPreferred = ID.IdentifierValue;
        }
        this.countSubject++;
        return true;
    }

    private async handleItem(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const item: DBAPI.Item | null = await DBAPI.Item.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!item) {
            LOG.logger.error(`IndexSolr.handleItem failed to compute item from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = item.Name;
        doc.ItemEntireSubject = item.EntireSubject;
        this.countItem++;
        return true;
    }

    private async handleCaptureData(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const captureData: DBAPI.CaptureData | null = await DBAPI.CaptureData.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!captureData) {
            LOG.logger.error(`IndexSolr.handleCaptureData failed to compute capture data from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        const captureDataPhotos: DBAPI.CaptureDataPhoto[] | null = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(captureData.idCaptureData);
        const captureDataPhoto: DBAPI.CaptureDataPhoto | null = (captureDataPhotos && captureDataPhotos.length > 0) ? captureDataPhotos[0] : null;

        doc.CommonName = captureData.Name;
        doc.CommonDescription = captureData.Description;
        doc.CommonDateCreated = captureData.DateCaptured;
        doc.CDCaptureMethod = await this.lookupVocabulary(captureData.idVCaptureMethod);
        if (captureDataPhoto) {
            doc.CDCaptureDatasetType = await this.lookupVocabulary(captureDataPhoto.idVCaptureDatasetType);
            doc.CDCaptureDatasetFieldID = captureDataPhoto.CaptureDatasetFieldID;
            doc.CDItemPositionType = await this.lookupVocabulary(captureDataPhoto.idVItemPositionType);
            doc.CDItemPositionFieldID = captureDataPhoto.ItemPositionFieldID;
            doc.CDItemArrangementFieldID = captureDataPhoto.ItemArrangementFieldID;
            doc.CDFocusType = await this.lookupVocabulary(captureDataPhoto.idVFocusType);
            doc.CDLightSourceType = await this.lookupVocabulary(captureDataPhoto.idVLightSourceType);
            doc.CDBackgroundRemovalMethod = await this.lookupVocabulary(captureDataPhoto.idVBackgroundRemovalMethod);
            doc.CDClusterType = await this.lookupVocabulary(captureDataPhoto.idVClusterType);
            doc.CDClusterGeometryFieldID = captureDataPhoto.ClusterGeometryFieldID;
            doc.CDCameraSettingsUniform = captureDataPhoto.CameraSettingsUniform;
        }

        const captureDataFiles: DBAPI.CaptureDataFile[] | null = await DBAPI.CaptureDataFile.fetchFromCaptureData(captureData.idCaptureData);
        if (captureDataFiles) {
            const variantTypeMap: Map<string, boolean> = new Map<string, boolean>();
            for (const captureDataFile of captureDataFiles) {
                const variantType: string | null = await this.lookupVocabulary(captureDataFile.idVVariantType);
                if (variantType)
                    variantTypeMap.set(variantType, true);
            }
            if (variantTypeMap.size > 0)
                doc.CDVariantType = [...variantTypeMap.keys()];
        }
        this.countCaptureData++;
        return true;
    }

    private async handleModel(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const modelConstellation: DBAPI.ModelConstellation | null = await DBAPI.ModelConstellation.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!modelConstellation) {
            LOG.logger.error(`IndexSolr.handleModel failed to compute ModelConstellation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        const model: DBAPI.Model = modelConstellation.model;

        doc.CommonName = model.Name;
        doc.CommonDateCreated = model.DateCreated;

        doc.ModelCreationMethod = await this.computeVocabulary(model.idVCreationMethod);
        doc.ModelMaster = model.Master;
        doc.ModelAuthoritative = model.Authoritative;
        doc.ModelModality = await this.computeVocabulary(model.idVModality);
        doc.ModelUnits = await this.computeVocabulary(model.idVUnits);
        doc.ModelPurpose = await this.computeVocabulary(model.idVPurpose);
        doc.ModelFileType = await this.computeVocabulary(model.idVFileType);

        doc.ModelCountAnimations = model.CountAnimations;
        doc.ModelCountCameras = model.CountCameras;
        doc.ModelCountFaces = model.CountFaces;
        doc.ModelCountLights = model.CountLights;
        doc.ModelCountMaterials = model.CountMaterials;
        doc.ModelCountMeshes = model.CountMeshes;
        doc.ModelCountVertices = model.CountVertices;
        doc.ModelCountEmbeddedTextures = model.CountEmbeddedTextures;
        doc.ModelCountLinkedTextures = model.CountLinkedTextures;
        doc.ModelFileEncoding = model.FileEncoding;

        const modelMaterialNameMap: Map<string, boolean> = new Map<string, boolean>();
        const modelMaterialChannelTypeMap: Map<string, boolean> = new Map<string, boolean>();
        const modelMaterialChannelTypeOtherMap: Map<string, boolean> = new Map<string, boolean>();
        const modelMaterialChannelUVMapEmbeddedMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMaterialChannelPositionMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMaterialChannelWidthMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMaterialChannelValuesMap: Map<string, boolean> = new Map<string, boolean>();
        const modelMaterialChannelAdditionalAttributesMap: Map<string, boolean> = new Map<string, boolean>();
        const modelMaterialUVMapEdgeLengthMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsBoundingBoxP1XMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsBoundingBoxP1YMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsBoundingBoxP1ZMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsBoundingBoxP2XMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsBoundingBoxP2YMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsBoundingBoxP2ZMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsCountPointMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsCountFaceMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsCountColorChannelMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsCountTextureCoorinateChannelMap: Map<number, boolean> = new Map<number, boolean>();
        const modelMetricsHasBonesMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMetricsHasFaceNormalsMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMetricsHasTangentsMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMetricsHasTextureCoordinatesMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMetricsHasVertexNormalsMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMetricsHasVertexColorMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMetricsIsTwoManifoldUnboundedMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMetricsIsTwoManifoldBoundedMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMetricsIsWatertightMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelMetricsSelfIntersectingMap: Map<boolean, boolean> = new Map<boolean, boolean>();

        if (modelConstellation.modelMaterials) {
            for (const modelMaterial of modelConstellation.modelMaterials) {
                if (modelMaterial.Name)
                    modelMaterialNameMap.set(modelMaterial.Name, true);
            }
        }

        if (modelConstellation.modelMaterialChannels) {
            for (const modelMaterialChannel of modelConstellation.modelMaterialChannels) {
                if (modelMaterialChannel.idVMaterialType) {
                    const materialType = await this.computeVocabulary(modelMaterialChannel.idVMaterialType);
                    if (materialType)
                        modelMaterialChannelTypeMap.set(materialType, true);
                }
                if (modelMaterialChannel.MaterialTypeOther) modelMaterialChannelTypeOtherMap.set(modelMaterialChannel.MaterialTypeOther, true);
                if (modelMaterialChannel.UVMapEmbedded !== null) modelMaterialChannelUVMapEmbeddedMap.set(modelMaterialChannel.UVMapEmbedded, true);
                if (modelMaterialChannel.ChannelPosition) modelMaterialChannelPositionMap.set(modelMaterialChannel.ChannelPosition, true);
                if (modelMaterialChannel.ChannelWidth) modelMaterialChannelWidthMap.set(modelMaterialChannel.ChannelWidth, true);

                let channelValue: string = [modelMaterialChannel.Scalar1, modelMaterialChannel.Scalar2,
                    modelMaterialChannel.Scalar3, modelMaterialChannel.Scalar4].join(', ');
                if (channelValue.indexOf(',') >= 0)
                    channelValue = `(${channelValue})`;
                if (channelValue) modelMaterialChannelValuesMap.set(channelValue, true);

                if (modelMaterialChannel.AdditionalAttributes) modelMaterialChannelAdditionalAttributesMap.set(modelMaterialChannel.AdditionalAttributes, true);
            }
        }

        if (modelConstellation.modelMaterialUVMaps) {
            for (const modelMaterialUVMap of modelConstellation.modelMaterialUVMaps)
                modelMaterialUVMapEdgeLengthMap.set(modelMaterialUVMap.UVMapEdgeLength, true);
        }

        const modelMetricsList: DBAPI.ModelMetrics[] = [];
        if (modelConstellation.modelMetrics)
            modelMetricsList.push(...modelConstellation.modelMetrics);
        for (const modelMetrics of modelMetricsList) {
            if (modelMetrics.BoundingBoxP1X) modelMetricsBoundingBoxP1XMap.set(modelMetrics.BoundingBoxP1X, true);
            if (modelMetrics.BoundingBoxP1Y) modelMetricsBoundingBoxP1YMap.set(modelMetrics.BoundingBoxP1Y, true);
            if (modelMetrics.BoundingBoxP1Z) modelMetricsBoundingBoxP1ZMap.set(modelMetrics.BoundingBoxP1Z, true);
            if (modelMetrics.BoundingBoxP2X) modelMetricsBoundingBoxP2XMap.set(modelMetrics.BoundingBoxP2X, true);
            if (modelMetrics.BoundingBoxP2Y) modelMetricsBoundingBoxP2YMap.set(modelMetrics.BoundingBoxP2Y, true);
            if (modelMetrics.BoundingBoxP2Z) modelMetricsBoundingBoxP2ZMap.set(modelMetrics.BoundingBoxP2Z, true);
            if (modelMetrics.CountPoint) modelMetricsCountPointMap.set(modelMetrics.CountPoint, true);
            if (modelMetrics.CountFace) modelMetricsCountFaceMap.set(modelMetrics.CountFace, true);
            if (modelMetrics.CountColorChannel) modelMetricsCountColorChannelMap.set(modelMetrics.CountColorChannel, true);
            if (modelMetrics.CountTextureCoorinateChannel) modelMetricsCountTextureCoorinateChannelMap.set(modelMetrics.CountTextureCoorinateChannel, true);
            if (modelMetrics.HasBones) modelMetricsHasBonesMap.set(modelMetrics.HasBones, true);
            if (modelMetrics.HasFaceNormals) modelMetricsHasFaceNormalsMap.set(modelMetrics.HasFaceNormals, true);
            if (modelMetrics.HasTangents) modelMetricsHasTangentsMap.set(modelMetrics.HasTangents, true);
            if (modelMetrics.HasTextureCoordinates) modelMetricsHasTextureCoordinatesMap.set(modelMetrics.HasTextureCoordinates, true);
            if (modelMetrics.HasVertexNormals) modelMetricsHasVertexNormalsMap.set(modelMetrics.HasVertexNormals, true);
            if (modelMetrics.HasVertexColor) modelMetricsHasVertexColorMap.set(modelMetrics.HasVertexColor, true);
            if (modelMetrics.IsTwoManifoldUnbounded) modelMetricsIsTwoManifoldUnboundedMap.set(modelMetrics.IsTwoManifoldUnbounded, true);
            if (modelMetrics.IsTwoManifoldBounded) modelMetricsIsTwoManifoldBoundedMap.set(modelMetrics.IsTwoManifoldBounded, true);
            if (modelMetrics.IsWatertight) modelMetricsIsWatertightMap.set(modelMetrics.IsWatertight, true);
            if (modelMetrics.SelfIntersecting) modelMetricsSelfIntersectingMap.set(modelMetrics.SelfIntersecting, true);

        }
        doc.ModelMaterialName = [...modelMaterialNameMap.keys()];
        doc.ModelMaterialChannelType = [...modelMaterialChannelTypeMap.keys()];
        doc.ModelMaterialChannelTypeOther = [...modelMaterialChannelTypeOtherMap.keys()];
        doc.ModelMaterialChannelUVMapEmbedded = [...modelMaterialChannelUVMapEmbeddedMap.keys()];
        doc.ModelMaterialChannelPosition = [...modelMaterialChannelPositionMap.keys()];
        doc.ModelMaterialChannelWidth = [...modelMaterialChannelWidthMap.keys()];
        doc.ModelMaterialChannelValues = [...modelMaterialChannelValuesMap.keys()];
        doc.ModelMaterialChannelAdditionalAttributes = [...modelMaterialChannelAdditionalAttributesMap.keys()];
        doc.ModelMaterialUVMapEdgeLength = [...modelMaterialUVMapEdgeLengthMap.keys()];
        doc.ModelMetricsBoundingBoxP1X = [...modelMetricsBoundingBoxP1XMap.keys()];
        doc.ModelMetricsBoundingBoxP1Y = [...modelMetricsBoundingBoxP1YMap.keys()];
        doc.ModelMetricsBoundingBoxP1Z = [...modelMetricsBoundingBoxP1ZMap.keys()];
        doc.ModelMetricsBoundingBoxP2X = [...modelMetricsBoundingBoxP2XMap.keys()];
        doc.ModelMetricsBoundingBoxP2Y = [...modelMetricsBoundingBoxP2YMap.keys()];
        doc.ModelMetricsBoundingBoxP2Z = [...modelMetricsBoundingBoxP2ZMap.keys()];
        doc.ModelMetricsCountPoint = [...modelMetricsCountPointMap.keys()];
        doc.ModelMetricsCountFace = [...modelMetricsCountFaceMap.keys()];
        doc.ModelMetricsCountColorChannel = [...modelMetricsCountColorChannelMap.keys()];
        doc.ModelMetricsCountTextureCoorinateChannel = [...modelMetricsCountTextureCoorinateChannelMap.keys()];
        doc.ModelMetricsHasBones = [...modelMetricsHasBonesMap.keys()];
        doc.ModelMetricsHasFaceNormals = [...modelMetricsHasFaceNormalsMap.keys()];
        doc.ModelMetricsHasTangents = [...modelMetricsHasTangentsMap.keys()];
        doc.ModelMetricsHasTextureCoordinates = [...modelMetricsHasTextureCoordinatesMap.keys()];
        doc.ModelMetricsHasVertexNormals = [...modelMetricsHasVertexNormalsMap.keys()];
        doc.ModelMetricsHasVertexColor = [...modelMetricsHasVertexColorMap.keys()];
        doc.MetricsIsTwoManifoldUnbounded = [...modelMetricsIsTwoManifoldUnboundedMap.keys()];
        doc.MetricsIsTwoManifoldBounded = [...modelMetricsIsTwoManifoldBoundedMap.keys()];
        doc.ModelMetricsIsWatertight = [...modelMetricsIsWatertightMap.keys()];
        doc.ModelMetricsSelfIntersecting = [...modelMetricsSelfIntersectingMap.keys()];

        // TODO: should we turn multivalued metrics and bounding boxes into single valued attributes, and combine the multiple values in a meaningful way (e.g. add point and face counts, combine bounding boxes)
        this.countModel++;
        return true;
    }

    private async handleScene(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!scene) {
            LOG.logger.error(`IndexSolr.handleScene failed to compute scene from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = scene.Name;
        doc.SceneIsOriented = scene.IsOriented;
        doc.SceneHasBeenQCd = scene.HasBeenQCd;
        this.countScene++;
        return true;
    }

    private async handleIntermediaryFile(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const intermediaryFile: DBAPI.IntermediaryFile | null = await DBAPI.IntermediaryFile.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!intermediaryFile) {
            LOG.logger.error(`IndexSolr.handleIntermediaryFile failed to compute intermediaryFile from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = `Intermediary File created ${intermediaryFile.DateCreated.toISOString()}`;
        doc.CommonDateCreated = intermediaryFile.DateCreated;
        this.countIntermediaryFile++;
        return true;
    }

    private async handleProjectDocumentation(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const projectDocumentation: DBAPI.ProjectDocumentation | null = await DBAPI.ProjectDocumentation.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!projectDocumentation) {
            LOG.logger.error(`IndexSolr.handleProjectDocumentation failed to compute projectDocumentation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = projectDocumentation.Name;
        doc.CommonDescription = projectDocumentation.Description;
        this.countProjectDocumentation++;
        return true;
    }

    private async handleAsset(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!asset) {
            LOG.logger.error(`IndexSolr.handleAsset failed to compute asset from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = asset.FileName;
        doc.AssetFileName = asset.FileName;
        doc.AssetFilePath = asset.FilePath;
        doc.AssetType = await this.lookupVocabulary(asset.idVAssetType);
        this.countAsset++;
        return true;
    }

    private async handleAssetVersion(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!assetVersion) {
            LOG.logger.error(`IndexSolr.handleAssetVersion failed to compute assetVersion from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        const user: DBAPI.User | null = await DBAPI.User.fetch(assetVersion.idUserCreator);
        if (!user) {
            LOG.logger.error(`IndexSolr.handleAssetVersion failed to compute idUserCreator from ${assetVersion.idUserCreator}`);
            return false;
        }
        doc.CommonName = `Version ${assetVersion.Version}`;
        doc.AVUserCreator = user.Name;
        doc.AVStorageHash = assetVersion.StorageHash;
        doc.AVStorageSize = Number(assetVersion.StorageSize);
        doc.AVIngested = assetVersion.Ingested;
        doc.AVBulkIngest = assetVersion.BulkIngest;
        this.countAssetVersion++;
        return true;
    }

    private async handleActor(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const actor: DBAPI.Actor | null = await DBAPI.Actor.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!actor) {
            LOG.logger.error(`IndexSolr.handleActor failed to compute actor from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = actor.IndividualName;
        doc.CommonOrganizationName = actor.OrganizationName;
        this.countActor++;
        return true;
    }

    private async handleStakeholder(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const stakeholder: DBAPI.Stakeholder | null = await DBAPI.Stakeholder.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!stakeholder) {
            LOG.logger.error(`IndexSolr.handleStakeholder failed to compute stakeholder from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        doc.CommonName = stakeholder.IndividualName;
        doc.CommonOrganizationName = stakeholder.OrganizationName;
        doc.StakeholderEmailAddress = stakeholder.EmailAddress;
        doc.StakeholderPhoneNumberMobile = stakeholder.PhoneNumberMobile;
        doc.StakeholderPhoneNumberOffice = stakeholder.PhoneNumberOffice;
        doc.StakeholderMailingAddress = stakeholder.MailingAddress;
        this.countStakeholder++;
        return true;
    }

    private async handleUnknown(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        LOG.logger.error(`IndexSolr.fullIndex called with unknown object type from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
        doc.CommonName = `Unknown ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`;
        this.countUnknown++;
        return false;
    }

    private async computeIdentifiers(idSystemObject: number): Promise<string[]> {
        const identifiersRet: string[] = [];
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);
        if (identifiers) {
            for (const identifier of identifiers)
                identifiersRet.push(identifier.IdentifierValue);
        }
        return identifiersRet;
    }

    private async lookupVocabulary(idVocabulary: number | null): Promise<string> {
        if (!idVocabulary) return '';
        const vocabulary: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(idVocabulary);
        return vocabulary ? vocabulary.Term : '';
    }
}