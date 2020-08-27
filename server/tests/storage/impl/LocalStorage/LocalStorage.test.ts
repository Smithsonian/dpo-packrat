import * as path from 'path';
// import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import * as STR from 'stream';

import * as STORE from '../../../../storage/interface/IStorage';
import * as LS from '../../../../storage/impl/LocalStorage/LocalStorage';
// import * as OR from '../../../../storage/impl/LocalStorage/OCFLRoot';
// import * as OO from '../../../../storage/impl/LocalStorage/OCFLObject';
// import * as ST from '../../../../storage/impl/LocalStorage/SharedTypes';
// import * as DBAPI from '../../../../db';
import * as H from '../../../../utils/helpers';
import * as LOG from '../../../../utils/logger';
import { ObjectHierarchyTestSetup } from '../../../db/composite/ObjectHierarchy.setup';

const OHTS: ObjectHierarchyTestSetup = new ObjectHierarchyTestSetup();
// const ocflRoot: OR.OCFLRoot = new OR.OCFLRoot();
// let ocflObject: OO.OCFLObject | null = null;
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
        opInfo;
    });

    test('LocalStorage.initialize', async () => {
        let ioResults: H.IOResults = H.Helpers.createDirectory(ocflStorageRoot);
        expect(ioResults.success).toBeTruthy();

        ioResults = await ls.initialize(ocflStorageRoot);
        expect(ioResults.success).toBeTruthy();
    });
});

let LSTC: LocalStorageTestCase;
describe('LocalStorage Initial Staging & Promotion', () => {
    test('LocalStorage.writeStream', async() => {
        LSTC = await testWriteStream(10000);
    });

    test('LocalStorage.commitWriteStream', async() => {
        await testCommitWriteStream(LSTC);
    });

    test('LocalStorage.readStream Staging', async() => {
        await testReadStream(LSTC);
    });

    test('LocalStorage.computeStorageKey', async() => {
        LSTC.storageKeyRepo = await testComputeStorageKey(LSTC.uniqueID.toString());
    });

    test('LocalStorage.promoteStagedAsset', async() => {
        await testPromoteStagedAsset(LSTC);
    });

    test('LocalStorage.readStream Production', async() => {
        await testReadStream(LSTC);
    });
});

let LSTC2: LocalStorageTestCase;
describe('LocalStorage Add Version', () => {
    test('LocalStorage.writeStream', async() => {
        LSTC2 = await testWriteStream(12000);
        LSTC2.fileName = LSTC.fileName;
    });

    test('LocalStorage.commitWriteStream', async() => {
        await testCommitWriteStream(LSTC2);
    });

    test('LocalStorage.readStream Staging', async() => {
        await testReadStream(LSTC2);
    });

    test('LocalStorage.promoteStagedAsset', async() => {
        LSTC2.storageKeyRepo = LSTC.storageKeyRepo;
        if (await testPromoteStagedAsset(LSTC2))
            LSTC2.version++;
    });

    test('LocalStorage.readStream Production', async() => {
        await testReadStream(LSTC2);
    });
});

/*
    async writeStream(): Promise<STORE.WriteStreamResult> {
    async commitWriteStream(writeStreamCloseInput: STORE.CommitWriteStreamInput): Promise<STORE.CommitWriteStreamResult> {
    async readStream(readStreamInput: STORE.ReadStreamInput): Promise<STORE.ReadStreamResult> {
    async promoteStagedAsset(promoteStagedAssetInput: STORE.PromoteStagedAssetInput): Promise<STORE.PromoteStagedAssetResult> {
    async computeStorageKey(uniqueID: string): Promise<STORE.ComputeStorageKeyResult> {

    async readStream(readStreamInput: STORE.ReadStreamInput): Promise<STORE.ReadStreamResult> {

    async renameAsset(renameAssetInput: STORE.RenameAssetInput): Promise<STORE.RenameAssetResult> {
    async hideAsset(hideAssetInput: STORE.HideAssetInput): Promise<STORE.HideAssetResult> {
    async reinstateAsset(reinstateAssetInput: STORE.ReinstateAssetInput): Promise<STORE.ReinstateAssetResult> {
    async updateMetadata(updateMetadataInput: STORE.UpdateMetadataInput): Promise<STORE.UpdateMetadataResult> {
    async validateAsset(storageKey: string): Promise<STORE.ValidateAssetResult> {
*/

async function createRandomFile(stream: STR.Writable, fileSize: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        try {
            const hash = crypto.createHash('sha512');

            let bytesRemaining: number = fileSize;

            do {
                const chunkSize: number = bytesRemaining > 1024 ? 1024 : bytesRemaining;
                const buffer = crypto.randomBytes(chunkSize);

                bytesRemaining -= chunkSize;
                stream.write(buffer);
                hash.write(buffer);
            } while (bytesRemaining > 0);

            stream.end();
            stream.on('finish', () => { resolve(hash.digest('hex')); });
            stream.on('error', reject);
        } catch (error) {
            LOG.logger.error('LocalStorage.test.ts createRandomFile() error', error);
            reject(error);
        }
    });
}

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
    LSTC.storageHash = await createRandomFile(WSR.writeStream, fileSize);
    expect(LSTC.storageHash).toBeTruthy();
    return LSTC;
}

async function testCommitWriteStream(LSTC: LocalStorageTestCase): Promise<boolean> {
    const CWSI: STORE.CommitWriteStreamInput = {
        storageKey: LSTC.storageKeyStaging,
        storageHash: LSTC.storageHash
    };

    LOG.logger.info(`LocalStorage.commitWriteStream: ${JSON.stringify(CWSI)}`);
    const CWSR: STORE.CommitWriteStreamResult = await ls.commitWriteStream(CWSI);
    expect(CWSR.success).toBeTruthy();
    expect(CWSR.storageHash).toBeTruthy();
    expect(CWSR.storageHash).toEqual(LSTC.storageHash);
    expect(CWSR.storageSize).toEqual(LSTC.fileSize);
    return CWSR.success;
}

async function testReadStream(LSTC: LocalStorageTestCase): Promise<boolean> {
    const RSI: STORE.ReadStreamInput = {
        storageKey: LSTC.staging ? LSTC.storageKeyStaging : LSTC.storageKeyRepo,
        fileName: LSTC.fileName,
        version: LSTC.version,
        staging: LSTC.staging
    };

    LOG.logger.info(`LocalStorage.readStream: ${JSON.stringify(RSI)}`);
    const RSR: STORE.ReadStreamResult = await ls.readStream(RSI);
    expect(RSR.success).toBeTruthy();
    expect(RSR.storageHash).toEqual(LSTC.storageHash);
    expect(RSR.readStream).toBeTruthy();
    if (RSR.readStream)
        expect(await readStreamAndComputeHash(RSR.readStream)).toEqual(LSTC.storageHash);
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

async function testPromoteStagedAsset(LSTC: LocalStorageTestCase): Promise<boolean> {
    const PSAI: STORE.PromoteStagedAssetInput = {
        storageKeyStaged: LSTC.storageKeyStaging,
        storageKeyFinal: LSTC.storageKeyRepo,
        fileName: LSTC.fileName,
        metadata: OHTS,
        opInfo
    };

    LOG.logger.info(`LocalStorage.promoteStagedAsset: ${PSAI.storageKeyStaged} -> ${PSAI.storageKeyFinal}`);
    const PSAR: STORE.PromoteStagedAssetResult = await ls.promoteStagedAsset(PSAI);
    expect(PSAR.success);
    if (PSAR.success) {
        LSTC.staging = false;
        LSTC.version = 1;
    }
    return PSAR.success;
}