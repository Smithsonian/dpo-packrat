import * as path from 'path';
import * as STORE from '../../../storage/interface/';
// import * as ST from '../../../storage/impl/LocalStorage/SharedTypes';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as H from '../../../utils/helpers';
import { BagitReader } from '../../../utils/parser/bagitReader';
import * as LOG from '../../../utils/logger';
import { BulkIngestReader, IngestMetadata } from '../../../utils/parser';
import { Config } from '../../../config';
import { ObjectGraphTestSetup } from '../../db/composite/ObjectGraph.setup';
import { createItemAndIDsForBagitTesting } from '../../db/api/Item.util';

const mockPathBagit1: string = path.join(__dirname, '../../mock/utils/bagit/PackratTestValidMultiHash.zip');
const mockPathBagit2: string = path.join(__dirname, '../../mock/utils/zip/PackratTest.zip');
const mockPathBagitScene: string = path.join(__dirname, '../../mock/utils/bagit/PackratTestBulkIngest.Scene.zip');
const mockPathBagitInvalidModel: string = path.join(__dirname, '../../mock/utils/bagit/PackratTestBagitInvalidModel.zip');
const mockPathBagitInvalidPhoto: string = path.join(__dirname, '../../mock/utils/bagit/PackratTestBagitInvalidPhoto.zip');
const mockPathBagitInvalidScene: string = path.join(__dirname, '../../mock/utils/bagit/PackratTestBagitInvalidScene.zip');
const mockPathBagitInvalidNoMeta: string = path.join(__dirname, '../../mock/utils/bagit/PackratTestBagitNoMetadata.zip');

type BulkIngestReaderTestCase = {
    assets: DBAPI.Asset[],
    assetVersions: DBAPI.AssetVersion[],
    SOBased: DBAPI.SystemObjectBased | null
};

const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();
let vAssetTypeBulk: DBAPI.Vocabulary;
let vAssetTypeOther: DBAPI.Vocabulary;
let opInfo: STORE.OperationInfo;
let rootRepositoryOrig: string;
let rootRepositoryNew: string;
let rootStagingOrig: string;
let rootStagingNew: string;

beforeAll(() => {
    rootRepositoryOrig = Config.storage.rootRepository;
    rootStagingOrig = Config.storage.rootStaging;

    rootRepositoryNew = path.join('var', 'test', H.Helpers.randomSlug());
    rootStagingNew = path.join('var', 'test', H.Helpers.randomSlug());
    // LOG.info(`Test Repo ${rootRepositoryNew}; staging ${rootStagingNew}`, LOG.LS.eTEST);

    Config.storage.rootRepository = rootRepositoryNew;
    Config.storage.rootStaging = rootStagingNew;
});

afterAll(async done => {
    Config.storage.rootRepository = rootRepositoryOrig;
    Config.storage.rootStaging = rootStagingOrig;
    await H.Helpers.removeDirectory(rootRepositoryNew, true);
    await H.Helpers.removeDirectory(rootStagingNew, true);
    // await H.Helpers.sleep(2000);
    done();
});

describe('BulkIngestReader Setup', () => {
    test('BulkIngestReader Setup', async() => {
        await OHTS.initialize();
        await OHTS.wire();
        opInfo = {
            message: '1',
            idUser: OHTS.user1 ? OHTS.user1.idUser : 0,
            userEmailAddress: OHTS.user1 ? OHTS.user1.EmailAddress : '',
            userName: OHTS.user1 ? OHTS.user1.Name : ''
        };

        let vAssetTypeLookup: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeBulkIngestion);
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

describe('BulkIngestReader Methods', () => {
    test('BulkIngestReader.loadFromZip', async() => {
        await testLoad(mockPathBagit1, null, true, true);
        await testLoad(mockPathBagit1, null, false, true, OHTS.subject1);
        await testLoad(mockPathBagit2, null, true, true);
        await testLoad(mockPathBagit2, null, false, true, OHTS.subject2);
        await testLoad(mockPathBagitScene, null, true, true);
        await testLoad(mockPathBagitScene, null, false, true, OHTS.subject3);
    });

    test('BulkIngestReader.loadFromAssetVersion', async() => {
        const tcBagit1: BulkIngestReaderTestCase = await testCommitNewAsset(null, 0, OHTS.captureData1, mockPathBagit1, vAssetTypeBulk);
        expect(tcBagit1.assetVersions.length).toBeGreaterThan(0);
        if (tcBagit1.assetVersions.length > 0) {
            await testLoad(null, tcBagit1.assetVersions[0], true, true);
            await testLoad(null, tcBagit1.assetVersions[0], false, true, OHTS.subject3);
        }

        const tcBagit2: BulkIngestReaderTestCase = await testCommitNewAsset(null, 0, OHTS.captureData1, mockPathBagit2, vAssetTypeBulk);
        expect(tcBagit2.assetVersions.length).toBeGreaterThan(0);
        if (tcBagit2.assetVersions.length > 0) {
            await testLoad(null, tcBagit2.assetVersions[0], true, true);
            await testLoad(null, tcBagit2.assetVersions[0], false, true, OHTS.subject4);
        }

        const tcBagitScene: BulkIngestReaderTestCase = await testCommitNewAsset(null, 0, OHTS.scene1, mockPathBagitScene, vAssetTypeBulk);
        expect(tcBagitScene.assetVersions.length).toBeGreaterThan(0);
        if (tcBagitScene.assetVersions.length > 0) {
            await testLoad(null, tcBagitScene.assetVersions[0], true, true);
            await testLoad(null, tcBagitScene.assetVersions[0], false, true, OHTS.subject4);
        }
    });

    test('BulkIngestReader Expected Failures', async() => {
        const BIR: BulkIngestReader = new BulkIngestReader();
        expect((await BIR.loadFromAssetVersion(0, true)).success).toBeFalsy(); // idAssetVersion of 0 doesn't exist
        expect((await BIR.loadFromAssetVersion(1, true)).success).toBeFalsy(); // idAssetVersion of 1 isn't a zip ... we hope!

        const tcOther: BulkIngestReaderTestCase = await testCommitNewAsset(null, 0, OHTS.captureData1, mockPathBagit2, vAssetTypeOther);
        expect(tcOther.assetVersions.length).toBeGreaterThan(0);
        expect((await BIR.loadFromAssetVersion(tcOther.assetVersions[0].idAssetVersion, true)).success).toBeFalsy(); // idAssetVersion of 0 doesn't exist

        await testLoad(mockPathBagitInvalidModel, null, true, false);
        await testLoad(mockPathBagitInvalidPhoto, null, true, false);
        await testLoad(mockPathBagitInvalidScene, null, true, false);
        await testLoad(mockPathBagitInvalidNoMeta, null, true, false);
    });
});

async function testLoad(fileName: string | null, assetVersion: DBAPI.AssetVersion | null, autoClose: boolean,
    expectSuccess: boolean, subject: DBAPI.Subject | null = null): Promise<boolean> {
    const BIR: BulkIngestReader = new BulkIngestReader();
    let ioResults: H.IOResults = { success: false, error: 'Invalid test case ' };
    if (fileName) {
        const zip = new BagitReader({ zipFileName: fileName, zipStream: null, directory: null, validate: true, validateContent: false });
        ioResults = await zip.load();
        if (ioResults.success)
            ioResults = await BIR.loadFromZip(zip, autoClose);
    } else if (assetVersion)
        ioResults = await BIR.loadFromAssetVersion(assetVersion.idAssetVersion, autoClose);

    if (!ioResults.success && expectSuccess)
        LOG.error(ioResults.error, LOG.LS.eTEST);
    expect(ioResults.success).toEqual(expectSuccess);
    if (!ioResults.success)
        return !expectSuccess;

    const ingestedMetadata: IngestMetadata[] = BIR.ingestedObjects;
    // LOG.info(`ingestedMetadata: ${JSON.stringify(ingestedMetadata)}`, LOG.LS.eTEST);
    expect(ingestedMetadata.length).toBeGreaterThan(0);

    // Doctor ingestedMetadata when requested
    if (subject)
        ingestedMetadata[0].idSubject = subject.idSubject;
    const projectsExpected: boolean = (ingestedMetadata[0].idSubject != 0);

    const projects: DBAPI.Project[] | null = await BulkIngestReader.computeProjects(ingestedMetadata[0]);
    // LOG.info(`projects: ${JSON.stringify(projects)}`, LOG.LS.eTEST);
    if (projectsExpected) {
        expect(projects).toBeTruthy();
        if (projects)
            expect(projects.length).toBeGreaterThan(0);
    }

    if (!autoClose) {
        ioResults = await BIR.close();
        expect(ioResults.success).toBeTruthy();
    }
    return true;
}

async function testCommitNewAsset(TestCase: BulkIngestReaderTestCase | null, fileSize: number, SOBased: DBAPI.SystemObjectBased | null,
    fileName: string | null = null, vocabulary: DBAPI.Vocabulary | null = null): Promise<BulkIngestReaderTestCase> {
    if (!vocabulary)
        vocabulary = vAssetTypeBulk;
    const BulkIngest: boolean = (vocabulary == vAssetTypeBulk);

    let newAsset: boolean;
    if (!TestCase) {
        const fileNameAsset: string = (fileName) ? path.basename(fileName) : H.Helpers.randomSlug();
        TestCase = { assets: [], assetVersions: [], SOBased };

        TestCase.assets.push(new DBAPI.Asset({ idAsset: 0, FileName: fileNameAsset, FilePath: H.Helpers.randomSlug(), idAssetGroup: null, idVAssetType: vocabulary.idVocabulary, idSystemObject: null, StorageKey: '' }));
        TestCase.assetVersions.push(new DBAPI.AssetVersion({ idAssetVersion: 0, idAsset: 0, FileName: fileNameAsset, idUserCreator: opInfo.idUser, DateCreated: new Date(), StorageHash: '', StorageSize: BigInt(0), StorageKeyStaging: '', Ingested: false, BulkIngest, idSOAttachment: null, Version: 0 }));
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
    // LOG.info('AssetStorageAdaterTest IStorage.writeStream', LOG.LS.eTEST);
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

    let ASRC: STORE.AssetStorageResultCommit;
    if (newAsset) {
        // LOG.info(`AssetStorageAdaterTest AssetStorageAdapter.commitNewAsset ${TestCase.asset.FileName}`, LOG.LS.eTEST);
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
        ASRC = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
    } else {
        // LOG.info(`AssetStorageAdaterTest AssetStorageAdapter.commitNewAssetVersion ${TestCase.asset.FileName}`, LOG.LS.eTEST);
        const ASCNAVI: STORE.AssetStorageCommitNewAssetVersionInput = {
            storageKey: TestCase.assetVersions[0].StorageKeyStaging,
            storageHash,
            asset: TestCase.assets[0],
            assetNameOverride: TestCase.assets[0].FileName,
            idUserCreator: TestCase.assetVersions[0].idUserCreator,
            DateCreated: TestCase.assetVersions[0].DateCreated
        };
        ASRC = await STORE.AssetStorageAdapter.commitNewAssetVersion(ASCNAVI);
    }
    expect(ASRC.success).toBeTruthy();
    if (!ASRC.success) {
        LOG.error(`AssetStorageAdaterTest AssetStorageAdapter.commitNewAsset: ${ASRC.error}`, LOG.LS.eTEST);
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

