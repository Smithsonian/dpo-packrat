import * as path from 'path';
import * as ST from './SharedTypes';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';

export type ComputeWriteStreamLocationResults = {
    locationPublic: string,     // partial path, safe to share
    locationPrivate: string,    // full path; keep private, but needed to create stream
    ioResults: H.IOResults,
};

export class OCFLRoot {
    private storageRoot:        string = '';
    private storageRootRepo:    string = '';
    private storageRootStaging: string = '';

    constructor() { }

    // For example, the idAsset == 1 yields the SHA1 hash of 356A192B7913B04C54574D18C28D46E6395428AB.  This will yield the path:
    // /35/6A/19/356A192B7913B04C54574D18C28D46E6395428AB (the entire hash is repeated at the of the n-tuple).

    computeLocationRepoRoot(): string {
        return this.storageRootRepo;
    }

    computeLocationStagingRoot(): string {
        return this.storageRootStaging;
    }

    /** Computes OCFL storage root location (or staging root location) */
    computeLocationRoot(staging: boolean): string {
        return staging ? this.computeLocationStagingRoot() : this.computeLocationRepoRoot();
    }

    /** Computes an abstract storage key folder */
    private computeStorageKeyFolder(storageKey: string): string {
        return path.join(storageKey.substring(0, 2), storageKey.substring(2, 4), storageKey.substring(4, 6), storageKey);
    }

    /** Computes path to OCFL object root */
    computeLocationObjectRoot(storageKey: string, staging: boolean): string {
        return path.join(this.computeLocationRoot(staging), this.computeStorageKeyFolder(storageKey));
    }

    /** Computes path to version root for a given storageKey and version */
    computeLocationObjectVersionRoot(storageKey: string, version: number, staging: boolean): string {
        if (version < 1)
            version = 1;
        return path.join(this.computeLocationObjectRoot(storageKey, staging), `v${version}`);
    }

    /** Computes path to file for a given storageKey, version, and filename */
    computeLocationObjectVersionContent(storageKey: string, version: number, filename: string, staging: boolean): string {
        return path.join(this.computeLocationObjectVersionRoot(storageKey, version, staging), ST.OCFLStorageObjectContentFolder, filename);
    }

    /** Computes a random directory and filename in the staging area */
    computeWriteStreamLocation(): ComputeWriteStreamLocationResults {
        const results: ComputeWriteStreamLocationResults = {
            locationPublic: '<INVALID>',
            locationPrivate: '<INVALID>',
            ioResults: {
                ok: false,
                error: '',
            }
        };

        const directoryName: string = H.Helpers.randomSlug();
        const fileName: string      = H.Helpers.randomSlug();
        const directoryPath: string = path.join(this.computeLocationStagingRoot(), directoryName);
        results.ioResults = H.Helpers.createDirectory(directoryPath);
        if (results.ioResults.ok) {
            results.locationPublic = path.join(directoryName, fileName);    // Partial path
            results.locationPrivate = path.join(directoryPath, fileName);   // Full path
        }
        return results;
    }

    async initialize(storageRoot: string): Promise<H.IOResults> {
        this.storageRoot = storageRoot;                                 // single spot under which our files are stored
        this.storageRootRepo = path.join(storageRoot, 'REPO/');         // root of OCFL repository
        this.storageRootStaging = path.join(storageRoot, 'STAGING/');   // root of staging area -- should be on the same volume as the OCFL repository so that move operations are fast
        LOG.logger.info(`OCFL Storage initialization: Storage Root = ${this.storageRoot}`);
        LOG.logger.info(`OCFL Storage initialization: Repo Root    = ${this.storageRootRepo}`);
        LOG.logger.info(`OCFL Storage initialization: Staging Root = ${this.storageRootStaging}`);

        let ioResults: H.IOResults;
        ioResults = this.initializeDirectory(this.storageRoot, 'Local Storage Root');
        if (!ioResults.ok)
            return ioResults;
        ioResults = this.initializeDirectory(this.storageRootRepo, 'OCFL Storage Root');
        if (!ioResults.ok)
            return ioResults;
        ioResults = this.initializeDirectory(this.storageRootStaging, 'Staging Root');
        if (!ioResults.ok)
            return ioResults;

        return await this.initializeStorageRoot();
    }

    private async initializeStorageRoot(): Promise<H.IOResults> {
        // Ensure initialization of OCFL Storage Root "NAMASTE" file
        let source: string | null   = null;
        let dest: string            = path.join(this.storageRootRepo, ST.OCFLStorageRootNamasteFilename);
        let ioResults: H.IOResults  = this.initializeFile(source, dest, 'OCFL Root Namaste File');
        if (!ioResults.ok)
            return ioResults;

        source      = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageRootLayoutFilename);
        dest        = path.join(this.storageRootRepo, ST.OCFLStorageRootLayoutFilename);
        ioResults   = this.initializeFile(source, dest, 'OCFL Root Layout File');
        if (!ioResults.ok)
            return ioResults;

        source      = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageRootSpecFilename);
        dest        = path.join(this.storageRootRepo, ST.OCFLStorageRootSpecFilename);
        ioResults   = this.initializeFile(source, dest, 'OCFL Root Spec File');
        if (!ioResults.ok)
            return ioResults;

        return ioResults;
    }

    private initializeDirectory(directory: string, description: string): H.IOResults {
        let ioResults: H.IOResults = H.Helpers.fileOrDirExists(directory);
        if (ioResults.ok)
            return ioResults;

        LOG.logger.info(`${description} does not exist; creating it`);
        ioResults = H.Helpers.createDirectory(directory);
        if (!ioResults.ok)
            LOG.logger.error(`Unable to create ${description} at ${directory}`);
        return ioResults;
    }

    private initializeFile(source: string | null, dest: string, description: string): H.IOResults {
        let ioResults: H.IOResults;
        ioResults = H.Helpers.fileOrDirExists(dest);
        if (ioResults.ok)
            return ioResults;

        LOG.logger.info(`${description} does not exist; creating it`);
        ioResults = source ? H.Helpers.copyFile(source, dest) : H.Helpers.ensureFileExists(dest);
        if (!ioResults.ok)
            LOG.logger.error(`Unable to create ${description} at ${dest}`);
        return ioResults;
    }
}
