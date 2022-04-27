import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as STORE from '../../storage/interface';
import * as NAV from '../../navigation/interface';
import * as H from '../helpers';
import * as LOG from '../logger';
import { ModelMigrationFile } from './ModelMigrationFile';

import * as path from 'path';

export type ModelMigrationResults = {
    success: boolean;
    error?: string | undefined;
    modelFileName?: string | undefined;
    model?: DBAPI.Model | null | undefined;
    asset?: DBAPI.Asset[] | null | undefined;
    assetVersion?: DBAPI.AssetVersion[] | null | undefined;
    filesMissing?: boolean | undefined;
};

export class ModelMigration {
    // private storage: STORE.IStorage | null = null;
    private static vocabModel:          DBAPI.Vocabulary | undefined    = undefined;
    private static vocabModelUVMapFile: DBAPI.Vocabulary | undefined    = undefined;
    private static idSystemObjectTest:  number | undefined              = undefined;

    private userOwner:                  DBAPI.User | undefined          = undefined;
    private model:                      DBAPI.Model | null | undefined  = undefined;

    async initialize(idUser: number): Promise<H.IOResults> {
        // this.storage = await STORE.StorageFactory.getInstance();
        // if (!this.storage)
        //     return this.recordError('initialize failed to retrieve storage interface');

        this.userOwner = await CACHE.UserCache.getUser(idUser);
        if (!this.userOwner)
            return this.recordError(`initialize unable to load user with idUser of ${idUser}`);

        if (!ModelMigration.vocabModel)
            ModelMigration.vocabModel             = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModel);
        if (!ModelMigration.vocabModelUVMapFile)
            ModelMigration.vocabModelUVMapFile    = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile);

        if (!ModelMigration.vocabModel)
            return this.recordError('initialize unable to load vocabulary for model file asset type');
        if (!ModelMigration.vocabModelUVMapFile)
            return this.recordError('initialize unable to load vocabulary for model uv map file asset type');
        return { success: true };
    }

    async migrateModel(modelFileSet: ModelMigrationFile[], doNotSendIngestionEvent?: boolean): Promise<ModelMigrationResults> {
        let idSystemObject: number | undefined = undefined;
        let testData: boolean | undefined = undefined;

        let modelFileName: string | undefined = undefined;
        let asset: DBAPI.Asset[] | null | undefined = undefined;
        let assetVersion: DBAPI.AssetVersion[] | null | undefined = undefined;

        for (const modelFile of modelFileSet) {
            const fileExists: boolean = await this.testFileExistence(modelFile);
            if (!fileExists) {
                return this.recordError(`migrateModel unable to locate file for ${H.Helpers.JSONStringify(modelFile)}`, { filesMissing: true });
            }

            // capture idSystemObject for item, if any, and ensure consistency
            if (modelFile.idSystemObjectItem !== idSystemObject) {
                if (idSystemObject === undefined)
                    idSystemObject = modelFile.idSystemObjectItem;
                else if (idSystemObject !== ModelMigration.idSystemObjectTest)
                    return this.recordError(`migrateModel called with inconsistent value for idSystemObjectItem (${modelFile.idSystemObjectItem}); expected ${idSystemObject}`);
            }

            // capture testData flag, if set, and ensure consistency
            if (modelFile.testData !== testData) {
                if (testData === undefined)
                    testData = modelFile.testData;
                else
                    return this.recordError(`migrateModel called with inconsistent value for testData (${modelFile.testData}); expected ${testData}`);
            }

            if (!idSystemObject && testData) {
                await this.createTestObjects();
                idSystemObject = ModelMigration.idSystemObjectTest;
            }

            if (modelFile.geometry) {
                const vocabMFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(modelFile.fileName);
                if (!vocabMFileType)
                    return this.recordError(`migrateModel failed to fetch Model file type Vocabulary for ${H.Helpers.JSONStringify(modelFile)}`);

                const vCreationMethod: DBAPI.Vocabulary | undefined = modelFile.eVCreationMethod    ? await CACHE.VocabularyCache.vocabularyByEnum(modelFile.eVCreationMethod)  : undefined;
                const vModality: DBAPI.Vocabulary | undefined       = modelFile.eVModality          ? await CACHE.VocabularyCache.vocabularyByEnum(modelFile.eVModality)        : undefined;
                const vPurpose: DBAPI.Vocabulary | undefined        = modelFile.eVPurpose           ? await CACHE.VocabularyCache.vocabularyByEnum(modelFile.eVPurpose)         : undefined;
                const vUnits: DBAPI.Vocabulary | undefined          = modelFile.eVUnits             ? await CACHE.VocabularyCache.vocabularyByEnum(modelFile.eVUnits)           : undefined;

                if (!vCreationMethod)
                    return this.recordError(`migrateModel model missing creation method ${H.Helpers.JSONStringify(modelFile)}`);
                if (!vModality)
                    return this.recordError(`migrateModel model missing modality ${H.Helpers.JSONStringify(modelFile)}`);
                if (!vPurpose)
                    return this.recordError(`migrateModel model missing purpose ${H.Helpers.JSONStringify(modelFile)}`);
                if (!vUnits)
                    return this.recordError(`migrateModel model missing units ${H.Helpers.JSONStringify(modelFile)}`);

                modelFileName = modelFile.fileName;
                this.model = new DBAPI.Model({
                    Name: modelFileName,
                    DateCreated: new Date(),
                    idVCreationMethod: vCreationMethod.idVocabulary,
                    idVModality: vModality.idVocabulary,
                    idVUnits: vUnits.idVocabulary,
                    idVPurpose: vPurpose.idVocabulary,
                    idVFileType: vocabMFileType.idVocabulary,
                    idAssetThumbnail: null,
                    CountAnimations: null, CountCameras: null, CountFaces: null, CountLights: null, CountMaterials: null, CountMeshes: null, CountVertices: null,
                    CountEmbeddedTextures: null, CountLinkedTextures: null, FileEncoding: null, IsDracoCompressed: null, AutomationTag: null,
                    CountTriangles: null,
                    Title: modelFile.title,
                    idModel: 0
                });
                if (!await this.model.create())
                    return this.recordError(`migrateModel failed to create model DB record ${H.Helpers.JSONStringify(this.model)}`);
                // wire item to model
                if (idSystemObject) {
                    if (!await this.wireItemToModel(idSystemObject))
                        return this.recordError(`migrateModel failed to wire media group to model for ${H.Helpers.JSONStringify(modelFileSet)}`);
                }
            } else if (!this.model)
                return this.recordError(`migrateModel attempting to ingest non-model ${H.Helpers.JSONStringify(modelFile)} without model already created`);

            const ingestRes: STORE.IngestStreamOrFileResult = await this.ingestFile(modelFile, doNotSendIngestionEvent);
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
                return this.recordError(`migrateModel failed to ingest ${H.Helpers.JSONStringify(modelFile)}: ${ingestRes.error}`);
        }

        if (idSystemObject)
            await this.postItemWiring();

        return { success: true, model: this.model, modelFileName, asset, assetVersion };
    }

    private async ingestFile(modelFile: ModelMigrationFile, doNotSendIngestionEvent?: boolean): Promise<STORE.IngestStreamOrFileResult> {
        if (!this.model || !this.userOwner || !ModelMigration.vocabModel || !ModelMigration.vocabModelUVMapFile)
            return { success: false };

        const LocalFilePath: string = this.computeFilePath(modelFile);
        LOG.info(`ModelMigration.ingestFile ${LocalFilePath} for model ${this.model}`, LOG.LS.eSYS);
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream: null,
            localFilePath: LocalFilePath,
            asset: null,
            FileName: modelFile.fileName,
            FilePath: modelFile.filePath,
            idAssetGroup: 0,
            idVAssetType: modelFile.geometry ? ModelMigration.vocabModel.idVocabulary : ModelMigration.vocabModelUVMapFile.idVocabulary,
            allowZipCracking: true,
            idUserCreator: this.userOwner.idUser,
            SOBased: this.model,
            Comment: null,
            doNotSendIngestionEvent
        };

        return await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
    }

    private async wireItemToModel(idSystemObject: number): Promise<H.IOResults> {
        if (!this.model)
            return this.recordError('wireItemToModel called with null model');

        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
        if (!oID)
            return this.recordError(`wireItemToModel unable to compute object info for ${idSystemObject}`);
        if (oID.eObjectType !== COMMON.eSystemObjectType.eItem)
            return this.recordError(`wireItemToModel called with non-item idSystemObject ID (${idSystemObject}):  ${H.Helpers.JSONStringify(oID)}`);

        const itemDB: DBAPI.Item | null = await DBAPI.Item.fetch(oID.idObject);
        if (!itemDB)
            return this.recordError(`wireItemToModel failed to fetch item ${oID.idObject}`);

        const xref: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemDB, this.model);
        if (!xref)
            return this.recordError(`wireItemToModel unable to wire item ${JSON.stringify(itemDB)} to model ${this.model}`);

        LOG.info(`ModelMigration.wireItemToModel ${JSON.stringify(itemDB)} to model ${this.model}`, LOG.LS.eSYS);
        return { success: true };
    }

    private async postItemWiring(): Promise<H.IOResults> {
        LOG.info('ModelMigration.postItemWiring', LOG.LS.eSYS);
        if (!this.model)
            return this.recordError('postItemWiring called without model defined');

        // explicitly reindex model
        const nav: NAV.INavigation | null = await NAV.NavigationFactory.getInstance();
        if (!nav)
            return this.recordError('postItemWiring unable to fetch navigation interface');

        const SO: DBAPI.SystemObject | null = await this.model.fetchSystemObject();
        if (!SO)
            return this.recordError(`postItemWiring unable to fetch system object for ${H.Helpers.JSONStringify(this.model)}`);

        // index directly instead of scheduling indexing, so that we get an initial SOLR entry right away
        // NAV.NavigationFactory.scheduleObjectIndexing(SO.idSystemObject);
        const indexer: NAV.IIndexer | null = await nav.getIndexer();
        if (!indexer)
            return this.recordError(`postItemWiring unable to fetch navigation indexer for ${H.Helpers.JSONStringify(this.model)}`);

        indexer.indexObject(SO.idSystemObject);
        return { success: true };
    }

    private async createTestObjects(): Promise<H.IOResults> {
        if (ModelMigration.idSystemObjectTest)
            return { success: true };

        LOG.info('ModelMigration.createTestObjects', LOG.LS.eSYS);
        const unitDB: DBAPI.Unit | null = await DBAPI.Unit.fetch(1); // Unknown Unit
        if (!unitDB)
            return this.recordError('createTestObjects unable to fetch unit with ID=1 for test data');

        const Name: string = `ModelMigrationTest-${new Date().toISOString()}`;
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
        ModelMigration.idSystemObjectTest = SO.idSystemObject;

        return { success: true };
    }

    private computeFilePath(modelFile: ModelMigrationFile): string {
        // if no path is provided, assume this is regression testing, and look in the appropriate path for our mock models
        const basePath: string = modelFile.path ? modelFile.path : path.join(__dirname, '../../tests/mock/models', modelFile.filePath);
        return path.join(basePath, modelFile.fileName);
    }

    private async testFileExistence(modelFile: ModelMigrationFile): Promise<boolean> {
        const filePath: string = this.computeFilePath(modelFile);
        const res: H.StatResults = await H.Helpers.stat(filePath);
        let success: boolean = res.success && (res.stat !== null) && res.stat.isFile();

        if (modelFile.hash) {
            const hashRes: H.HashResults = await H.Helpers.computeHashFromFile(filePath, 'sha256');
            if (!hashRes.success) {
                LOG.error(`ModelMigration.testFileExistience('${filePath}') unable to compute hash ${hashRes.error}`, LOG.LS.eSYS);
                success = false;
            } else if (hashRes.hash != modelFile.hash) {
                LOG.error(`ModelMigration.testFileExistience('${filePath}') computed different hash ${hashRes.hash} than expected ${modelFile.hash}`, LOG.LS.eSYS);
                success = false;
            }
        }

        LOG.info(`ModelMigration.testFileExistience('${filePath}') = ${success}`, LOG.LS.eSYS);
        return success;
    }

    private recordError(error: string, props?: any): H.IOResults { // eslint-disable-line @typescript-eslint/no-explicit-any
        LOG.error(`ModelMigration.${error}`, LOG.LS.eSYS);
        return { success: false, error, ...props };
    }
}
