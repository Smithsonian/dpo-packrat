import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as STORE from '../../storage/interface';
import * as NAV from '../../navigation/interface';
import * as COL from '../../collections/interface/';
import * as H from '../helpers';
import * as LOG from '../logger';
import { SceneMigrationPackage } from './SceneMigrationPackage';
import { SceneHelpers } from '../../utils';
import { SvxReader } from '../parser';
import { JobCookSIGenerateDownloads } from '../../job/impl/Cook';
import { PublishScene } from '../../collections/impl/PublishScene';
import { WorkflowUtil } from '../../workflow/impl/Packrat/WorkflowUtil';

import * as path from 'path';
import fetch from 'node-fetch';

export type SceneMigrationResults = {
    success: boolean;
    error?: string | undefined;
    sceneFileName?: string | undefined;
    scene?: DBAPI.Scene | null | undefined;
    asset?: DBAPI.Asset[] | null | undefined;
    assetVersion?: DBAPI.AssetVersion[] | null | undefined;
    filesMissing?: boolean | undefined;
};

export class SceneMigration {
    private static vocabScene:          DBAPI.Vocabulary | undefined        = undefined;
    private static vocabModel:          DBAPI.Vocabulary | undefined        = undefined;
    private static vocabOther:          DBAPI.Vocabulary | undefined        = undefined;
    private static vocabDownload:       DBAPI.Vocabulary | undefined        = undefined;
    private static idSystemObjectTest:  number | undefined                  = undefined;

    private ICol:                       COL.ICollection | undefined         = undefined;
    private scenePackage:               SceneMigrationPackage | undefined   = undefined;
    private userOwner:                  DBAPI.User | undefined              = undefined;
    private scene:                      DBAPI.Scene | null | undefined      = undefined;
    private sceneSystemObjectID:        number | undefined                  = undefined;

    private async initialize(): Promise<H.IOResults> {
        if (!SceneMigration.vocabScene)
            SceneMigration.vocabScene   = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeScene);
        if (!SceneMigration.vocabModel)
            SceneMigration.vocabModel   = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile);
        if (!SceneMigration.vocabOther)
            SceneMigration.vocabOther   = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeOther);
        if (!SceneMigration.vocabDownload)
            SceneMigration.vocabDownload = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload);

        if (!SceneMigration.vocabScene)
            return this.recordError('initialize unable to load vocabulary for scene asset type');
        if (!SceneMigration.vocabModel)
            return this.recordError('initialize unable to load vocabulary for model asset type');
        if (!SceneMigration.vocabOther)
            return this.recordError('initialize unable to load vocabulary for other asset type');
        if (!SceneMigration.vocabDownload)
            return this.recordError('initialize unable to load vocabulary for download model purpose');
        return { success: true };
    }

    async migrateScene(idUser: number, scenePackage: SceneMigrationPackage, doNotSendIngestionEvent?: boolean): Promise<SceneMigrationResults> {
        let testData: boolean | undefined = undefined;

        let asset: DBAPI.Asset[] | null | undefined = undefined;
        let assetVersion: DBAPI.AssetVersion[] | null | undefined = undefined;

        const initRes: H.IOResults = await this.initialize();
        if (!initRes.success)
            return initRes;

        this.ICol = COL.CollectionFactory.getInstance();
        this.scenePackage = scenePackage;
        this.userOwner = await CACHE.UserCache.getUser(idUser);
        if (!this.userOwner)
            return this.recordError(`initialize unable to load user with idUser of ${idUser}`);

        if (!await this.testFileExistence())
            return this.recordError(`migrateScene unable to locate file for ${H.Helpers.JSONStringify(this.scenePackage)}`, { filesMissing: true });

        // capture testData flag, if set, and ensure consistency
        if (this.scenePackage.testData !== testData) {
            if (testData === undefined)
                testData = this.scenePackage.testData;
            else
                return this.recordError(`migrateScene called with inconsistent value for testData (${this.scenePackage.testData}); expected ${testData}`);
        }

        if (!this.scenePackage.idSystemObjectItem && testData) {
            await this.createTestObjects();
            this.scenePackage.idSystemObjectItem = SceneMigration.idSystemObjectTest;
        }

        const readStream: NodeJS.ReadableStream | null = await this.fetchRemoteScenePackage();
        if (!readStream)
            return this.recordError(`migrateScene failed to retrieve scene package stream for ${H.Helpers.JSONStringify(this.scenePackage)}`);

        this.scene = new DBAPI.Scene({
            Name: this.scenePackage.SceneName,
            idAssetThumbnail: null,
            CountScene: null,
            CountNode: null,
            CountCamera: null,
            CountLight: null,
            CountModel: null,
            CountMeta: null,
            CountSetup: null,
            CountTour: null,
            EdanUUID: this.scenePackage.EdanUUID,
            PosedAndQCd: this.scenePackage.PosedAndQCd ?? false,
            ApprovedForPublication: this.scenePackage.ApprovedForPublication ?? false,
            Title: null,
            idScene: 0
        });

        if (!await this.scene.create())
            return this.recordError(`migrateScene failed to create scene DB record ${H.Helpers.JSONStringify(this.scene)}`);
        LOG.info(`SceneMigration.migrateScene created scene ${H.Helpers.JSONStringify(this.scene)}`, LOG.LS.eSYS);

        // wire item to scene
        if (this.scenePackage.idSystemObjectItem) {
            if (!await this.wireItemToScene(this.scenePackage.idSystemObjectItem))
                return this.recordError(`migrateScene failed to wire media group to scene for ${H.Helpers.JSONStringify(this.scenePackage)}`);
            LOG.info(`SceneMigration.migrateScene wired scene to idSystemObject ${this.scenePackage.idSystemObjectItem}`, LOG.LS.eSYS);
        }

        const sceneFileName: string = this.scenePackage.PackageName ? this.scenePackage.PackageName : `${this.scenePackage.EdanUUID}.zip`;
        const IAR: STORE.IngestAssetResult = await this.ingestStream(readStream, sceneFileName, true, this.scene, SceneMigration.vocabScene?.idVocabulary, doNotSendIngestionEvent); /* true -> allow zip containing scene package to be cracked open */
        if (!IAR.success)
            return this.recordError(`migrateScene failed to ingest ${H.Helpers.JSONStringify(this.scenePackage)}: ${IAR.error}`);
        if (IAR.assets)
            asset = IAR.assets;
        if (IAR.assetVersions)
            assetVersion = IAR.assetVersions;

        const { success } = await SceneHelpers.handleComplexIngestionScene(this.scene, IAR, this.userOwner.idUser, undefined);
        if (!success)
            return this.recordError(`migrateScene failed in handleComplexIngestionScene for ${H.Helpers.JSONStringify(this.scenePackage)}`);

        // Extract scene metrics; Trim excess objects that were present in scene zip (EDAN seems to have scenes published with all sorts of extraneous crap)
        const metricsRes: H.IOResults = await this.extractSceneDetails(asset, assetVersion);
        if (!metricsRes.success)
            return metricsRes;

        // Fetch and Ingest Resources
        const resourceRes: H.IOResults = await this.fetchAndIngestResources(doNotSendIngestionEvent);
        if (!resourceRes.success)
            return resourceRes;

        if (this.scenePackage.idSystemObjectItem)
            await this.postItemWiring();

        return { success: true, scene: this.scene, sceneFileName, asset, assetVersion };
    }

    private async fetchRemoteScenePackage(): Promise<NodeJS.ReadableStream | null> {
        if (!this.scenePackage)
            return null;

        const packageURL: string = `https://3d-api.si.edu/content/package/3d_package:${this.scenePackage.EdanUUID}`;
        return this.fetchRemoteStream(packageURL);
    }

    private async fetchRemoteStream(url: string): Promise<NodeJS.ReadableStream | null> {
        LOG.info(`SceneMigration.fetchRemoteStream fetching ${url}`, LOG.LS.eSYS);
        try {
            const res = await fetch(url);
            return res.body;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('SceneMigration.fetchRemoteStream', LOG.LS.eSYS, error);
            return null;
        }
    }

    private async ingestStream(readStream: NodeJS.ReadableStream | null, FileName: string, allowZipCracking: boolean, SOBased: DBAPI.SystemObjectBased,
        idVAssetType?: number, doNotSendIngestionEvent?: boolean): Promise<STORE.IngestAssetResult> {
        if (!this.scenePackage || !this.scene || !this.userOwner || !SceneMigration.vocabScene)
            return { success: false };

        const localFilePath: string | null = readStream ? null : this.computeFilePath(FileName);
        LOG.info(`SceneMigration.ingestStream using ${readStream ? 'stream' : 'file ' + localFilePath} for scene ${H.Helpers.JSONStringify(this.scene)}`, LOG.LS.eSYS);

        if (!idVAssetType)
            idVAssetType = SceneMigration.vocabScene.idVocabulary;

        const ISI: STORE.IngestStreamOrFileInput = {
            readStream,
            localFilePath,
            asset: null,
            FileName,
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType,
            allowZipCracking,
            idUserCreator: this.userOwner.idUser,
            SOBased,
            Comment: 'Created by migration',
            doNotSendIngestionEvent
        };

        return await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
    }

    private async wireItemToScene(idSystemObject: number): Promise<H.IOResults> {
        if (!this.scene)
            return this.recordError('wireItemToScene called with null scene');

        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
        if (!oID)
            return this.recordError(`wireItemToScene unable to compute object info for ${idSystemObject}`);
        if (oID.eObjectType !== COMMON.eSystemObjectType.eItem)
            return this.recordError(`wireItemToScene called with non-item idSystemObject ID (${idSystemObject}):  ${H.Helpers.JSONStringify(oID)}`);

        const itemDB: DBAPI.Item | null = await DBAPI.Item.fetch(oID.idObject);
        if (!itemDB)
            return this.recordError(`wireItemToScene failed to fetch item ${oID.idObject}`);

        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemDB, this.scene);
        if (!xref)
            return this.recordError(`wireItemToScene unable to wire item ${JSON.stringify(itemDB)} to scene ${H.Helpers.JSONStringify(this.scene)}`);

        LOG.info(`SceneMigration.wireItemToScene ${JSON.stringify(itemDB)} to scene ${H.Helpers.JSONStringify(this.scene)}`, LOG.LS.eSYS);
        return { success: true };
    }

    private async postItemWiring(): Promise<H.IOResults> {
        LOG.info('SceneMigration.postItemWiring', LOG.LS.eSYS);
        if (!this.scene)
            return this.recordError('postItemWiring called without scene defined');

        // explicitly reindex scene
        const nav: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
        if (!nav)
            return this.recordError('postItemWiring unable to fetch navigation interface');

        const idSystemObject: number | undefined = await this.fetchSceneSystemObjectID();
        if (!idSystemObject)
            return this.recordError(`postItemWiring unable to fetch system object ID for ${H.Helpers.JSONStringify(this.scene)}`);

        // index directly instead of scheduling indexing, so that we get an initial SOLR entry right away
        // NAV.NavigationFactory.scheduleObjectIndexing(SO.idSystemObject);
        const indexer: NAV.IIndexer | null = await nav.getIndexer();
        if (!indexer)
            return this.recordError(`postItemWiring unable to fetch navigation indexer for ${H.Helpers.JSONStringify(this.scene)}`);

        indexer.indexObject(idSystemObject);
        return { success: true };
    }

    private async fetchSceneSystemObjectID(): Promise<number | undefined> {
        if (this.sceneSystemObjectID)
            return this.sceneSystemObjectID;
        if (!this.scene)
            return undefined;
        const SO: DBAPI.SystemObject | null = await this.scene.fetchSystemObject();
        if (!SO) {
            this.recordError(`fetchSceneSystemObjectID unable to fetch system object for ${H.Helpers.JSONStringify(this.scene)}`);
            return undefined;
        }
        this.sceneSystemObjectID = SO.idSystemObject;
        return this.sceneSystemObjectID;
    }

    private async createTestObjects(): Promise<H.IOResults> {
        if (SceneMigration.idSystemObjectTest)
            return { success: true };

        LOG.info('SceneMigration.createTestObjects', LOG.LS.eSYS);
        const unitDB: DBAPI.Unit | null = await DBAPI.Unit.fetch(1); // Unknown Unit
        if (!unitDB)
            return this.recordError('createTestObjects unable to fetch unit with ID=1 for test data');

        const Name: string = `SceneMigrationTest-${new Date().toISOString()}`;
        const subjectDB: DBAPI.Subject = new DBAPI.Subject({
            idUnit: unitDB.idUnit,
            idAssetThumbnail: null,
            idGeoLocation: null,
            Name,
            idIdentifierPreferred: null,
            idSubject: 0,
        });
        if (!await subjectDB.create())
            return this.recordError(`createTestObjects unable to create subject ${H.Helpers.JSONStringify(subjectDB)}`);

        const itemDB: DBAPI.Item = new DBAPI.Item({
            idAssetThumbnail: null,
            idGeoLocation: null,
            Name,
            EntireSubject: true,
            Title: null,
            idItem: 0,
        });
        if (!await itemDB.create())
            return this.recordError(`createTestObjects unable to create item ${H.Helpers.JSONStringify(itemDB)}`);

        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subjectDB, itemDB);
        if (!xref)
            return this.recordError(`createTestObjects unable to wire subject ${H.Helpers.JSONStringify(subjectDB)} to item ${H.Helpers.JSONStringify(itemDB)}`);

        const SO: DBAPI.SystemObject | null = await itemDB.fetchSystemObject();
        if (!SO)
            return this.recordError(`createTestObjects unable to fetch system object from item ${H.Helpers.JSONStringify(itemDB)}`);
        SceneMigration.idSystemObjectTest = SO.idSystemObject;

        return { success: true };
    }

    private computeFilePath(FileName?: string | undefined): string | null {
        if (!this.scenePackage || !FileName)
            return null;
        // if no path is provided, assume this is regression testing, and look in the appropriate path for our mock scenes
        const basePath: string = this.scenePackage?.PackagePath ? this.scenePackage.PackagePath : path.join(__dirname, '../../tests/mock/scenes', this.scenePackage.EdanUUID);
        return path.join(basePath, FileName);
    }

    private async testFileExistence(): Promise<boolean> {
        if (!this.scenePackage) // missing scene package details? Error!
            return false;
        if (this.scenePackage.fetchRemote)  // fetching remotely, all is good
            return true;

        const filePath: string | null = this.computeFilePath(this.scenePackage.PackageName);
        if (filePath === null) // We are loading via EDAN
            return true;
        const res: H.StatResults = await H.Helpers.stat(filePath);
        const success: boolean = res.success && (res.stat !== null) && res.stat.isFile();

        /*
        if (sceneEntry.hash) {
            const hashRes: H.HashResults = await H.Helpers.computeHashFromFile(filePath, 'sha256');
            if (!hashRes.success) {
                LOG.error(`SceneMigration.testFileExistience('${filePath}') unable to compute hash ${hashRes.error}`, LOG.LS.eSYS);
                success = false;
            } else if (hashRes.hash != sceneEntry.hash) {
                LOG.error(`SceneMigration.testFileExistience('${filePath}') computed different hash ${hashRes.hash} than expected ${sceneEntry.hash}`, LOG.LS.eSYS);
                success = false;
            }
        }
        */

        LOG.info(`SceneMigration.testFileExistience('${filePath}') = ${success}`, LOG.LS.eSYS);
        return success;
    }

    private async extractSceneDetails(assets: DBAPI.Asset[] | undefined, assetVersions: DBAPI.AssetVersion[] | undefined): Promise<H.IOResults> {
        if (!assets || !assetVersions || !this.scene)
            return this.recordError('extractSceneDetails called without assets and/or asset versions');

        LOG.info(`SceneMigration.extractSceneDetails called for scene ${H.Helpers.JSONStringify(this.scene)}`, LOG.LS.eSYS);
        // Build map of asset ID -> asset version
        const assetIDToVersionMap: Map<number, DBAPI.AssetVersion> = new Map<number, DBAPI.AssetVersion>();
        for (const assetVersion of assetVersions)
            assetIDToVersionMap.set(assetVersion.idAsset, assetVersion);

        let svxLoaded: boolean = false;
        let assetScene: DBAPI.Asset | undefined = undefined;
        let assetVersionScene: DBAPI.AssetVersion | undefined = undefined;
        const svx: SvxReader = new SvxReader();
        for (const asset of assets) {
            const assetVersion: DBAPI.AssetVersion | undefined = assetIDToVersionMap.get(asset.idAsset);
            if (!assetVersion)
                return this.recordError(`extractSceneDetails could not find asset version for asset ${H.Helpers.JSONStringify(asset)}`);

            const assetType: COMMON.eVocabularyID | undefined = await asset.assetType();
            if (!assetType)
                return this.recordError(`extractSceneDetails unable to compute asset type for asset ${H.Helpers.JSONStringify(asset)}`);

            if (assetType !== COMMON.eVocabularyID.eAssetAssetTypeScene)
                continue;

            // found our scene; process it!
            if (!svxLoaded) {
                assetScene = asset;
                assetVersionScene = assetVersion;

                LOG.info(`SceneMigration.extractSceneDetails extracting svx.json from ${H.Helpers.JSONStringify(assetScene)}`, LOG.LS.eSYS);
                const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(assetScene, assetVersion);
                if (!RSR.success)
                    return this.recordError(`extractSceneDetails failed to read scene asset ${H.Helpers.JSONStringify(assetScene)}: ${RSR.error}`);
                if (!RSR.readStream)
                    return this.recordError(`extractSceneDetails unable to compute stream for scene asset ${H.Helpers.JSONStringify(assetScene)}`);

                const svxRes: H.IOResults = await svx.loadFromStream(RSR.readStream);
                if (!svxRes.success || !svx.SvxExtraction)
                    return this.recordError(`extractSceneDetails unable to parse SVX from stream: ${svxRes.error}`);
                svxLoaded = true;

                this.scene.CountScene   = svx.SvxExtraction.sceneCount;
                this.scene.CountNode    = svx.SvxExtraction.nodeCount;
                this.scene.CountCamera  = svx.SvxExtraction.cameraCount;
                this.scene.CountLight   = svx.SvxExtraction.lightCount;
                this.scene.CountModel   = svx.SvxExtraction.modelCount;
                this.scene.CountMeta    = svx.SvxExtraction.metaCount;
                this.scene.CountSetup   = svx.SvxExtraction.setupCount;
                this.scene.CountTour    = svx.SvxExtraction.tourCount;
                if (!await this.scene.update())
                    return this.recordError(`extractSceneDetails unable to update scene metrics for ${H.Helpers.JSONStringify(this.scene)}`);

                LOG.info(`SceneMigration.extractSceneDetails updated scene metrics for ${H.Helpers.JSONStringify(this.scene)}`, LOG.LS.eSYS);
            }
        }

        if (!svxLoaded || !svx.SvxExtraction || !assetScene || !assetVersionScene)
            return this.recordError('extractSceneDetails unable to locate asset for scene svx.json');

        // retire assets and asset versions for objects not referenced by scene's svx.jxon
        const referencedAssetUris: Set<string> = new Set<string>();
        if (svx.SvxExtraction.modelAssets)
            for (const asset of svx.SvxExtraction.modelAssets)
                referencedAssetUris.add(this.normalizePath(assetVersionScene, asset.uri));
        if (svx.SvxExtraction.nonModelAssets)
            for (const asset of svx.SvxExtraction.nonModelAssets)
                referencedAssetUris.add(this.normalizePath(assetVersionScene, asset.uri));

        // LOG.info(`SceneMigration.extractSceneDetails testing assets against ${H.Helpers.JSONStringify(referencedAssetUris)}`, LOG.LS.eSYS);

        let assetVersionOverrideMap: Map<number, number> | undefined = undefined;
        for (const asset of assets) {
            if (asset === assetScene) // asset representing scene svx.json should not be retired!
                continue;
            const assetVersion: DBAPI.AssetVersion | undefined = assetIDToVersionMap.get(asset.idAsset);
            if (!assetVersion)
                return this.recordError(`extractSceneDetails could not find asset version for asset ${H.Helpers.JSONStringify(asset)}`);
            const normalizedUri: string = this.normalizePath(assetVersion);

            if (!referencedAssetUris.has(normalizedUri)) {
                LOG.info(`SceneMigration.extractSceneDetails retiring unreferenced asset ${normalizedUri} for asset version ${H.Helpers.JSONStringify(assetVersion)}`, LOG.LS.eSYS);

                let retired: boolean = false;
                const SOAV: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
                if (SOAV)
                    retired = await SOAV.retireObject();
                if (!retired)
                    this.recordError(`extractSceneDetails unable to retire asset version ${H.Helpers.JSONStringify(assetVersion)}`);

                const SOA: DBAPI.SystemObject | null = await asset.fetchSystemObject();
                if (SOA)
                    retired = await SOA.retireObject();
                if (!retired)
                    this.recordError(`extractSceneDetails unable to retire asset ${H.Helpers.JSONStringify(asset)}`);

                if (!assetVersionOverrideMap)
                    assetVersionOverrideMap = new Map<number, number>();
                assetVersionOverrideMap.set(asset.idAsset, 0); // set override value of 0 for idAssetVersion to indicate removal of asset/asset version from cloned system object version
            }
        }

        // Use SystemObjectVersion.cloneObjectAndXrefs if any are retired
        if (assetVersionOverrideMap) {
            const idSystemObject: number | undefined = await this.fetchSceneSystemObjectID();
            if (!idSystemObject)
                return this.recordError(`postItemWiring unable to fetch system object ID for ${H.Helpers.JSONStringify(this.scene)}`);

            const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(idSystemObject, null,
                'Created by migration: removing unreferenced assets from scene', assetVersionOverrideMap);
            if (!SOV)
                return this.recordError(`extractSceneDetails unable to cloneObjectAndXrefs for idSystemObject ${idSystemObject}`);
        }

        return { success: true };
    }

    private normalizePath(assetVersion: DBAPI.AssetVersion, uriOverride?: string | undefined): string {
        return assetVersion.FilePath.toLowerCase() + (assetVersion.FilePath ? '/' : '') + (uriOverride ? uriOverride : assetVersion.FileName).toLowerCase();
    }

    private async fetchAndIngestResources(doNotSendIngestionEvent?: boolean | undefined): Promise<H.IOResults> {
        if (!this.ICol || !this.scenePackage || !this.scene)
            return this.recordError(`fetchAndIngestResources called without required data for ${H.Helpers.JSONStringify(this.scenePackage)}`);

        const edanURL: string = `3d_package:${this.scenePackage.EdanUUID}`;
        const edanRecord: COL.EdanRecord | null = await this.ICol.fetchContent(undefined, edanURL);
        if (!edanRecord)
            return this.recordError(`fetchAndIngestResources unable to fetch EDAN record for ${edanURL}`);

        LOG.info(`fetchAndIngestResources ${edanURL}: ${H.Helpers.JSONStringify(edanRecord)}`, LOG.LS.eSYS);

        // record updated asset -> asset version, for use in rolling a new SystemObjectVersion for the scene
        const assetVersionOverrideMap: Map<number, number> = new Map<number, number>();
        let idSystemObjectScene: number | null = null;

        const edan3DResources: COL.Edan3DResource[] | undefined = edanRecord.content?.resources;
        if (edan3DResources) {
            const SO: DBAPI.SystemObject | null = await this.scene.fetchSystemObject();
            if (!SO)
                return this.recordError(`fetchAndIngestResources unable to fetch SystemObject from scene ${H.Helpers.JSONStringify(this.scene)}`);
            idSystemObjectScene = SO.idSystemObject;

            for (const resource of edan3DResources) {
                LOG.info(`fetchAndIngestResources ${edanURL}: Handling resource ${H.Helpers.JSONStringify(resource)}`, LOG.LS.eSYS);
                if (!resource.url || !resource.filename)
                    continue;
                const readStream: NodeJS.ReadableStream | null = await this.fetchRemoteStream(resource.url);
                if (!readStream)
                    return this.recordError(`fetchAndIngestResources failed to retrieve stream for resource ${H.Helpers.JSONStringify(resource)}`);

                const resourceInfo: COL.Edan3DResource & COL.Edan3DResourceAttribute = this.extractResourceInfo(resource);
                const downloadType: string = PublishScene.computeDownloadType(resourceInfo.category, resourceInfo.MODEL_FILE_TYPE, resourceInfo.DRACO_COMPRESSED);
                const model: DBAPI.Model | null = await this.createModel(resourceInfo, downloadType);
                const IAR: STORE.IngestAssetResult = await this.ingestStream(readStream, resource.filename, false, model ?? this.scene,
                    SceneMigration.vocabModel?.idVocabulary, doNotSendIngestionEvent); /* false -> do not crack resource/attachment zips */
                if (!IAR.success)
                    return this.recordError(`fetchAndIngestResources failed to ingest resource ${H.Helpers.JSONStringify(resource)}: ${IAR.error}`);
                if (IAR.assetVersions && IAR.assetVersions.length > 1)
                    LOG.error(`fetchAndIngestResources created multiple asset versions, unexpectedly, ingesting ${resource.filename}`, LOG.LS.eJOB);

                let idSystemObject: number = SO.idSystemObject;
                let FileSize: bigint | null = null;

                const assetVersion: DBAPI.AssetVersion | null = (IAR.assetVersions && IAR.assetVersions.length > 0) ? IAR.assetVersions[0] : null;
                if (assetVersion) {
                    const SOAssetVersion: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
                    if (!SOAssetVersion)
                        return this.recordError(`fetchAndIngestResources failed to fetch system object for asset version ${H.Helpers.JSONStringify(assetVersion)}`);
                    idSystemObject = SOAssetVersion.idSystemObject;
                    assetVersionOverrideMap.set(assetVersion.idAsset, assetVersion.idAssetVersion);
                    FileSize = assetVersion.StorageSize;
                }

                const metadataRes: H.IOResults = await SceneHelpers.recordResourceMetadata(resource, idSystemObject, SO.idSystemObject, this.userOwner?.idUser ?? null);
                if (!metadataRes.success)
                    LOG.error('fetchAndIngestResources could not persist attachment metadata', LOG.LS.eSYS);

                // create/update ModelSceneXref for each download generated ... do after ingest so that we have the storage size available
                if (model) {
                    await this.createModelSceneXref(model, downloadType, FileSize);
                    const SOModel: DBAPI.SystemObject | null = await model.fetchSystemObject();
                    if (SOModel) {
                        // run si-packrat-inspect on this model
                        const results: H.IOResults = await WorkflowUtil.computeModelMetrics(model.Name, model.idModel, SOModel.idSystemObject, undefined,
                            undefined, undefined /* FIXME */, this.userOwner?.idUser);
                        if (results.error)
                            this.recordError(`fetchAndIngestResources failed to compute model metrics: ${results.error}`);
                    } else
                        this.recordError(`fetchAndIngestResources failed to fetch system object for model ${H.Helpers.JSONStringify(model)}`);
                }
            }
        }

        if (assetVersionOverrideMap.size > 0 && idSystemObjectScene) {
            // Clone scene's systemObjectVersion, using the assetVersionOverrideMap populated with new/updated assets
            const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(idSystemObjectScene, null,
                'Created by migration of downloads', assetVersionOverrideMap);
            if (!SOV)
                return this.recordError(`fetchAndIngestResources unable to clone SystemObjectVersion for ${H.Helpers.JSONStringify(this.scene)}`);
        }
        return { success: true };
    }

    private extractResourceInfo(resource: COL.Edan3DResource): COL.Edan3DResource & COL.Edan3DResourceAttribute {
        let UNITS: COL.Edan3DResourceAttributeUnits | undefined = undefined;
        let MODEL_FILE_TYPE: COL.Edan3DResourceAttributeModelFileType | undefined = undefined;
        let FILE_TYPE: COL.Edan3DResourceAttributeFileType | undefined = undefined;
        let GLTF_STANDARDIZED: boolean | undefined = undefined;
        let DRACO_COMPRESSED: boolean | undefined = undefined;

        if (resource.attributes) {
            for (const attribute of resource.attributes) {
                if (attribute.UNITS)
                    UNITS = attribute.UNITS;
                else if (attribute.MODEL_FILE_TYPE)
                    MODEL_FILE_TYPE = attribute.MODEL_FILE_TYPE;
                else if (attribute.FILE_TYPE)
                    FILE_TYPE = attribute.FILE_TYPE;
                else if (attribute.GLTF_STANDARDIZED)
                    GLTF_STANDARDIZED = attribute.GLTF_STANDARDIZED;
                else if (attribute.DRACO_COMPRESSED)
                    DRACO_COMPRESSED = attribute.DRACO_COMPRESSED;
            }
        }
        return { ...resource, UNITS, MODEL_FILE_TYPE, FILE_TYPE, GLTF_STANDARDIZED, DRACO_COMPRESSED };
    }

    private async createModel(resourceInfo: COL.Edan3DResource & COL.Edan3DResourceAttribute, downloadType: string): Promise<DBAPI.Model | null> {
        const isModel: boolean = (resourceInfo.type === '3D mesh' || resourceInfo.type === 'CAD model');
        if (!isModel)
            return null;

        const Name: string = resourceInfo.filename ?? '';
        const Units: DBAPI.Vocabulary | undefined = resourceInfo.UNITS ? await PublishScene.mapEdanUnitsToPackratVocabulary(resourceInfo.UNITS) : undefined;
        const AutomationTag: string = JobCookSIGenerateDownloads.computeModelAutomationTag(downloadType);

        const idVPurpose: number | null = SceneMigration.vocabDownload?.idVocabulary ?? null;
        const idVUnits: number | null = Units?.idVocabulary ?? null;
        const vFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(Name);
        const model: DBAPI.Model = new DBAPI.Model({
            idModel: 0,
            Name,
            Title: null,
            DateCreated: new Date(),
            idVCreationMethod: null,
            idVModality: null,
            idVPurpose,
            idVUnits,
            idVFileType: vFileType ? vFileType.idVocabulary : null,
            idAssetThumbnail: null, CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null,CountMaterials: null,
            CountMeshes: null, CountVertices: null, CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null,
            AutomationTag, CountTriangles: null
        });

        if (!await model.create()) {
            this.recordError(`createModel unable to create model ${H.Helpers.JSONStringify(model)}`);
            return null;
        }

        // link each model as derived from both the scene and the master model
        if (this.scene) {
            const SOX1: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(this.scene, model);
            if (!SOX1)
                this.recordError(`createModel unable to wire Scene ${H.Helpers.JSONStringify(this.scene)} and Model ${H.Helpers.JSONStringify(model)} together`);
        }

        /*
        const SOX2: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(this.modelSource, model);
        if (!SOX2)
            return this.logError(`createSystemObjects unable to wire Model Source ${H.Helpers.JSONStringify(this.modelSource)} and Model ${H.Helpers.JSONStringify(model)} together`);
        */

        return model;
    }

    private async createModelSceneXref(model: DBAPI.Model, downloadType: string, FileSize: bigint | null): Promise<H.IOResults> {
        if (!this.scene)
            return this.recordError('createModelSceneXref called without valid scene');

        const MSX: DBAPI.ModelSceneXref = new DBAPI.ModelSceneXref({
            idModelSceneXref: 0,
            idModel: model.idModel,
            idScene: this.scene.idScene,
            Name: model.Name,
            Usage: `Download ${downloadType}`,
            Quality: null,
            FileSize,
            UVResolution: null,
            BoundingBoxP1X: null, BoundingBoxP1Y: null, BoundingBoxP1Z: null, BoundingBoxP2X: null, BoundingBoxP2Y: null, BoundingBoxP2Z: null,
            TS0: null, TS1: null, TS2: null, R0: null, R1: null, R2: null, R3: null, S0: null, S1: null, S2: null,
        });
        if (!await MSX.create())
            return this.recordError(`createModelSceneXref unable to create ModelSceneXref ${H.Helpers.JSONStringify(MSX)}`);
        return { success: true };
    }


    private recordError(error: string, props?: any): H.IOResults { // eslint-disable-line @typescript-eslint/no-explicit-any
        LOG.error(`SceneMigration.${error}`, LOG.LS.eSYS);
        return { success: false, error, ...props };
    }
}
