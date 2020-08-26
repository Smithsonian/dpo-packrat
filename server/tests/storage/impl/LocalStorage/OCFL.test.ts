import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import * as STR from 'stream';

import * as OR from '../../../../storage/impl/LocalStorage/OCFLRoot';
import * as OO from '../../../../storage/impl/LocalStorage/OCFLObject';
import * as ST from '../../../../storage/impl/LocalStorage/SharedTypes';
import * as DBAPI from '../../../../db';
import * as H from '../../../../utils/helpers';
import * as LOG from '../../../../utils/logger';
import { OperationInfo } from '../../../../storage/interface/IStorage';
import { ObjectHierarchyTestSetup } from '../../../db/composite/ObjectHierarchy.setup';


const OHTS: ObjectHierarchyTestSetup = new ObjectHierarchyTestSetup();
const ocflRoot: OR.OCFLRoot = new OR.OCFLRoot();
let ocflObject: OO.OCFLObject | null = null;
let ocflStorageRoot: string;
let opInfo: OperationInfo;

beforeAll(() => {
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

// *******************************************************************
// OCFL OCFLRoot
// *******************************************************************
describe('OCFL Setup', () => {
    test('OCFL OCFLRoot Setup', async () => {
        let ioResults: H.IOResults = H.Helpers.createDirectory(ocflStorageRoot);
        expect(ioResults.success).toBeTruthy();

        ioResults = await ocflRoot.initialize(ocflStorageRoot);
        expect(ioResults.success).toBeTruthy();

        // Validate root
        ioResults = await ocflRoot.validate();
        expect(ioResults.success).toBeTruthy();
    });

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
});

describe('OCFL OCFLRoot', () => {
    test('OCFL OCFLRoot.computeWriteStreamLocation', async () => {
        const directoryName: string = createUploadLocation(ocflRoot);
        const ioResults: H.IOResults = H.Helpers.removeDirectory(directoryName);
        expect(ioResults.success).toBeTruthy();
    });

    test('OCFL OCFLRoot.computeLocationRepoRoot', async () => {
        const location: string = ocflRoot.computeLocationRepoRoot();
        expect(location).toEqual(path.join(ocflStorageRoot, ST.OCFLStorageRootFolderRepository));
    });

    test('OCFL OCFLRoot.computeLocationRoot', async () => {
        const location: string = ocflRoot.computeLocationStagingRoot();
        expect(location).toEqual(path.join(ocflStorageRoot, ST.OCFLStorageRootFolderStaging));
    });

    test('OCFL OCFLRoot.computeLocationRepoRoot', async () => {
        let location: string = ocflRoot.computeLocationRoot(false);
        expect(location).toEqual(path.join(ocflStorageRoot, ST.OCFLStorageRootFolderRepository));
        location = ocflRoot.computeLocationRoot(true);
        expect(location).toEqual(path.join(ocflStorageRoot, ST.OCFLStorageRootFolderStaging));
    });

    test('OCFL OCFLRoot.computeLocationObjectRoot', async () => {
        const storageKey: string = H.Helpers.computeHashFromString('1', 'sha1');
        let location: string = ocflRoot.computeLocationObjectRoot(storageKey, false);
        expect(location.toLowerCase()).toEqual(path.join(ocflStorageRoot, ST.OCFLStorageRootFolderRepository, '/35/6A/19/356A192B7913B04C54574D18C28D46E6395428AB').toLowerCase());
        location = ocflRoot.computeLocationObjectRoot(storageKey, true);
        expect(location.toLowerCase()).toEqual(path.join(ocflStorageRoot, ST.OCFLStorageRootFolderStaging, '/35/6A/19/356A192B7913B04C54574D18C28D46E6395428AB').toLowerCase());
    });

    test('OCFL OCFLRoot.ocflObject', async () => {
        const storageKey: string = H.Helpers.computeHashFromString('1', 'sha1');
        let initRes: OO.OCFLObjectInitResults = await ocflRoot.ocflObject(storageKey, true, true);  // Attempt to read a non-existant object root
        expect(initRes.success).toBeFalsy();

        initRes = await ocflRoot.ocflObject(storageKey, true, false); // Attempt to write a non-existant object root
        expect(initRes.success).toBeTruthy();
        ocflObject = initRes.ocflObject;
    });
});

describe('OCFL Object', () => {
    let fileName1: string = '';
    let fileName2: string = '';
    let fileName3: string = '';

    test('OCFL Object.addOrUpdate', async () => {
        fileName1 = await testAddOrUpdate(ocflObject, OHTS.captureData1, 16384);
        fileName2 = await testAddOrUpdate(ocflObject, OHTS.model1, 65536);
        fileName3 = await testAddOrUpdate(ocflObject, OHTS.captureData1, 36);
    });

    test('OCFL Object.rename', async () => {
        fileName1 = await testRename(ocflObject, fileName1, true);
        fileName2 = await testRename(ocflObject, fileName2, true);
        fileName3 = await testRename(ocflObject, fileName3, true);
        await testRename(ocflObject, H.Helpers.randomSlug(), false);
    });

    test('OCFL Object.delete', async () => {
        await testDelete(ocflObject, fileName1, true);
        await testDelete(ocflObject, fileName2, true);
        await testDelete(ocflObject, fileName3, true);
        await testDelete(ocflObject, fileName3, false);
    });

    /*
    test('OCFL Object.xxx', async () => {
    });
    async delete(fileName: string, opInfo: OperationInfo): Promise<H.IOResults> {
    async reinstate(fileName: string, opInfo: OperationInfo): Promise<H.IOResults> {
    async purge(fileName: string): Promise<H.IOResults> {
    async validate(): Promise<H.IOResults> {
    get objectRoot(): string {
    versionRoot(version: number): string {
    versionContentFullPath(version: number): string {
    versionContentPartialPath(version: number): string {
    static versionFolderName(version: number): string {
    fileHash(fileName: string, version: number): string {
    fileLocation(fileName: string, version: number): string {
    headVersion(): number {

    */
});

describe('OCFL Teardown', () => {
    // Destructive test -- leave until end!
    test('OCFL OCFLRoot.validate', async () => {
        let results: H.IOResults;
        let filename: string;

        filename = path.join(ocflRoot.computeLocationRepoRoot(), ST.OCFLStorageRootSpecFilename);
        results = H.Helpers.removeFile(filename);
        expect(results.success).toBeTruthy();
        results = await ocflRoot.validate();
        expect(results.success).toBeFalsy();

        filename = path.join(ocflRoot.computeLocationRepoRoot(), ST.OCFLStorageRootLayoutFilename);
        results = H.Helpers.removeFile(filename);
        expect(results.success).toBeTruthy();
        results = await ocflRoot.validate();
        expect(results.success).toBeFalsy();

        filename = path.join(ocflRoot.computeLocationRepoRoot(), ST.OCFLStorageRootNamasteFilename);
        results = H.Helpers.removeFile(filename);
        expect(results.success).toBeTruthy();
        results = await ocflRoot.validate();
        expect(results.success).toBeFalsy();
    });
});


function createUploadLocation(ocflRoot: OR.OCFLRoot): string {
    // identify location to which we'll write our temporary data (as if we were streaming content here)
    const res: OR.ComputeWriteStreamLocationResults = ocflRoot.computeWriteStreamLocation();
    expect(res.ioResults.success).toBeTruthy();

    // LOG.logger.info(`Created write location at ${path.resolve(res.locationPrivate)}`);
    const directoryName: string = path.dirname(res.locationPrivate);
    const ioResults: H.IOResults = H.Helpers.fileOrDirExists(directoryName);
    expect(ioResults.success).toBeTruthy();

    return directoryName;
}

// inspired by https://stackoverflow.com/questions/57506770/how-to-write-a-large-amount-of-random-bytes-to-file
async function createRandomFile(directoryName: string, fileName: string, fileSize: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        try {
            const fullPath: string = path.join(directoryName, fileName);
            const stream: STR.Writable = fs.createWriteStream(fullPath);
            let bytesRemaining: number = fileSize;

            do {
                const chunkSize: number = bytesRemaining > 1024 ? 1024 : bytesRemaining;
                const buffer = crypto.randomBytes(chunkSize);

                bytesRemaining -= chunkSize;
                stream.write(buffer);
            } while (bytesRemaining > 0);

            stream.end();
            stream.on('finish', () => { resolve(fullPath); });
            stream.on('error', reject);
        } catch (error) {
            LOG.logger.error('OCFL.test.ts createRandomFile() error', error);
            reject(error);
        }
    });
}

async function testAddOrUpdate(ocflObject: OO.OCFLObject | null, SOBased: DBAPI.SystemObjectBased | null, fileSize: number): Promise<string> {
    expect(ocflObject).toBeTruthy();
    if (!ocflObject)
        return '';

    // construct metadata for addOrUpdate
    const metadataOA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(SOBased);

    // identify location to which we'll write our temporary data (as if we were streaming content here); write data
    const directoryName: string = createUploadLocation(ocflRoot);
    const fileName: string = H.Helpers.randomSlug();
    const pathOnDisk: string = await createRandomFile(directoryName, fileName, fileSize);

    // Add content
    let ioResults: H.IOResults = await ocflObject.addOrUpdate(pathOnDisk, fileName, metadataOA, opInfo);
    if (!ioResults.success)
        LOG.logger.error(ioResults.error);
    expect(ioResults.success).toBeTruthy();

    // Internal Validation
    ioResults = await ocflObject.validate();
    if (!ioResults.success)
        LOG.logger.error(ioResults.error);
    expect(ioResults.success).toBeTruthy();

    // External validation
    // LOG.logger.info(`OCFL Object Root Validations: ${ocflObject.objectRoot}`);
    ioResults = H.Helpers.fileOrDirExists(path.join(ocflObject.objectRoot, ST.OCFLStorageObjectNamasteFilename));
    expect(ioResults.success).toBeTruthy();
    ioResults = H.Helpers.fileOrDirExists(path.join(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryFilename));
    expect(ioResults.success).toBeTruthy();
    ioResults = H.Helpers.fileOrDirExists(path.join(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryDigestFilename));
    expect(ioResults.success).toBeTruthy();

    const version: number = ocflObject.headVersion();
    const versionRoot: string = ocflObject.versionRoot(version);
    // LOG.logger.info(`OCFL Object Version Root Validations: ${versionRoot}`);
    ioResults = H.Helpers.fileOrDirExists(versionRoot);
    expect(ioResults.success).toBeTruthy();
    ioResults = H.Helpers.fileOrDirExists(path.join(versionRoot, ST.OCFLStorageObjectInventoryFilename));
    expect(ioResults.success).toBeTruthy();
    ioResults = H.Helpers.fileOrDirExists(path.join(versionRoot, ST.OCFLStorageObjectInventoryDigestFilename));
    expect(ioResults.success).toBeTruthy();

    const contentRoot: string = ocflObject.versionContentFullPath(version);
    // LOG.logger.info(`OCFL Object Content Root Validations: ${contentRoot}`);
    ioResults = H.Helpers.fileOrDirExists(contentRoot);
    expect(ioResults.success).toBeTruthy();
    ioResults = H.Helpers.fileOrDirExists(path.join(contentRoot, ST.OCFLMetadataFilename));
    expect(ioResults.success).toBeTruthy();
    ioResults = H.Helpers.fileOrDirExists(path.join(contentRoot, fileName));
    expect(ioResults.success).toBeTruthy();

    // cleanup temporary upload location
    ioResults = H.Helpers.removeDirectory(directoryName, true);
    expect(ioResults.success).toBeTruthy();

    return fileName;
}

async function testRename(ocflObject: OO.OCFLObject | null, fileNameOld: string, expectSuccess: boolean): Promise<string> {
    expect(ocflObject).toBeTruthy();
    if (!ocflObject)
        return '';

    const fileNameNew: string = H.Helpers.randomSlug();
    const ioResults: H.IOResults = await ocflObject.rename(fileNameOld, fileNameNew, opInfo);
    if (!ioResults.success && expectSuccess)
        LOG.logger.error(ioResults.error);
    expect(expectSuccess === ioResults.success).toBeTruthy();
    return ioResults.success ? fileNameNew : fileNameOld;
}

async function testDelete(ocflObject: OO.OCFLObject | null, fileName: string, expectSuccess: boolean): Promise<void> {
    expect(ocflObject).toBeTruthy();
    if (!ocflObject)
        return;

    const ioResults: H.IOResults = await ocflObject.delete(fileName, opInfo);
    if (!ioResults.success && expectSuccess)
        LOG.logger.error(ioResults.error);
    expect(expectSuccess === ioResults.success).toBeTruthy();
}

