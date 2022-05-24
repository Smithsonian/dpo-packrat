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
    private static vocabOther:          DBAPI.Vocabulary | undefined        = undefined;
    private static idSystemObjectTest:  number | undefined                  = undefined;

    private ICol:                       COL.ICollection | undefined         = undefined;
    private scenePackage:               SceneMigrationPackage | undefined   = undefined;
    private userOwner:                  DBAPI.User | undefined              = undefined;
    private scene:                      DBAPI.Scene | null | undefined      = undefined;

    private async initialize(): Promise<H.IOResults> {
        if (!SceneMigration.vocabScene)
            SceneMigration.vocabScene   = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeScene);
        if (!SceneMigration.vocabOther)
            SceneMigration.vocabOther   = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeOther);

        if (!SceneMigration.vocabScene)
            return this.recordError('initialize unable to load vocabulary for scene asset type');
        if (!SceneMigration.vocabOther)
            return this.recordError('initialize unable to load vocabulary for other asset type');
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
        const ingestRes: STORE.IngestStreamOrFileResult = await this.ingestStream(readStream, sceneFileName, true, doNotSendIngestionEvent); /* true -> allow zip containing scene package to be cracked open */
        if (!ingestRes.success)
            return this.recordError(`migrateScene failed to ingest ${H.Helpers.JSONStringify(this.scenePackage)}: ${ingestRes.error}`);
        if (ingestRes.assets)
            asset = ingestRes.assets;
        if (ingestRes.assetVersions)
            assetVersion = ingestRes.assetVersions;

        // Extract scene metrics
        const metricsRes: H.IOResults = await this.extractAndUpdateSceneMetrics(asset, assetVersion);
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

    private async ingestStream(readStream: NodeJS.ReadableStream | null, FileName: string, allowZipCracking: boolean,
        doNotSendIngestionEvent?: boolean): Promise<STORE.IngestStreamOrFileResult> {
        if (!this.scenePackage || !this.scene || !this.userOwner || !SceneMigration.vocabScene || !SceneMigration.vocabOther)
            return { success: false };

        const localFilePath: string | null = readStream ? null : this.computeFilePath(FileName);
        LOG.info(`SceneMigration.ingestFile using ${readStream ? 'stream' : 'file ' + localFilePath} for scene ${H.Helpers.JSONStringify(this.scene)}`, LOG.LS.eSYS);

        const ISI: STORE.IngestStreamOrFileInput = {
            readStream,
            localFilePath,
            asset: null,
            FileName,
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType: SceneMigration.vocabScene.idVocabulary, // sceneEntry.geometry ? SceneMigration.vocabScene.idVocabulary : SceneMigration.vocabOther.idVocabulary, // FIXME: correct this info!
            allowZipCracking,
            idUserCreator: this.userOwner.idUser,
            SOBased: this.scene,
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

        const SO: DBAPI.SystemObject | null = await this.scene.fetchSystemObject();
        if (!SO)
            return this.recordError(`postItemWiring unable to fetch system object for ${H.Helpers.JSONStringify(this.scene)}`);

        // index directly instead of scheduling indexing, so that we get an initial SOLR entry right away
        // NAV.NavigationFactory.scheduleObjectIndexing(SO.idSystemObject);
        const indexer: NAV.IIndexer | null = await nav.getIndexer();
        if (!indexer)
            return this.recordError(`postItemWiring unable to fetch navigation indexer for ${H.Helpers.JSONStringify(this.scene)}`);

        indexer.indexObject(SO.idSystemObject);
        return { success: true };
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

    private async extractAndUpdateSceneMetrics(assets: DBAPI.Asset[] | undefined, assetVersions: DBAPI.AssetVersion[] | undefined): Promise<H.IOResults> {
        if (!assets || !assetVersions || !this.scene)
            return this.recordError('extractAndUpdateSceneMetrics called without assets and/or asset versions');

        LOG.info(`SceneMigration.extractAndUpdateSceneMetrics called for scene ${H.Helpers.JSONStringify(this.scene)}`, LOG.LS.eSYS);
        // Build map of asset ID -> asset version
        const assetIDToVersionMap: Map<number, DBAPI.AssetVersion> = new Map<number, DBAPI.AssetVersion>();
        for (const assetVersion of assetVersions)
            assetIDToVersionMap.set(assetVersion.idAsset, assetVersion);

        for (const asset of assets) {
            const assetVersion: DBAPI.AssetVersion | undefined = assetIDToVersionMap.get(asset.idAsset);
            if (!assetVersion)
                return this.recordError(`extractAndUpdateSceneMetrics could not find asset version for asset ${H.Helpers.JSONStringify(asset)}`);

            const assetType: COMMON.eVocabularyID | undefined = await asset.assetType();
            if (!assetType)
                return this.recordError(`extractAndUpdateSceneMetrics unable to compute asset type for asset ${H.Helpers.JSONStringify(asset)}`);

            if (assetType !== COMMON.eVocabularyID.eAssetAssetTypeScene)
                continue;

            // found our scene; process it!
            LOG.info(`SceneMigration.extractAndUpdateSceneMetrics extracting svx.json from ${H.Helpers.JSONStringify(asset)}`, LOG.LS.eSYS);
            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(asset, assetVersion);
            if (!RSR.success)
                return this.recordError(`extractAndUpdateSceneMetrics failed to read scene asset ${H.Helpers.JSONStringify(asset)}: ${RSR.error}`);
            if (!RSR.readStream)
                return this.recordError(`extractAndUpdateSceneMetrics unable to compute stream for scene asset ${H.Helpers.JSONStringify(asset)}`);

            const svx: SvxReader = new SvxReader();
            const svxRes: H.IOResults = await svx.loadFromStream(RSR.readStream);
            if (!svxRes.success || !svx.SvxExtraction)
                return this.recordError(`extractAndUpdateSceneMetrics unable to parse SVX from stream: ${svxRes.error}`);

            this.scene.CountScene   = svx.SvxExtraction.sceneCount;
            this.scene.CountNode    = svx.SvxExtraction.nodeCount;
            this.scene.CountCamera  = svx.SvxExtraction.cameraCount;
            this.scene.CountLight   = svx.SvxExtraction.lightCount;
            this.scene.CountModel   = svx.SvxExtraction.modelCount;
            this.scene.CountMeta    = svx.SvxExtraction.metaCount;
            this.scene.CountSetup   = svx.SvxExtraction.setupCount;
            this.scene.CountTour    = svx.SvxExtraction.tourCount;
            if (!await this.scene.update())
                return this.recordError(`extractAndUpdateSceneMetrics unable to update scene metrics for ${H.Helpers.JSONStringify(this.scene)}`);

            LOG.info(`SceneMigration.extractAndUpdateSceneMetrics updated scene metrics for ${H.Helpers.JSONStringify(this.scene)}`, LOG.LS.eSYS);
            return { success: true };
        }

        return this.recordError('extractAndUpdateSceneMetrics unable to locate asset for scene svx.json');
    }

    private async fetchAndIngestResources(doNotSendIngestionEvent?: boolean | undefined): Promise<H.IOResults> {
        if (!this.ICol || !this.scenePackage || !this.scene)
            return this.recordError(`fetchAndIngestResources called without required data for ${H.Helpers.JSONStringify(this.scenePackage)}`);

        const edanURL: string = `3d_package:${this.scenePackage.EdanUUID}`;
        const edanRecord: COL.EdanRecord | null = await this.ICol.fetchContent(undefined, edanURL);
        if (!edanRecord)
            return this.recordError(`fetchAndIngestResources unable to fetch EDAN record for ${edanURL}`);

        LOG.info(`fetchAndIngestResources ${edanURL}: ${H.Helpers.JSONStringify(edanRecord)}`, LOG.LS.eSYS);

        const edan3DResources: COL.Edan3DResource[] | undefined = edanRecord.content?.resources;
        if (edan3DResources) {
            const SO: DBAPI.SystemObject | null = await this.scene.fetchSystemObject();
            if (!SO)
                return this.recordError(`fetchAndIngestResources unable to fetch SystemObject from scene ${H.Helpers.JSONStringify(this.scene)}`);

            for (const resource of edan3DResources) {
                LOG.info(`fetchAndIngestResources ${edanURL}: Handling resource ${H.Helpers.JSONStringify(resource)}`, LOG.LS.eSYS);
                if (!resource.url || !resource.filename)
                    continue;
                const readStream: NodeJS.ReadableStream | null = await this.fetchRemoteStream(resource.url);
                if (!readStream)
                    return this.recordError(`fetchAndIngestResources failed to retrieve stream for resource ${H.Helpers.JSONStringify(resource)}`);

                const ingestRes: STORE.IngestStreamOrFileResult = await this.ingestStream(readStream, resource.filename, false, doNotSendIngestionEvent); /* false -> do not crack resource/attachment zips */
                if (!ingestRes.success)
                    return this.recordError(`fetchAndIngestResources failed to ingest resource ${H.Helpers.JSONStringify(resource)}: ${ingestRes.error}`);

                let idSystemObject: number = SO.idSystemObject;
                if (ingestRes.assetVersion) {
                    const SOAssetVersion: DBAPI.SystemObject | null = await ingestRes.assetVersion.fetchSystemObject();
                    if (!SOAssetVersion)
                        return this.recordError(`fetchAndIngestResources failed to fetch system object for asset version ${H.Helpers.JSONStringify(ingestRes.assetVersion)}`);
                    idSystemObject = SOAssetVersion.idSystemObject;
                }

                const metadataRes: H.IOResults = await SceneHelpers.recordResourceMetadata(resource, idSystemObject, SO.idSystemObject, this.userOwner?.idUser ?? null);
                if (!metadataRes.success)
                    LOG.error('fetchAndIngestResources could not persist attachment metadata', LOG.LS.eSYS);
            }
        }
        return { success: true };
    }

    private recordError(error: string, props?: any): H.IOResults { // eslint-disable-line @typescript-eslint/no-explicit-any
        LOG.error(`SceneMigration.${error}`, LOG.LS.eSYS);
        return { success: false, error, ...props };
    }
}
