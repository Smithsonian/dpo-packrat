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
        solrClient._client.autoCommit = true;

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
                solrClient._client.add(docs, function (err, obj) { if (err) LOG.logger.error('ReindexSolr.fullIndex adding cached records', err); else obj; });
                solrClient._client.commit(function (err, obj) { if (err) LOG.logger.error('ReindexSolr.fullIndex -> commit()', err); else obj; });
                docs = [];
            }
        }

        if (docs.length > 0) {
            solrClient._client.add(docs, function (err, obj) { if (err) LOG.logger.error('ReindexSolr.fullIndex adding cached records', err); else obj; });
            solrClient._client.commit(function (err, obj) { if (err) LOG.logger.error('ReindexSolr.fullIndex -> commit()', err); else obj; });
        }
        return true;
    }

    private async extractCommonFields(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<void> {
        const OGDEH: DBAPI.ObjectGraphDataEntryHierarchy = objectGraphDataEntry.extractHierarchy();

        doc.idSystemObject = OGDEH.idSystemObject;
        doc.Retired = OGDEH.retired;
        doc.ObjectType = DBAPI.SystemObjectTypeToName(OGDEH.eObjectType);
        doc.idObject = OGDEH.idObject;

        doc.ParentID = OGDEH.parents.length == 0 ? [0] : OGDEH.parents;
        doc.ChildrenID = OGDEH.children.length == 0 ? [0] : OGDEH.children;
        doc.Identifier = this.computeIdentifiers(objectGraphDataEntry.systemObjectIDType.idSystemObject);

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
            doc.Unit = nameArray;
            doc.UnitID = idArray;
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
            doc.Project = nameArray;
            doc.ProjectID = idArray;
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
            doc.Subject = nameArray;
            doc.SubjectID = idArray;
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
            doc.Item = nameArray;
            doc.ItemID = idArray;
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
        doc.Name = unit.Name;
        doc.Abbreviation = unit.Abbreviation;
        doc.ARKPrefix = unit.ARKPrefix;
        return true;
    }

    private async handleProject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const project: DBAPI.Project | null = await DBAPI.Project.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!project) {
            LOG.logger.error(`ReindexSolr.handleProject failed to compute project from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.Name = project.Name;
        doc.Description = project.Description;
        return true;
    }

    private async handleSubject(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const subject: DBAPI.Subject | null = await DBAPI.Subject.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!subject) {
            LOG.logger.error(`ReindexSolr.handleSubject failed to compute subject from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        doc.Name = subject.Name;
        if (subject.idIdentifierPreferred) {
            const ID: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(subject.idIdentifierPreferred);
            if (ID) doc.IdentifierPreferred = ID.IdentifierValue;
        }
        return true;
    }

    private async handleItem(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const item: DBAPI.Item | null = await DBAPI.Item.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!item) {
            LOG.logger.error(`ReindexSolr.handleItem failed to compute item from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.Name = item.Name;
        doc.EntireSubject = item.EntireSubject;
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

        doc.Name = captureData.Name;
        doc.Description = captureData.Description;
        doc.DateCreated = captureData.DateCaptured;
        doc.CaptureMethod = await this.lookupVocabulary(captureData.idVCaptureMethod);
        if (captureDataPhoto) {
            doc.CaptureDatasetType = await this.lookupVocabulary(captureDataPhoto.idVCaptureDatasetType);
            doc.CaptureDatasetFieldID = captureDataPhoto.CaptureDatasetFieldID;
            doc.ItemPositionType = await this.lookupVocabulary(captureDataPhoto.idVItemPositionType);
            doc.ItemPositionFieldID = captureDataPhoto.ItemPositionFieldID;
            doc.ItemArrangementFieldID = captureDataPhoto.ItemArrangementFieldID;
            doc.FocusType = await this.lookupVocabulary(captureDataPhoto.idVFocusType);
            doc.LightSourceType = await this.lookupVocabulary(captureDataPhoto.idVLightSourceType);
            doc.BackgroundRemovalMethod = await this.lookupVocabulary(captureDataPhoto.idVBackgroundRemovalMethod);
            doc.ClusterType = await this.lookupVocabulary(captureDataPhoto.idVClusterType);
            doc.ClusterGeometryFieldID = captureDataPhoto.ClusterGeometryFieldID;
            doc.CameraSettingsUniform = captureDataPhoto.CameraSettingsUniform;
        }
        return true;
    }

    private async handleModel(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const modelConstellation: DBAPI.ModelConstellation | null = await DBAPI.ModelConstellation.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!modelConstellation) {
            LOG.logger.error(`ReindexSolr.handleModel failed to compute ModelConstellation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        doc.Name = modelConstellation.model.Name;
        doc.DateCreated = modelConstellation.model.DateCreated;

        doc.CreationMethod = await this.computeVocabulary(modelConstellation.model.idVCreationMethod);
        doc.Master = modelConstellation.model.Master;
        doc.Authoritative = modelConstellation.model.Authoritative;
        doc.Modality = await this.computeVocabulary(modelConstellation.model.idVModality);
        doc.Units = await this.computeVocabulary(modelConstellation.model.idVUnits);
        doc.Purpose = await this.computeVocabulary(modelConstellation.model.idVPurpose);

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

        const modelFileType: string[] = [...modelFileTypeMap.keys()];
        const roughness: number[] = [...roughnessMap.keys()];
        const metalness: number[] = [...metalnessMap.keys()];
        const pointCount: number[] = [...pointCountMap.keys()];
        const faceCount: number[] = [...faceCountMap.keys()];
        const isWatertight: boolean[] = [...isWatertightMap.keys()];
        const hasNormals: boolean[] = [...hasNormalsMap.keys()];
        const hasVertexColor: boolean[] = [...hasVertexColorMap.keys()];
        const hasUVSpace: boolean[] = [...hasUVSpaceMap.keys()];
        const boundingBoxP1X: number[] = [...boundingBoxP1XMap.keys()];
        const boundingBoxP1Y: number[] = [...boundingBoxP1YMap.keys()];
        const boundingBoxP1Z: number[] = [...boundingBoxP1ZMap.keys()];
        const boundingBoxP2X: number[] = [...boundingBoxP2XMap.keys()];
        const boundingBoxP2Y: number[] = [...boundingBoxP2YMap.keys()];
        const boundingBoxP2Z: number[] = [...boundingBoxP2ZMap.keys()];
        const uvMapEdgeLength: number[] = [...uvMapEdgeLengthMap.keys()];
        const channelPosition: number[] = [...channelPositionMap.keys()];
        const channelWidth: number[] = [...channelWidthMap.keys()];
        const uvMapType: string[] = [...uvMapTypeMap.keys()];

        doc.ModelFileType = modelFileType.length == 1 ? modelFileType[0] : modelFileType;
        doc.Roughness = roughness.length == 1 ? roughness[0] : roughness;
        doc.Metalness = metalness.length == 1 ? metalness[0] : metalness;
        doc.PointCount = pointCount.length == 1 ? pointCount[0] : pointCount;
        doc.FaceCount = faceCount.length == 1 ? faceCount[0] : faceCount;
        doc.IsWatertight = isWatertight.length == 1 ? isWatertight[0] : isWatertight;
        doc.HasNormals = hasNormals.length == 1 ? hasNormals[0] : hasNormals;
        doc.HasVertexColor = hasVertexColor.length == 1 ? hasVertexColor[0] : hasVertexColor;
        doc.HasUVSpace = hasUVSpace.length == 1 ? hasUVSpace[0] : hasUVSpace;
        doc.BoundingBoxP1X = boundingBoxP1X.length == 1 ? boundingBoxP1X[0] : boundingBoxP1X;
        doc.BoundingBoxP1Y = boundingBoxP1Y.length == 1 ? boundingBoxP1Y[0] : boundingBoxP1Y;
        doc.BoundingBoxP1Z = boundingBoxP1Z.length == 1 ? boundingBoxP1Z[0] : boundingBoxP1Z;
        doc.BoundingBoxP2X = boundingBoxP2X.length == 1 ? boundingBoxP2X[0] : boundingBoxP2X;
        doc.BoundingBoxP2Y = boundingBoxP2Y.length == 1 ? boundingBoxP2Y[0] : boundingBoxP2Y;
        doc.BoundingBoxP2Z = boundingBoxP2Z.length == 1 ? boundingBoxP2Z[0] : boundingBoxP2Z;
        doc.UVMapEdgeLength = uvMapEdgeLength.length == 1 ? uvMapEdgeLength[0] : uvMapEdgeLength;
        doc.ChannelPosition = channelPosition.length == 1 ? channelPosition[0] : channelPosition;
        doc.ChannelWidth = channelWidth.length == 1 ? channelWidth[0] : channelWidth;
        doc.UVMapType = uvMapType.length == 1 ? uvMapType[0] : uvMapType;
        return true;
    }

    private async handleScene(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!scene) {
            LOG.logger.error(`ReindexSolr.handleScene failed to compute scene from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.Name = scene.Name;
        doc.IsOriented = scene.IsOriented;
        doc.HasBeenQCd = scene.HasBeenQCd;
        return true;
    }

    private async handleIntermediaryFile(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const intermediaryFile: DBAPI.IntermediaryFile | null = await DBAPI.IntermediaryFile.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!intermediaryFile) {
            LOG.logger.error(`ReindexSolr.handleIntermediaryFile failed to compute intermediaryFile from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.DateCreated = intermediaryFile.DateCreated;
        return true;
    }

    private async handleProjectDocumentation(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const projectDocumentation: DBAPI.ProjectDocumentation | null = await DBAPI.ProjectDocumentation.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!projectDocumentation) {
            LOG.logger.error(`ReindexSolr.handleProjectDocumentation failed to compute projectDocumentation from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.Name = projectDocumentation.Name;
        doc.Description = projectDocumentation.Description;
        return true;
    }

    private async handleAsset(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!asset) {
            LOG.logger.error(`ReindexSolr.handleAsset failed to compute asset from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.FileName = asset.FileName;
        doc.FilePath = asset.FilePath;
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
        doc.UserCreator = user.Name;
        doc.StorageHash = assetVersion.StorageHash;
        doc.StorageSize = assetVersion.StorageSize;
        doc.Ingested = assetVersion.Ingested;
        doc.BulkIngest = assetVersion.BulkIngest;
        return true;
    }

    private async handleActor(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const actor: DBAPI.Actor | null = await DBAPI.Actor.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!actor) {
            LOG.logger.error(`ReindexSolr.handleActor failed to compute actor from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }
        doc.Name = actor.IndividualName;
        doc.OrganizationName = actor.OrganizationName;
        return true;
    }

    private async handleStakeholder(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        const stakeholder: DBAPI.Stakeholder | null = await DBAPI.Stakeholder.fetch(objectGraphDataEntry.systemObjectIDType.idObject);
        if (!stakeholder) {
            LOG.logger.error(`ReindexSolr.handleStakeholder failed to compute stakeholder from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
            return false;
        }

        doc.Name = stakeholder.IndividualName;
        doc.OrganizationName = stakeholder.OrganizationName;
        doc.EmailAddress = stakeholder.EmailAddress;
        doc.PhoneNumberMobile = stakeholder.PhoneNumberMobile;
        doc.PhoneNumberOffice = stakeholder.PhoneNumberOffice;
        doc.MailingAddress = stakeholder.MailingAddress;
        return true;
    }

    private async handleUnknown(doc: any, objectGraphDataEntry: DBAPI.ObjectGraphDataEntry): Promise<boolean> {
        LOG.logger.error(`ReindexSolr.fullIndex called with unknown object type from ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`);
        doc.Name = `Unknown ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}`;
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
