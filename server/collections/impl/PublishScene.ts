import { Config } from '../../config';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COL from '../../collections/interface/';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as ZIP from '../../utils/zipStream';
import * as STORE from '../../storage/interface';
import { SvxReader } from '../../utils/parser';
import { IDocument } from '../../types/voyager';

import { v4 as uuidv4 } from 'uuid';
import path from 'path';

type SceneAssetCollector = {
    idSystemObject: number;
    asset: DBAPI.Asset;
    assetVersion: DBAPI.AssetVersion;
    model?: DBAPI.Model;
    modelSceneXref?: DBAPI.ModelSceneXref;
};

export class PublishScene {
    private ICol: COL.ICollection;
    private idSystemObject: number;
    private eState: DBAPI.ePublishedState;

    private scene?: DBAPI.Scene | null;
    private systemObjectVersion?: DBAPI.SystemObjectVersion | null;
    private subject?: DBAPI.Subject;
    private DownloadMSXMap?: Map<number, DBAPI.ModelSceneXref>; // map of model's idSystemObject -> ModelSceneXref
    private SacList: SceneAssetCollector[] = [];                // array of SceneAssetCollector

    private assetVersions?: DBAPI.AssetVersion[] | null = null;

    private sceneFile?: string | undefined = undefined;
    private extractedPath?: string | undefined = undefined;
    private svxDocument?: IDocument | null = null;
    private edan3DResourceList?: COL.Edan3DResource[] = [];
    private resourcesHotFolder?: string | undefined = undefined;

    private sharedName?: string | undefined = undefined;

    constructor(ICol: COL.ICollection, idSystemObject: number, eState: DBAPI.ePublishedState) {
        this.ICol = ICol;
        this.idSystemObject = idSystemObject;
        this.eState = eState;
    }

    async publish(): Promise<boolean> {
        if (!await this.fetchScene() || !this.scene || !this.subject)
            return false;
        LOG.info(`PublishScene.publish UUID ${this.scene.EdanUUID}`, LOG.LS.eCOLL);

        // Process models, building a mapping from the model's idSystemObject -> ModelSceneXref, for those models that are for Downloads
        if (!await this.computeMSXMap() || !this.DownloadMSXMap)
            return false;

        // collect and analyze assets
        if (!await this.collectAssets() || this.SacList.length <= 0)
            return false;

        // stage scene
        if (!await this.stageSceneFiles() || !this.sharedName)
            return false;

        // create EDAN 3D Package
        let edanRecord: COL.EdanRecord | null = await this.ICol.createEdan3DPackage(this.sharedName, this.sceneFile);
        if (!edanRecord) {
            LOG.error('PublishScene.publish EDAN failed', LOG.LS.eCOLL);
            return false;
        }
        LOG.info(`PublishScene.publish ${edanRecord.url} succeeded with Edan status ${edanRecord.status}, publicSearch ${edanRecord.publicSearch}`, LOG.LS.eCOLL);

        // stage downloads
        if (!await this.stageDownloads() || !this.edan3DResourceList)
            return false;

        // update SystemObjectVersion.PublishedState
        if (!await this.updatePublishedState())
            return false;

        const { status, publicSearch, downloads } = this.computeEdanSearchFlags(edanRecord, this.eState);
        const haveDownloads: boolean = (this.edan3DResourceList.length > 0);
        const updatePackage: boolean = haveDownloads        // we have downloads, or
            || (status !== edanRecord.status)               // publication status changed
            || (publicSearch !== edanRecord.publicSearch);  // public search changed

        // update EDAN 3D Package if we have downloads and/or if our published state has changed
        if (this.svxDocument && updatePackage) {
            const E3DPackage: COL.Edan3DPackageContent = {
                document: this.svxDocument,
                resources: (downloads && haveDownloads) ? this.edan3DResourceList : undefined
            };

            LOG.info(`PublishScene.publish updating ${edanRecord.url}`, LOG.LS.eCOLL);
            edanRecord = await this.ICol.updateEdan3DPackage(edanRecord.url, E3DPackage, status, publicSearch);
            if (!edanRecord) {
                LOG.error('PublishScene.publish Edan3DPackage update failed', LOG.LS.eCOLL);
                return false;
            }
        }

        LOG.info(`PublishScene.publish UUID ${this.scene.EdanUUID}, status ${status}, publicSearch ${publicSearch}, downloads ${downloads}, has downloads ${haveDownloads}`, LOG.LS.eCOLL);
        return true;
    }

    private async fetchScene(): Promise<boolean> {
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(this.idSystemObject);
        if (!oID) {
            LOG.error(`PublishScene.fetchScene unable to retrieve object details from ${this.idSystemObject}`, LOG.LS.eCOLL);
            return false;
        }

        if (oID.eObjectType !== DBAPI.eSystemObjectType.eScene) {
            LOG.error(`PublishScene.fetchScene received eSceneQCd event for non scene object ${JSON.stringify(oID, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
            return false;
        }

        // fetch SystemObjectVersion
        this.systemObjectVersion = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(this.idSystemObject);
        if (!this.systemObjectVersion) {
            LOG.error(`PublishScene.fetchScene could not compute SystemObjectVersion for idSystemObject ${this.idSystemObject}`, LOG.LS.eCOLL);
            return false;
        }

        // fetch scene
        this.scene = oID.idObject ? await DBAPI.Scene.fetch(oID.idObject) : null;
        if (!this.scene) {
            LOG.error(`PublishScene.fetchScene could not compute scene from ${JSON.stringify(oID, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
            return false;
        }

        if (!this.scene.HasBeenQCd) {
            LOG.error(`PublishScene.fetchScene attempting to publish non-QC'd scene ${JSON.stringify(this.scene, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
            return false;
        }

        // create UUID if not done already
        if (!this.scene.EdanUUID) {
            this.scene.EdanUUID = uuidv4();
            if (!await this.scene.update()) {
                LOG.error(`PublishScene.fetchScene unable to persist UUID for scene object ${JSON.stringify(this.scene, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
                return false;
            }
        }

        // compute subject(s) owning this scene
        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(this.idSystemObject, DBAPI.eObjectGraphMode.eAncestors);
        if (!await OG.fetch()) {
            LOG.error(`PublishScene.fetchScene unable to compute object graph for scene ${JSON.stringify(this.scene, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
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
            LOG.error(`PublishScene.computeMSXMap unable to fetch ModelSceneXrefs for scene ${this.scene.idScene}`, LOG.LS.eCOLL);
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
        if (!this.DownloadMSXMap)
            return false;
        this.assetVersions = await DBAPI.AssetVersion.fetchLatestFromSystemObject(this.idSystemObject);
        if (!this.assetVersions || this.assetVersions.length === 0) {
            LOG.error(`PublishScene.collectAssets unable to load asset versions for scene ${JSON.stringify(this.scene, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
            return false;
        }

        // first pass through assets: detect and record the scene file (first file to match *.svx.json); lookup supporting information
        // prepare to extract and discard the path to this file, so that the scene zip is "rooted" at the svx.json
        let stageRes: H.IOResults = { success: true, error: '' };
        for (const assetVersion of this.assetVersions) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            LOG.info(`PublishScene.collectAssets considering assetVersion=${JSON.stringify(assetVersion, H.Helpers.saferStringify)} asset=${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
            if (!asset) {
                LOG.error(`PublishScene.collectAssets unable to load asset by id ${assetVersion.idAsset}`, LOG.LS.eCOLL);
                return false;
            }

            if (asset.idSystemObject) {
                const modelSceneXref: DBAPI.ModelSceneXref | undefined = this.DownloadMSXMap.get(asset.idSystemObject ?? 0);
                if (!modelSceneXref)
                    this.SacList.push({ idSystemObject: asset.idSystemObject, asset, assetVersion });
                else {
                    const model: DBAPI.Model | null = await DBAPI.Model.fetch(modelSceneXref.idModel);
                    if (!model) {
                        LOG.error(`PublishScene.collectAssets unable to load model from xref ${JSON.stringify(modelSceneXref, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
                        return false;
                    }
                    this.SacList.push({ idSystemObject: asset.idSystemObject, asset, assetVersion, model, modelSceneXref });
                }
            }

            if (!this.sceneFile && assetVersion.FileName.toLowerCase().endsWith('.svx.json')) {
                this.sceneFile = assetVersion.FileName;
                this.extractedPath = asset.FilePath;

                // extract scene's SVX.JSON for use in updating EDAN search status and creating downloads
                const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(asset, assetVersion);
                if (!RSR.success || !RSR.readStream) {
                    LOG.error(`PublishScene.collectAssets failed to extract stream for scene's asset version ${assetVersion.idAssetVersion}`, LOG.LS.eCOLL);
                    return false;
                }

                const svx: SvxReader = new SvxReader();
                stageRes = await svx.loadFromStream(RSR.readStream);
                if (!stageRes.success) {
                    LOG.error(`PublishScene.collectAssets failed to extract scene's svx.json contents: ${stageRes.error}`, LOG.LS.eCOLL);
                    return false;
                }
                this.svxDocument = svx.SvxDocument;
            }
        }
        return true;
    }

    private async stageSceneFiles(): Promise<boolean> {
        if (this.SacList.length <= 0 || !this.scene)
            return false;
        let stageRes: H.IOResults = { success: true, error: '' };

        // second pass: zip up appropriate assets; prepare to copy downloads
        const zip: ZIP.ZipStream = new ZIP.ZipStream();
        for (const SAC of this.SacList.values()) {
            if (SAC.model) // skip downloads
                continue;

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(SAC.asset, SAC.assetVersion);
            if (!RSR.success || !RSR.readStream) {
                LOG.error(`PublishScene.stageSceneFiles failed to extract stream for asset version ${SAC.assetVersion.idAssetVersion}`, LOG.LS.eCOLL);
                return false;
            }

            let rebasedPath: string = this.extractedPath ? SAC.asset.FilePath.replace(this.extractedPath, '') : SAC.asset.FilePath;
            if (this.extractedPath && rebasedPath.startsWith('/'))
                rebasedPath = rebasedPath.substring(1);

            const fileNameAndPath: string = path.posix.join(rebasedPath, SAC.assetVersion.FileName);
            LOG.info(`PublishScene.stageSceneFiles adding ${fileNameAndPath} to zip`, LOG.LS.eCOLL);
            const res: H.IOResults = await zip.add(fileNameAndPath, RSR.readStream);
            if (!res.success) {
                LOG.error(`PublishScene.stageSceneFiles failed to add asset version ${SAC.assetVersion.idAssetVersion} to zip: ${res.error}`, LOG.LS.eCOLL);
                return false;
            }
        }

        const zipStream: NodeJS.ReadableStream | null = await zip.streamContent(null);
        if (!zipStream) {
            LOG.error('PublishScene.stageSceneFiles failed to extract stream from zip', LOG.LS.eCOLL);
            return false;
        }

        stageRes = await H.Helpers.fileOrDirExists(Config.collection.edan.stagingRoot);
        if (!stageRes.success)
            stageRes = await H.Helpers.createDirectory(Config.collection.edan.stagingRoot);
        if (!stageRes.success) {
            LOG.error(`PublishScene.stageSceneFiles unable to ensure existence of staging directory ${Config.collection.edan.stagingRoot}: ${stageRes.error}`, LOG.LS.eCOLL);
            return false;
        }

        const noFinalSlash: boolean = !Config.collection.edan.upsertContentRoot.endsWith('/');
        this.sharedName = Config.collection.edan.upsertContentRoot + (noFinalSlash ? '/' : '') + this.scene.EdanUUID! + '.zip'; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        const stagedName: string = path.join(Config.collection.edan.stagingRoot, this.scene.EdanUUID!) + '.zip'; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        LOG.info(`PublishScene.stageSceneFiles staging file ${stagedName}, referenced in publish as ${this.sharedName}`, LOG.LS.eCOLL);

        stageRes = await H.Helpers.writeStreamToFile(zipStream, stagedName);
        if (!stageRes.success) {
            LOG.error(`PublishScene.stageSceneFiles unable to stage file ${stagedName}: ${stageRes.error}`, LOG.LS.eCOLL);
            return false;
        }
        LOG.info(`PublishScene.stageSceneFiles staged file ${stagedName}`, LOG.LS.eCOLL);
        return true;
    }

    private async stageDownloads(): Promise<boolean> {
        if (this.SacList.length <= 0 || !this.scene)
            return false;
        // third pass: stage downloads
        let stageRes: H.IOResults = { success: true, error: '' };
        this.edan3DResourceList = [];
        this.resourcesHotFolder = path.join(Config.collection.edan.resourcesHotFolder, this.scene.EdanUUID!); // eslint-disable-line @typescript-eslint/no-non-null-assertion

        for (const SAC of this.SacList.values()) {
            if (!SAC.model) // SAC is not a download, skip it
                continue;

            if (!await this.ensureResourceHotFolderExists())
                return false;

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(SAC.asset, SAC.assetVersion);
            if (!RSR.success || !RSR.readStream) {
                LOG.error(`PublishScene.stageDownloads failed to extract stream for asset version ${SAC.assetVersion.idAssetVersion}`, LOG.LS.eCOLL);
                return false;
            }

            // copy stream to resourcesHotFolder
            const stagedName: string = path.join(this.resourcesHotFolder, SAC.assetVersion.FileName);
            LOG.info(`PublishScene.stageDownloads staging file ${stagedName}`, LOG.LS.eCOLL);
            stageRes = await H.Helpers.writeStreamToFile(RSR.readStream, stagedName);
            if (!stageRes.success) {
                LOG.error(`PublishScene.stageDownloads unable to stage file ${stagedName}: ${stageRes.error}`, LOG.LS.eCOLL);
                return false;
            }
            LOG.info(`PublishScene.stageDownloads staged file ${stagedName}`, LOG.LS.eCOLL);

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
            LOG.error(`PublishScene.ensureResourceHotFolderExists failed to create resources hot folder ${this.resourcesHotFolder}: ${stageRes.error}`, LOG.LS.eCOLL);
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
            default: LOG.error(`PublishScene.extractResource found no type mapping for ${typeV?.Term}`, LOG.LS.eCOLL); break;
            case undefined: break;
            case 'Scan To Mesh':    type = '3D mesh'; break;
            case 'CAD':             type = 'CAD model'; break;
        }

        let UNITS: COL.Edan3DResourceAttributeUnits | undefined = undefined;
        const unitsV: DBAPI.Vocabulary | undefined = SAC.model.idVUnits ? await CACHE.VocabularyCache.vocabulary(SAC.model.idVUnits) : undefined;
        switch (unitsV?.Term) {
            default: LOG.error(`PublishScene.extractResource found no units mapping for ${unitsV?.Term}`, LOG.LS.eCOLL); break;
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
            default: LOG.error(`PublishScene.extractResource found no model file type mapping for ${modelTypeV?.Term}`, LOG.LS.eCOLL); break;
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
            default: LOG.error(`PublishScene.extractResource found no file type mapping for ${SAC.assetVersion.FileName}`, LOG.LS.eCOLL); break;
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

    private async updatePublishedState(): Promise<boolean> {
        if (!this.systemObjectVersion)
            return false;

        // Determine if licensing prevents publishing
        const LR: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(this.idSystemObject);
        if (LR && LR.License &&
            DBAPI.LicenseRestrictLevelToPublishedStateEnum(LR.License.RestrictLevel) === DBAPI.ePublishedState.eNotPublished)
            this.eState = DBAPI.ePublishedState.eNotPublished;
        LOG.info(`PublishScene.updatePublishedState computed license ${LR ? JSON.stringify(LR.License, H.Helpers.saferStringify) : 'none'}, resulting in published state of ${this.eState}`, LOG.LS.eCOLL);

        if (this.systemObjectVersion.publishedStateEnum() !== this.eState) {
            this.systemObjectVersion.setPublishedState(this.eState);
            if (!await this.systemObjectVersion.update()) {
                LOG.error(`PublishScene.updatePublishedState unable to update published state for ${JSON.stringify(this.systemObjectVersion, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
                return false;
            }
        }

        return true;
    }

    private computeEdanSearchFlags(edanRecord: COL.EdanRecord, eState: DBAPI.ePublishedState): { status: number, publicSearch: boolean, downloads: boolean } {
        let status: number = edanRecord.status;
        let publicSearch: boolean = edanRecord.publicSearch;
        let downloads: boolean = publicSearch;

        switch (eState) {
            default:
            case DBAPI.ePublishedState.eNotPublished:       status = 1; publicSearch = false; downloads = false; break;
            case DBAPI.ePublishedState.eAPIOnly:            status = 0; publicSearch = false; downloads = true;  break;
            case DBAPI.ePublishedState.ePublished:          status = 0; publicSearch = true;  downloads = true;  break;
            // case DBAPI.ePublishedState.eViewOnly:           status = 0; publicSearch = true;  downloads = false; break;
        }
        LOG.info(`PublishScene.computeEdanSearchFlags(${DBAPI.ePublishedState[eState]}) = { status ${status}, publicSearch ${publicSearch}, downloads ${downloads} }`, LOG.LS.eCOLL);
        return { status, publicSearch, downloads };
    }
}