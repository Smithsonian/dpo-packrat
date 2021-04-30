/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
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
        LOG.info('****************************************', LOG.LS.eNAV);
        LOG.info('IndexSolr.fullIndexProfiled() starting', LOG.LS.eNAV);
        return new Promise<boolean>((resolve) => {
            const inspector = require('inspector');
            const fs = require('fs');
            const session = new inspector.Session();
            session.connect();

            session.post('Profiler.enable', async () => {
                session.post('Profiler.start', async () => {
                    LOG.info('IndexSolr.fullIndexProfiled() fullIndex() starting', LOG.LS.eNAV);
                    const retValue: boolean = await this.fullIndex();
                    LOG.info('IndexSolr.fullIndexProfiled() fullIndex() complete', LOG.LS.eNAV);
                    resolve(retValue);

                    // some time later...
                    session.post('Profiler.stop', (err, { profile }) => {
                        // Write profile to disk, upload, etc.
                        if (!err) {
                            LOG.info('IndexSolr.fullIndexProfiled() writing profile', LOG.LS.eNAV);
                            fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
                        }
                        LOG.info('IndexSolr.fullIndexProfiled() writing profile ending', LOG.LS.eNAV);
                    });
                });
            });
        });
    }

    async fullIndex(): Promise<boolean> {
        if (IndexSolr.fullIndexUnderway) {
            LOG.error('IndexSolr.fullIndex() already underway; exiting this additional request early', LOG.LS.eNAV);
            return false;
        }

        let retValue: boolean = false;
        try {
            IndexSolr.fullIndexUnderway = true;
            retValue = await this.fullIndexWorker();
        } catch (error) {
            LOG.error('IndexSolr.fullIndex', LOG.LS.eNAV, error);
        } finally {
            IndexSolr.fullIndexUnderway = false;
        }
        return retValue;
    }

    async indexObject(idSystemObject: number): Promise<boolean> {
        // Compute full object graph for object
        if (!await this.objectGraphDatabase.fetchFromSystemObject(idSystemObject))
            LOG.error(`IndexSolr.indexObject(${idSystemObject}) failed computing ObjectGraph`, LOG.LS.eNAV);

        const OGDE: ObjectGraphDataEntry | undefined = this.objectGraphDatabase.objectMap.get(idSystemObject);
        if (!OGDE) {
            LOG.error(`IndexSolr.indexObject(${idSystemObject}) failed fetching ObjectGraphDataEntry from ObjectGraphDatabase`, LOG.LS.eNAV);
            return false;
        }

        const docs: any[] = [];
        const doc: any = {};
        if (await this.handleObject(doc, OGDE)) {
            docs.push(doc);

            if (!await this.handleAncestors(docs, OGDE)) // updates docs, if there are ancestors and if OGDE has children data
                return false;

            // LOG.info(`IndexSolr.indexObject(${idSystemObject}) produced ${JSON.stringify(doc, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eNAV);
            const solrClient: SolrClient = new SolrClient(null, null, null);
            try {
                let res: H.IOResults = await solrClient.add(docs);
                if (res.success)
                    res = await solrClient.commit();
                if (!res.success)
                    LOG.error(`IndexSolr.indexObject failed: ${res.error}`, LOG.LS.eNAV);
            } catch (error) {
                LOG.error(`IndexSolr.indexObject(${idSystemObject}) failed`, LOG.LS.eNAV, error);
                return false;
            }

            LOG.info(`IndexSolr.indexObject(${idSystemObject}) succeeded, updating ${docs.length} documents`, LOG.LS.eNAV);
        } else
            LOG.error(`IndexSolr.indexObject(${idSystemObject}) failed in handleObject`, LOG.LS.eNAV);

        return true;
    }

    private async handleAncestors(docs: any[], OGDE: ObjectGraphDataEntry): Promise<boolean> {
        const OGDEHChildrenInfo: DBAPI.ObjectGraphDataEntryHierarchy = OGDE.extractChildrenHierarchy(null);
        if (OGDEHChildrenInfo.childrenInfoEmpty())
            return true;

        for (const idSystemObject of OGDE.ancestorObjectMap.keys()) {
            const doc: any = {};
            doc.id = idSystemObject;
            await this.extractCommonChildrenFields(doc, OGDEHChildrenInfo, false); // false means we're updating
            docs.push(doc);
            // LOG.info(`IndexSolr.handleAncestors prepping to update ${JSON.stringify(doc)}`, LOG.LS.eNAV);
        }
        return true;
    }

    private async fullIndexWorker(): Promise<boolean> {
        const solrClient: SolrClient = new SolrClient(null, null, null);
        if (!(await this.objectGraphDatabase.fetch())) {
            LOG.error('IndexSolr.fullIndex failed on ObjectGraphDatabase.fetch()', LOG.LS.eNAV);
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
                        let res: H.IOResults = await solrClient.add(docs);
                        if (res.success)
                            res = await solrClient.commit();
                        if (!res.success)
                            LOG.error(`IndexSolr.fullIndexWorker failed: ${res.error}`, LOG.LS.eNAV);
                    } catch (error) {
                        LOG.error('IndexSolr.fullIndexWorker failed', LOG.LS.eNAV, error);
                        return false;
                    }
                    documentCount += docs.length;
                    LOG.info(`IndexSolr.fullIndex committed ${documentCount} total documents`, LOG.LS.eNAV);
                    docs = [];
                }
            } else
                LOG.error('IndexSolr.fullIndex failed in handleObject', LOG.LS.eNAV);
        }

        if (docs.length > 0) {
            try {
                let res: H.IOResults = await solrClient.add(docs);
                if (res.success)
                    res = await solrClient.commit();
                if (!res.success)
                    LOG.error(`IndexSolr.fullIndexWorker failed: ${res.error}`, LOG.LS.eNAV);
            } catch (error) {
                LOG.error('IndexSolr.fullIndexWorker failed', LOG.LS.eNAV, error);
                return false;
            }
            documentCount += docs.length;
        }

        LOG.info(`IndexSolr.fullIndex indexed units: ${this.countUnit}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed projects: ${this.countProject}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed subjects: ${this.countSubject}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed items: ${this.countItem}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed capture data: ${this.countCaptureData}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed models: ${this.countModel}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed scenes: ${this.countScene}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed intermediary files: ${this.countIntermediaryFile}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed project documentation: ${this.countProjectDocumentation}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed assets: ${this.countAsset}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed asset versions: ${this.countAssetVersion}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed actors: ${this.countActor}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed stakeholders: ${this.countStakeholder}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex indexed unknown: ${this.countUnknown}`, LOG.LS.eNAV);
        LOG.info(`IndexSolr.fullIndex committed ${documentCount} total documents`, LOG.LS.eNAV);
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

        doc.id = OGDEH.idSystemObject;
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
                    LOG.error(`Unable to compute Unit for ${JSON.stringify(objInfo)}`, LOG.LS.eNAV);
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
                    LOG.error(`Unable to compute Project for ${JSON.stringify(objInfo)}`, LOG.LS.eNAV);
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
                    LOG.error(`Unable to compute Subject for ${JSON.stringify(objInfo)}`, LOG.LS.eNAV);
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
                    LOG.error(`Unable to compute Item for ${JSON.stringify(objInfo)}`, LOG.LS.eNAV);
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

        await this.extractCommonChildrenFields(doc, OGDEH, true);
    }

    private async extractCommonChildrenFields(doc: any, OGDEH: DBAPI.ObjectGraphDataEntryHierarchy, create: boolean): Promise<void> {
        const ChildrenObjectTypes: string[] = [];
        for (const childrenObjectType of OGDEH.childrenObjectTypes)
            ChildrenObjectTypes.push(DBAPI.SystemObjectTypeToName(childrenObjectType));
        if (ChildrenObjectTypes.length > 0)
            doc.ChildrenObjectTypes = create ? ChildrenObjectTypes : { 'add': ChildrenObjectTypes };

        let VocabList: string[] = [];
        VocabList = await this.computeVocabularyTerms(OGDEH.childrenCaptureMethods);
        if (VocabList.length > 0) {
            doc.ChildrenCaptureMethods = create ?  VocabList : { 'add': VocabList };
            VocabList = [];
        }

        VocabList = await this.computeVocabularyTerms(OGDEH.childrenVariantTypes);
        if (VocabList.length > 0) {
            doc.ChildrenVariantTypes = create ?  VocabList : { 'add': VocabList };
            VocabList = [];
        }

        VocabList = await this.computeVocabularyTerms(OGDEH.childrenModelPurposes);
        if (VocabList.length > 0) {
            doc.ChildrenModelPurposes = create ?  VocabList : { 'add': VocabList };
            VocabList = [];
        }

        VocabList = await this.computeVocabularyTerms(OGDEH.childrenModelFileTypes);
        if (VocabList.length > 0) {
            doc.ChildrenModelFileTypes = create ?  VocabList : { 'add': VocabList };
            VocabList = [];
        }

        if (OGDEH.childrenDateCreated.length > 0)
            doc.ChildrenDateCreated = create ? OGDEH.childrenDateCreated : { 'add': OGDEH.childrenDateCreated };
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
            LOG.error(`IndexSolr.handleUnit failed to compute unit from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
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
            LOG.error(`IndexSolr.handleProject failed to compute project from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
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
            LOG.error(`IndexSolr.handleSubject failed to compute subject from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
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
            LOG.error(`IndexSolr.handleItem failed to compute item from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
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
            LOG.error(`IndexSolr.handleCaptureData failed to compute capture data from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        const captureDataPhotos: DBAPI.CaptureDataPhoto[] | null = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(captureData.idCaptureData);
        const captureDataPhoto: DBAPI.CaptureDataPhoto | null = (captureDataPhotos && captureDataPhotos.length > 0) ? captureDataPhotos[0] : null;

        doc.CommonName = captureData.Name;
        doc.CommonDescription = captureData.Description;
        doc.CommonDateCreated = captureData.DateCaptured;
        doc.ChildrenDateCreated = [captureData.DateCaptured];
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
            LOG.error(`IndexSolr.handleModel failed to compute ModelConstellation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        const model: DBAPI.Model = modelConstellation.Model;

        doc.CommonName = model.Name;
        doc.CommonDateCreated = model.DateCreated;
        doc.ChildrenDateCreated = [model.DateCreated];

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
        const modelObjectBoundingBoxP1XMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectBoundingBoxP1YMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectBoundingBoxP1ZMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectBoundingBoxP2XMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectBoundingBoxP2YMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectBoundingBoxP2ZMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectCountVerticesMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectCountFacesMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectCountColorChannelsMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectCountTextureCoordinateChannelsMap: Map<number, boolean> = new Map<number, boolean>();
        const modelObjectHasBonesMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelObjectHasFaceNormalsMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelObjectHasTangentsMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelObjectHasTextureCoordinatesMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelObjectHasVertexNormalsMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelObjectHasVertexColorMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelObjectIsTwoManifoldUnboundedMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelObjectIsTwoManifoldBoundedMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelObjectIsWatertightMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const modelObjectSelfIntersectingMap: Map<boolean, boolean> = new Map<boolean, boolean>();

        if (modelConstellation.ModelMaterials) {
            for (const modelMaterial of modelConstellation.ModelMaterials) {
                if (modelMaterial.Name)
                    modelMaterialNameMap.set(modelMaterial.Name, true);
            }
        }

        if (modelConstellation.ModelMaterialChannels) {
            for (const modelMaterialChannel of modelConstellation.ModelMaterialChannels) {
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

        if (modelConstellation.ModelMaterialUVMaps) {
            for (const modelMaterialUVMap of modelConstellation.ModelMaterialUVMaps)
                modelMaterialUVMapEdgeLengthMap.set(modelMaterialUVMap.UVMapEdgeLength, true);
        }

        const modelObjectsList: DBAPI.ModelObject[] = [];
        if (modelConstellation.ModelObjects)
            modelObjectsList.push(...modelConstellation.ModelObjects);
        for (const modelObject of modelObjectsList) {
            if (modelObject.BoundingBoxP1X) modelObjectBoundingBoxP1XMap.set(modelObject.BoundingBoxP1X, true);
            if (modelObject.BoundingBoxP1Y) modelObjectBoundingBoxP1YMap.set(modelObject.BoundingBoxP1Y, true);
            if (modelObject.BoundingBoxP1Z) modelObjectBoundingBoxP1ZMap.set(modelObject.BoundingBoxP1Z, true);
            if (modelObject.BoundingBoxP2X) modelObjectBoundingBoxP2XMap.set(modelObject.BoundingBoxP2X, true);
            if (modelObject.BoundingBoxP2Y) modelObjectBoundingBoxP2YMap.set(modelObject.BoundingBoxP2Y, true);
            if (modelObject.BoundingBoxP2Z) modelObjectBoundingBoxP2ZMap.set(modelObject.BoundingBoxP2Z, true);
            if (modelObject.CountVertices) modelObjectCountVerticesMap.set(modelObject.CountVertices, true);
            if (modelObject.CountFaces) modelObjectCountFacesMap.set(modelObject.CountFaces, true);
            if (modelObject.CountColorChannels) modelObjectCountColorChannelsMap.set(modelObject.CountColorChannels, true);
            if (modelObject.CountTextureCoordinateChannels) modelObjectCountTextureCoordinateChannelsMap.set(modelObject.CountTextureCoordinateChannels, true);
            if (modelObject.HasBones) modelObjectHasBonesMap.set(modelObject.HasBones, true);
            if (modelObject.HasFaceNormals) modelObjectHasFaceNormalsMap.set(modelObject.HasFaceNormals, true);
            if (modelObject.HasTangents) modelObjectHasTangentsMap.set(modelObject.HasTangents, true);
            if (modelObject.HasTextureCoordinates) modelObjectHasTextureCoordinatesMap.set(modelObject.HasTextureCoordinates, true);
            if (modelObject.HasVertexNormals) modelObjectHasVertexNormalsMap.set(modelObject.HasVertexNormals, true);
            if (modelObject.HasVertexColor) modelObjectHasVertexColorMap.set(modelObject.HasVertexColor, true);
            if (modelObject.IsTwoManifoldUnbounded) modelObjectIsTwoManifoldUnboundedMap.set(modelObject.IsTwoManifoldUnbounded, true);
            if (modelObject.IsTwoManifoldBounded) modelObjectIsTwoManifoldBoundedMap.set(modelObject.IsTwoManifoldBounded, true);
            if (modelObject.IsWatertight) modelObjectIsWatertightMap.set(modelObject.IsWatertight, true);
            if (modelObject.SelfIntersecting) modelObjectSelfIntersectingMap.set(modelObject.SelfIntersecting, true);

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
        doc.ModelObjectBoundingBoxP1X = [...modelObjectBoundingBoxP1XMap.keys()];
        doc.ModelObjectBoundingBoxP1Y = [...modelObjectBoundingBoxP1YMap.keys()];
        doc.ModelObjectBoundingBoxP1Z = [...modelObjectBoundingBoxP1ZMap.keys()];
        doc.ModelObjectBoundingBoxP2X = [...modelObjectBoundingBoxP2XMap.keys()];
        doc.ModelObjectBoundingBoxP2Y = [...modelObjectBoundingBoxP2YMap.keys()];
        doc.ModelObjectBoundingBoxP2Z = [...modelObjectBoundingBoxP2ZMap.keys()];
        doc.ModelObjectCountVertices = [...modelObjectCountVerticesMap.keys()];
        doc.ModelObjectCountFaces = [...modelObjectCountFacesMap.keys()];
        doc.ModelObjectCountColorChannels = [...modelObjectCountColorChannelsMap.keys()];
        doc.ModelObjectCountTextureCoordinateChannels = [...modelObjectCountTextureCoordinateChannelsMap.keys()];
        doc.ModelObjectHasBones = [...modelObjectHasBonesMap.keys()];
        doc.ModelObjectHasFaceNormals = [...modelObjectHasFaceNormalsMap.keys()];
        doc.ModelObjectHasTangents = [...modelObjectHasTangentsMap.keys()];
        doc.ModelObjectHasTextureCoordinates = [...modelObjectHasTextureCoordinatesMap.keys()];
        doc.ModelObjectHasVertexNormals = [...modelObjectHasVertexNormalsMap.keys()];
        doc.ModelObjectHasVertexColor = [...modelObjectHasVertexColorMap.keys()];
        doc.ModelObjectIsTwoManifoldUnbounded = [...modelObjectIsTwoManifoldUnboundedMap.keys()];
        doc.ModelObjectIsTwoManifoldBounded = [...modelObjectIsTwoManifoldBoundedMap.keys()];
        doc.ModelObjectIsWatertight = [...modelObjectIsWatertightMap.keys()];
        doc.ModelObjectSelfIntersecting = [...modelObjectSelfIntersectingMap.keys()];

        // TODO: should we turn multivalued metrics and bounding boxes into single valued attributes, and combine the multiple values in a meaningful way (e.g. add point and face counts, combine bounding boxes)
        this.countModel++;
        return true;
    }

    private async handleScene(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!scene) {
            LOG.error(`IndexSolr.handleScene failed to compute scene from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = scene.Name;
        doc.SceneIsOriented = scene.IsOriented;
        doc.SceneHasBeenQCd = scene.HasBeenQCd;
        doc.SceneCountScene = scene.CountScene;
        doc.SceneCountNode = scene.CountNode;
        doc.SceneCountCamera = scene.CountCamera;
        doc.SceneCountLight = scene.CountLight;
        doc.SceneCountModel = scene.CountModel;
        doc.SceneCountMeta = scene.CountMeta;
        doc.SceneCountSetup = scene.CountSetup;
        doc.SceneCountTour = scene.CountTour;
        this.countScene++;
        return true;
    }

    private async handleIntermediaryFile(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const intermediaryFile: DBAPI.IntermediaryFile | null = await DBAPI.IntermediaryFile.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!intermediaryFile) {
            LOG.error(`IndexSolr.handleIntermediaryFile failed to compute intermediaryFile from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }
        doc.CommonName = `Intermediary File created ${intermediaryFile.DateCreated.toISOString()}`;
        doc.CommonDateCreated = intermediaryFile.DateCreated;
        doc.ChildrenDateCreated = [intermediaryFile.DateCreated];
        this.countIntermediaryFile++;
        return true;
    }

    private async handleProjectDocumentation(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const projectDocumentation: DBAPI.ProjectDocumentation | null = await DBAPI.ProjectDocumentation.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!projectDocumentation) {
            LOG.error(`IndexSolr.handleProjectDocumentation failed to compute projectDocumentation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
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
            LOG.error(`IndexSolr.handleAsset failed to compute asset from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
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
            LOG.error(`IndexSolr.handleAssetVersion failed to compute assetVersion from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
            return false;
        }

        const user: DBAPI.User | null = await DBAPI.User.fetch(assetVersion.idUserCreator);
        if (!user) {
            LOG.error(`IndexSolr.handleAssetVersion failed to compute idUserCreator from ${assetVersion.idUserCreator}`, LOG.LS.eNAV);
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
            LOG.error(`IndexSolr.handleActor failed to compute actor from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
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
            LOG.error(`IndexSolr.handleStakeholder failed to compute stakeholder from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
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
        LOG.error(`IndexSolr.fullIndex called with unknown object type from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`, LOG.LS.eNAV);
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
