import { Config } from '../../config';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COL from '../../collections/interface/';
import * as META from '../../metadata';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as ZIP from '../../utils/zipStream';
import * as STORE from '../../storage/interface';
import * as WF from '../../workflow/interface';
import { SvxReader } from '../../utils/parser';
import { IDocument } from '../../types/voyager';
import * as COMMON from '@dpo-packrat/common';
import { EdanCollection } from './EdanCollection';

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
            LOG.info(`PublishScene.publish cannot publish. no scene/subject. (scene: ${this.scene?.Name} | subject: ${this.subject?.Name})`,LOG.LS.eCOLL);
            return false;
        }

        // stage scene
        if (!await this.stageSceneFiles() || !this.sharedName) {
            LOG.error(`PublishScene.publish cannot stage files. (scene: ${this.scene?.Name} | sharedName: ${this.sharedName})`,LOG.LS.eCOLL);
            return false;
        }

        // create EDAN 3D Package
        let edanRecord: COL.EdanRecord | null = await ICol.createEdan3DPackage(this.sharedName, this.sceneFile);
        if (!edanRecord) {
            LOG.error('PublishScene.publish EDAN failed', LOG.LS.eCOLL);
            return false;
        }
        LOG.info(`PublishScene.publish ${edanRecord.url} succeeded with Edan status ${edanRecord.status}, publicSearch ${edanRecord.publicSearch}`, LOG.LS.eCOLL);
        // LOG.info(`PublishScene.publish ${edanRecord.url} succeeded with Edan status ${edanRecord.status}, publicSearch ${edanRecord.publicSearch}:\n${H.Helpers.JSONStringify(edanRecord)}`, LOG.LS.eCOLL);

        // stage downloads
        if (!await this.stageDownloads() || !this.edan3DResourceList)
            return false;

        // update SystemObjectVersion.PublishedState
        const LR: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(this.idSystemObject);
        if (!await this.updatePublishedState(LR, ePublishedStateIntended))
            return false;
        const media_usage: COL.EdanLicenseInfo = EdanCollection.computeLicenseInfo(LR?.License?.Name); // eslint-disable-line camelcase

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

            LOG.info(`PublishScene.publish updating ${edanRecord.url}`, LOG.LS.eCOLL);
            edanRecord = await ICol.updateEdan3DPackage(edanRecord.url, edanRecord.title, E3DPackage, status, publicSearch);
            if (!edanRecord) {
                LOG.error('PublishScene.publish Edan3DPackage update failed', LOG.LS.eCOLL);
                return false;
            }
            // LOG.info(`PublishScene.publish updated ${edanRecord.url}:\n${H.Helpers.JSONStringify(edanRecord)}`, LOG.LS.eCOLL);
        }

        LOG.info(`PublishScene.publish UUID ${this.scene.EdanUUID}, status ${status}, publicSearch ${publicSearch}, downloads ${downloads}, has downloads ${haveDownloads}`, LOG.LS.eCOLL);
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
                    LOG.error(error, LOG.LS.eCOLL);
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
        LOG.info(`PublishScene.analyze UUID ${this.scene.EdanUUID}`, LOG.LS.eCOLL);

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
            LOG.error(`PublishScene.fetchScene unable to retrieve object details from ${this.idSystemObject}`, LOG.LS.eCOLL);
            return false;
        }

        if (oID.eObjectType !== COMMON.eSystemObjectType.eScene) {
            LOG.error(`PublishScene.fetchScene called for non scene object ${JSON.stringify(oID, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
            return false;
        }

        // fetch SystemObjectVersion
        this.systemObjectVersion = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(this.idSystemObject);
        if (!this.systemObjectVersion && changingPubState) {
            LOG.error(`PublishScene.fetchScene could not compute SystemObjectVersion for idSystemObject ${this.idSystemObject}`, LOG.LS.eCOLL);
            return false;
        }

        // fetch scene
        this.scene = oID.idObject ? await DBAPI.Scene.fetch(oID.idObject) : null;
        if (!this.scene) {
            LOG.error(`PublishScene.fetchScene could not compute scene from ${JSON.stringify(oID, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
            return false;
        }

        // If we're intending to change publishing state, verify that we can given the intended published state
        if (changingPubState) {
            if (ePublishedStateIntended !== COMMON.ePublishedState.eNotPublished &&
               (!this.scene.ApprovedForPublication || !this.scene.PosedAndQCd)) {
                LOG.error(`PublishScene.fetchScene attempting to publish non-Approved and/or non-QC'd scene ${JSON.stringify(this.scene, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
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
            LOG.error(`PublishScene.computeDownloadMSXMap unable to fetch ModelSceneXrefs for scene ${idScene}`, LOG.LS.eCOLL);
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

    static async handleSceneUpdates(idScene: number, idSystemObject: number, _idUser: number | undefined,
        oldPosedAndQCd: boolean, newPosedAndQCd: boolean,
        LicenseOld: DBAPI.License | undefined, LicenseNew: DBAPI.License | undefined): Promise<SceneUpdateResult> {
        // if we've changed Posed and QC'd, and/or we've updated our license, create or remove downloads
        const oldDownloadState: boolean = oldPosedAndQCd && DBAPI.LicenseAllowsDownloadGeneration(LicenseOld?.RestrictLevel);
        const newDownloadState: boolean = newPosedAndQCd && DBAPI.LicenseAllowsDownloadGeneration(LicenseNew?.RestrictLevel);

        if (oldDownloadState === newDownloadState)
            return PublishScene.sendResult(true);

        if (newDownloadState) {
            LOG.info(`PublishScene.handleSceneUpdates generating downloads for scene ${idScene}`, LOG.LS.eGQL);
            // Generate downloads
            const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
            if (!workflowEngine)
                return PublishScene.sendResult(false, `Unable to fetch workflow engine for download generation for scene ${idScene}`);

            // trigger the workflow/recipe
            workflowEngine.generateSceneDownloads(idScene, { idUserInitiator: _idUser }); // don't await
            return { success: true, downloadsGenerated: true, downloadsRemoved: false };
        } else { // Remove downloads
            LOG.info(`PublishScene.handleSceneUpdates removing downloads for scene ${idScene}`, LOG.LS.eGQL);
            // Compute downloads
            const DownloadMSXMap: Map<number, DBAPI.ModelSceneXref> | null = await PublishScene.computeDownloadMSXMap(idScene);
            if (!DownloadMSXMap)
                return PublishScene.sendResult(false, `Unable to fetch scene downloads for scene ${idScene}`);

            // For each download, compute assets, and set those to having an asset vresion override of 0, which means do not attach to the cloned system object
            const assetVersionOverrideMap: Map<number, number> = new Map<number, number>();
            for (const idSystemObject of DownloadMSXMap.keys()) {
                const assets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(idSystemObject);
                if (!assets)
                    return PublishScene.sendResult(false, `Unable to fetch assets for idSystemObject ${idSystemObject} for scene ${idScene}`);
                for (const asset of assets)
                    assetVersionOverrideMap.set(asset.idAsset, 0);
            }

            const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(idSystemObject, null, 'Removing Downloads', assetVersionOverrideMap);
            if (!SOV)
                return PublishScene.sendResult(false, `Unable to clone system object version for idSystemObject ${idSystemObject} for scene ${idScene}`);
            return { success: true, downloadsGenerated: false, downloadsRemoved: true };
        }
    }

    private static sendResult(success: boolean, error?: string): H.IOResults {
        if (!success)
            LOG.error(error, LOG.LS.eCOLL);
        return { success, error };
    }

    private async collectAssets(ePublishedStateIntended?: COMMON.ePublishedState): Promise<boolean> {
        // LOG.info(`>>> collectAssets.DownloadMSXMap: ${H.Helpers.JSONStringify(this.DownloadMSXMap)}`,LOG.LS.eDEBUG);
        if (!this.DownloadMSXMap)
            return false;
        this.assetVersions = await DBAPI.AssetVersion.fetchLatestFromSystemObject(this.idSystemObject);
        if (!this.assetVersions || this.assetVersions.length === 0) {
            LOG.error(`PublishScene.collectAssets unable to load asset versions for scene ${JSON.stringify(this.scene, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
            return false;
        }

        LOG.info(`PublishScene.collectAssets downloadMSXMap ${H.Helpers.JSONStringify(this.DownloadMSXMap)}`, LOG.LS.eDEBUG);

        // first pass through assets: detect and record the scene file (first file to match *.svx.json); lookup supporting information
        // prepare to extract and discard the path to this file, so that the scene zip is "rooted" at the svx.json
        let stageRes: H.IOResults = { success: true };
        for (const assetVersion of this.assetVersions) {
            // grab our system object for this asset version
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            LOG.info(`PublishScene.collectAssets considering assetVersion=${JSON.stringify(assetVersion, H.Helpers.saferStringify)} asset=${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
            if (!asset) {
                LOG.error(`PublishScene.collectAssets unable to load asset by id ${assetVersion.idAsset}`, LOG.LS.eCOLL);
                return false;
            }

            // determine if assetVersion is an attachment by examining metadata
            // NOTE: isAttachment metadata is set in computeResourceMap to label an asset as a 'resource' (i.e. downloadable)
            // however, usdz/draco files have dual use and are resources, but also connected to a voyager scene. below is a special
            // case for this situation until downloadable is decoupled from Usage.
            let isAttachment: boolean = false;
            const SOAssetVersion: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
            if (!SOAssetVersion) {
                LOG.error(`PublishScene.collectAssets unable to compute system object for ${JSON.stringify(assetVersion, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
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
                LOG.error(`PublishScene.collectAssets unable to compute metadata for ${H.Helpers.JSONStringify(assetVersion)}`, LOG.LS.eCOLL);

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
                        LOG.error(`PublishScene.collectAssets unable to load model from xref ${H.Helpers.JSONStringify(modelSceneXref)}`, LOG.LS.eCOLL);
                        return false;
                    }
                    // LOG.info(`>>> PublishScene.collectAssets adding to list with MSX (${asset.FileName}|${isAttachment}|${H.Helpers.JSONStringify(modelSceneXref)}`, LOG.LS.eDEBUG);
                    this.SacList.push({ idSystemObject: asset.idSystemObject, asset, assetVersion, model, modelSceneXref, metadataSet: isAttachment ? metadataSet : undefined });

                    // HACK: special case for handling dual-use assets (draco/usdz), which will be added as downloads/attachments by default.
                    // whe check if we're dealing with that asset and add like other scene referenced assets. (i.e. we omit the MSX and metadataSet)
                    if(modelSceneXref.Usage === 'App3D' || modelSceneXref.Usage === 'iOSApp3D') {
                        LOG.info(`>>> PublishScene.collectAssets adding draco/usdz assets again (${asset.FileName})`,LOG.LS.eDEBUG);
                        this.SacList.push({ idSystemObject: asset.idSystemObject, asset, assetVersion, metadataSet: undefined });
                    }
                }

            } else {
                LOG.info(`PublishScene.collectAssets not adding. no idSystemObject ${H.Helpers.JSONStringify(asset)}|${H.Helpers.JSONStringify(metadataSet)}`, LOG.LS.eDEBUG);
            }

            if (!this.sceneFile && assetVersion.FileName.toLowerCase().endsWith('.svx.json')) {
                this.sceneFile = assetVersion.FileName;
                this.extractedPath = assetVersion.FilePath;

                // if we're intending to publish, extract scene's SVX.JSON for use in updating EDAN search status and creating downloads
                if (ePublishedStateIntended !== undefined) {
                    const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(asset, assetVersion);
                    if (!RSR.success || !RSR.readStream) {
                        LOG.error(`PublishScene.collectAssets failed to extract stream for scene's asset version ${assetVersion.idAssetVersion}: ${RSR.error}`, LOG.LS.eCOLL);
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
        }

        // LOG.info(`>>> collectAssets.SAC: ${H.Helpers.JSONStringify(this.SacList)}`,LOG.LS.eDEBUG);
        return true;
    }

    private async stageSceneFiles(): Promise<boolean> {
        if (this.SacList.length <= 0 || !this.scene) {
            LOG.error(`PublishScene.stageSceneFiles casnnot stage files for scene (${this.sceneFile}). No scene or assets list (${this.scene}|${this.SacList.length})`,LOG.LS.eCOLL);
            return false;
        }
        let stageRes: H.IOResults = { success: true };

        // log what will be included
        const assets: string[] = this.SacList.map(SAC => { return `${SAC.asset.FileName}(${SAC.assetVersion.Version})`; });
        LOG.info(`PublishScene.stageSceneFiles collecting assets for scene (${this.sceneFile}): ${assets.join(',')}`,LOG.LS.eCOLL);

        // second pass: zip up appropriate assets; prepare to copy downloads
        const zip: ZIP.ZipStream = new ZIP.ZipStream();
        for (const SAC of this.SacList.values()) {
            if (SAC.model || SAC.metadataSet) // skip downloads
                continue;

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(SAC.asset, SAC.assetVersion);
            if (!RSR.success || !RSR.readStream) {
                LOG.error(`PublishScene.stageSceneFiles failed to extract stream for asset version ${SAC.assetVersion.idAssetVersion}: ${RSR.error}`, LOG.LS.eCOLL);
                return false;
            }

            const filePath: string = SAC.assetVersion.FilePath;
            let rebasedPath: string = this.extractedPath ? filePath.replace(this.extractedPath, '') : filePath;
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
                LOG.error(`PublishScene.stageDownloads failed to extract stream for asset version ${SAC.assetVersion.idAssetVersion}: ${RSR.error}`, LOG.LS.eCOLL);
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
                default: LOG.error(`PublishScene.extractResource found no type mapping for ${typeV?.Term}`, LOG.LS.eCOLL); break;
                case undefined: break;
                case 'Scan To Mesh':    type = '3D mesh'; break;
                case 'CAD':             type = 'CAD model'; break;
            }

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

            switch (path.extname(SAC.assetVersion.FileName).toLowerCase()) {
                default: LOG.error(`PublishScene.extractResource found no file type mapping for ${SAC.assetVersion.FileName}`, LOG.LS.eCOLL); break;
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
        LOG.info(`PublishScene.updatePublishedState computed license ${LR ? JSON.stringify(LR.License, H.Helpers.saferStringify) : 'none'}, resulting in published state of ${ePublishedStateIntended}`, LOG.LS.eCOLL);

        if (this.systemObjectVersion.publishedStateEnum() !== ePublishedStateIntended) {
            this.systemObjectVersion.setPublishedState(ePublishedStateIntended);
            if (!await this.systemObjectVersion.update()) {
                LOG.error(`PublishScene.updatePublishedState unable to update published state for ${JSON.stringify(this.systemObjectVersion, H.Helpers.saferStringify)}`, LOG.LS.eCOLL);
                return false;
            }
        } else {
            LOG.info(`PublishScene.updatePublishedState skipping.... ${H.Helpers.JSONStringify(ePublishedStateIntended)}`, LOG.LS.eDEBUG);
        }

        return true;
    }

    private computeEdanSearchFlags(edanRecord: COL.EdanRecord, eState: COMMON.ePublishedState): { status: number, publicSearch: boolean, downloads: boolean } {
        let status: number = edanRecord.status;
        let publicSearch: boolean = edanRecord.publicSearch;
        let downloads: boolean = publicSearch;

        switch (eState) {
            default:
            case COMMON.ePublishedState.eNotPublished:       status = 1; publicSearch = false; downloads = false; break;
            case COMMON.ePublishedState.eAPIOnly:            status = 0; publicSearch = false; downloads = true;  break;
            case COMMON.ePublishedState.ePublished:          status = 0; publicSearch = true;  downloads = true;  break;
            // case COMMON.ePublishedState.eViewOnly:           status = 0; publicSearch = true;  downloads = false; break;
        }
        LOG.info(`PublishScene.computeEdanSearchFlags(${COMMON.ePublishedState[eState]}) = { status ${status}, publicSearch ${publicSearch}, downloads ${downloads} }`, LOG.LS.eCOLL);
        return { status, publicSearch, downloads };
    }
}