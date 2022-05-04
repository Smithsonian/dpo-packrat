import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as STORE from '../../storage/interface';
import * as NAV from '../../navigation/interface';
import * as H from '../helpers';
import * as LOG from '../logger';
import { SceneMigrationPackage } from './SceneMigrationPackage';

import * as path from 'path';

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
    private static vocabScene:          DBAPI.Vocabulary | undefined    = undefined;
    private static vocabOther:          DBAPI.Vocabulary | undefined    = undefined;
    private static idSystemObjectTest:  number | undefined              = undefined;

    private userOwner:                  DBAPI.User | undefined          = undefined;
    private scene:                      DBAPI.Scene | null | undefined  = undefined;

    async initialize(idUser: number): Promise<H.IOResults> {
        this.userOwner = await CACHE.UserCache.getUser(idUser);
        if (!this.userOwner)
            return this.recordError(`initialize unable to load user with idUser of ${idUser}`);

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

    async migrateScene(scenePackage: SceneMigrationPackage, doNotSendIngestionEvent?: boolean): Promise<SceneMigrationResults> {
        let testData: boolean | undefined = undefined;

        let sceneFileName: string | undefined = undefined;
        let asset: DBAPI.Asset[] | null | undefined = undefined;
        let assetVersion: DBAPI.AssetVersion[] | null | undefined = undefined;

        const fileExists: boolean = await this.testFileExistence(scenePackage);
        if (!fileExists)
            return this.recordError(`migrateScene unable to locate file for ${H.Helpers.JSONStringify(scenePackage)}`, { filesMissing: true });

        // capture testData flag, if set, and ensure consistency
        if (scenePackage.testData !== testData) {
            if (testData === undefined)
                testData = scenePackage.testData;
            else
                return this.recordError(`migrateScene called with inconsistent value for testData (${scenePackage.testData}); expected ${testData}`);
        }

        if (!scenePackage.idSystemObjectItem && testData) {
            await this.createTestObjects();
            scenePackage.idSystemObjectItem = SceneMigration.idSystemObjectTest;
        }

        // TODO: Fetch scene package via HTTP; process scene file and extract metrics below
        sceneFileName = scenePackage.EdanUUID;
        this.scene = new DBAPI.Scene({
            Name: sceneFileName,
            idAssetThumbnail: null,
            CountScene: null,
            CountNode: null,
            CountCamera: null,
            CountLight: null,
            CountModel: null,
            CountMeta: null,
            CountSetup: null,
            CountTour: null,
            EdanUUID: scenePackage.EdanUUID,
            PosedAndQCd: scenePackage.PosedAndQCd ?? false,
            ApprovedForPublication: scenePackage.ApprovedForPublication ?? false,
            Title: null,
            idScene: 0
        });

        if (!await this.scene.create())
            return this.recordError(`migrateScene failed to create scene DB record ${H.Helpers.JSONStringify(this.scene)}`);
        // wire item to scene
        if (scenePackage.idSystemObjectItem) {
            if (!await this.wireItemToScene(scenePackage.idSystemObjectItem))
                return this.recordError(`migrateScene failed to wire media group to scene for ${H.Helpers.JSONStringify(scenePackage)}`);
        }

        const ingestRes: STORE.IngestStreamOrFileResult = await this.ingestFile(scenePackage, doNotSendIngestionEvent);
        if (ingestRes.asset) {
            if (!asset)
                asset = [];
            asset.push(ingestRes.asset);
        }
        if (ingestRes.assetVersion) {
            if (!assetVersion)
                assetVersion = [];
            assetVersion.push(ingestRes.assetVersion);
        }

        if (!ingestRes.success)
            return this.recordError(`migrateScene failed to ingest ${H.Helpers.JSONStringify(scenePackage)}: ${ingestRes.error}`);

        if (scenePackage.idSystemObjectItem)
            await this.postItemWiring();

        return { success: true, scene: this.scene, sceneFileName, asset, assetVersion };
    }

    private async ingestFile(scenePackage: SceneMigrationPackage, doNotSendIngestionEvent?: boolean): Promise<STORE.IngestStreamOrFileResult> {
        if (!this.scene || !this.userOwner || !SceneMigration.vocabScene || !SceneMigration.vocabOther)
            return { success: false };

        const localFilePath: string | null = this.computeFilePath(scenePackage);

        LOG.info(`SceneMigration.ingestFile ${localFilePath} for scene ${this.scene}`, LOG.LS.eSYS);
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream: null,
            localFilePath,
            asset: null,
            FileName: scenePackage.PackageName ? scenePackage.PackageName : scenePackage.EdanUUID,
            FilePath: '',
            idAssetGroup: 0,
            idVAssetType: SceneMigration.vocabScene.idVocabulary, // sceneEntry.geometry ? SceneMigration.vocabScene.idVocabulary : SceneMigration.vocabOther.idVocabulary, // FIXME: correct this info!
            allowZipCracking: true,
            idUserCreator: this.userOwner.idUser,
            SOBased: this.scene,
            Comment: null,
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
            return this.recordError(`wireItemToScene unable to wire item ${JSON.stringify(itemDB)} to scene ${this.scene}`);

        LOG.info(`SceneMigration.wireItemToScene ${JSON.stringify(itemDB)} to scene ${this.scene}`, LOG.LS.eSYS);
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

    private computeFilePath(scenePackage: SceneMigrationPackage): string | null {
        if (!scenePackage.PackageName)
            return null;
        // if no path is provided, assume this is regression testing, and look in the appropriate path for our mock scenes
        const basePath: string = scenePackage.PackagePath ? scenePackage.PackagePath : path.join(__dirname, '../../tests/mock/scenes', scenePackage.EdanUUID);
        return path.join(basePath, scenePackage.PackageName);
    }

    private async testFileExistence(scenePackage: SceneMigrationPackage): Promise<boolean> {
        const filePath: string | null = this.computeFilePath(scenePackage);
        if (filePath === null) {
            // We are loading via EDAN ... handle that here!
            return false;
        }
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

    private recordError(error: string, props?: any): H.IOResults { // eslint-disable-line @typescript-eslint/no-explicit-any
        LOG.error(`SceneMigration.${error}`, LOG.LS.eSYS);
        return { success: false, error, ...props };
    }
}
