import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';

import { OperationInfo } from '../../../../storage/interface/IStorage';
import * as OR from '../../../../storage/impl/LocalStorage/OCFLRoot';
import * as OO from '../../../../storage/impl/LocalStorage/OCFLObject';
import * as ST from '../../../../storage/impl/LocalStorage/SharedTypes';
import * as DBAPI from '../../../../db';
import * as H from '../../../../utils/helpers';
import * as LOG from '../../../../utils/logger';
import { ObjectGraphTestSetup } from '../../../db/composite/ObjectGraph.setup';

const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();
const ocflRoot: OR.OCFLRoot = new OR.OCFLRoot();
let ocflObject: OO.OCFLObject | null = null;
let ocflStorageRoot: string;
let opInfo: OperationInfo;
const storageKey: string = H.Helpers.computeHashFromString('1', 'sha1');

beforeAll(() => {
    ocflStorageRoot = path.join('var', 'test', H.Helpers.randomSlug());
    LOG.logger.info(`Creating test storage root in ${path.resolve(ocflStorageRoot)}`);
});

afterAll(async done => {
    LOG.logger.info(`Removing test storage root from ${path.resolve(ocflStorageRoot)}`);
    await H.Helpers.removeDirectory(ocflStorageRoot, true);
    // jest.setTimeout(5000);
    // await H.Helpers.sleep(2000);
    done();
});

describe('OCFL Setup', () => {
    test('OCFL OCFLRoot Setup', async () => {
        let ioResults: H.IOResults = await H.Helpers.createDirectory(ocflStorageRoot);
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
        const directoryName: string = await createUploadLocation(ocflRoot);
        const ioResults: H.IOResults = await H.Helpers.removeDirectory(directoryName);
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
        const location: string = ocflRoot.computeLocationObjectRoot(storageKey);
        expect(location.toLowerCase()).toEqual(path.join(ocflStorageRoot, ST.OCFLStorageRootFolderRepository, '/35/6A/19/356A192B7913B04C54574D18C28D46E6395428AB').toLowerCase());
    });

    test('OCFL OCFLRoot.ocflObject New', async () => {
        let initRes: OO.OCFLObjectInitResults = await ocflRoot.ocflObject(storageKey, false);  // Don't create if missing, non-existant object root
        expect(initRes.success).toBeFalsy();

        initRes = await ocflRoot.ocflObject(storageKey, true); // Do create if missing, non-existant object root
        expect(initRes.success).toBeTruthy();
        ocflObject = initRes.ocflObject;
    });
});

describe('OCFL Object', () => {
    let fileName1: string = '';
    let fileName2: string = '';
    let fileName3: string = '';
    let fileName4: string = ''; // non-existing file
    let fileName1Orig: string = '';

    test('OCFL Object.addOrUpdate', async () => {
        fileName1 = await testAddOrUpdate(ocflObject, OHTS.captureData1, 16384, true); fileName1Orig = fileName1;
        fileName2 = await testAddOrUpdate(ocflObject, OHTS.model1, 65536, true);
        fileName3 = await testAddOrUpdate(ocflObject, OHTS.captureData1, 36, true);
        fileName4 = await testAddOrUpdate(ocflObject, OHTS.captureData1, 0, false); // 0 -> do not create file, but do return a random name; should fail
        await testAddOrUpdate(ocflObject, null, 0, false); // 0 -> do not create file, but do return a random name; should fail
    });

    test('OCFL Object.rename', async () => {
        fileName1 = await testRename(ocflObject, fileName1, true);
        fileName2 = await testRename(ocflObject, fileName2, true);
        fileName3 = await testRename(ocflObject, fileName3, true);
        fileName4 = await testRename(ocflObject, fileName4, false); // should fail for non-existing files
    });

    test('OCFL Object.delete', async () => {
        await testDelete(ocflObject, fileName1, true);
        await testDelete(ocflObject, fileName2, true);
        await testDelete(ocflObject, fileName3, true);
        await testDelete(ocflObject, fileName3, false); // should fail second time
        await testDelete(ocflObject, fileName4, false); // should fail for non-existing files
    });

    test('OCFL Object.reinstate', async () => {
        await testReinstate(ocflObject, fileName1, true);
        await testReinstate(ocflObject, fileName2, true);
        await testReinstate(ocflObject, fileName3, true);
        await testReinstate(ocflObject, fileName3, true); // OCFL implementation notes say this should fail second time; I say it's ok
        await testReinstate(ocflObject, fileName4, false); // should fail for non-existing files
    });

    test('OCFL Object.purge', async () => {
        await testPurge(ocflObject, fileName1, false); // not implemented
    });

    test('OCFL OCFLRoot.ocflObject Existing 1', async () => {
        jest.setTimeout(30000); // this is needed here, for some reason, when running in my container
        let initRes: OO.OCFLObjectInitResults = await ocflRoot.ocflObject(storageKey, false);  // Don't create if missing
        expect(initRes.success).toBeTruthy();
        await testValidate(initRes.ocflObject, 1, 'unmodified');

        initRes = await ocflRoot.ocflObject(storageKey, true); // Do create if missing
        expect(initRes.success).toBeTruthy();
        await testValidate(initRes.ocflObject, 1, 'unmodified');

        expect(initRes.ocflObject).toBeTruthy();
        if (!initRes.ocflObject)
            return;

        // add, rename, delete, reinstate with new OCFLObjects
        let fileName5: string = await testAddOrUpdate(initRes.ocflObject, OHTS.captureData1, 16384, true);
        initRes = await ocflRoot.ocflObject(storageKey, false); // Don't create if missing
        expect(initRes.success).toBeTruthy();
        expect(initRes.ocflObject).toBeTruthy();
        if (!initRes.ocflObject)
            return;

        fileName5 = await testRename(initRes.ocflObject, fileName5, true);
        initRes = await ocflRoot.ocflObject(storageKey, false); // Don't create if missing
        expect(initRes.success).toBeTruthy();
        expect(initRes.ocflObject).toBeTruthy();
        if (!initRes.ocflObject)
            return;

        await testDelete(initRes.ocflObject, fileName5, true);
        initRes = await ocflRoot.ocflObject(storageKey, false); // Don't create if missing
        expect(initRes.success).toBeTruthy();
        expect(initRes.ocflObject).toBeTruthy();
        if (!initRes.ocflObject)
            return;

        await testReinstate(initRes.ocflObject, fileName5, true);
        initRes = await ocflRoot.ocflObject(storageKey, false); // Don't create if missing
        expect(initRes.success).toBeTruthy();
        expect(initRes.ocflObject).toBeTruthy();
        if (!initRes.ocflObject)
            return;
    });

    test('OCFL Object.fileLocationAndHash', async () => {
        expect(ocflObject).toBeTruthy();
        if (!ocflObject)
            return;

        let pathAndHash: OO.OCFLPathAndHash | null;
        pathAndHash = ocflObject.fileLocationAndHash(fileName4, 1); // non-existing file
        expect(pathAndHash).toBeFalsy();

        pathAndHash = ocflObject.fileLocationAndHash(fileName4, -1); // non-existing file, most recent version
        expect(pathAndHash).toBeFalsy();

        pathAndHash = ocflObject.fileLocationAndHash(fileName1, 1); // invalid version for this name
        expect(pathAndHash).toBeFalsy();

        pathAndHash = ocflObject.fileLocationAndHash(fileName1Orig, 1); // valid, old version
        expect(pathAndHash).toBeTruthy();
        if (pathAndHash)
            expect(pathAndHash.path).toEqual(path.join(ocflObject.versionContentFullPath(1), fileName1Orig));

        pathAndHash = ocflObject.fileLocationAndHash(fileName1, 10); // valid, old version
        expect(pathAndHash).toBeTruthy();
        if (pathAndHash)
            expect(pathAndHash.path).toEqual(path.join(ocflObject.versionContentFullPath(10), fileName1));

        pathAndHash = ocflObject.fileLocationAndHash(fileName1, -1); // valid, most recent version
        expect(pathAndHash).toBeTruthy();
        if (pathAndHash)
            expect(pathAndHash.path).toEqual(path.join(ocflObject.versionContentFullPath(10), fileName1));
    });

    test('OCFL Object Other Methods', async () => {
        expect(ocflObject).toBeTruthy();
        if (!ocflObject)
            return;
        const objectRoot: string = ocflObject.objectRoot;
        const storageKey: string = H.Helpers.computeHashFromString('1', 'sha1');
        expect(objectRoot).toContain(storageKey);

        const versionRoot: string = ocflObject.versionRoot(1);
        expect(versionRoot).toEqual(path.join(objectRoot, 'v1'));

        const versionContentFullPath: string = ocflObject.versionContentFullPath(1);
        expect(versionContentFullPath).toEqual(path.join(objectRoot, 'v1', ST.OCFLStorageObjectContentFolder));

        const versionContentPartialPath: string = OO.OCFLObject.versionContentPartialPath(1);
        expect(versionContentPartialPath).toEqual(path.join('v1', ST.OCFLStorageObjectContentFolder));

        const versionFolderName: string = OO.OCFLObject.versionFolderName(1);
        expect(versionFolderName).toEqual('v1');

        const fileLocationExplicit: string = ocflObject.fileLocationExplicit(fileName1, 1);
        expect(fileLocationExplicit).toEqual(path.join(objectRoot, versionContentPartialPath, fileName1));

        const headVersion: number = ocflObject.headVersion();
        expect(headVersion).toEqual(13);
    });

    test('OCFL Object.validate', async () => {
        const storageKey: string = H.Helpers.computeHashFromString('1', 'sha1');
        const initRes: OO.OCFLObjectInitResults = await ocflRoot.ocflObject(storageKey, false);  // Don't create if missing
        expect(initRes.success).toBeTruthy();
        expect(initRes.ocflObject).toBeTruthy();
        ocflObject = initRes.ocflObject;

        await testValidate(ocflObject, 1, 'unmodified');
        await testValidate(ocflObject, 2, 'missing namaste file');
        await testValidate(ocflObject, 3, 'invalid namaste file');
        await testValidate(ocflObject, 4, 'missing root inventory');
        await testValidate(ocflObject, 5, 'missing root digest');
        await testValidate(ocflObject, 6, 'invalid root inventory');
        await testValidate(ocflObject, 7, 'invalid root digest');
        await testValidate(ocflObject, 8, 'missing version inventory');
        await testValidate(ocflObject, 9, 'missing file in version folder');
        await testValidate(ocflObject, 10, 'additional file in version folder');
        await testValidate(ocflObject, 11, 'missing object root directory');
        await testValidate(ocflObject, 12, 'modified version file');
        await testValidate(ocflObject, 13, 'root inventory does not match head inventory');
        await testValidate(ocflObject, 14, 'version inventory has wrong version number');
    });
});

describe('OCFL Teardown', async () => {
    // Destructive test -- leave until end!
    test('OCFL OCFLRoot.validate', async () => {
        let results: H.IOResults;
        let filename: string;

        filename = path.join(ocflRoot.computeLocationRepoRoot(), ST.OCFLStorageRootSpecFilename);
        results = await H.Helpers.removeFile(filename);
        expect(results.success).toBeTruthy();
        results = await ocflRoot.validate();
        expect(results.success).toBeFalsy();

        filename = path.join(ocflRoot.computeLocationRepoRoot(), ST.OCFLStorageRootLayoutFilename);
        results = await H.Helpers.removeFile(filename);
        expect(results.success).toBeTruthy();
        results = await ocflRoot.validate();
        expect(results.success).toBeFalsy();

        filename = path.join(ocflRoot.computeLocationRepoRoot(), ST.OCFLStorageRootNamasteFilename);
        results = await H.Helpers.removeFile(filename);
        expect(results.success).toBeTruthy();
        results = await ocflRoot.validate();
        expect(results.success).toBeFalsy();
    });
});

async function createUploadLocation(ocflRoot: OR.OCFLRoot): Promise<string> {
    // identify location to which we'll write our temporary data (as if we were streaming content here)
    const res: OR.ComputeWriteStreamLocationResults = await ocflRoot.computeWriteStreamLocation();
    expect(res.ioResults.success).toBeTruthy();

    // LOG.logger.info(`Created write location at ${path.resolve(res.locationPrivate)}`);
    const directoryName: string = path.dirname(res.locationPrivate);
    const ioResults: H.IOResults = await H.Helpers.fileOrDirExists(directoryName);
    expect(ioResults.success).toBeTruthy();

    return directoryName;
}

// inspired by https://stackoverflow.com/questions/57506770/how-to-write-a-large-amount-of-random-bytes-to-file
async function createRandomFile(directoryName: string, fileName: string, fileSize: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        try {
            const fullPath: string = path.join(directoryName, fileName);
            const stream: NodeJS.WritableStream = fs.createWriteStream(fullPath);
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

async function testAddOrUpdate(ocflObject: OO.OCFLObject | null, SOBased: DBAPI.SystemObjectBased | null, fileSize: number, expectSuccess: boolean): Promise<string> {
    expect(ocflObject).toBeTruthy();
    if (!ocflObject)
        return '';

    // construct metadata for addOrUpdate
    const metadataOA: DBAPI.ObjectGraph | null = SOBased ? await ObjectGraphTestSetup.testObjectGraphFetch(SOBased, DBAPI.eObjectGraphMode.eAncestors) : null;

    // identify location to which we'll write our temporary data (as if we were streaming content here); write data
    const directoryName: string = await createUploadLocation(ocflRoot);
    const fileName: string = (SOBased != null || fileSize > 0) ? H.Helpers.randomSlug() : '';
    const pathOnDisk: string = (fileSize > 0)
        ? await createRandomFile(directoryName, fileName, fileSize) // create a file
        : path.join(directoryName, fileName);                       // just yield a filenmae

    // Add content
    LOG.logger.info(`addOrUpdate ${fileName}: Expected ${expectSuccess ? 'success' : 'failure'}`);
    let ioResults: H.IOResults = await ocflObject.addOrUpdate(pathOnDisk, fileName, metadataOA, opInfo);
    expect(expectSuccess === ioResults.success).toBeTruthy();
    if (!ioResults.success) {
        if (expectSuccess)
            LOG.logger.error(ioResults.error);
        else
            return fileName;
    }

    // Internal Validation
    ioResults = await ocflObject.validate();
    if (!ioResults.success)
        LOG.logger.error(ioResults.error);
    expect(ioResults.success).toBeTruthy();

    // External validation
    // LOG.logger.info(`OCFL Object Root Validations: ${ocflObject.objectRoot}`);
    ioResults = await H.Helpers.fileOrDirExists(path.join(ocflObject.objectRoot, ST.OCFLStorageObjectNamasteFilename));
    expect(ioResults.success).toBeTruthy();
    ioResults = await H.Helpers.fileOrDirExists(path.join(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryFilename));
    expect(ioResults.success).toBeTruthy();
    ioResults = await H.Helpers.fileOrDirExists(path.join(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryDigestFilename));
    expect(ioResults.success).toBeTruthy();

    const version: number = ocflObject.headVersion();
    const versionRoot: string = ocflObject.versionRoot(version);
    // LOG.logger.info(`OCFL Object Version Root Validations: ${versionRoot}`);
    ioResults = await H.Helpers.fileOrDirExists(versionRoot);
    expect(ioResults.success).toBeTruthy();
    ioResults = await H.Helpers.fileOrDirExists(path.join(versionRoot, ST.OCFLStorageObjectInventoryFilename));
    expect(ioResults.success).toBeTruthy();
    ioResults = await H.Helpers.fileOrDirExists(path.join(versionRoot, ST.OCFLStorageObjectInventoryDigestFilename));
    expect(ioResults.success).toBeTruthy();

    const contentRoot: string = ocflObject.versionContentFullPath(version);
    // LOG.logger.info(`OCFL Object Content Root Validations: ${contentRoot}`);
    ioResults = await H.Helpers.fileOrDirExists(contentRoot);
    expect(ioResults.success).toBeTruthy();
    ioResults = await H.Helpers.fileOrDirExists(path.join(contentRoot, ST.OCFLMetadataFilename));
    expect(ioResults.success).toBeTruthy();
    ioResults = await H.Helpers.fileOrDirExists(path.join(contentRoot, fileName));
    expect(ioResults.success).toBeTruthy();

    // cleanup temporary upload location
    ioResults = await H.Helpers.removeDirectory(directoryName, true);
    expect(ioResults.success).toBeTruthy();

    return fileName;
}

async function testRename(ocflObject: OO.OCFLObject | null, fileNameOld: string, expectSuccess: boolean): Promise<string> {
    expect(ocflObject).toBeTruthy();
    if (!ocflObject)
        return '';

    const fileNameNew: string = H.Helpers.randomSlug();
    LOG.logger.info(`testRename ${fileNameOld} to ${fileNameNew}: Expected ${expectSuccess ? 'success' : 'failure'}`);
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

    LOG.logger.info(`testDelete ${fileName}: Expected ${expectSuccess ? 'success' : 'failure'}`);
    const ioResults: H.IOResults = await ocflObject.delete(fileName, opInfo);
    if (!ioResults.success && expectSuccess)
        LOG.logger.error(ioResults.error);
    expect(expectSuccess === ioResults.success).toBeTruthy();
}

async function testReinstate(ocflObject: OO.OCFLObject | null, fileName: string, expectSuccess: boolean): Promise<void> {
    expect(ocflObject).toBeTruthy();
    if (!ocflObject)
        return;

    LOG.logger.info(`testReinstate ${fileName}: Expected ${expectSuccess ? 'success' : 'failure'}`);
    const ioResults: H.IOResults = await ocflObject.reinstate(fileName, -1, opInfo);
    if (!ioResults.success && expectSuccess)
        LOG.logger.error(ioResults.error);
    expect(expectSuccess === ioResults.success).toBeTruthy();
}

async function testPurge(ocflObject: OO.OCFLObject | null, fileName: string, expectSuccess: boolean): Promise<void> {
    expect(ocflObject).toBeTruthy();
    if (!ocflObject)
        return;

    LOG.logger.info(`testPurge ${fileName}: Expected ${expectSuccess ? 'success' : 'failure'}`);
    const ioResults: H.IOResults = await ocflObject.purge(fileName);
    if (!ioResults.success && expectSuccess)
        LOG.logger.error(ioResults.error);
    expect(expectSuccess === ioResults.success).toBeTruthy();
}

async function testValidate(ocflObject: OO.OCFLObject | null, testMode: number, testCase: string): Promise<void> {
    expect(ocflObject).toBeTruthy();
    if (!ocflObject)
        return;

    let expectSuccess: boolean = true;
    let sourceFile: string = '';
    let destFile: string = '';
    let ioResults: H.IOResults;

    // modify
    switch (testMode) {
        case 1: {       // unmodified, and thus valid object
            expectSuccess = true;
        } break;
        case 2: {       // missing namaste file
            sourceFile  = path.join(ocflObject.objectRoot, ST.OCFLStorageObjectNamasteFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), '');
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();
            expectSuccess = false;
        } break;
        case 3: {       // tweaked namaste file
            sourceFile  = path.join(ocflObject.objectRoot, ST.OCFLStorageObjectNamasteFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), ''); // save file
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();

            expect(await createRandomFile(ocflObject.objectRoot, ST.OCFLStorageObjectNamasteFilename, 500)).toBeTruthy(); // create random replacement
            expectSuccess = false;
        } break;
        case 4: {       // missing root inventory
            sourceFile  = path.join(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), '');
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();
            expectSuccess = false;
        } break;
        case 5: {       // missing root digest
            sourceFile  = path.join(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryDigestFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), '');
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();
            expectSuccess = false;
        } break;
        case 6: {       // invalid root inventory
            sourceFile  = path.join(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), ''); // save file
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();

            expect(await createRandomFile(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryFilename, 500)).toBeTruthy(); // create random replacement
            expectSuccess = false;
        } break;
        case 7: {       // invalid root digest
            sourceFile  = path.join(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryDigestFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), '');
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();

            expect(await createRandomFile(ocflObject.objectRoot, ST.OCFLStorageObjectInventoryDigestFilename, 500)).toBeTruthy(); // create random replacement
            expectSuccess = false;
        } break;
        case 8: {       // missing version inventory
            sourceFile  = path.join(ocflObject.versionRoot(1), ST.OCFLStorageObjectInventoryFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), '');
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();
            expectSuccess = false;
        } break;
        case 9: {       // missing file in version folder
            sourceFile  = path.join(ocflObject.versionContentFullPath(1), ST.OCFLMetadataFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), '');
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();
            expectSuccess = false;
        } break;
        case 10: {      // additional file in version folder
            destFile = await createRandomFile(ocflObject.versionContentFullPath(1), H.Helpers.randomSlug(), 500); // create random file
            expect(destFile).toBeTruthy();
            expectSuccess = false;
        } break;
        case 11: {      // missing object root directory
            sourceFile  = ocflObject.objectRoot;
            destFile    = ocflObject.objectRoot + H.Helpers.randomSlug();
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();
            expectSuccess = false;
        } break;
        case 12: {       // modified version file
            sourceFile  = path.join(ocflObject.versionContentFullPath(1), ST.OCFLMetadataFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), '');
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();

            expect(await createRandomFile(ocflObject.versionContentFullPath(1), ST.OCFLMetadataFilename, 500)).toBeTruthy(); // create random replacement
            expectSuccess = false;
        } break;
        case 13: {       // root inventory does not match head inventory
            sourceFile  = path.join(ocflObject.versionRoot(ocflObject.headVersion()), ST.OCFLStorageObjectInventoryFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), '');
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();

            const oldVersionInv: string = path.join(ocflObject.versionRoot(1), ST.OCFLStorageObjectInventoryFilename);
            ioResults   = await H.Helpers.copyFile(oldVersionInv, sourceFile);
            expect(ioResults.success).toBeTruthy();
            expectSuccess = false;
        } break;
        case 14: {       // version inventory has wrong version number
            sourceFile  = path.join(ocflObject.versionRoot(1), ST.OCFLStorageObjectInventoryFilename);
            destFile    = H.Helpers.randomFilename(ocflRoot.computeLocationRoot(true), '');
            ioResults   = await H.Helpers.moveFile(sourceFile, destFile);
            expect(ioResults.success).toBeTruthy();

            const oldVersionInv: string = path.join(ocflObject.versionRoot(2), ST.OCFLStorageObjectInventoryFilename);
            ioResults   = await H.Helpers.copyFile(oldVersionInv, sourceFile);
            expect(ioResults.success).toBeTruthy();
            expectSuccess = false;
        } break;
        default: {
            LOG.logger.error(`testValidate Unimplemented test case ${testMode}: {${testCase}}`);
            expect(false).toBeTruthy();
        } break;
    }

    LOG.logger.info(`testValidate mode ${testMode} (${testCase}): Expected ${expectSuccess ? 'success' : 'failure'}`);
    ioResults = await ocflObject.validate();
    if (!ioResults.success && expectSuccess)
        LOG.logger.error(ioResults.error);
    expect(expectSuccess === ioResults.success).toBeTruthy();

    // reset
    if (destFile != '' && sourceFile != '') {
        ioResults = await H.Helpers.moveFile(destFile, sourceFile);
        expect(ioResults.success).toBeTruthy();
    } else if (destFile != '') {
        ioResults = await H.Helpers.removeFile(destFile);
        expect(ioResults.success).toBeTruthy();
    }
}
