import * as path from 'path';
import * as crypto from 'crypto';
import * as STR from 'stream';

import * as STORE from '../../../../storage/interface/IStorage';
import * as LS from '../../../../storage/impl/LocalStorage/LocalStorage';
import * as DBAPI from '../../../../db';
import * as H from '../../../../utils/helpers';
import * as LOG from '../../../../utils/logger';
import { ObjectHierarchyTestSetup } from '../../../db/composite/ObjectHierarchy.setup';

type LocalStorageTestCase = {
    storageKeyStaging: string;
    storageKeyRepo: string;
    storageHash: string;
    fileSize: number;
    fileName: string;
    version: number;
    staging: boolean;
    uniqueID: number;
};

let LSTC: LocalStorageTestCase;
let LSTC2: LocalStorageTestCase;
let LSTC3: LocalStorageTestCase;

const OHTS: ObjectHierarchyTestSetup = new ObjectHierarchyTestSetup();
let ocflStorageRoot: string;
let ls: LS.LocalStorage;
let opInfo: STORE.OperationInfo;
let nextID: number = 1;

beforeAll(() => {
    ls = new LS.LocalStorage();
    ocflStorageRoot = path.join('var', 'test', H.Helpers.randomSlug());
    LOG.logger.info(`Creating test storage root in ${path.resolve(ocflStorageRoot)}`);
});

afterAll(async done => {
    LOG.logger.info(`Removing test storage root from ${path.resolve(ocflStorageRoot)}`);
    H.Helpers.removeDirectory(ocflStorageRoot, true);
    jest.setTimeout(3000);
    await H.Helpers.sleep(2000);
    done();
});

describe('LocalStorage Init', () => {
    test('Object Hierarchy Test Setup', async() => {
        await OHTS.initialize();
        await OHTS.wire();
        opInfo = {
            message: '1',
            idUser: OHTS.user1 ? OHTS.user1.idUser : 0,
            userEmailAddress: OHTS.user1 ? OHTS.user1.EmailAddress : '',
            userName: OHTS.user1 ? OHTS.user1.Name : ''
        };
    });

    test('LocalStorage.initialize', async () => {
        let ioResults: H.IOResults = H.Helpers.createDirectory(ocflStorageRoot);
        expect(ioResults.success).toBeTruthy();

        ioResults = await ls.initialize(ocflStorageRoot);
        expect(ioResults.success).toBeTruthy();
    });
});

describe('LocalStorage Initial Staging & Promotion', () => {
    test('LocalStorage.writeStream', async() => {
        LSTC = await testWriteStream(10000);
    });
    test('LocalStorage.commitWriteStream', async() => {
        await testCommitWriteStream(LSTC, true);
    });
    test('LocalStorage.readStream Staging', async() => {
        await testReadStream(LSTC, true);
    });
    test('LocalStorage.computeStorageKey', async() => {
        LSTC.storageKeyRepo = await testComputeStorageKey(LSTC.uniqueID.toString());
    });
    test('LocalStorage.promoteStagedAsset', async() => {
        await testPromoteStagedAsset(LSTC, OHTS.captureData1, true);
    });
    test('LocalStorage.readStream Production', async() => {
        await testReadStream(LSTC, true);
    });
    test('LocalStorage.validateAsset', async() => {
        await testValidateAsset(LSTC, true);
    });
});

describe('LocalStorage Add Version', () => {
    test('LocalStorage.writeStream', async() => {
        LSTC2 = await testWriteStream(12000);
        LSTC2.fileName = LSTC.fileName;
    });
    test('LocalStorage.commitWriteStream', async() => {
        await testCommitWriteStream(LSTC2, true);
    });
    test('LocalStorage.readStream Staging', async() => {
        await testReadStream(LSTC2, true);
    });
    test('LocalStorage.promoteStagedAsset', async() => {
        LSTC2.storageKeyRepo = LSTC.storageKeyRepo;
        if (await testPromoteStagedAsset(LSTC2, OHTS.model1, true))
            LSTC2.version++;
    });
    test('LocalStorage.readStream Production', async() => {
        await testReadStream(LSTC2, true);
    });
    test('LocalStorage.validateAsset', async() => {
        await testValidateAsset(LSTC2, true);
    });
});

describe('LocalStorage Modify Version', () => {
    test('LocalStorage.renameAsset', async() => {
        await testRenameAsset(LSTC2, true);
        await testReadStream(LSTC2, true);
    });
    test('LocalStorage.hideAsset', async() => {
        await testHideAsset(LSTC2, true);
    });
    test('LocalStorage.reinstateAsset', async() => {
        await testReinstateAsset(LSTC2, true);
        await testReadStream(LSTC2, true);
    });
    test('LocalStorage.updateMetadata', async() => {
        await testUpdateMetadata(LSTC2, OHTS.model2);
    });
    test('LocalStorage.validateAsset', async() => {
        await testValidateAsset(LSTC2, true);
    });
});

describe('LocalStorage Error Conditions', () => {
    test('LocalStorage.readStream invalid storage key', async() => {
        const originalStorageKeyRepo: string = LSTC2.storageKeyRepo;
        LSTC2.storageKeyRepo = H.Helpers.randomSlug();
        await testReadStream(LSTC2, false);
        LSTC2.storageKeyRepo = originalStorageKeyRepo;
    });

    test('LocalStorage.readStream invalid version', async() => {
        const originalVersion: number = LSTC2.version;
        LSTC2.version = originalVersion + 10;
        await testReadStream(LSTC2, false);
        LSTC2.version = originalVersion;
    });

    test('LocalStorage.readStream invalid staging storage key', async() => {
        LSTC2.staging = true;
        await testReadStream(LSTC2, false);
        LSTC2.staging = false;
    });

    test('LocalStorage.commitWriteStream invalid storage key and hash', async() => {
        LSTC3 = await testWriteStream(15000);
        const originalStorageKeyStaging: string = LSTC3.storageKeyStaging;
        LSTC3.storageKeyStaging = H.Helpers.randomSlug();
        await testCommitWriteStream(LSTC3, false);
        LSTC3.storageKeyStaging = originalStorageKeyStaging;

        const originalStorageHash: string = LSTC3.storageHash;
        LSTC3.storageHash = H.Helpers.randomSlug();
        await testCommitWriteStream(LSTC3, false);
        LSTC3.storageHash = originalStorageHash;
    });

    test('LocalStorage.promoteStagedAsset invalid source file', async() => {
        LSTC3.storageKeyRepo = LSTC.storageKeyRepo;
        const originalStorageKeyStaging: string = LSTC3.storageKeyStaging;
        LSTC3.storageKeyStaging = H.Helpers.randomSlug();
        await testPromoteStagedAsset(LSTC3, OHTS.model1, false);
        LSTC3.storageKeyStaging = originalStorageKeyStaging;
    });

    test('LocalStorage.renameAsset invalid storage key', async() => {
        const originalStorageKeyRepo: string = LSTC3.storageKeyRepo;
        LSTC3.storageKeyRepo = H.Helpers.randomSlug();
        await testRenameAsset(LSTC3, false);
        LSTC3.storageKeyRepo = originalStorageKeyRepo;
    });

    test('LocalStorage.hideAsset invalid storage key', async() => {
        const originalStorageKeyRepo: string = LSTC3.storageKeyRepo;
        LSTC3.storageKeyRepo = H.Helpers.randomSlug();
        await testHideAsset(LSTC3, false);
        LSTC3.storageKeyRepo = originalStorageKeyRepo;
    });

    test('LocalStorage.reinstateAsset invalid storage key', async() => {
        const originalStorageKeyRepo: string = LSTC3.storageKeyRepo;
        LSTC3.storageKeyRepo = H.Helpers.randomSlug();
        await testReinstateAsset(LSTC3, false);
        LSTC3.storageKeyRepo = originalStorageKeyRepo;
    });

    test('LocalStorage.validateAsset invalid storage key', async() => {
        const originalStorageKeyRepo: string = LSTC3.storageKeyRepo;
        LSTC3.storageKeyRepo = H.Helpers.randomSlug();
        await testValidateAsset(LSTC3, false);
        LSTC3.storageKeyRepo = originalStorageKeyRepo;
    });
});

async function readStreamAndComputeHash(stream: STR.Readable): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        try {
            const hash = crypto.createHash('sha512');
            stream.on('data', chunk => hash.write(chunk));
            stream.on('end', () => { resolve(hash.digest('hex')); });
            stream.on('error', error => reject(error));
        } catch (error) {
            LOG.logger.error('LocalStorage.test.ts readStreamAndComputeHash() error', error);
            reject(error);
        }
    });
}

async function constructMetadata(SOBased: DBAPI.SystemObjectBased | null): Promise<DBAPI.ObjectAncestry | null> {
    return SOBased ? await ObjectHierarchyTestSetup.testObjectAncestryFetch(SOBased) : null;
}

async function testWriteStream(fileSize: number): Promise<LocalStorageTestCase> {
    const LSTC: LocalStorageTestCase = {
        storageKeyStaging: '',
        storageKeyRepo: '',
        storageHash: '',
        fileSize,
        fileName: H.Helpers.randomSlug(),
        version: -1,
        staging: true,
        uniqueID: nextID++
    };

    LOG.logger.info('LocalStorage.writeStream');
    const WSR: STORE.WriteStreamResult = await ls.writeStream();
    expect(WSR.success).toBeTruthy();
    expect(WSR.writeStream).toBeTruthy();
    expect(WSR.storageKey).toBeTruthy();
    if (!WSR.writeStream)
        return LSTC;
    if (!WSR.storageKey)
        return LSTC;

    LSTC.storageKeyStaging = WSR.storageKey;
    LSTC.storageHash = await H.Helpers.createRandomFile(WSR.writeStream, fileSize);
    expect(LSTC.storageHash).toBeTruthy();
    return LSTC;
}

async function testCommitWriteStream(LSTC: LocalStorageTestCase, expectSuccess: boolean): Promise<boolean> {
    const CWSI: STORE.CommitWriteStreamInput = {
        storageKey: LSTC.storageKeyStaging,
        storageHash: LSTC.storageHash
    };

    LOG.logger.info(`LocalStorage.commitWriteStream: ${JSON.stringify(CWSI)} (Expect ${expectSuccess ? 'Success' : 'Failure'})`);
    const CWSR: STORE.CommitWriteStreamResult = await ls.commitWriteStream(CWSI);
    expect(CWSR.success).toEqual(expectSuccess);
    if (expectSuccess) {
        expect(CWSR.storageHash).toBeTruthy();
        expect(CWSR.storageHash).toEqual(LSTC.storageHash);
        expect(CWSR.storageSize).toEqual(LSTC.fileSize);
    }
    return CWSR.success;
}

async function testReadStream(LSTC: LocalStorageTestCase, expectSuccess: boolean): Promise<boolean> {
    const RSI: STORE.ReadStreamInput = {
        storageKey: LSTC.staging ? LSTC.storageKeyStaging : LSTC.storageKeyRepo,
        fileName: LSTC.fileName,
        version: LSTC.version,
        staging: LSTC.staging
    };

    LOG.logger.info(`LocalStorage.readStream: ${JSON.stringify(RSI)} (Expect ${expectSuccess ? 'Success' : 'Failure'})`);
    const RSR: STORE.ReadStreamResult = await ls.readStream(RSI);
    expect(RSR.success).toEqual(expectSuccess);
    if (expectSuccess) {
        expect(RSR.storageHash).toEqual(LSTC.storageHash);
        expect(RSR.readStream).toBeTruthy();
        if (RSR.readStream)
            expect(await readStreamAndComputeHash(RSR.readStream)).toEqual(LSTC.storageHash);
    }
    return RSR.success;
}

async function testComputeStorageKey(uniqueID: string): Promise<string> {
    LOG.logger.info(`LocalStorage.computeStorageKey: ${uniqueID}`);
    const res = await ls.computeStorageKey(uniqueID);
    expect(res.success).toBeTruthy();
    expect(res.storageKey).toBeTruthy();
    LOG.logger.info(`LocalStorage.computeStorageKey: ${res.storageKey}`);
    return res.storageKey;
}

async function testPromoteStagedAsset(LSTC: LocalStorageTestCase, SOBased: DBAPI.SystemObjectBased | null, expectSuccess: boolean): Promise<boolean> {
    const PSAI: STORE.PromoteStagedAssetInput = {
        storageKeyStaged: LSTC.storageKeyStaging,
        storageKeyFinal: LSTC.storageKeyRepo,
        fileName: LSTC.fileName,
        metadata: await constructMetadata(SOBased),
        opInfo
    };

    LOG.logger.info(`LocalStorage.promoteStagedAsset: ${PSAI.storageKeyStaged} -> ${PSAI.storageKeyFinal} (Expect ${expectSuccess ? 'Success' : 'Failure'})`);
    const PSAR: STORE.PromoteStagedAssetResult = await ls.promoteStagedAsset(PSAI);
    expect(PSAR.success).toEqual(expectSuccess);
    if (PSAR.success) {
        LSTC.staging = false;
        LSTC.version = 1;
    }
    return PSAR.success;
}

async function testRenameAsset(LSTC: LocalStorageTestCase, expectSuccess: boolean): Promise<boolean> {
    const RAI: STORE.RenameAssetInput = {
        storageKey: LSTC.storageKeyRepo,
        fileNameOld: LSTC.fileName,
        fileNameNew: H.Helpers.randomSlug(),
        opInfo
    };

    LOG.logger.info(`LocalStorage.renameAsset: ${RAI.storageKey} ${RAI.fileNameOld} -> ${RAI.fileNameNew} (Expect ${expectSuccess ? 'Success' : 'Failure'})`);
    const RAR: STORE.RenameAssetResult = await ls.renameAsset(RAI);
    expect(RAR.success).toEqual(expectSuccess);
    if (RAR.success) {
        LSTC.fileName = RAI.fileNameNew;
        LSTC.version++;
    }
    return RAR.success;
}

async function testHideAsset(LSTC: LocalStorageTestCase, expectSuccess: boolean): Promise<boolean> {
    const HAI: STORE.HideAssetInput = {
        storageKey: LSTC.storageKeyRepo,
        fileName: LSTC.fileName,
        opInfo
    };

    LOG.logger.info(`LocalStorage.hideAsset: ${HAI.storageKey} ${HAI.fileName} (Expect ${expectSuccess ? 'Success' : 'Failure'})`);
    const HAR: STORE.HideAssetResult = await ls.hideAsset(HAI);
    expect(HAR.success).toEqual(expectSuccess);
    if (HAR.success)
        LSTC.version++;
    return HAR.success;
}

async function testReinstateAsset(LSTC: LocalStorageTestCase, expectSuccess: boolean): Promise<boolean> {
    const RAI: STORE.ReinstateAssetInput = {
        storageKey: LSTC.storageKeyRepo,
        fileName: LSTC.fileName,
        version: -1,
        opInfo
    };

    LOG.logger.info(`LocalStorage.reinstateAsset: ${RAI.storageKey} ${RAI.fileName} (Expect ${expectSuccess ? 'Success' : 'Failure'})`);
    const RAR: STORE.ReinstateAssetResult = await ls.reinstateAsset(RAI);
    expect(RAR.success).toEqual(expectSuccess);
    if (RAR.success)
        LSTC.version++;
    return RAR.success;
}

async function testUpdateMetadata(LSTC: LocalStorageTestCase, SOBased: DBAPI.SystemObjectBased | null): Promise<boolean> {
    const UMI: STORE.UpdateMetadataInput = {
        storageKey: LSTC.storageKeyRepo,
        metadata: await constructMetadata(SOBased),
        opInfo
    };

    LOG.logger.info(`LocalStorage.updateMetadata: ${UMI.storageKey}`);
    const UMR: STORE.UpdateMetadataResult = await ls.updateMetadata(UMI);
    expect(UMR.success).toBeTruthy();
    if (UMR.success)
        LSTC.version++;
    return UMR.success;
}

async function testValidateAsset(LSTC: LocalStorageTestCase, expectSuccess: boolean): Promise<boolean> {
    const VAR: STORE.ValidateAssetResult = await ls.validateAsset(LSTC.storageKeyRepo);
    expect(VAR.success).toEqual(expectSuccess);
    return VAR.success;
}