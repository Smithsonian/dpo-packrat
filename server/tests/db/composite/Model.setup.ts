import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as STORE from '../../../storage/interface';
import * as H from '../../../utils/helpers';
import * as UTIL from '../api';
import * as LOG from '../../../utils/logger';
import * as path from 'path';

class ModelTestData {
    testCase: string;
    fileName: string;
    directory: string;
    geometry: boolean; // true -> geometry file; false -> support file, such as a texture map
    hash: string;

    constructor(testCase: string, fileName: string, directory: string, geometry: boolean, hash: string) {
        this.testCase = testCase;
        this.fileName = fileName;
        this.directory = directory;
        this.geometry = geometry;
        this.hash = hash;
    }
}

const modelTestData: ModelTestData[] = [
    { testCase: 'fbx-stand-alone', fileName: 'eremotherium_laurillardi-150k-4096.fbx', directory: '', geometry: true, hash: '' },
    { testCase: 'fbx-with-support', fileName: 'eremotherium_laurillardi-150k-4096.fbx', directory: 'eremotherium_laurillardi-150k-4096-fbx', geometry: true, hash: '' },
    { testCase: 'fbx-with-support', fileName: 'eremotherium_laurillardi-150k-4096-diffuse.jpg', directory: 'eremotherium_laurillardi-150k-4096-fbx', geometry: false, hash: '' },
    { testCase: 'glb', fileName: 'eremotherium_laurillardi-150k-4096.glb', directory: '', geometry: true, hash: '' },
    { testCase: 'obj', fileName: 'eremotherium_laurillardi-150k-4096.obj', directory: 'eremotherium_laurillardi-150k-4096-obj', geometry: true, hash: '' },
    { testCase: 'obj', fileName: 'eremotherium_laurillardi-150k-4096.mtl', directory: 'eremotherium_laurillardi-150k-4096-obj', geometry: false, hash: '' },
    { testCase: 'obj', fileName: 'eremotherium_laurillardi-150k-4096-diffuse.jpg', directory: 'eremotherium_laurillardi-150k-4096-obj', geometry: false, hash: '' },
    { testCase: 'ply', fileName: 'eremotherium_laurillardi-150k.ply', directory: '', geometry: true, hash: '' },
    { testCase: 'stl', fileName: 'eremotherium_laurillardi-150k.stl', directory: '', geometry: true, hash: '' },
    { testCase: 'usd', fileName: 'eremotherium_laurillardi-150k-4096-5.usdc', directory: 'eremotherium_laurillardi-150k-4096-usd', geometry: true, hash: '' },
    { testCase: 'usd', fileName: 'baseColor-1.jpg', directory: 'eremotherium_laurillardi-150k-4096-usd/0', geometry: false, hash: '' },
    { testCase: 'usdz', fileName: 'eremotherium_laurillardi-150k-4096.usdz', directory: '', geometry: true, hash: '' },
    { testCase: 'wrl', fileName: 'eremotherium_laurillardi-150k-4096.x3d.wrl', directory: 'eremotherium_laurillardi-150k-4096-wrl', geometry: true, hash: '' },
    { testCase: 'wrl', fileName: 'eremotherium_laurillardi-150k-4096-diffuse.jpg', directory: 'eremotherium_laurillardi-150k-4096-wrl', geometry: false, hash: '' },
    { testCase: 'x3d', fileName: 'eremotherium_laurillardi-150k-4096.x3d', directory: 'eremotherium_laurillardi-150k-4096-x3d', geometry: true, hash: '' },
    { testCase: 'x3d', fileName: 'eremotherium_laurillardi-150k-4096-diffuse.jpg', directory: 'eremotherium_laurillardi-150k-4096-x3d', geometry: false, hash: '' },
];

export class ModelTestSetup {
    /* #region Variable Declarations */
    modelFbx1:          DBAPI.Model | null = null;
    modelFbx2:          DBAPI.Model | null = null;
    modelGlb:           DBAPI.Model | null = null;
    modelObj:           DBAPI.Model | null = null;
    modelPly:           DBAPI.Model | null = null;
    modelStl:           DBAPI.Model | null = null;
    modelUsd:           DBAPI.Model | null = null;
    modelUsdz:          DBAPI.Model | null = null;
    modelWrl:           DBAPI.Model | null = null;
    modelX3d:           DBAPI.Model | null = null;

    assetFbxA:          DBAPI.Asset | null = null;
    assetFbxB1:         DBAPI.Asset | null = null;
    assetFbxB2:         DBAPI.Asset | null = null;
    assetGlb:           DBAPI.Asset | null = null;
    assetObj1:          DBAPI.Asset | null = null;
    assetObj2:          DBAPI.Asset | null = null;
    assetObj3:          DBAPI.Asset | null = null;
    assetPly:           DBAPI.Asset | null = null;
    assetStl:           DBAPI.Asset | null = null;
    assetUsd1:          DBAPI.Asset | null = null;
    assetUsd2:          DBAPI.Asset | null = null;
    assetUsdz:          DBAPI.Asset | null = null;
    assetWrl1:          DBAPI.Asset | null = null;
    assetWrl2:          DBAPI.Asset | null = null;
    assetX3d1:          DBAPI.Asset | null = null;
    assetX3d2:          DBAPI.Asset | null = null;

    assetVersionFbxA:   DBAPI.AssetVersion | null = null;
    assetVersionFbxB1:  DBAPI.AssetVersion | null = null;
    assetVersionFbxB2:  DBAPI.AssetVersion | null = null;
    assetVersionGlb:    DBAPI.AssetVersion | null = null;
    assetVersionObj1:   DBAPI.AssetVersion | null = null;
    assetVersionObj2:   DBAPI.AssetVersion | null = null;
    assetVersionObj3:   DBAPI.AssetVersion | null = null;
    assetVersionPly:    DBAPI.AssetVersion | null = null;
    assetVersionStl:    DBAPI.AssetVersion | null = null;
    assetVersionUsd1:   DBAPI.AssetVersion | null = null;
    assetVersionUsd2:   DBAPI.AssetVersion | null = null;
    assetVersionUsdz:   DBAPI.AssetVersion | null = null;
    assetVersionWrl1:   DBAPI.AssetVersion | null = null;
    assetVersionWrl2:   DBAPI.AssetVersion | null = null;
    assetVersionX3d1:   DBAPI.AssetVersion | null = null;
    assetVersionX3d2:   DBAPI.AssetVersion | null = null;

    userOwner:          DBAPI.User | null = null;
    vocabModel:         DBAPI.Vocabulary | undefined = undefined;
    vocabMCreation:     DBAPI.Vocabulary | undefined = undefined;
    vocabMModality:     DBAPI.Vocabulary | undefined = undefined;
    vocabMUnits:        DBAPI.Vocabulary | undefined = undefined;
    vocabMPurpose:      DBAPI.Vocabulary | undefined = undefined;

    storage:            STORE.IStorage | null = null;
    /* #endregion */

    //** Returns null if initialize cannot locate test files.  Do not treat this as an error */
    async initialize(): Promise<boolean | null> {
        // let assigned: boolean = true;
        this.userOwner = await UTIL.createUserTest({ Name: 'Model Test', EmailAddress: 'modeltest@si.edu', SecurityID: 'Model Test', Active: true, DateActivated: UTIL.nowCleansed(), DateDisabled: null, WorkflowNotificationTime: UTIL.nowCleansed(), EmailSettings: 0, idUser: 0 });
        if (!this.userOwner) {
            LOG.logger.error('ModelTestSetup failed to create user');
            return false;
        }

        this.vocabModel = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeModel);
        this.vocabMCreation = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelCreationMethodCAD);
        this.vocabMModality = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelModalityMesh);
        this.vocabMUnits = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelUnitsMillimeter);
        this.vocabMPurpose = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelPurposeMaster);
        if (!this.vocabModel || !this.vocabMCreation || !this.vocabMModality || !this.vocabMUnits || !this.vocabMPurpose) {
            LOG.logger.error('ModelTestSetup failed to fetch Model-related Vocabulary');
            return false;
        }

        this.storage = await STORE.StorageFactory.getInstance();
        if (!this.storage) {
            LOG.logger.error('ModelTestSetup failed to retrieve storage interface');
            return false;
        }

        for (const MTD of modelTestData) {
            const fileExists: boolean = await this.testFileExistence(MTD);
            if (!fileExists) {
                LOG.logger.info(`ModelTestSetup unable to locate file for ${JSON.stringify(MTD)}`);
                return null;
            }

            const vocabMFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(MTD.fileName);
            if (!vocabMFileType) {
                LOG.logger.error('ModelTestSetup failed to fetch Model file type Vocabulary');
                return false;
            }

            const model: DBAPI.Model | null = await UTIL.createModelTest({
                Name: MTD.fileName,
                DateCreated: UTIL.nowCleansed(),
                idVCreationMethod: this.vocabMCreation.idVocabulary,
                Master: true, Authoritative: true,
                idVModality: this.vocabMModality.idVocabulary,
                idVUnits: this.vocabMUnits.idVocabulary,
                idVPurpose: this.vocabMPurpose.idVocabulary,
                idVFileType: vocabMFileType.idVocabulary,
                idAssetThumbnail: null,
                idModelMetrics: 0,
                idModel: 0
            });

            const { success, asset, assetVersion } = await this.ingestFile(MTD, model);
            if (!success) {
                LOG.logger.error('ModelTesetSetup failed to ingest model');
                return false;
            }

            switch (MTD.testCase) {
                case 'fbx-stand-alone':
                    this.modelFbx1 = model;
                    this.assetFbxA = asset;
                    this.assetVersionFbxA = assetVersion;
                    break;
                case 'fbx-with-support':
                    if (MTD.geometry) {
                        this.modelFbx2 = model;
                        this.assetFbxB1 = asset;
                        this.assetVersionFbxB1 = assetVersion;
                    } else {
                        this.assetFbxB2 = asset;
                        this.assetVersionFbxB2 = assetVersion;
                    }
                    break;
                case 'glb':
                    this.modelGlb = model;
                    this.assetGlb = asset;
                    this.assetVersionGlb = assetVersion;
                    break;
                case 'obj':
                    if (MTD.geometry) {
                        this.modelObj = model;
                        this.assetObj1 = asset;
                        this.assetVersionObj1 = assetVersion;
                    } else if (!this.assetObj2) {
                        this.assetObj2 = asset;
                        this.assetVersionObj2 = assetVersion;
                    } else {
                        this.assetObj3 = asset;
                        this.assetVersionObj3 = assetVersion;
                    }
                    break;
                case 'ply':
                    this.modelPly = model;
                    this.assetPly = asset;
                    this.assetVersionPly = assetVersion;
                    break;
                case 'stl':
                    this.modelStl = model;
                    this.assetStl = asset;
                    this.assetVersionStl = assetVersion;
                    break;
                case 'usd':
                    if (MTD.geometry) {
                        this.modelUsd = model;
                        this.assetUsd1 = asset;
                        this.assetVersionUsd1 = assetVersion;
                    } else {
                        this.assetUsd2 = asset;
                        this.assetVersionUsd2 = assetVersion;
                    }
                    break;
                case 'usdz':
                    this.modelUsdz = model;
                    this.assetUsdz = asset;
                    this.assetVersionUsdz = assetVersion;
                    break;
                case 'wrl':
                    if (MTD.geometry) {
                        this.modelWrl = model;
                        this.assetWrl1 = asset;
                        this.assetVersionWrl1 = assetVersion;
                    } else {
                        this.assetWrl2 = asset;
                        this.assetVersionWrl2 = assetVersion;
                    }
                    break;
                case 'x3d':
                    if (MTD.geometry) {
                        this.modelX3d = model;
                        this.assetX3d1 = asset;
                        this.assetVersionX3d1 = assetVersion;
                    } else {
                        this.assetX3d2 = asset;
                        this.assetVersionX3d2 = assetVersion;
                    }
                    break;
            }
        }

        return true;
    }

    async ingestFile(MTD: ModelTestData, model: DBAPI.Model): Promise<{ success: boolean, asset: DBAPI.Asset | null, assetVersion: DBAPI.AssetVersion | null}> {
        if (!this.userOwner || !this.vocabModel || !this.storage)
            return { success: false, asset: null, assetVersion: null };

        const wsRes: STORE.WriteStreamResult = await this.storage.writeStream(MTD.fileName);
        if (!wsRes.success || !wsRes.writeStream || !wsRes.storageKey) {
            LOG.logger.error(`ModelTestSetup.ingestFile Unable to create write stream for ${MTD.fileName}: ${wsRes.error}`);
            return { success: false, asset: null, assetVersion: null };
        }
        const filePath: string = this.computeFilePath(MTD);
        const wrRes: H.IOResults = await H.Helpers.writeFileToStream(filePath, wsRes.writeStream);
        if (!wrRes.success) {
            LOG.logger.error(`ModelTestSetup.ingestFile Unable to write ${filePath} to stream: ${wrRes.error}`);
            return { success: false, asset: null, assetVersion: null };
        }

        const ASCNAI: STORE.AssetStorageCommitNewAssetInput = {
            storageKey: wsRes.storageKey,
            storageHash: null,
            FileName: MTD.fileName,
            FilePath: MTD.directory,
            idAssetGroup: 0,
            idVAssetType: this.vocabModel.idVocabulary,
            idUserCreator: this.userOwner.idUser,
            DateCreated: new Date()
        };

        const comRes: STORE.AssetStorageResultCommit = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
        if (!comRes.success || !comRes.assets || comRes.assets.length != 1 || !comRes.assetVersions || comRes.assetVersions.length != 1) {
            LOG.logger.error(`ModelTestSetup.ingestFile Unable to commit asset: ${comRes.error}`);
            return { success: false, asset: null, assetVersion: null };
        }

        const opInfo: STORE.OperationInfo = { message: 'Ingesting asset', idUser: this.userOwner.idUser,
            userEmailAddress: this.userOwner.EmailAddress, userName: this.userOwner.Name };
        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestAsset(comRes.assets[0], comRes.assetVersions[0], model, opInfo);
        return { success: IAR.success, asset: comRes.assets[0] || null, assetVersion: comRes.assetVersions[0] || null };
    }

    private computeFilePath(MTD: ModelTestData): string {
        return path.join('../../mock/models', MTD.directory, MTD.fileName);
    }

    private async testFileExistence(MTD: ModelTestData): Promise<boolean> {
        const filePath: string = this.computeFilePath(MTD);
        const res: H.StatResults = await H.Helpers.stat(filePath);
        const success: boolean = res.success && (res.stat !== null) && res.stat.isFile();
        LOG.logger.info(`ModelTestSetup.testFileExistience(${filePath}) = ${success}`);
        return success;
    }
}