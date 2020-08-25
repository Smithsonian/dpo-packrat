import * as path from 'path';

import * as OR from '../../../../storage/impl/LocalStorage/OCFLRoot';
import * as OO from '../../../../storage/impl/LocalStorage/OCFLObject';
import * as ST from '../../../../storage/impl/LocalStorage/SharedTypes';
import * as H from '../../../../utils/helpers';
// import * as DBAPI from '../../../db';
// import * as CACHE from '../../../cache';
// import * as UTIL from '../api';
import * as LOG from '../../../../utils/logger';

const ocflRoot: OR.OCFLRoot = new OR.OCFLRoot();
let ocflStorageRoot: string;

beforeAll(() => {
    ocflStorageRoot = path.join('var', 'test', H.Helpers.randomSlug());
    LOG.logger.info(`Creating test storage root in ${path.resolve(ocflStorageRoot)}`);
});

afterAll(async done => {
    LOG.logger.info(`Removing test storage root from ${path.resolve(ocflStorageRoot)}`);
    H.Helpers.removeDirectory(ocflStorageRoot, true);
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
});

describe('OCFL OCFLRoot', () => {
    test('OCFL OCFLRoot.computeWriteStreamLocation', async () => {
        const res: OR.ComputeWriteStreamLocationResults = ocflRoot.computeWriteStreamLocation();
        expect(res.ioResults.success).toBeTruthy();

        LOG.logger.info(`Created write location at ${path.resolve(res.locationPrivate)}`);
        const directoryName: string = path.dirname(res.locationPrivate);
        let ioResults: H.IOResults = H.Helpers.fileOrDirExists(directoryName);
        expect(ioResults.success).toBeTruthy();

        ioResults = H.Helpers.removeDirectory(directoryName);
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

    test('OCFL OCFLRoot.computeLocationRoot', async () => {
        const storageKey: string = H.Helpers.computeHashFromString('1', 'sha1');
        let initRes: OO.OCFLObjectInitResults = await ocflRoot.ocflObject(storageKey, true, true);  // Attempt to read a non-existant object root
        expect(initRes.success).toBeFalsy();

        initRes = await ocflRoot.ocflObject(storageKey, true, false); // Attempt to write a non-existant object root
        expect(initRes.success).toBeTruthy();
    });

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