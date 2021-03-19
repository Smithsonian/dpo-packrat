import * as path from 'path';
import * as STORE from '../../../storage/interface/';
import * as ST from '../../../storage/impl/LocalStorage/SharedTypes';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';
import { IngestMetadata } from '../../../utils/parser';
import { Config } from '../../../config';
import { ObjectGraphTestSetup } from '../../db/composite/ObjectGraph.setup';
import { createItemAndIDsForBagitTesting } from '../../db/api/Item.util';
import { AssetVersionContent } from '../../../types/graphql';


const mockPathZip: string = path.join(__dirname, '../../mock/utils/zip/PackratTest.zip');
const mockPathBagit1: string = path.join(__dirname, '../../mock/utils/bagit/PackratTestValidMultiHash.zip');
const mockPathBagit2: string = path.join(__dirname, '../../mock/utils/zip/PackratTest.zip');

type AssetStorageAdapterTestCase = {
    assets: DBAPI.Asset[],
    assetVersions: DBAPI.AssetVersion[],
    SOBased: DBAPI.SystemObjectBased | null
};

const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();
let vAssetTypePhoto: DBAPI.Vocabulary;
let vAssetTypeBulk: DBAPI.Vocabulary;
let vAssetTypeOther: DBAPI.Vocabulary;
let opInfo: STORE.OperationInfo;
let TestCase1: AssetStorageAdapterTestCase;
let rootRepositoryOrig: string;
let rootRepositoryNew: string;
let rootStagingOrig: string;
let rootStagingNew: string;

beforeAll(() => {
    rootRepositoryOrig = Config.storage.rootRepository;
    rootStagingOrig = Config.storage.rootStaging;

    rootRepositoryNew = path.join('var', 'test', H.Helpers.randomSlug());
    rootStagingNew = path.join('var', 'test', H.Helpers.randomSlug());
    // LOG.logger.info(`Test Repo ${rootRepositoryNew}; staging ${rootStagingNew}`);

    Config.storage.rootRepository = rootRepositoryNew;
    Config.storage.rootStaging = rootStagingNew;
});

afterAll(async done => {
    Config.storage.rootRepository = rootRepositoryOrig;
    Config.storage.rootStaging = rootStagingOrig;
    await H.Helpers.removeDirectory(rootRepositoryNew, true);
    await H.Helpers.removeDirectory(rootStagingNew, true);
    // jest.setTimeout(5000);
    // await H.Helpers.sleep(2000);
    done();
});

describe('AssetStorageAdapter Init', () => {
    test('Object Hierarchy Test Setup', async() => {
        await OHTS.initialize();
        await OHTS.wire();
        opInfo = {
            message: '1',
            idUser: OHTS.user1 ? OHTS.user1.idUser : 0,
            userEmailAddress: OHTS.user1 ? OHTS.user1.EmailAddress : '',
            userName: OHTS.user1 ? OHTS.user1.Name : ''
        };

        let vAssetTypeLookup: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry);
        expect(vAssetTypeLookup).toBeTruthy();
        if (!vAssetTypeLookup)
            return;
        vAssetTypePhoto = vAssetTypeLookup;

        vAssetTypeLookup = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeBulkIngestion);
        expect(vAssetTypeLookup).toBeTruthy();
        if (!vAssetTypeLookup)
            return;
        vAssetTypeBulk = vAssetTypeLookup;

        vAssetTypeLookup = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeOther);
        expect(vAssetTypeLookup).toBeTruthy();
        if (!vAssetTypeLookup)
            return;
        vAssetTypeOther = vAssetTypeLookup;

        await createItemAndIDsForBagitTesting({
            idAssetThumbnail: null,
            idGeoLocation: null,
            Name: 'BagitTestingItem',
            EntireSubject: true,
            idItem: 0
        });
    });
});

describe('AssetStorageAdapter Methods', () => {
    test('AssetStorageAdapter.commitNewAsset', async() => {
        TestCase1 = await testCommitNewAsset(null, 10000, OHTS.captureData1);
        await testReadAsset(TestCase1, true);
        await testReadAssetVersion(TestCase1, true);
    });

    test('AssetStorageAdapter.ingestAsset', async() => {
        await testIngestAsset(TestCase1, true);
        await testReadAsset(TestCase1, true);
        await testReadAssetVersionByID(TestCase1, true);
    });

    test('AssetStorageAdapter.commitNewAsset 2', async() => {
        TestCase1 = await testCommitNewAsset(TestCase1, 12000, OHTS.model1);
        await testReadAsset(TestCase1, true);
        await testReadAssetVersion(TestCase1, true);
    });

    test('AssetStorageAdapter.ingestAsset 2', async() => {
        await testIngestAsset(TestCase1, true);
        await testReadAsset(TestCase1, true);
        await testReadAssetVersionByID(TestCase1, true);
    });

    test('AssetStorageAdapter.commitNewAsset 3', async() => {
        TestCase1 = await testCommitNewAsset(TestCase1, 14000, OHTS.model1); // don't change metadata this time for fuller code coverage
        await testReadAsset(TestCase1, true);
        await testReadAssetVersion(TestCase1, true);
    });

    test('AssetStorageAdapter.ingestAsset 3', async() => {
        await testIngestAsset(TestCase1, true);
        await testReadAsset(TestCase1, true);
        await testReadAssetVersionByID(TestCase1, true);
    });

    test('AssetStorageAdapter.renameAsset', async() => {
        await testRenameAsset(TestCase1, true);
        await testReadAsset(TestCase1, true);
        await testReadAssetVersion(TestCase1, true);
    });

    test('AssetStorageAdapter.hideAsset', async() => {
        await testHideAsset(TestCase1, true);
        await testReadAsset(TestCase1, false); // Expected failure as asset was hidden
        await testReadAssetVersionByID(TestCase1, false); // Expected failure as asset was hidden
    });

    test('AssetStorageAdapter.reinstateAsset', async() => {
        await testReinstateAsset(TestCase1, -1, true);
        await testReadAsset(TestCase1, true);
        await testReadAssetVersion(TestCase1, true);
    });

    test('AssetStorageAdapter.hideAsset', async() => {
        await testHideAsset(TestCase1, true);
        await testReadAsset(TestCase1, false); // Expected failure as asset was hidden
        await testReadAssetVersionByID(TestCase1, false); // Expected failure as asset was hidden
    });

    test('AssetStorageAdapter.reinstateAsset', async() => {
        await testReinstateAsset(TestCase1, 4, true);
        await testReadAsset(TestCase1, true);
        await testReadAssetVersion(TestCase1, true);
    });

    test('AssetStorageAdapter.discardAssetVersion', async() => {
        const TestCase2 = await testCommitNewAsset(null, 15000, OHTS.captureData1);
        await testDiscardAssetVersion(TestCase2, true);  // first time should succeed
        await testDiscardAssetVersion(TestCase2, false); // second time should fail

        await testDiscardAssetVersion(TestCase1, false); // discard of ingested asset should fail
    });
});

describe('AssetStorageAdapter Failures', () => {
    test('AssetStorageAdapter.commitNewAsset failure', async() => {
        await testCommitNewAssetFailure(TestCase1);
    });

    test('AssetStorageAdapter.ingestAsset failure', async() => {
        await testIngestAssetFailure(TestCase1);
    });
});

describe('AssetStorageAdapter getAssetVersionContents', () => {
    test('AssetStorageAdapter.getAssetVersionContents', async() => {
        await testGetAssetVersionContents(TestCase1, [TestCase1.assetVersions[0].FileName], []);
    });

    test('AssetStorageAdapter.getAssetVersionContents zip', async() => {
        const tcZip: AssetStorageAdapterTestCase = await testCommitNewAsset(null, 0, OHTS.captureData1, mockPathZip, vAssetTypeOther);
        await testGetAssetVersionContents(tcZip, ['bag-info.txt', 'bagit.txt', 'capture_data_photo.csv', 'manifest-sha1.txt', 'tagmanifest-sha1.txt', 'nmnh_sea_turtle-1_low-01.jpg', 'nmnh_sea_turtle-1_low-02.jpg', 'nmnh_sea_turtle-1_low-01.dng', 'nmnh_sea_turtle-1_low-02.dng'], ['PackratTest', 'PackratTest/data/nmnh_sea_turtle-1_low/camera', 'PackratTest/data/nmnh_sea_turtle-1_low/raw']);
        await testCrackAsset(tcZip, true);
        await testIngestAsset(tcZip, true);
        await testGetAssetVersionContents(tcZip, ['bag-info.txt', 'bagit.txt', 'capture_data_photo.csv', 'manifest-sha1.txt', 'tagmanifest-sha1.txt', 'nmnh_sea_turtle-1_low-01.jpg', 'nmnh_sea_turtle-1_low-02.jpg', 'nmnh_sea_turtle-1_low-01.dng', 'nmnh_sea_turtle-1_low-02.dng'], ['PackratTest', 'PackratTest/data/nmnh_sea_turtle-1_low/camera', 'PackratTest/data/nmnh_sea_turtle-1_low/raw']);
    });

    test('AssetStorageAdapter.getAssetVersionContents bagit 1', async() => {
        const tcBagit1Other: AssetStorageAdapterTestCase = await testCommitNewAsset(null, 0, OHTS.captureData1, mockPathBagit1, vAssetTypeBulk);
        await testGetAssetVersionContents(tcBagit1Other, ['hello.txt'], ['model']);
        await testExtractBulkIngestMetadata(tcBagit1Other, true);
        await testCrackAsset(tcBagit1Other, true);
        await testIngestAsset(tcBagit1Other, true);
        await testGetAssetVersionContents(tcBagit1Other, ['hello.txt'], []); // ingested sub-element is no longer in the "model" folder
        await testExtractBulkIngestMetadata(tcBagit1Other, false);
        await testCrackAsset(tcBagit1Other, false);
    });

    test('AssetStorageAdapter.getAssetVersionContents bagit 2', async() => {
        const tcBagit2: AssetStorageAdapterTestCase = await testCommitNewAsset(null, 0, OHTS.captureData1, mockPathBagit2, vAssetTypeBulk);
        await testGetAssetVersionContents(tcBagit2, ['nmnh_sea_turtle-1_low-01.jpg', 'nmnh_sea_turtle-1_low-02.jpg', 'nmnh_sea_turtle-1_low-01.dng', 'nmnh_sea_turtle-1_low-02.dng'], ['nmnh_sea_turtle-1_low/camera', 'nmnh_sea_turtle-1_low/raw']);
        await testExtractBulkIngestMetadata(tcBagit2, true);
        await testCrackAsset(tcBagit2, true);
        await testIngestAsset(tcBagit2, true);
        await testGetAssetVersionContents(tcBagit2, ['nmnh_sea_turtle-1_low-01.jpg', 'nmnh_sea_turtle-1_low-02.jpg', 'nmnh_sea_turtle-1_low-01.dng', 'nmnh_sea_turtle-1_low-02.dng'], []);
        await testExtractBulkIngestMetadata(tcBagit2, false);
        await testCrackAsset(tcBagit2, false);
    });
});


async function testCommitNewAsset(TestCase: AssetStorageAdapterTestCase | null, fileSize: number, SOBased: DBAPI.SystemObjectBased | null,
    fileName: string | null = null, vocabulary: DBAPI.Vocabulary | null = null): Promise<AssetStorageAdapterTestCase> {
    if (!vocabulary)
        vocabulary = vAssetTypePhoto;
    const BulkIngest: boolean = (vocabulary == vAssetTypeBulk);

    let newAsset: boolean;
    if (!TestCase) {
        const fileNameAsset: string = (fileName) ? path.basename(fileName) : H.Helpers.randomSlug();
        TestCase = { assets: [], assetVersions: [], SOBased };

        TestCase.assets.push(new DBAPI.Asset({ idAsset: 0, FileName: fileNameAsset, FilePath: H.Helpers.randomSlug(), idAssetGroup: null, idVAssetType: vocabulary.idVocabulary, idSystemObject: null, StorageKey: '' }));
        TestCase.assetVersions.push(new DBAPI.AssetVersion({ idAssetVersion: 0, idAsset: 0, FileName: fileNameAsset, idUserCreator: opInfo.idUser, DateCreated: new Date(), StorageHash: '', StorageSize: BigInt(0), StorageKeyStaging: '', Ingested: false, BulkIngest, Version: 1 }));
        newAsset = true;
    } else {
        TestCase.SOBased = SOBased;
        newAsset = false;
    }

    // Get storage interface
    const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance();
    expect(storage).toBeTruthy();
    if (!storage)
        return TestCase;

    // Use IStorage.writeStream to write bits
    // LOG.logger.info('AssetStorageAdaterTest IStorage.writeStream');
    const WSR: STORE.WriteStreamResult = await storage.writeStream(TestCase.assetVersions[0].FileName);
    expect(WSR.success).toBeTruthy();
    expect(WSR.writeStream).toBeTruthy();
    expect(WSR.storageKey).toBeTruthy();
    if (!WSR.writeStream)
        return TestCase;
    if (!WSR.storageKey)
        return TestCase;

    // record storage key & stream bits to storage system
    TestCase.assetVersions[0].StorageKeyStaging = WSR.storageKey;
    let storageHash: string;
    if (!fileName) {
        storageHash = await H.Helpers.createRandomFile(WSR.writeStream, fileSize);
        expect(storageHash).toBeTruthy();
    } else {
        expect(await H.Helpers.writeFileToStream(fileName, WSR.writeStream)).toBeTruthy();
        const hashResults: H.HashResults = await H.Helpers.computeHashFromFile(fileName, 'sha512');
        expect(hashResults.success).toBeTruthy();
        storageHash = hashResults.hash;
    }

    // Use STORE.AssetStorageAdapter.commitNewAsset();
    const ASCNAI: STORE.AssetStorageCommitNewAssetInput = {
        storageKey: TestCase.assetVersions[0].StorageKeyStaging,
        storageHash,
        FileName: TestCase.assets[0].FileName,
        FilePath: TestCase.assets[0].FilePath,
        idAssetGroup: TestCase.assets[0].idAssetGroup,
        idVAssetType: TestCase.assets[0].idVAssetType,
        idUserCreator: TestCase.assetVersions[0].idUserCreator,
        DateCreated: TestCase.assetVersions[0].DateCreated
    };

    let ASRC: STORE.AssetStorageResultCommit;
    if (newAsset) {
        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.commitNewAsset ${TestCase.asset.FileName}`);
        ASRC = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
    } else {
        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.commitNewAssetVersion ${TestCase.asset.FileName}`);
        ASRC = await STORE.AssetStorageAdapter.commitNewAssetVersion({ storageKey: TestCase.assetVersions[0].StorageKeyStaging, storageHash },
            TestCase.assets[0], TestCase.assetVersions[0].idUserCreator, TestCase.assetVersions[0].DateCreated);
    }
    expect(ASRC.success).toBeTruthy();
    if (!ASRC.success) {
        LOG.logger.error(`AssetStorageAdaterTest AssetStorageAdapter.commitNewAsset: ${ASRC.error}`);
        return TestCase;
    }

    expect(ASRC.assets).toBeTruthy();
    expect(ASRC.assetVersions).toBeTruthy();
    if (ASRC.assets) {
        TestCase.assets = ASRC.assets;
        expect(ASRC.assets.length).toBeGreaterThan(0);
        expect(TestCase.assets[0].idAsset).toBeGreaterThan(0);
    }
    if (ASRC.assetVersions) {
        TestCase.assetVersions = ASRC.assetVersions;
        expect(ASRC.assetVersions.length).toBeGreaterThan(0);
        expect(TestCase.assetVersions[0].idAssetVersion).toBeGreaterThan(0);
        expect(TestCase.assetVersions[0].idAsset).toEqual(TestCase.assets[0].idAsset);
        expect(TestCase.assetVersions[0].Ingested).toBeFalsy();
        if (ASRC.assets)
            expect(ASRC.assets.length).toEqual(ASRC.assetVersions.length);
    }

    return TestCase;
}

async function testReadAsset(TestCase: AssetStorageAdapterTestCase, expectSuccess: boolean): Promise<boolean> {
    for (let index = 0; index < TestCase.assets.length; index++) {
        const asset: DBAPI.Asset = TestCase.assets[index];
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.readAsset (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(asset, assetVersion);
        if (!testReadAssetResults(RSR, assetVersion, expectSuccess, 'readAsset'))
            return false;
    }
    return true;
}

async function testReadAssetResults(RSR: STORE.ReadStreamResult, assetVersion: DBAPI.AssetVersion, expectSuccess: boolean, errorContext: string): Promise<boolean> {
    if (!RSR.success && expectSuccess)
        LOG.logger.error(`AssetStorageAdaterTest AssetStorageAdapter.${errorContext}: ${RSR.error}`);
    expect(RSR.success).toEqual(expectSuccess);
    if (!RSR.success)
        return !expectSuccess;

    expect(RSR.readStream).toBeTruthy();
    expect(RSR.fileName).toEqual(assetVersion.FileName);
    expect(RSR.storageHash).toEqual(assetVersion.StorageHash);
    if (!RSR.readStream)
        return false;

    const hashResults: H.HashResults = await H.Helpers.computeHashFromStream(RSR.readStream, ST.OCFLDigestAlgorithm);
    expect(hashResults.success).toBeTruthy();
    expect(hashResults.hash).toEqual(RSR.storageHash);
    expect(hashResults.hash).toEqual(assetVersion.StorageHash);
    return true;
}

async function testReadAssetVersion(TestCase: AssetStorageAdapterTestCase, expectSuccess: boolean): Promise<boolean> {
    for (let index = 0; index < TestCase.assets.length; index++) {
        // const asset: DBAPI.Asset = TestCase.assets[index];
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.readAssetVersion (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(assetVersion);
        if (!testReadAssetResults(RSR, assetVersion, expectSuccess, 'readAssetVersion'))
            return false;
    }
    return true;
}

async function testReadAssetVersionByID(TestCase: AssetStorageAdapterTestCase, expectSuccess: boolean): Promise<boolean> {
    for (let index = 0; index < TestCase.assets.length; index++) {
        // const asset: DBAPI.Asset = TestCase.assets[index];
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.readAssetByID (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(assetVersion.idAssetVersion);
        if (!testReadAssetResults(RSR, assetVersion, expectSuccess, 'readAssetVersionByID'))
            return false;
    }
    return true;
}

async function testIngestAsset(TestCase: AssetStorageAdapterTestCase, expectSuccess: boolean): Promise<boolean> {
    expect(TestCase.SOBased).toBeTruthy();
    if (!TestCase.SOBased)
        return false;

    let assets: DBAPI.Asset[] = [];
    let assetVersions: DBAPI.AssetVersion[] = [];
    for (let index = 0; index < TestCase.assets.length; index++) {
        const asset: DBAPI.Asset = TestCase.assets[index];
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.ingestAsset (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const ISR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestAsset(asset, assetVersion, TestCase.SOBased, opInfo);

        if (!ISR.success && expectSuccess)
            LOG.logger.error(`AssetStorageAdaterTest AssetStorageAdapter.ingestAsset: ${ISR.error}`);
        expect(ISR.success).toEqual(expectSuccess);
        if (!ISR.success)
            return !expectSuccess;

        expect(ISR.assets).toBeTruthy();
        if (ISR.assets)
            assets = assets.concat(ISR.assets);

        // LOG.logger.info(`Ingest reports ${JSON.stringify(ISR.assetVersions)}`);
        expect(ISR.assetVersions).toBeTruthy();
        if (ISR.assetVersions)
            assetVersions = assetVersions.concat(ISR.assetVersions);
    }

    // LOG.logger.info(`Accumulated ${JSON.stringify(assetVersions)}`);
    for (const assetVersion of assetVersions) {
        expect(assetVersion.StorageKeyStaging).toEqual('');
        expect(assetVersion.Ingested).toBeTruthy();
    }

    TestCase.assets = assets;
    TestCase.assetVersions = assetVersions;
    return true;
}

async function testRenameAsset(TestCase: AssetStorageAdapterTestCase, expectSuccess: boolean): Promise<boolean> {
    expect(TestCase.SOBased).toBeTruthy();
    if (!TestCase.SOBased)
        return false;

    for (let index = 0; index < TestCase.assets.length; index++) {
        const asset: DBAPI.Asset = TestCase.assets[index];
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        const fileNameNew = H.Helpers.randomSlug();
        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.renameAsset (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.renameAsset(asset, fileNameNew, opInfo);

        if (!ASR.success && expectSuccess)
            LOG.logger.error(`AssetStorageAdaterTest AssetStorageAdapter.renameAsset: ${ASR.error}`);
        expect(ASR.success).toEqual(expectSuccess);
        if (!ASR.success)
            return !expectSuccess;

        expect(ASR.asset).toBeTruthy();
        expect(ASR.assetVersion).toBeTruthy();
        expect(asset.FileName).toEqual(fileNameNew);
        if (ASR.assetVersion) {
            expect(assetVersion.Version + 1).toEqual(ASR.assetVersion.Version);
            TestCase.assetVersions[index] = ASR.assetVersion;
        }
    }
    return true;
}

async function testHideAsset(TestCase: AssetStorageAdapterTestCase, expectSuccess: boolean): Promise<boolean> {
    expect(TestCase.SOBased).toBeTruthy();
    if (!TestCase.SOBased)
        return false;

    for (let index = 0; index < TestCase.assets.length; index++) {
        const asset: DBAPI.Asset = TestCase.assets[index];
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.hideAsset (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.hideAsset(asset, opInfo);

        if (!ASR.success && expectSuccess)
            LOG.logger.error(`AssetStorageAdaterTest AssetStorageAdapter.hideAsset: ${ASR.error}`);
        expect(ASR.success).toEqual(expectSuccess);
        if (!ASR.success)
            return !expectSuccess;

        expect(ASR.asset).toBeTruthy();
        expect(ASR.assetVersion).toBeTruthy();
        if (ASR.assetVersion) {
            expect(assetVersion.Version + 1).toEqual(ASR.assetVersion.Version);
            TestCase.assetVersions[index] = ASR.assetVersion;
        }

        const SO: DBAPI.SystemObject | null = await asset.fetchSystemObject();
        expect(SO).toBeTruthy();
        if (SO)
            expect(SO.Retired).toBeTruthy();
    }
    return true;
}

async function testReinstateAsset(TestCase: AssetStorageAdapterTestCase, version: number, expectSuccess: boolean): Promise<boolean> {
    expect(TestCase.SOBased).toBeTruthy();
    if (!TestCase.SOBased)
        return false;

    for (let index = 0; index < TestCase.assets.length; index++) {
        const asset: DBAPI.Asset = TestCase.assets[index];
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        let assetVersionFetch: DBAPI.AssetVersion | null = null;
        if (version == assetVersion.Version)
            assetVersionFetch = assetVersion;
        else if (version == -1)
            assetVersionFetch = null;
        else {
            const assetVersionArray: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchByAssetAndVersion(asset.idAsset, version);
            assetVersionFetch = (assetVersionArray != null && assetVersionArray.length > 0) ? assetVersionArray[0] : null;
            if (expectSuccess)
                expect(assetVersionFetch).toBeTruthy();
        }

        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.reinstateAsset version ${version} (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.reinstateAsset(asset, assetVersionFetch, opInfo);

        if (!ASR.success && expectSuccess)
            LOG.logger.error(`AssetStorageAdaterTest AssetStorageAdapter.reinstateAsset: ${ASR.error}`);
        expect(ASR.success).toEqual(expectSuccess);
        if (!ASR.success)
            return !expectSuccess;

        expect(ASR.asset).toBeTruthy();
        expect(ASR.assetVersion).toBeTruthy();
        if (ASR.assetVersion) {
            expect(assetVersion.Version + 1).toEqual(ASR.assetVersion.Version);
            TestCase.assetVersions[index] = ASR.assetVersion;
        }

        const SO: DBAPI.SystemObject | null = await asset.fetchSystemObject();
        expect(SO).toBeTruthy();
        if (SO)
            expect(SO.Retired).toBeFalsy();
    }
    return true;
}

async function testCommitNewAssetFailure(TestCase: AssetStorageAdapterTestCase): Promise<boolean> {
    const ASCNAI: STORE.AssetStorageCommitNewAssetInput = {
        storageKey: H.Helpers.randomSlug(),
        storageHash: H.Helpers.randomSlug(),
        FileName: TestCase.assets[0].FileName,
        FilePath: TestCase.assets[0].FilePath,
        idAssetGroup: TestCase.assets[0].idAssetGroup,
        idVAssetType: TestCase.assets[0].idVAssetType,
        idUserCreator: TestCase.assetVersions[0].idUserCreator,
        DateCreated: TestCase.assetVersions[0].DateCreated,
    };

    LOG.logger.info('AssetStorageAdaterTest AssetStorageAdapter.commitNewAsset Failure Expected');
    const ASRC: STORE.AssetStorageResultCommit = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
    expect(ASRC.success).toBeFalsy();
    return !ASRC.success;
}

async function testIngestAssetFailure(TestCase: AssetStorageAdapterTestCase): Promise<boolean> {
    expect(TestCase.SOBased).toBeTruthy();
    if (!TestCase.SOBased)
        return false;

    const storageKeyStagingOld: string = TestCase.assetVersions[0].StorageKeyStaging;
    TestCase.assetVersions[0].StorageKeyStaging = H.Helpers.randomSlug();
    LOG.logger.info('AssetStorageAdaterTest AssetStorageAdapter.ingestAsset (Expecting Failure)');
    const ISR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestAsset(TestCase.assets[0], TestCase.assetVersions[0], TestCase.SOBased, opInfo);
    TestCase.assetVersions[0].StorageKeyStaging = storageKeyStagingOld;

    expect(ISR.success).toBeFalsy();
    return !ISR.success;
}

async function testGetAssetVersionContents(TestCase: AssetStorageAdapterTestCase, expectedFiles: string[], expectedDirs: string[]): Promise<void> {
    let observedFiles: string[] = [];
    let observedDirs: string[] = [];
    for (let index = 0; index < TestCase.assetVersions.length; index++) {
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        const AVC: AssetVersionContent = await STORE.AssetStorageAdapter.getAssetVersionContents(assetVersion);
        expect(AVC.idAssetVersion).toEqual(assetVersion.idAssetVersion);
        observedFiles = observedFiles.concat(AVC.all);
        observedDirs = observedDirs.concat(AVC.folders);
    }

    if (observedFiles.length != expectedFiles.length)
        LOG.logger.info(`observedFiles = ${JSON.stringify(observedFiles)} vs expectedFiles = ${JSON.stringify(expectedFiles)}`);
    if (observedDirs.length != expectedDirs.length)
        LOG.logger.info(`observedDirs = ${JSON.stringify(observedDirs)} vs expectedDirs = ${JSON.stringify(expectedDirs)}`);
    expect(observedFiles.length).toEqual(expectedFiles.length);
    expect(observedDirs.length).toEqual(expectedDirs.length);

    expect(observedFiles).toEqual(expect.arrayContaining(expectedFiles));
    expect(expectedFiles).toEqual(expect.arrayContaining(observedFiles));
    expect(observedDirs).toEqual(expect.arrayContaining(expectedDirs));
    expect(expectedDirs).toEqual(expect.arrayContaining(observedDirs));
}

async function testDiscardAssetVersion(TestCase: AssetStorageAdapterTestCase, expectSuccess: boolean): Promise<boolean> {
    for (let index = 0; index < TestCase.assets.length; index++) {
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.discardAssetVersion (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.discardAssetVersion(assetVersion);

        if (!ASR.success && expectSuccess)
            LOG.logger.error(`AssetStorageAdaterTest AssetStorageAdapter.discardAssetVersion: ${ASR.error}`);
        expect(ASR.success).toEqual(expectSuccess);
        if (!ASR.success)
            return !expectSuccess;

        expect(ASR.assetVersion).toBeFalsy();
        const SO: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
        expect(SO).toBeTruthy();
        if (SO)
            expect(SO.Retired).toBeTruthy();
    }
    return true;
}

async function testExtractBulkIngestMetadata(TestCase: AssetStorageAdapterTestCase, expectSuccess: boolean): Promise<boolean> {
    for (let index = 0; index < TestCase.assets.length; index++) {
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.discardAssetVersion (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const ingestMetadata: IngestMetadata | null = await STORE.AssetStorageAdapter.extractBulkIngestMetadata(assetVersion);
        if (!ingestMetadata && expectSuccess)
            LOG.logger.error('AssetStorageAdaterTest AssetStorageAdapter.extracBulkIngestMetadata failed');
        if (expectSuccess)
            expect(ingestMetadata).toBeTruthy();
    }
    return true;
}

async function testCrackAsset(TestCase: AssetStorageAdapterTestCase, expectSuccess: boolean): Promise<boolean> {
    for (let index = 0; index < TestCase.assets.length; index++) {
        const assetVersion: DBAPI.AssetVersion = TestCase.assetVersions[index];

        // LOG.logger.info(`AssetStorageAdaterTest AssetStorageAdapter.discardAssetVersion (Expecting ${expectSuccess ? 'Success' : 'Failure'})`);
        const CAR: STORE.CrackAssetResult = await STORE.AssetStorageAdapter.crackAsset(assetVersion);
        if (!CAR.success && expectSuccess)
            LOG.logger.error(`AssetStorageAdaterTest AssetStorageAdapter.crackAsset failed: ${CAR.error}`);
        if (CAR.zip)
            await CAR.zip.close();
        expect(CAR.success).toEqual(expectSuccess);
    }
    return true;
}