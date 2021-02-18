/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import { eSystemObjectType } from '../../../db';
import { SolrClient } from './SolrClient';

export class ReindexSolr {
    private objectGraphDatabase: DBAPI.ObjectGraphDatabase = new DBAPI.ObjectGraphDatabase();
    private hierarchyNameMap: Map<number, string> = new Map<number, string>(); // map of idSystemObject -> object name
    private static fullIndexUnderway: boolean = false;

    async fullIndexProfiled(): Promise<boolean> {
        LOG.logger.info('****************************************');
        LOG.logger.info('ReindexSolr.fullIndexProfiled() starting');
        return new Promise<boolean>((resolve) => {
            const inspector = require('inspector');
            const fs = require('fs');
            const session = new inspector.Session();
            session.connect();

            session.post('Profiler.enable', async () => {
                session.post('Profiler.start', async () => {
                    LOG.logger.info('ReindexSolr.fullIndexProfiled() fullIndex() starting');
                    const retValue: boolean = await this.fullIndex();
                    LOG.logger.info('ReindexSolr.fullIndexProfiled() fullIndex() complete');
                    resolve(retValue);

                    // some time later...
                    session.post('Profiler.stop', (err, { profile }) => {
                        // Write profile to disk, upload, etc.
                        if (!err) {
                            LOG.logger.info('ReindexSolr.fullIndexProfiled() writing profile');
                            fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
                        }
                        LOG.logger.info('ReindexSolr.fullIndexProfiled() writing profile ending');
                    });
                });
            });
        });
    }

    async fullIndex(): Promise<boolean> {
        if (ReindexSolr.fullIndexUnderway) {
            LOG.logger.error('ReindexSolr.fullIndex() already underway; exiting this additional request early');
            return false;
        }

        let retValue: boolean = false;
        try {
            ReindexSolr.fullIndexUnderway = true;
            retValue = await this.fullIndexWorker();
        } finally {
            ReindexSolr.fullIndexUnderway = false;
        }
        return retValue;
    }

    private async fullIndexWorker(): Promise<boolean> {
        const solrClient: SolrClient = new SolrClient(null, null, null);
        if (!(await this.objectGraphDatabase.fetch())) {
            LOG.logger.error('ReindexSolr.fullIndex failed on ObjectGraphDatabase.fetch()');
            return false;
        }

        let docs: any[] = [];
        for (const objectGraphDataEntry of this.objectGraphDatabase.objectMap.values()) {
            const doc: any = {};

            await this.extractCommonFields(doc, objectGraphDataEntry);

            switch (objectGraphDataEntry.systemObjectIDType.eObjectType) {
                case eSystemObjectType.eUnit:                   await this.handleUnit(doc, objectGraphDataEntry);                 break;
                case eSystemObjectType.eProject:                await this.handleProject(doc, objectGraphDataEntry);              break;
                case eSystemObjectType.eSubject:                await this.handleSubject(doc, objectGraphDataEntry);              break;
                case eSystemObjectType.eItem:                   await this.handleItem(doc, objectGraphDataEntry);                 break;
                case eSystemObjectType.eCaptureData:            await this.handleCaptureData(doc, objectGraphDataEntry);          break;
                case eSystemObjectType.eModel:                  await this.handleModel(doc, objectGraphDataEntry);                break;
                case eSystemObjectType.eScene:                  await this.handleScene(doc, objectGraphDataEntry);                break;
                case eSystemObjectType.eIntermediaryFile:       await this.handleIntermediaryFile(doc, objectGraphDataEntry);     break;
                case eSystemObjectType.eProjectDocumentation:   await this.handleProjectDocumentation(doc, objectGraphDataEntry); break;
                case eSystemObjectType.eAsset:                  await this.handleAsset(doc, objectGraphDataEntry);                break;
                case eSystemObjectType.eAssetVersion:           await this.handleAssetVersion(doc, objectGraphDataEntry);         break;
                case eSystemObjectType.eActor:                  await this.handleActor(doc, objectGraphDataEntry);                break;
                case eSystemObjectType.eStakeholder:            await this.handleStakeholder(doc, objectGraphDataEntry);          break;

                default:
                case eSystemObjectType.eUnknown:                await this.handleUnknown(doc, objectGraphDataEntry);              break;
            }

            docs.push(doc);
            if (docs.length >= 1000) {
                solrClient._client.add(docs, undefined, function (err, obj) { if (err) LOG.logger.error('ReindexSolr.fullIndex adding cached records', err); else obj; });
                solrClient._client.commit(undefined, function (err, obj) { if (err) LOG.logger.error('ReindexSolr.fullIndex -> commit()', err); else obj; });
                docs = [];
            }
        }

        if (docs.length > 0) {
            solrClient._client.add(docs, undefined, function (err, obj) { if (err) LOG.logger.error('ReindexSolr.fullIndex adding cached records', err); else obj; });
            solrClient._client.commit(undefined, function (err, obj) { if (err) LOG.logger.error('ReindexSolr.fullIndex -> commit()', err); else obj; });
        }
        return true;
    }

    private async extractCommonFields(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<void> {
        const OGDEH: DBAPI.ObjectGraphDataEntryHierarchy = objectGraphDataEntry.extractHierarchy();

        doc.idSystemObject = OGDEH.idSystemObject;
        doc.CommonRetired = OGDEH.retired;
        doc.CommonObjectType = DBAPI.SystemObjectTypeToName(OGDEH.eObjectType);
        doc.CommonidObject = OGDEH.idObject;
        doc.CommonIdentifier = await this.computeIdentifiers(objectGraphDataEntry.systemObjectIDType.idSystemObject);

        doc.HierarchyParentID = OGDEH.parents.length == 0 ? [0] : OGDEH.parents;
        doc.HierarchyChildrenID = OGDEH.children.length == 0 ? [0] : OGDEH.children;

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
            LOG.logger.error(`ReindexSolr.handleUnit failed to compute unit from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = unit.Name;
        doc.UnitAbbreviation = unit.Abbreviation;
        doc.UnitARKPrefix = unit.ARKPrefix;
        return true;
    }

    private async handleProject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const project: DBAPI.Project | null = await DBAPI.Project.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!project) {
            LOG.logger.error(`ReindexSolr.handleProject failed to compute project from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = project.Name;
        doc.CommonDescription = project.Description;
        return true;
    }

    private async handleSubject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const subject: DBAPI.Subject | null = await DBAPI.Subject.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!subject) {
            LOG.logger.error(`ReindexSolr.handleSubject failed to compute subject from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        doc.CommonName = subject.Name;
        if (subject.idIdentifierPreferred) {
            const ID: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(subject.idIdentifierPreferred);
            if (ID)
                doc.SubjectIdentifierPreferred = ID.IdentifierValue;
        }
        return true;
    }

    private async handleItem(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const item: DBAPI.Item | null = await DBAPI.Item.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!item) {
            LOG.logger.error(`ReindexSolr.handleItem failed to compute item from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = item.Name;
        doc.ItemEntireSubject = item.EntireSubject;
        return true;
    }

    private async handleCaptureData(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const captureData: DBAPI.CaptureData | null = await DBAPI.CaptureData.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!captureData) {
            LOG.logger.error(`ReindexSolr.handleCaptureData failed to compute capture data from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
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

        return true;
    }

    private async handleModel(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const modelConstellation: DBAPI.ModelConstellation | null = await DBAPI.ModelConstellation.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!modelConstellation) {
            LOG.logger.error(`ReindexSolr.handleModel failed to compute ModelConstellation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        doc.CommonName = modelConstellation.model.Name;
        doc.CommonDateCreated = modelConstellation.model.DateCreated;

        doc.ModelCreationMethod = await this.computeVocabulary(modelConstellation.model.idVCreationMethod);
        doc.ModelMaster = modelConstellation.model.Master;
        doc.ModelAuthoritative = modelConstellation.model.Authoritative;
        doc.ModelModality = await this.computeVocabulary(modelConstellation.model.idVModality);
        doc.ModelUnits = await this.computeVocabulary(modelConstellation.model.idVUnits);
        doc.ModelPurpose = await this.computeVocabulary(modelConstellation.model.idVPurpose);

        const modelFileTypeMap: Map<string, boolean> = new Map<string, boolean>();
        const roughnessMap: Map<number, boolean> = new Map<number, boolean>();
        const metalnessMap: Map<number, boolean> = new Map<number, boolean>();
        const pointCountMap: Map<number, boolean> = new Map<number, boolean>();
        const faceCountMap: Map<number, boolean> = new Map<number, boolean>();
        const isWatertightMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const hasNormalsMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const hasVertexColorMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const hasUVSpaceMap: Map<boolean, boolean> = new Map<boolean, boolean>();
        const boundingBoxP1XMap: Map<number, boolean> = new Map<number, boolean>();
        const boundingBoxP1YMap: Map<number, boolean> = new Map<number, boolean>();
        const boundingBoxP1ZMap: Map<number, boolean> = new Map<number, boolean>();
        const boundingBoxP2XMap: Map<number, boolean> = new Map<number, boolean>();
        const boundingBoxP2YMap: Map<number, boolean> = new Map<number, boolean>();
        const boundingBoxP2ZMap: Map<number, boolean> = new Map<number, boolean>();
        const uvMapEdgeLengthMap: Map<number, boolean> = new Map<number, boolean>();
        const channelPositionMap: Map<number, boolean> = new Map<number, boolean>();
        const channelWidthMap: Map<number, boolean> = new Map<number, boolean>();
        const uvMapTypeMap: Map<string, boolean> = new Map<string, boolean>();

        if (modelConstellation.modelGeometryFiles) {
            for (const modelGeometryFile of modelConstellation.modelGeometryFiles) {
                const modelFileTypeWorker: string | undefined = await this.computeVocabulary(modelGeometryFile.idVModelFileType);
                if (modelFileTypeWorker) modelFileTypeMap.set(modelFileTypeWorker, true);
                if (modelGeometryFile.Roughness) roughnessMap.set(modelGeometryFile.Roughness, true);
                if (modelGeometryFile.Metalness) metalnessMap.set(modelGeometryFile.Metalness, true);
                if (modelGeometryFile.PointCount) pointCountMap.set(modelGeometryFile.PointCount, true);
                if (modelGeometryFile.IsWatertight != null) isWatertightMap.set(modelGeometryFile.IsWatertight, true);
                if (modelGeometryFile.HasNormals != null) hasNormalsMap.set(modelGeometryFile.HasNormals, true);
                if (modelGeometryFile.HasVertexColor != null) hasVertexColorMap.set(modelGeometryFile.HasVertexColor, true);
                if (modelGeometryFile.HasUVSpace != null) hasUVSpaceMap.set(modelGeometryFile.HasUVSpace, true);
                if (modelGeometryFile.BoundingBoxP1X) boundingBoxP1XMap.set(modelGeometryFile.BoundingBoxP1X, true);
                if (modelGeometryFile.BoundingBoxP1Y) boundingBoxP1YMap.set(modelGeometryFile.BoundingBoxP1Y, true);
                if (modelGeometryFile.BoundingBoxP1Z) boundingBoxP1ZMap.set(modelGeometryFile.BoundingBoxP1Z, true);
                if (modelGeometryFile.BoundingBoxP2X) boundingBoxP2XMap.set(modelGeometryFile.BoundingBoxP2X, true);
                if (modelGeometryFile.BoundingBoxP2Y) boundingBoxP2YMap.set(modelGeometryFile.BoundingBoxP2Y, true);
                if (modelGeometryFile.BoundingBoxP2Z) boundingBoxP2ZMap.set(modelGeometryFile.BoundingBoxP2Z, true);
            }
        }

        if (modelConstellation.modelUVMapFiles) {
            for (const modelUVMapFile of modelConstellation.modelUVMapFiles) {
                uvMapEdgeLengthMap.set(modelUVMapFile.UVMapEdgeLength, true);
            }
        }

        if (modelConstellation.modelUVMapChannels) {
            for (const modelUVMapChannel of modelConstellation.modelUVMapChannels) {
                channelPositionMap.set(modelUVMapChannel.ChannelPosition, true);
                channelWidthMap.set(modelUVMapChannel.ChannelWidth, true);
                const uvMapTypeWorker: string | undefined = await this.computeVocabulary(modelUVMapChannel.idVUVMapType);
                if (uvMapTypeWorker) uvMapTypeMap.set(uvMapTypeWorker, true);
            }
        }

        doc.ModelFileType           = [...modelFileTypeMap.keys()];
        doc.ModelRoughness          = [...roughnessMap.keys()];
        doc.ModelMetalness          = [...metalnessMap.keys()];
        doc.ModelPointCount         = [...pointCountMap.keys()];
        doc.ModelFaceCount          = [...faceCountMap.keys()];
        doc.ModelIsWatertight       = [...isWatertightMap.keys()];
        doc.ModelHasNormals         = [...hasNormalsMap.keys()];
        doc.ModelHasVertexColor     = [...hasVertexColorMap.keys()];
        doc.ModelHasUVSpace         = [...hasUVSpaceMap.keys()];
        doc.ModelBoundingBoxP1X     = [...boundingBoxP1XMap.keys()];
        doc.ModelBoundingBoxP1Y     = [...boundingBoxP1YMap.keys()];
        doc.ModelBoundingBoxP1Z     = [...boundingBoxP1ZMap.keys()];
        doc.ModelBoundingBoxP2X     = [...boundingBoxP2XMap.keys()];
        doc.ModelBoundingBoxP2Y     = [...boundingBoxP2YMap.keys()];
        doc.ModelBoundingBoxP2Z     = [...boundingBoxP2ZMap.keys()];
        doc.ModelUVMapEdgeLength    = [...uvMapEdgeLengthMap.keys()];
        doc.ModelChannelPosition    = [...channelPositionMap.keys()];
        doc.ModelChannelWidth       = [...channelWidthMap.keys()];
        doc.ModelUVMapType          = [...uvMapTypeMap.keys()];
        // TODO: should we turn multivalued metrics and bounding boxes into single valued attributes, and combine the multiple values in a meaningful way (e.g. add point and face counts, combine bounding boxes)
        return true;
    }

    private async handleScene(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!scene) {
            LOG.logger.error(`ReindexSolr.handleScene failed to compute scene from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = scene.Name;
        doc.SceneIsOriented = scene.IsOriented;
        doc.SceneHasBeenQCd = scene.HasBeenQCd;
        return true;
    }

    private async handleIntermediaryFile(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const intermediaryFile: DBAPI.IntermediaryFile | null = await DBAPI.IntermediaryFile.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!intermediaryFile) {
            LOG.logger.error(`ReindexSolr.handleIntermediaryFile failed to compute intermediaryFile from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonDateCreated = intermediaryFile.DateCreated;
        return true;
    }

    private async handleProjectDocumentation(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const projectDocumentation: DBAPI.ProjectDocumentation | null = await DBAPI.ProjectDocumentation.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!projectDocumentation) {
            LOG.logger.error(`ReindexSolr.handleProjectDocumentation failed to compute projectDocumentation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = projectDocumentation.Name;
        doc.CommonDescription = projectDocumentation.Description;
        return true;
    }

    private async handleAsset(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!asset) {
            LOG.logger.error(`ReindexSolr.handleAsset failed to compute asset from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.AssetFileName = asset.FileName;
        doc.AssetFilePath = asset.FilePath;
        doc.AssetType = await this.lookupVocabulary(asset.idVAssetType);
        return true;
    }

    private async handleAssetVersion(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!assetVersion) {
            LOG.logger.error(`ReindexSolr.handleAssetVersion failed to compute assetVersion from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        const user: DBAPI.User | null = await DBAPI.User.fetch(assetVersion.idUserCreator);
        if (!user) {
            LOG.logger.error(`ReindexSolr.handleAssetVersion failed to compute idUserCreator from ${assetVersion.idUserCreator}`);
            return false;
        }
        doc.AVUserCreator = user.Name;
        doc.AVStorageHash = assetVersion.StorageHash;
        doc.AVStorageSize = assetVersion.StorageSize;
        doc.AVIngested = assetVersion.Ingested;
        doc.AVBulkIngest = assetVersion.BulkIngest;
        return true;
    }

    private async handleActor(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const actor: DBAPI.Actor | null = await DBAPI.Actor.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!actor) {
            LOG.logger.error(`ReindexSolr.handleActor failed to compute actor from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.CommonName = actor.IndividualName;
        doc.CommonOrganizationName = actor.OrganizationName;
        return true;
    }

    private async handleStakeholder(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const stakeholder: DBAPI.Stakeholder | null = await DBAPI.Stakeholder.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!stakeholder) {
            LOG.logger.error(`ReindexSolr.handleStakeholder failed to compute stakeholder from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        doc.CommonName = stakeholder.IndividualName;
        doc.CommonOrganizationName = stakeholder.OrganizationName;
        doc.StakeholderEmailAddress = stakeholder.EmailAddress;
        doc.StakeholderPhoneNumberMobile = stakeholder.PhoneNumberMobile;
        doc.StakeholderPhoneNumberOffice = stakeholder.PhoneNumberOffice;
        doc.StakeholderMailingAddress = stakeholder.MailingAddress;
        return true;
    }

    private async handleUnknown(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        LOG.logger.error(`ReindexSolr.fullIndex called with unknown object type from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
        doc.CommonName = `Unknown ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`;
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
