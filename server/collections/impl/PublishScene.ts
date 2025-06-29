import { Config } from '../../config';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COL from '../../collections/interface/';
import * as META from '../../metadata';
import * as H from '../../utils/helpers';
import * as ZIP from '../../utils/zipStream';
import * as STORE from '../../storage/interface';
import * as WF from '../../workflow/interface';
import { SvxReader } from '../../utils/parser';
import { IDocument } from '../../types/voyager';
import * as COMMON from '@dpo-packrat/common';
import { EdanCollection } from './EdanCollection';
import { RecordKeeper as RK } from '../../records/recordKeeper';

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import lodash from 'lodash';

export type SceneAssetCollector = {
    idSystemObject: number;
    asset: DBAPI.Asset;
    assetVersion: DBAPI.AssetVersion;
    model?: DBAPI.Model;
    modelSceneXref?: DBAPI.ModelSceneXref;
    metadataSet?: DBAPI.Metadata[] | null;
};

export type SceneUpdateResult = {
    success: boolean;
    downloadsGenerated?: boolean;
    downloadsRemoved?: boolean;
    error?: string;
};

export class PublishScene {
    private idSystemObject: number;
    private analyzed: boolean = false;

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

    constructor(idSystemObject: number) {
        this.idSystemObject = idSystemObject;
    }

    async computeResourceMap(): Promise<Map<SceneAssetCollector, COL.Edan3DResource> | null> {
        if (!this.analyzed) {
            const result: boolean = await this.analyze();
            if (!result)
                return null;
        }

        if (!this.scene)
            return null;
        const resourceMap: Map<SceneAssetCollector, COL.Edan3DResource> = new Map<SceneAssetCollector, COL.Edan3DResource>();
        for (const SAC of this.SacList.values()) {
            if (!SAC.model) // SAC is not a download, skip it
                continue;

            // compute download entry
            const resource: COL.Edan3DResource | null = await this.extractResource(SAC, this.scene.EdanUUID!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (resource)
                resourceMap.set(SAC, resource);
        }
        // LOG.info(`>>> PublishScene.computeResourceMap (scene: ${this.sceneFile} | ${H.Helpers.JSONStringify(resourceMap)})`,LOG.LS.eDEBUG);
        return resourceMap;
    }

    async publish(ICol: COL.ICollection, ePublishedStateIntended: COMMON.ePublishedState): Promise<boolean> {
        if (!this.analyzed) {
            const result: boolean = await this.analyze(ePublishedStateIntended);
            if (!result)
                return false;
        }

        if (!this.scene || !this.subject) {
            RK.logError(RK.LogSection.eCOLL,'publish failed','cannot publish. no scene/subject',{ scene: this.scene, subject: this.subject },'Publish.Scene');
            return false;
        }

        // stage scene
        if (!await this.stageSceneFiles() || !this.sharedName) {
            RK.logError(RK.LogSection.eCOLL,'publish failed','cannot stage files',{ scene: this.scene, sharedName: this.sharedName },'Publish.Scene');
            return false;
        }

        // create EDAN 3D Package for our scene and push to EDAN (un-published state)
        // this is done first so when we update with license/status info the scene is there
        let edanRecord: COL.EdanRecord | null = await ICol.createEdan3DPackage(this.sharedName, this.sceneFile);
        if (!edanRecord) {
            RK.logError(RK.LogSection.eCOLL,'publish failed','create EDAN package failed',{ scene: this.scene, sharedName: this.sharedName },'Publish.Scene');
            return false;
        }
        RK.logInfo(RK.LogSection.eCOLL,'publish sucess','3D package published to EDAN',{ status: edanRecord.status, publicSearch: edanRecord.publicSearch, resources: this.edan3DResourceList?.length ?? 0, path: this.sharedName },'Publish.Scene');

        // stage downloads
        if (!await this.stageDownloads() || !this.edan3DResourceList) {
            RK.logError(RK.LogSection.eCOLL,'publish failed','failed to stage downloads',{ count: this.edan3DResourceList?.length ?? -1 },'Publish.Scene');
            return false;
        }

        // figure out our license information
        const LR: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(this.idSystemObject);
        if (!await this.updatePublishedState(LR, ePublishedStateIntended))
            return false;
        const media_usage: COL.EdanLicenseInfo = EdanCollection.computeLicenseInfo(LR?.License?.Name); // eslint-disable-line camelcase

        // figure out our flags for the package so we have the correct visibility within EDAN
        const { status, publicSearch, downloads } = this.computeEdanSearchFlags(edanRecord, ePublishedStateIntended);
        const haveDownloads: boolean = (this.edan3DResourceList.length > 0);
        const updatePackage: boolean = haveDownloads                                // we have downloads, or
            || (status !== edanRecord.status)                                       // publication status changed
            || (publicSearch !== edanRecord.publicSearch)                           // public search changed
            || (!lodash.isEqual(media_usage, edanRecord.content['media_usage']));   // license has changed

        // update EDAN 3D Package if we have downloads and/or if our published state has changed
        // Per Andrew Gunther on 1/10/2023, 'media_usage' is the correct property for us to set for our calls
        // to the EDAN 3D API upsertContent, when we want to specify licensing information for the scene (not its metadata)
        // Confusingly, this data is presented as 'usage' when querying EDAN using its metadata search
        if (this.svxDocument && updatePackage) {
            const E3DPackage: COL.Edan3DPackageContent = { ...edanRecord.content };
            E3DPackage.document = this.svxDocument;
            E3DPackage.resources = (downloads && haveDownloads) ? this.edan3DResourceList : [];
            E3DPackage.media_usage = media_usage; // eslint-disable-line camelcase

            RK.logDebug(RK.LogSection.eCOLL,'publish','updating package',{ edanRecord },'Publish.Scene');
            edanRecord = await ICol.updateEdan3DPackage(edanRecord.url, edanRecord.title, E3DPackage, status, publicSearch);
            if (!edanRecord) {
                RK.logError(RK.LogSection.eCOLL,'publish failed','EDAN package update failed',{ edanPackage: E3DPackage },'Publish.Scene');
                return false;
            }
        }

        RK.logInfo(RK.LogSection.eCOLL,'publish EDAN package success',undefined,{ UUID: this.scene.EdanUUID, status: COMMON.ePublishedState[status], publicSearch, downloads, haveDownloads },'Publish.Scene');
        return true;
    }

    static async extractSceneMetadata(idSystemObject: number, idUser: number | null): Promise<H.IOResults> {
        const publishScene: PublishScene = new PublishScene(idSystemObject);
        const resourceMap: Map<SceneAssetCollector, COL.Edan3DResource> | null = await publishScene.computeResourceMap();
        if (!resourceMap)
            return { success: false, error: 'PublishScene.extractSceneMetadata failed to compute resource map' };

        // LOG.info(`extractSceneMetadata(${idSystemObject}) handling ${resourceMap.size} resources`, LOG.LS.eCOLL);
        const retValue: H.IOResults = { success: true };
        for (const [ SAC, resource ] of resourceMap) {
            // LOG.info(`extractSceneMetadata(${idSystemObject}, ${SAC.idSystemObject}) = ${JSON.stringify(resource)}`, LOG.LS.eCOLL);
            const extractor: META.MetadataExtractor = new META.MetadataExtractor();
            extractor.metadata.set('isAttachment', '1');
            if (resource.type)
                extractor.metadata.set('type', resource.type);
            if (resource.category)
                extractor.metadata.set('category', resource.category);
            if (resource.title)
                extractor.metadata.set('title', resource.title);
            if (resource.attributes) {
                for (const attribute of resource.attributes) {
                    if (attribute.UNITS)
                        extractor.metadata.set('units', attribute.UNITS);
                    if (attribute.MODEL_FILE_TYPE)
                        extractor.metadata.set('modelType', attribute.MODEL_FILE_TYPE);
                    if (attribute.FILE_TYPE)
                        extractor.metadata.set('fileType', attribute.FILE_TYPE);
                    if (attribute.GLTF_STANDARDIZED)
                        extractor.metadata.set('gltfStandardized', attribute.GLTF_STANDARDIZED ? '1' : '0');
                    if (attribute.DRACO_COMPRESSED)
                        extractor.metadata.set('dracoCompressed', attribute.DRACO_COMPRESSED ? '1' : '0');
                }
            }

            if (extractor.metadata.size > 0) {
                const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromAssetVersion(SAC.assetVersion);
                const results: H.IOResults = SOI ? await META.MetadataManager.persistExtractor(SOI.idSystemObject, idSystemObject, extractor, idUser) // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    : { success: false, error: 'Unable to compute idSystemObject for asset version' };
                if (!results.success) {
                    const error: string = `PublishScene.extractSceneMetadata unable to persist scene attachment metadata for asset version ${JSON.stringify(SAC.assetVersion, H.Helpers.saferStringify)}: ${results.error}`;
                    RK.logError(RK.LogSection.eCOLL,'extract scene metadata failed',`unable to persist scene attachment metadata for asset version: ${results.error}`,{ assetVersion: SAC.assetVersion },'Publish.Scene');
                    retValue.error += (retValue.error ? '\n' : '') + error;
                    retValue.success = false;
                }
            }
        }
        return retValue;
    }

    private async analyze(ePublishedStateIntended?: COMMON.ePublishedState): Promise<boolean> {
        this.analyzed = true;
        if (!await this.fetchScene(ePublishedStateIntended) || !this.scene || !this.subject)
            return false;
        RK.logInfo(RK.LogSection.eCOLL,'analyze',undefined,{ uuid: this.scene.EdanUUID, ePublishedStateIntended },'Publish.Scene');

        // Process models, building a mapping from the model's idSystemObject -> ModelSceneXref, for those models that are for Downloads
        if (!await this.computeMSXMap() || !this.DownloadMSXMap)
            return false;
        // collect and analyze assets
        if (!await this.collectAssets(ePublishedStateIntended) || this.SacList.length <= 0)
            return false;
        return true;
    }

    private async fetchScene(ePublishedStateIntended?: COMMON.ePublishedState): Promise<boolean> {
        const changingPubState: boolean = (ePublishedStateIntended !== undefined);
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(this.idSystemObject);
        if (!oID) {
            RK.logError(RK.LogSection.eCOLL,'fetch scene failed','unable to retrieve object details',{ idSystemObject: this.idSystemObject },'Publish.Scene');
            return false;
        }

        if (oID.eObjectType !== COMMON.eSystemObjectType.eScene) {
            RK.logError(RK.LogSection.eCOLL,'fetch scene failed','called for non scene object',{ objectID: oID },'Publish.Scene');
            return false;
        }

        // fetch SystemObjectVersion
        this.systemObjectVersion = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(this.idSystemObject);
        if (!this.systemObjectVersion && changingPubState) {
            RK.logError(RK.LogSection.eCOLL,'fetch scene failed','could not compute SystemObjectVersion for idSystemObject',{ idSystemObject: this.idSystemObject },'Publish.Scene');
            return false;
        }

        // fetch scene
        this.scene = oID.idObject ? await DBAPI.Scene.fetch(oID.idObject) : null;
        if (!this.scene) {
            RK.logError(RK.LogSection.eCOLL,'fetch scene failed','could not compute scene',{ objectID: oID },'Publish.Scene');
            return false;
        }

        // If we're intending to change publishing state, verify that we can given the intended published state
        if (changingPubState) {
            if (ePublishedStateIntended !== COMMON.ePublishedState.eNotPublished &&
               (!this.scene.ApprovedForPublication || !this.scene.PosedAndQCd)) {
                RK.logError(RK.LogSection.eCOLL,'fetch scene failed','attempting to publish non-Approved and/or non-QC scene',{ scene: this.scene },'Publish.Scene');
                return false;
            }

            // create UUID if not done already
            if (!this.scene.EdanUUID) {
                this.scene.EdanUUID = uuidv4();
                if (!await this.scene.update()) {
                    RK.logError(RK.LogSection.eCOLL,'fetch scene failed','unable to persist UUID for scene object',{ scene: this.scene },'Publish.Scene');
                    return false;
                }
            }
        }

        // compute subject(s) owning this scene
        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(this.idSystemObject, DBAPI.eObjectGraphMode.eAncestors);
        if (!await OG.fetch()) {
            RK.logError(RK.LogSection.eCOLL,'fetch scene failed','unable to compute object graph for scene',{ scene: this.scene },'Publish.Scene');
            return false;
        }
        if (OG.subject && OG.subject.length > 0)
            this.subject = OG.subject[0];
        return true;
    }

    private async computeMSXMap(): Promise<boolean> {
        if (!this.scene)
            return false;
        const DownloadMSXMap: Map<number, DBAPI.ModelSceneXref> | null = await PublishScene.computeDownloadMSXMap(this.scene.idScene);
        if (DownloadMSXMap) {
            this.DownloadMSXMap = DownloadMSXMap;
            return true;
        }
        return false;
    }

    static async computeDownloadMSXMap(idScene: number): Promise<Map<number, DBAPI.ModelSceneXref> | null> {
        if (!idScene)
            return null;
        const MSXs: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromScene(idScene);
        if (!MSXs) {
            RK.logError(RK.LogSection.eCOLL,'compute download map','unable to fetch ModelSceneXrefs for scene',{ idScene },'Publish.Scene');
            return null;
        }

        // LOG.info(`>>> computeDownloadMSXMap (${idScene}): ${H.Helpers.JSONStringify(MSXs)}`,LOG.LS.eDEBUG);
        const DownloadMSXMap: Map<number, DBAPI.ModelSceneXref> = new Map<number, DBAPI.ModelSceneXref>();
        for (const MSX of MSXs) {
            // HACK: Packrat is misusing the Usage property returned by Cook for Voyager scene generation. Some
            // assets like draco and USDZ downloads are used by the viewer & as a download. temporarily adding
            // their Usage types until a file's 'downloadable' property is detached from 'Usage'. (#DPO3DPKRT-777)
            if (MSX.Usage && (MSX.Usage.startsWith('Download:') || MSX.Usage.startsWith('App3D') || MSX.Usage.startsWith('iOSApp3D'))) {
                const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID({ eObjectType: COMMON.eSystemObjectType.eModel, idObject: MSX.idModel });
                if (SOI)
                    DownloadMSXMap.set(SOI.idSystemObject, MSX);
            }
        }
        return DownloadMSXMap;
    }

    static async handleSceneUpdates(idScene: number, _idSystemObject: number, _idUser: number | undefined,
        oldPosedAndQCd: boolean, newPosedAndQCd: boolean,
        LicenseOld: DBAPI.License | undefined, LicenseNew: DBAPI.License | undefined): Promise<SceneUpdateResult> {
        // if we've changed Posed and QC'd, and/or we've updated our license, create or remove downloads
        const oldDownloadState: boolean = oldPosedAndQCd && DBAPI.LicenseAllowsDownloadGeneration(LicenseOld?.RestrictLevel);
        const newDownloadState: boolean = newPosedAndQCd && DBAPI.LicenseAllowsDownloadGeneration(LicenseNew?.RestrictLevel);

        if (oldDownloadState === newDownloadState)
            return { success: true };

        if (newDownloadState) {
            RK.logInfo(RK.LogSection.eCOLL,'handle scene updates','generating downloads for scene (skipping)',{ idScene },'Publish.Scene');

            // Generate downloads
            const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
            if (!workflowEngine) {
                RK.logError(RK.LogSection.eCOLL,'handle scene updates','Unable to fetch workflow engine for download generation for scene',{ idScene },'Publish.Scene');
                return { success: false, error: `Unable to fetch workflow engine for download generation for scene ${idScene}` };
            }

            // trigger the workflow/recipe
            // HACK: disable automatic download generation for the moment
            // workflowEngine.generateSceneDownloads(idScene, { idUserInitiator: _idUser }); // don't await
            return { success: true, downloadsGenerated: false, downloadsRemoved: false };
        } else { // Remove downloads
            RK.logInfo(RK.LogSection.eCOLL,'handle scene updates','removing downloads for scene',{ idScene },'Publish.Scene');

            // Compute downloads
            const DownloadMSXMap: Map<number, DBAPI.ModelSceneXref> | null = await PublishScene.computeDownloadMSXMap(idScene);
            if (!DownloadMSXMap) {
                RK.logError(RK.LogSection.eCOLL,'handle scene update failed','Unable to fetch scene downloads for scene',{ idScene },'Publish.Scene');
                return { success: false, error: `Unable to fetch scene downloads for scene ${idScene}` };
            }

            // For each download, compute assets, and set those to having an asset vresion override of 0, which means do not attach to the cloned system object
            const assetVersionOverrideMap: Map<number, number> = new Map<number, number>();
            for (const idSystemObject of DownloadMSXMap.keys()) {
                const assets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(idSystemObject);
                if (!assets) {
                    RK.logError(RK.LogSection.eCOLL,'handle scene update failed','Unable to fetch assets for idSystemObject',{ idSystemObject },'Publish.Scene');
                    return { success: false, error: `Unable to fetch assets for idSystemObject ${idSystemObject} for scene ${idScene}` };
                }
                for (const asset of assets)
                    assetVersionOverrideMap.set(asset.idAsset, 0);
            }

            // HACK: preventing modifying downloads in the Scene.
            //       Publishing should not add/remove assets but select what is included when sent to EDAN
            // const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(idSystemObject, null, 'Removing Downloads', assetVersionOverrideMap);
            // if (!SOV)
            //     return PublishScene.sendResult(false, `Unable to clone system object version for idSystemObject ${idSystemObject} for scene ${idScene}`);
            return { success: true, downloadsGenerated: false, downloadsRemoved: true };
        }
    }

    private async collectAssets(ePublishedStateIntended?: COMMON.ePublishedState): Promise<boolean> {
        // LOG.info(`>>> collectAssets.DownloadMSXMap: ${H.Helpers.JSONStringify(this.DownloadMSXMap)}`,LOG.LS.eDEBUG);
        if (!this.DownloadMSXMap)
            return false;
        this.assetVersions = await DBAPI.AssetVersion.fetchLatestFromSystemObject(this.idSystemObject);
        if (!this.assetVersions || this.assetVersions.length === 0) {
            RK.logError(RK.LogSection.eCOLL,'collect assets failed','unable to load asset versions for scene',{ scene: this.scene },'Publish.Scene');
            return false;
        }

        RK.logDebug(RK.LogSection.eCOLL,'collect assets','download MSX map',{ downloadMSXMap: this.DownloadMSXMap },'Publish.Scene');

        // first pass through assets: detect and record the scene file (first file to match *.svx.json); lookup supporting information
        // prepare to extract and discard the path to this file, so that the scene zip is "rooted" at the svx.json
        let stageRes: H.IOResults = { success: true };
        for (const assetVersion of this.assetVersions) {
            // grab our system object for this asset version
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            RK.logInfo(RK.LogSection.eCOLL,'collect assets','considering assetVersion',{ assetVersion, asset },'Publish.Scene');
            if (!asset) {
                RK.logError(RK.LogSection.eCOLL,'collect assets failed','unable to load asset by id',{ assetVersion },'Publish.Scene');
                return false;
            }

            // determine if assetVersion is an attachment by examining metadata
            // NOTE: isAttachment metadata is set in computeResourceMap to label an asset as a 'resource' (i.e. downloadable)
            // however, usdz/draco files have dual use and are resources, but also connected to a voyager scene. below is a special
            // case for this situation until downloadable is decoupled from Usage.
            let isAttachment: boolean = false;
            const SOAssetVersion: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
            if (!SOAssetVersion) {
                RK.logError(RK.LogSection.eCOLL,'collect assets failed','unable to compute system object',{ assetVersion },'Publish.Scene');
                return false;
            }
            const metadataSet: DBAPI.Metadata[] | null = await  DBAPI.Metadata.fetchFromSystemObject(SOAssetVersion.idSystemObject);
            if (metadataSet) {
                for (const metadata of metadataSet) {
                    if (metadata.Name === 'isAttachment') {
                        isAttachment = (metadata.ValueShort === '1');
                        break;
                    }
                }
            } else
                RK.logError(RK.LogSection.eCOLL,'collect assets failed','unable to compute metadata',{ assetVersion },'Publish.Scene');

            // if we have our asset and a system object (always the case?) then we see if this asset is in the download/resource
            // map...
            if (asset.idSystemObject) {
                const modelSceneXref: DBAPI.ModelSceneXref | undefined = this.DownloadMSXMap.get(asset.idSystemObject ?? 0);
                if (!modelSceneXref) {
                    // LOG.info(`>>> PublishScene.collectAssets adding to list, no MSX (${asset.FileName}|${isAttachment}|${H.Helpers.JSONStringify(metadataSet)}`, LOG.LS.eDEBUG);
                    this.SacList.push({ idSystemObject: asset.idSystemObject, asset, assetVersion, metadataSet: isAttachment ? metadataSet : undefined });
                } else {
                    const model: DBAPI.Model | null = await DBAPI.Model.fetch(modelSceneXref.idModel);
                    if (!model) {
                        RK.logError(RK.LogSection.eCOLL,'collect assets failed','unable to load model from xref',{ modelSceneXref },'Publish.Scene');
                        return false;
                    }
                    // LOG.info(`>>> PublishScene.collectAssets adding to list with MSX (${asset.FileName}|${isAttachment}|${H.Helpers.JSONStringify(modelSceneXref)}`, LOG.LS.eDEBUG);
                    this.SacList.push({ idSystemObject: asset.idSystemObject, asset, assetVersion, model, modelSceneXref, metadataSet: isAttachment ? metadataSet : undefined });

                    // HACK: special case for handling dual-use assets (draco/usdz), which will be added as downloads/attachments by default.
                    // whe check if we're dealing with that asset and add like other scene referenced assets. (i.e. we omit the MSX and metadataSet)
                    if(modelSceneXref.Usage === 'App3D' || modelSceneXref.Usage === 'iOSApp3D') {
                        RK.logDebug(RK.LogSection.eCOLL,'collect assets failed','adding draco/usdz assets again',{ asset },'Publish.Scene');
                        this.SacList.push({ idSystemObject: asset.idSystemObject, asset, assetVersion, metadataSet: undefined });
                    }
                }

            } else
                RK.logDebug(RK.LogSection.eCOLL,'collect assets failed','not adding. no idSystemObject',{ asset, metadataSet },'Publish.Scene');

            if (!this.sceneFile && assetVersion.FileName.toLowerCase().endsWith('.svx.json')) {
                this.sceneFile = assetVersion.FileName;
                this.extractedPath = assetVersion.FilePath;

                // if we're intending to publish, extract scene's SVX.JSON for use in updating EDAN search status and creating downloads
                if (ePublishedStateIntended !== undefined) {
                    const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(asset, assetVersion);
                    if (!RSR.success || !RSR.readStream) {
                        RK.logError(RK.LogSection.eCOLL,'collect assets failed',`failed to extract stream for scene asset version: ${RSR.error}`,{ assetVersion },'Publish.Scene');
                        return false;
                    }

                    const svx: SvxReader = new SvxReader();
                    stageRes = await svx.loadFromStream(RSR.readStream);
                    if (!stageRes.success) {
                        RK.logError(RK.LogSection.eCOLL,'collect assets failed',`failed to extract scene svx.json contents: ${stageRes.error}`,{},'Publish.Scene');
                        return false;
                    }
                    this.svxDocument = svx.SvxDocument;
                }
            }
        }

        // LOG.info(`>>> collectAssets.SAC: ${H.Helpers.JSONStringify(this.SacList)}`,LOG.LS.eDEBUG);
        return true;
    }

    private async stageSceneFiles(): Promise<boolean> {
        if (this.SacList.length <= 0 || !this.scene) {
            RK.logError(RK.LogSection.eCOLL,'stage scene files failed','cannot stage files for scene. No scene or assets list',{ sceneFile: this.sceneFile, scene: this.scene, sacList: this.SacList },'Publish.Scene');
            return false;
        }
        let stageRes: H.IOResults = { success: true };

        // log what will be included
        const assets: string[] = this.SacList.map(SAC => { return `${SAC.asset.FileName}(v${SAC.assetVersion.Version})`; });
        RK.logInfo(RK.LogSection.eCOLL,'stage scene files','collecting assets for scene',{ sceneFile: this.sceneFile, assets },'Publish.Scene');

        // second pass: zip up appropriate assets; prepare to copy downloads
        const zip: ZIP.ZipStream = new ZIP.ZipStream();
        for (const SAC of this.SacList.values()) {
            if (SAC.model || SAC.metadataSet) // skip downloads
                continue;

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(SAC.asset, SAC.assetVersion);
            if (!RSR.success || !RSR.readStream) {
                RK.logError(RK.LogSection.eCOLL,'stage scene files failed',`failed to extract stream for asset version: ${RSR.error}`,{ ...SAC.assetVersion },'Publish.Scene');
                return false;
            }

            const filePath: string = SAC.assetVersion.FilePath;
            let rebasedPath: string = this.extractedPath ? filePath.replace(this.extractedPath, '') : filePath;
            if (this.extractedPath && rebasedPath.startsWith('/'))
                rebasedPath = rebasedPath.substring(1);

            const fileNameAndPath: string = path.posix.join(rebasedPath, SAC.assetVersion.FileName);
            RK.logDebug(RK.LogSection.eCOLL,'stage scene files','adding to zip',{ fileNameAndPath },'Publish.Scene');

            const res: H.IOResults = await zip.add(fileNameAndPath, RSR.readStream);
            if (!res.success) {
                RK.logError(RK.LogSection.eCOLL,'stage scene files failed',`failed to add asset version to zip: ${res.error}`,{ ...SAC.assetVersion },'Publish.Scene');
                return false;
            }
        }

        // stream entire zip
        const zipStream: NodeJS.ReadableStream | null = await zip.streamContent(null);
        if (!zipStream) {
            RK.logError(RK.LogSection.eCOLL,'stage scene files failed','failed to extract stream from zip',{},'Publish.Scene');
            return false;
        }

        // make sure we have a folder to stage our file in
        stageRes = await H.Helpers.fileOrDirExists(Config.collection.edan.stagingRoot);
        if (!stageRes.success)
            stageRes = await H.Helpers.createDirectory(Config.collection.edan.stagingRoot);
        if (!stageRes.success) {
            RK.logError(RK.LogSection.eCOLL,'stage scene files failed',`unable to ensure existence of staging directory: ${stageRes.error}`,{ stagingRoot: Config.collection.edan.stagingRoot },'Publish.Scene');
            return false;
        }

        // build our paths for the staged content and store in this instance via sharedName
        // 'sharedName' represents the path to the resource 'shared' and accessible to EDAN
        // in production where we put resources for EDAN to find is different than the staging root
        const noFinalSlash: boolean = !Config.collection.edan.upsertContentRoot.endsWith('/');
        this.sharedName = Config.collection.edan.upsertContentRoot + (noFinalSlash ? '/' : '') + this.scene.EdanUUID! + '.zip'; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        const stagedName: string = path.join(Config.collection.edan.stagingRoot, this.scene.EdanUUID!) + '.zip'; // eslint-disable-line @typescript-eslint/no-non-null-assertion

        RK.logDebug(RK.LogSection.eCOLL,'stage scene files','staging file referenced in publish as shared name',{ upsertRoot: Config.collection.edan.upsertContentRoot, stagingRoot: Config.collection.edan.stagingRoot, sharedName: this.sharedName, stagedName },'Publish.Scene');

        stageRes = await H.Helpers.writeStreamToFile(zipStream, stagedName);
        if (!stageRes.success) {
            RK.logError(RK.LogSection.eCOLL,'stage scene files failed',`unable to stage file: ${stageRes.error}`,{ stagedName },'Publish.Scene');
            return false;
        }

        RK.logInfo(RK.LogSection.eCOLL,'stage scene files success',undefined,{ stagedName },'Publish.Scene');
        return true;
    }

    private async stageDownloads(): Promise<boolean> {
        if (this.SacList.length <= 0 || !this.scene)
            return false;
        // third pass: stage downloads
        let stageRes: H.IOResults = { success: true };
        this.edan3DResourceList = [];
        this.resourcesHotFolder = path.join(Config.collection.edan.resourcesHotFolder, this.scene.EdanUUID!); // eslint-disable-line @typescript-eslint/no-non-null-assertion

        for (const SAC of this.SacList.values()) {
            // LOG.info(`>>> stageDownloads.SAC: ${H.Helpers.JSONStringify(SAC)}`,LOG.LS.eDEBUG);
            if (!SAC.model && !SAC.metadataSet) // SAC is not a attachment, skip it
                continue;

            if (!await this.ensureResourceHotFolderExists())
                return false;

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(SAC.asset, SAC.assetVersion);
            if (!RSR.success || !RSR.readStream) {
                RK.logError(RK.LogSection.eCOLL,'stage downloads failed',`failed to extract stream for asset version: ${RSR.error}`,{ ...SAC.assetVersion },'Publish.Scene');
                return false;
            }

            // copy stream to resourcesHotFolder
            const stagedName: string = path.join(this.resourcesHotFolder, SAC.assetVersion.FileName);
            RK.logInfo(RK.LogSection.eCOLL,'stage downloads',undefined,{ stagedName },'Publish.Scene');

            stageRes = await H.Helpers.writeStreamToFile(RSR.readStream, stagedName);
            if (!stageRes.success) {
                RK.logError(RK.LogSection.eCOLL,'stage downloads failed',`unable to stage file: ${stageRes.error}`,{ stagedName },'Publish.Scene');
                return false;
            }
            RK.logInfo(RK.LogSection.eCOLL,'stage downloads success',undefined,{ stagedName },'Publish.Scene');

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
            RK.logError(RK.LogSection.eCOLL,'check hot folder exists failed',`failed to create resources hot folder: ${stageRes.error}`,{ hotFolder: this.resourcesHotFolder },'Publish.Scene');
            return false;
        }
        return true;
    }

    static async mapEdanUnitsToPackratVocabulary(units: COL.Edan3DResourceAttributeUnits): Promise<DBAPI.Vocabulary | undefined> {
        let eVocabID: COMMON.eVocabularyID | undefined = undefined;
        switch (units) {
            case 'mm': eVocabID = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsmm; break;
            case 'cm': eVocabID = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitscm; break;
            case 'm':  eVocabID = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsm;  break;
            case 'km': eVocabID = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitskm; break;
            case 'in': eVocabID = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsin; break;
            case 'ft': eVocabID = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsft; break;
            case 'yd': eVocabID = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsyd; break;
            case 'mi': eVocabID = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsmi; break;
        }
        return eVocabID ? await CACHE.VocabularyCache.vocabularyByEnum(eVocabID) : undefined;
    }

    static computeDownloadType(category?: COL.Edan3DResourceCategory | undefined,
        MODEL_FILE_TYPE?: COL.Edan3DResourceAttributeModelFileType | undefined, DRACO_COMPRESSED?: boolean | undefined): string {

        let tag: string = '';
        switch (category) {
            case 'Low resolution':
                switch (MODEL_FILE_TYPE) {
                    case 'glb':  tag = DRACO_COMPRESSED ? 'webassetglbarcompressed' : 'webassetglblowuncompressed'; break;
                    case 'obj':  tag = 'objziplow'; break;
                    case 'gltf': tag = 'gltfziplow'; break;
                }
                break;
            case 'iOS AR model':
                tag =  (MODEL_FILE_TYPE === 'usdz') ? 'usdz' : '';
                break;
            case 'Full resolution':
                tag = (MODEL_FILE_TYPE === 'obj') ? 'objzipfull' : '';
                break;
        }
        return tag;
    }

    private async extractResource(SAC: SceneAssetCollector, uuid: string): Promise<COL.Edan3DResource | null> {
        let type: COL.Edan3DResourceType | undefined = undefined;
        let UNITS: COL.Edan3DResourceAttributeUnits | undefined = undefined;
        let MODEL_FILE_TYPE: COL.Edan3DResourceAttributeModelFileType | undefined = undefined;
        let FILE_TYPE: COL.Edan3DResourceAttributeFileType | undefined = undefined;
        let GLTF_STANDARDIZED: boolean = true;                            // per Jon Blundel, 8/19/2021, models generated by Cook for downloads meets this criteria
        let DRACO_COMPRESSED: boolean = false;
        let category: COL.Edan3DResourceCategory | undefined = undefined;   // Possible values: 'Full resolution', 'Medium resolution', 'Low resolution', 'Watertight', 'iOS AR model'

        if (SAC.metadataSet) {
            for (const metadata of SAC.metadataSet) {
                switch (metadata.Name.toLowerCase()) {
                    case 'type':
                        switch (metadata.ValueShort) {
                            case '3D mesh':
                            case 'CAD model':
                                type = metadata.ValueShort;
                                break;
                        } break;

                    case 'category':
                        switch (metadata.ValueShort) {
                            case 'Low resolution':
                            case 'iOS AR model':
                            case 'Full resolution':
                                category = metadata.ValueShort;
                                break;
                        } break;

                    case 'units':
                        switch (metadata.ValueShort) {
                            case 'mm':
                            case 'cm':
                            case 'm':
                            case 'km':
                            case 'in':
                            case 'ft':
                            case 'yd':
                            case 'mi':
                                UNITS = metadata.ValueShort;
                                break;
                        } break;

                    case 'modeltype':
                        switch (metadata.ValueShort) {
                            case 'obj':
                            case 'ply':
                            case 'stl':
                            case 'glb':
                            case 'gltf':
                            case 'usdz':
                            case 'x3d':
                                MODEL_FILE_TYPE = metadata.ValueShort;
                                break;
                        } break;

                    case 'filetype':
                        switch (metadata.ValueShort) {
                            case 'zip':
                            case 'glb':
                            case 'usdz':
                                FILE_TYPE = metadata.ValueShort;
                                break;
                        } break;

                    case 'gltfstandardized': GLTF_STANDARDIZED = (metadata.ValueShort === '1'); break;
                    case 'dracocompressed':  DRACO_COMPRESSED = (metadata.ValueShort === '1'); break;
                }
            }
        }

        if (SAC.model && SAC.modelSceneXref) {
            const typeV: DBAPI.Vocabulary | undefined = SAC.model.idVCreationMethod ? await CACHE.VocabularyCache.vocabulary(SAC.model.idVCreationMethod) : undefined;
            switch (typeV?.Term) {
                default:
                    RK.logError(RK.LogSection.eCOLL,'extract resource failed','found no type mapping', { type: typeV?.Term },'Publish.Scene');
                    break;
                case undefined: break;
                case 'Scan To Mesh':    type = '3D mesh'; break;
                case 'CAD':             type = 'CAD model'; break;
            }

            const unitsV: DBAPI.Vocabulary | undefined = SAC.model.idVUnits ? await CACHE.VocabularyCache.vocabulary(SAC.model.idVUnits) : undefined;
            switch (unitsV?.Term) {
                default:
                    RK.logError(RK.LogSection.eCOLL,'extract resource failed','found no units mapping', { units: unitsV?.Term },'Publish.Scene');
                    break;
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

            const modelTypeV: DBAPI.Vocabulary | undefined = SAC.model.idVFileType ? await CACHE.VocabularyCache.vocabulary(SAC.model.idVFileType) : undefined;
            switch (modelTypeV?.Term) {
                default:
                    RK.logError(RK.LogSection.eCOLL,'stage downloads failed','found no model file type mapping',{ type: modelTypeV?.Term },'Publish.Scene');
                    break;
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

            switch (path.extname(SAC.assetVersion.FileName).toLowerCase()) {
                default:
                    RK.logError(RK.LogSection.eCOLL,'stage downloads failed','found no file type mapping',{ assetVersion: SAC.assetVersion },'Publish.Scene');
                    break;
                case '.zip':    FILE_TYPE = 'zip'; break;
                case '.glb':    FILE_TYPE = 'glb'; break;
                case '.usdz':   FILE_TYPE = 'usdz'; break;
            }

            // handle download types
            switch (SAC.modelSceneXref.Usage?.replace('Download:', '').toLowerCase()) {
                case undefined:
                case 'webassetglblowuncompressed':  category = 'Low resolution';    MODEL_FILE_TYPE = 'glb'; break;
                case 'objzipfull':                  category = 'Full resolution';   MODEL_FILE_TYPE = 'obj'; break;
                case 'objziplow':                   category = 'Low resolution';    MODEL_FILE_TYPE = 'obj'; break;
                case 'gltfziplow':                  category = 'Low resolution';    MODEL_FILE_TYPE = 'gltf'; break;

                // HACK: special case to account for USDZ/Draco models which have dual purpose 'usage'
                // and requires specific Usage to work. fix when decoupling 'downloadable' property.
                case 'usdz':
                case 'iosapp3d':                    category = 'iOS AR model';      MODEL_FILE_TYPE = 'usdz'; break;
                case 'webassetglbarcompressed':
                case 'app3d':                       category = 'Low resolution';    MODEL_FILE_TYPE = 'glb'; DRACO_COMPRESSED = true; break;
            }
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

    private async updatePublishedState(LR: DBAPI.LicenseResolver | undefined, ePublishedStateIntended: COMMON.ePublishedState): Promise<boolean> {
        if (!this.systemObjectVersion)
            return false;

        // Determine if licensing prevents publishing
        if (LR && LR.License &&
            DBAPI.LicenseRestrictLevelToPublishedStateEnum(LR.License.RestrictLevel) === COMMON.ePublishedState.eNotPublished)
            ePublishedStateIntended = COMMON.ePublishedState.eNotPublished;
        RK.logInfo(RK.LogSection.eCOLL,'update published state','computed license, resulting in published state',{ license: LR?.License ?? 'none', ePublishedStateIntended },'Publish.Scene');

        if (this.systemObjectVersion.publishedStateEnum() !== ePublishedStateIntended) {
            this.systemObjectVersion.setPublishedState(ePublishedStateIntended);
            if (!await this.systemObjectVersion.update()) {
                RK.logError(RK.LogSection.eCOLL,'update published state failed','unable to update published state',{ systemObjectVersion: this.systemObjectVersion },'Publish.Scene');
                return false;
            }
        } else
            RK.logDebug(RK.LogSection.eCOLL,'update published state','skipping...',{ ePublishedStateIntended },'Publish.Scene');

        return true;
    }

    private computeEdanSearchFlags(edanRecord: COL.EdanRecord, eState: COMMON.ePublishedState): { status: number, publicSearch: boolean, downloads: boolean } {
        // Published (site)
        //      puts it on the 3d site
        //      params = { status: 0, publicSearch: true }
        // Published (API)
        //      only accessible directly by link (i.e. not on 3d site and not searchable)
        //      params = { status: 0, publicSearch: false }
        // Published (Internal)
        //      not publicly accessible and reserved for sensitive items that need an EDAN record but not publicly available (yet)
        //      params = { status: 1, publicSearch: false }

        let status: number = edanRecord.status;
        let publicSearch: boolean = edanRecord.publicSearch;
        let downloads: boolean = publicSearch;

        switch (eState) {
            default:
            case COMMON.ePublishedState.eNotPublished:       status = 1; publicSearch = false; downloads = false; break;
            case COMMON.ePublishedState.eAPIOnly:            status = 0; publicSearch = false; downloads = true;  break;
            case COMMON.ePublishedState.ePublished:          status = 0; publicSearch = true;  downloads = true;  break;
            case COMMON.ePublishedState.eInternal:           status = 1; publicSearch = false; downloads = true;  break; // same as 'NotPublished' but needed since default is 'NotPublished' and never triggers update.
            // case COMMON.ePublishedState.eViewOnly:           status = 0; publicSearch = true;  downloads = false; break;
        }
        RK.logInfo(RK.LogSection.eCOLL,'compute EDAN search flags',undefined,{ state: COMMON.ePublishedState[eState], status, publicSearch, downloads },'Publish.Scene');
        return { status, publicSearch, downloads };
    }
}