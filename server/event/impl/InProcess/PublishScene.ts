import { Config } from '../../../config';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COL from '../../../collections/interface/';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import * as ZIP from '../../../utils/zipStream';
import * as STORE from '../../../storage/interface';
import { SvxReader } from '../../../utils/parser';
import { IDocument } from '../../../types/voyager';

import { v4 as uuidv4 } from 'uuid';
import path from 'path';

type SceneAssetCollector = {
    asset: DBAPI.Asset;
    assetVersion: DBAPI.AssetVersion;
    model?: DBAPI.Model;
    modelSceneXref?: DBAPI.ModelSceneXref;
};

export class PublishScene {
    private audit: DBAPI.Audit;

    private idSystemObject?: number | null;
    private scene?: DBAPI.Scene | null;
    private subject?: DBAPI.Subject;
    private DownloadMSXMap?: Map<number, DBAPI.ModelSceneXref>; // map of model's idSystemObject -> ModelSceneXref
    private SacMap?: Map<number, SceneAssetCollector>;          // map of idSystemObject for object owning asset -> SceneAssetCollector

    private assetVersions?: DBAPI.AssetVersion[] | null = null;

    private sceneFile?: string | undefined = undefined;
    private extractedPath?: string | undefined = undefined;
    private svxDocument?: IDocument | null = null;
    private edan3DResourceList?: COL.Edan3DResource[] = [];
    private resourcesHotFolder?: string | undefined = undefined;

    private sharedName?: string | undefined = undefined;

    constructor(audit: DBAPI.Audit) {
        this.audit = audit;
    }

    async publish(): Promise<boolean> {
        if (!await this.handleAuditFetchScene() || !this.scene || !this.idSystemObject || !this.subject)
            return false;
        LOG.info(`PublishScene.publish Publishing Scene with UUID ${this.scene.EdanUUID}`, LOG.LS.eEVENT);

        // Process models, building a mapping from the model's idSystemObject -> ModelSceneXref, for those models that are for Downloads
        if (!await this.computeMSXMap() || !this.DownloadMSXMap)
            return false;

        // collect and analyze assets
        if (!await this.collectAssets() || !this.SacMap || this.SacMap.size <= 0)
            return false;

        // stage scene
        if (!await this.stageSceneFiles() || !this.sharedName)
            return false;

        // create EDAN 3D Package
        const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
        let edanRecord: COL.EdanRecord | null = await ICol.createEdan3DPackage(this.sharedName, this.sceneFile);
        if (!edanRecord) {
            LOG.error('PublishScene.publish publish to EDAN failed', LOG.LS.eEVENT);
            return false;
        }

        // stage downloads
        if (!await this.stageDownloads() || !this.edan3DResourceList)
            return false;

        // update EDAN 3D Package if we have downloads
        if (this.svxDocument && this.edan3DResourceList.length > 0) {
            const E3DPackage: COL.Edan3DPackageContent = {
                document: this.svxDocument,
                resources: this.edan3DResourceList
            };
            edanRecord = await ICol.updateEdan3DPackage(edanRecord.url, E3DPackage, edanRecord.status, edanRecord.publicSearch);
            if (!edanRecord) {
                LOG.error('PublishScene.publish publish of resources to EDAN failed', LOG.LS.eEVENT);
                return false;
            }
        }
        return true;
    }

    private async handleAuditFetchScene(): Promise<boolean> {
        this.idSystemObject = this.audit.idSystemObject;
        if (this.idSystemObject === null && this.audit.idDBObject && this.audit.DBObjectType) {
            const oID: DBAPI.ObjectIDAndType = { idObject: this.audit.idDBObject , eObjectType: this.audit.DBObjectType };
            const SOInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (SOInfo) {
                this.idSystemObject = SOInfo.idSystemObject;
                this.audit.idSystemObject = this.idSystemObject;
            }
        }

        LOG.info(`PublishScene.handleAuditFetchScene Scene QCd ${this.audit.idDBObject}`, LOG.LS.eEVENT);
        if (this.audit.idAudit === 0)
            this.audit.create(); // don't use await so this happens asynchronously

        if (!this.idSystemObject) {
            LOG.error(`PublishScene.handleAuditFetchScene received eSceneQCd event for scene without idSystemObject ${JSON.stringify(this.audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        if (this.audit.getDBObjectType() !== DBAPI.eSystemObjectType.eScene) {
            LOG.error(`PublishScene.handleAuditFetchScene received eSceneQCd event for non scene object ${JSON.stringify(this.audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        // fetch scene
        this.scene = this.audit.idDBObject ? await DBAPI.Scene.fetch(this.audit.idDBObject) : null;
        if (!this.scene) {
            LOG.error(`PublishScene.handleAuditFetchScene received eSceneQCd event for non scene object ${JSON.stringify(this.audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        // create UUID if not done already
        if (!this.scene.EdanUUID) {
            this.scene.EdanUUID = uuidv4();
            if (!await this.scene.update()) {
                LOG.error(`PublishScene.handleAuditFetchScene unable to persist UUID for scene object ${JSON.stringify(this.audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
                return false;
            }
        }

        // compute subject(s) owning this scene
        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(this.idSystemObject, DBAPI.eObjectGraphMode.eAncestors);
        if (!await OG.fetch()) {
            LOG.error(`PublishScene.handleAuditFetchScene unable to compute object graph for scene ${JSON.stringify(this.scene, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }
        if (OG.subject && OG.subject.length > 0)
            this.subject = OG.subject[0];
        return true;
    }

    private async computeMSXMap(): Promise<boolean> {
        if (!this.scene)
            return false;
        const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromScene(this.scene.idScene);
        if (!MSXs) {
            LOG.error(`PublishScene.computeMSXMap unable to fetch ModelSceneXrefs for scene ${this.scene.idScene}`, LOG.LS.eEVENT);
            return false;
        }

        const DownloadMSXMap: Map<number, DBAPI.ModelSceneXref> = new Map<number, DBAPI.ModelSceneXref>();
        for (const MSX of MSXs) {
            if (MSX.Usage && MSX.Usage.startsWith('Download')) {
                const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID({ eObjectType: DBAPI.eSystemObjectType.eModel, idObject: MSX.idModel });
                if (SOI)
                    DownloadMSXMap.set(SOI.idSystemObject, MSX);
            }
        }
        this.DownloadMSXMap = DownloadMSXMap;
        return true;
    }

    private async collectAssets(): Promise<boolean> {
        if (!this.idSystemObject || !this.DownloadMSXMap)
            return false;
        this.SacMap = new Map<number, SceneAssetCollector>();
        this.assetVersions = await DBAPI.AssetVersion.fetchLatestFromSystemObject(this.idSystemObject);
        if (!this.assetVersions || this.assetVersions.length === 0) {
            LOG.error(`PublishScene.collectAssets unable to load asset versions for scene ${JSON.stringify(this.scene, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        // first pass through assets: detect and record the scene file (first file to match *.svx.json); lookup supporting information
        // prepare to extract and discard the path to this file, so that the scene zip is "rooted" at the svx.json
        let stageRes: H.IOResults = { success: true, error: '' };
        for (const assetVersion of this.assetVersions) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            if (!asset) {
                LOG.error(`PublishScene.collectAssets unable to load asset by id ${assetVersion.idAsset}`, LOG.LS.eEVENT);
                return false;
            }

            if (asset.idSystemObject) {
                const modelSceneXref: DBAPI.ModelSceneXref | undefined = this.DownloadMSXMap.get(asset.idSystemObject ?? 0);
                if (!modelSceneXref)
                    this.SacMap.set(asset.idSystemObject, { asset, assetVersion });
                else {
                    const model: DBAPI.Model | null = await DBAPI.Model.fetch(modelSceneXref.idModel);
                    if (!model) {
                        LOG.error(`PublishScene.collectAssets unable to load model from xref ${JSON.stringify(modelSceneXref, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
                        return false;
                    }
                    this.SacMap.set(asset.idSystemObject, { asset, assetVersion, model, modelSceneXref });
                }
            }

            if (!this.sceneFile && assetVersion.FileName.toLowerCase().endsWith('.svx.json')) {
                this.sceneFile = assetVersion.FileName;
                this.extractedPath = asset.FilePath;
                // extract scene's SVX.JSON for use in creating downloads
                if (this.DownloadMSXMap.size > 0) {
                    const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(asset, assetVersion);
                    if (!RSR.success || !RSR.readStream) {
                        LOG.error(`PublishScene.collectAssets failed to extract stream for scene's asset version ${assetVersion.idAssetVersion}`, LOG.LS.eEVENT);
                        return false;
                    }

                    const svx: SvxReader = new SvxReader();
                    stageRes = await svx.loadFromStream(RSR.readStream);
                    if (!stageRes.success) {
                        LOG.error(`PublishScene.collectAssets failed to extract scene's svx.json contents: ${stageRes.error}`, LOG.LS.eEVENT);
                        return false;
                    }
                    this.svxDocument = svx.SvxDocument;
                }
            }
        }
        return true;
    }

    private async stageSceneFiles(): Promise<boolean> {
        if (!this.SacMap || !this.scene)
            return false;
        let stageRes: H.IOResults = { success: true, error: '' };

        // second pass: zip up appropriate assets; prepare to copy downloads
        const zip: ZIP.ZipStream = new ZIP.ZipStream();
        for (const SAC of this.SacMap.values()) {
            if (SAC.model) // skip downloads
                continue;

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(SAC.asset, SAC.assetVersion);
            if (!RSR.success || !RSR.readStream) {
                LOG.error(`PublishScene.stageFiles failed to extract stream for asset version ${SAC.assetVersion.idAssetVersion}`, LOG.LS.eEVENT);
                return false;
            }

            let rebasedPath: string = this.extractedPath ? SAC.asset.FilePath.replace(this.extractedPath, '') : SAC.asset.FilePath;
            if (this.extractedPath && rebasedPath.startsWith('/'))
                rebasedPath = rebasedPath.substring(1);

            const fileNameAndPath: string = path.posix.join(rebasedPath, SAC.assetVersion.FileName);
            LOG.info(`PublishScene.stageFiles adding ${fileNameAndPath} to zip`, LOG.LS.eEVENT);
            const res: H.IOResults = await zip.add(fileNameAndPath, RSR.readStream);
            if (!res.success) {
                LOG.error(`PublishScene.stageFiles failed to add asset version ${SAC.assetVersion.idAssetVersion} to zip: ${res.error}`, LOG.LS.eEVENT);
                return false;
            }
        }

        const zipStream: NodeJS.ReadableStream | null = await zip.streamContent(null);
        if (!zipStream) {
            LOG.error('PublishScene.stageFiles failed to extract stream from zip', LOG.LS.eEVENT);
            return false;
        }

        stageRes = await H.Helpers.fileOrDirExists(Config.collection.edan.stagingRoot);
        if (!stageRes.success)
            stageRes = await H.Helpers.createDirectory(Config.collection.edan.stagingRoot);
        if (!stageRes.success) {
            LOG.error(`PublishScene.stageFiles unable to ensure existence of staging directory ${Config.collection.edan.stagingRoot}: ${stageRes.error}`, LOG.LS.eEVENT);
            return false;
        }

        const noFinalSlash: boolean = !Config.collection.edan.upsertContentRoot.endsWith('/');
        this.sharedName = Config.collection.edan.upsertContentRoot + (noFinalSlash ? '/' : '') + this.scene.EdanUUID! + '.zip'; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        const stagedName: string = path.join(Config.collection.edan.stagingRoot, this.scene.EdanUUID!) + '.zip'; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        LOG.info(`*** PublishScene.stageFiles staging file ${stagedName}, referenced in publish as ${this.sharedName}`, LOG.LS.eEVENT);

        stageRes = await H.Helpers.writeStreamToFile(zipStream, stagedName);
        if (!stageRes.success) {
            LOG.error(`PublishScene.stageFiles unable to stage file ${stagedName}: ${stageRes.error}`, LOG.LS.eEVENT);
            return false;
        }
        return true;
    }

    private async stageDownloads(): Promise<boolean> {
        if (!this.SacMap || !this.scene)
            return false;
        // third pass: stage downloads
        let stageRes: H.IOResults = { success: true, error: '' };
        this.edan3DResourceList = [];
        this.resourcesHotFolder = path.join(Config.collection.edan.resourcesHotFolder, this.scene.EdanUUID!); // eslint-disable-line @typescript-eslint/no-non-null-assertion

        for (const SAC of this.SacMap.values()) {
            if (!SAC.model) // SAC is not a download, skip it
                continue;

            if (!await this.ensureResourceHotFolderExists())
                return false;

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(SAC.asset, SAC.assetVersion);
            if (!RSR.success || !RSR.readStream) {
                LOG.error(`PublishScene.stageFiles failed to extract stream for asset version ${SAC.assetVersion.idAssetVersion}`, LOG.LS.eEVENT);
                return false;
            }

            // copy stream to resourcesHotFolder
            const stagedName: string = path.join(this.resourcesHotFolder, SAC.assetVersion.FileName);
            LOG.info(`*** PublishScene.stageFiles staging file ${stagedName}`, LOG.LS.eEVENT);
            stageRes = await H.Helpers.writeStreamToFile(RSR.readStream, stagedName);
            if (!stageRes.success) {
                LOG.error(`PublishScene.stageFiles unable to stage file ${stagedName}: ${stageRes.error}`, LOG.LS.eEVENT);
                return false;
            }

            // prepare download entry
            const resource: COL.Edan3DResource | null = await this.extractResource(SAC, this.scene.EdanUUID!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (resource)
                this.edan3DResourceList.push(resource);
        }

        return true;
    }

    private async ensureResourceHotFolderExists(): Promise<boolean> {
        // create resourcesHotFolder if we haven't yet
        if (!this.scene || !this.resourcesHotFolder)
            return false;

        let stageRes: H.IOResults = await H.Helpers.fileOrDirExists(this.resourcesHotFolder);
        if (!stageRes.success)
            stageRes = await H.Helpers.createDirectory(this.resourcesHotFolder);
        if (!stageRes.success) {
            LOG.error(`PublishScene.ensureResourceHotFolderExists failed to create resources hot folder ${this.resourcesHotFolder}: ${stageRes.error}`, LOG.LS.eEVENT);
            return false;
        }
        return true;
    }

    private async extractResource(SAC: SceneAssetCollector, uuid: string): Promise<COL.Edan3DResource | null> {
        if (!SAC.model || !SAC.modelSceneXref)
            return null;

        let type: COL.Edan3DResourceType | undefined = undefined;
        const typeV: DBAPI.Vocabulary | undefined = SAC.model.idVCreationMethod ? await CACHE.VocabularyCache.vocabulary(SAC.model.idVCreationMethod) : undefined;
        switch (typeV?.Term) {
            default: LOG.error(`PublishScene.extractResource found no type mapping for ${typeV?.Term}`, LOG.LS.eEVENT); break;
            case undefined: break;
            case 'Scan To Mesh':    type = '3D mesh'; break;
            case 'CAD':             type = 'CAD model'; break;
        }

        let UNITS: COL.Edan3DResourceAttributeUnits | undefined = undefined;
        const unitsV: DBAPI.Vocabulary | undefined = SAC.model.idVUnits ? await CACHE.VocabularyCache.vocabulary(SAC.model.idVUnits) : undefined;
        switch (unitsV?.Term) {
            default: LOG.error(`PublishScene.extractResource found no units mapping for ${unitsV?.Term}`, LOG.LS.eEVENT); break;
            case undefined: break;
            case 'Millimeter':  UNITS = 'mm'; break;
            case 'Centimeter':  UNITS = 'cm'; break;
            case 'Meter':       UNITS = 'm'; break;
            case 'Kilometer':   UNITS = 'km'; break;
            case 'Inch':        UNITS = 'in'; break;
            case 'Foot':        UNITS = 'ft'; break;
            case 'Yard':        UNITS = 'yd'; break;
            case 'Mile':        UNITS = 'mi'; break;
        }

        let MODEL_FILE_TYPE: COL.Edan3DResourceAttributeModelFileType | undefined = undefined;
        const modelTypeV: DBAPI.Vocabulary | undefined = SAC.model.idVFileType ? await CACHE.VocabularyCache.vocabulary(SAC.model.idVFileType) : undefined;
        switch (modelTypeV?.Term) {
            default: LOG.error(`PublishScene.extractResource found no model file type mapping for ${modelTypeV?.Term}`, LOG.LS.eEVENT); break;
            case undefined: break;
            case 'obj - Alias Wavefront Object':                MODEL_FILE_TYPE = 'obj'; break;
            case 'ply - Stanford Polygon File Format':          MODEL_FILE_TYPE = 'ply'; break;
            case 'stl - StereoLithography':                     MODEL_FILE_TYPE = 'stl'; break;
            case 'glb - GL Transmission Format Binary':         MODEL_FILE_TYPE = 'glb'; break;
            case 'gltf - GL Transmission Format':               MODEL_FILE_TYPE = 'gltf'; break;
            case 'usdz - Universal Scene Description (zipped)': MODEL_FILE_TYPE = 'usdz'; break;
            case 'x3d':                                         MODEL_FILE_TYPE = 'x3d'; break;
            // case 'usd - Universal Scene Description':           break;
            // case 'wrl - VRML':                                  break;
            // case 'dae - COLLADA':                               break;
            // case 'fbx - Filmbox':                               break;
            // case 'ma - Maya':                                   break;
            // case '3ds - 3D Studio':                             break;
            // case 'ptx':                                         break;
            // case 'pts':                                         break;
        }

        let FILE_TYPE: COL.Edan3DResourceAttributeFileType | undefined = undefined;
        switch (path.extname(SAC.assetVersion.FileName).toLowerCase()) {
            default: LOG.error(`PublishScene.extractResource found no file type mapping for ${SAC.assetVersion.FileName}`, LOG.LS.eEVENT); break;
            case '.zip':    FILE_TYPE = 'zip'; break;
            case '.glb':    FILE_TYPE = 'glb'; break;
            case '.usdz':   FILE_TYPE = 'usdz'; break;
        }

        const GLTF_STANDARDIZED: boolean = true;                            // per Jon Blundel, 8/19/2021, models generated by Cook for downloads meets this criteria
        let DRACO_COMPRESSED: boolean = false;
        let category: COL.Edan3DResourceCategory | undefined = undefined;   // Possible values: 'Full resolution', 'Medium resolution', 'Low resolution', 'Watertight', 'iOS AR model'

        switch (SAC.modelSceneXref.Usage?.replace('Download ', '').toLowerCase()) {
            case undefined:
            case 'webassetglblowuncompressed':  category = 'Low resolution';    MODEL_FILE_TYPE = 'glb'; break;
            case 'webassetglbarcompressed':     category = 'Low resolution';    MODEL_FILE_TYPE = 'glb'; DRACO_COMPRESSED = true; break;
            case 'usdz':                        category = 'iOS AR model';      MODEL_FILE_TYPE = 'usdz'; break;
            case 'objzipfull':                  category = 'Full resolution';   MODEL_FILE_TYPE = 'obj'; break;
            case 'objziplow':                   category = 'Low resolution';    MODEL_FILE_TYPE = 'obj'; break;
            case 'gltfziplow':                  category = 'Low resolution';    MODEL_FILE_TYPE = 'gltf'; break;
        }


        const subjectName: string = this.subject ? this.subject.Name : '';
        const sceneName: string = this.scene ? this.scene.Name : '';
        const name: string = subjectName + ((sceneName && sceneName != 'Scene') ? `: ${sceneName}` : '');   // Full title of edanmdm record, plus a possible scene title
        const title: string = `${name} (${category} ${type}, ${MODEL_FILE_TYPE}, scale in ${UNITS})`;       // name, below, plus ($$category$$ $$type$$, $$attributes.MODEL_FILE_TYPE$$, scale in $$attributes.UNITS$$)

        const url: string = `https://3d-api.si.edu/content/document/3d_package:${uuid}/resources/${SAC.assetVersion.FileName}`;
        const filename: string = SAC.assetVersion.FileName;
        const attributes: COL.Edan3DResourceAttribute[] = [{ UNITS, MODEL_FILE_TYPE, FILE_TYPE, GLTF_STANDARDIZED, DRACO_COMPRESSED }];
        return { filename, url, type, title, name, attributes, category };
    }
}