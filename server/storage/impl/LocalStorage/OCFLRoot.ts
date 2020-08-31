import * as path from 'path';
//import * as STORE from '../../interface';
import * as ST from './SharedTypes';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';
import * as OO from './OCFLObject';

export type ComputeWriteStreamLocationResults = {
    locationPublic: string,     // partial path, safe to share
    locationPrivate: string,    // full path; keep private, but needed to create stream
    ioResults: H.IOResults
};

export class OCFLRoot {
    private storageRoot:        string = '';
    private storageRootRepo:    string = '';
    private storageRootStaging: string = '';

    constructor() { }

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
    // For example, the idAsset == 1 yields the SHA1 hash of 356A192B7913B04C54574D18C28D46E6395428AB.  This will yield the path:
    // /35/6A/19/356A192B7913B04C54574D18C28D46E6395428AB (the entire hash is repeated at the of the n-tuple).
    private computeStorageKeyFolder(storageKey: string): string {
        return path.join(storageKey.substring(0, 2), storageKey.substring(2, 4), storageKey.substring(4, 6), storageKey);
    }

    /** Computes path to OCFL object root */
    computeLocationObjectRoot(storageKey: string): string {
        return path.join(this.storageRootRepo, this.computeStorageKeyFolder(storageKey));
    }

    /** Computes a random directory and filename in the staging area */
    computeWriteStreamLocation(): ComputeWriteStreamLocationResults {
        const results: ComputeWriteStreamLocationResults = {
            locationPublic: '<INVALID>',
            locationPrivate: '<INVALID>',
            ioResults: {
                success: false,
                error: '',
            }
        };

        const directoryName: string = H.Helpers.randomSlug();
        const fileName: string      = H.Helpers.randomSlug();
        const directoryPath: string = path.join(this.computeLocationStagingRoot(), directoryName);
        results.ioResults = H.Helpers.createDirectory(directoryPath);
        /* istanbul ignore else */
        if (results.ioResults.success) {
            results.locationPublic = path.join(directoryName, fileName);    // Partial path
            results.locationPrivate = path.join(directoryPath, fileName);   // Full path
        }
        return results;
    }

    async initialize(storageRoot: string): Promise<H.IOResults> {
        this.storageRoot = storageRoot;                                                     // single spot under which our files are stored
        this.storageRootRepo = path.join(storageRoot, ST.OCFLStorageRootFolderRepository);  // root of OCFL repository
        this.storageRootStaging = path.join(storageRoot, ST.OCFLStorageRootFolderStaging);  // root of staging area -- should be on the same volume as the OCFL repository so that move operations are fast
        LOG.logger.info(`OCFL Storage initialization: Storage Root = ${this.storageRoot}`);
        LOG.logger.info(`OCFL Storage initialization: Repo Root    = ${this.storageRootRepo}`);
        LOG.logger.info(`OCFL Storage initialization: Staging Root = ${this.storageRootStaging}`);

        let ioResults: H.IOResults;
        ioResults = H.Helpers.initializeDirectory(this.storageRoot, 'Storage Root');
        /* istanbul ignore if */
        if (!ioResults.success)
            return ioResults;
        ioResults = H.Helpers.initializeDirectory(this.storageRootRepo, 'Storage OCFLRoot');
        /* istanbul ignore if */
        if (!ioResults.success)
            return ioResults;
        ioResults = H.Helpers.initializeDirectory(this.storageRootStaging, 'Storage Staging Root');
        /* istanbul ignore if */
        if (!ioResults.success)
            return ioResults;

        return await this.initializeStorageRoot();
    }

    async ocflObject(storageKey: string, createIfMissing: boolean): Promise<OO.OCFLObjectInitResults> {
        const ocflObject: OO.OCFLObject = new OO.OCFLObject();
        const objectRoot: string = this.computeLocationObjectRoot(storageKey);
        return await ocflObject.initialize(storageKey, objectRoot, createIfMissing);
    }

    private async initializeStorageRoot(): Promise<H.IOResults> {
        // Ensure initialization of OCFL Storage Root "NAMASTE" file
        let source: string          = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageRootNamasteFilename);
        let dest: string            = path.join(this.storageRootRepo, ST.OCFLStorageRootNamasteFilename);
        let ioResults: H.IOResults  = H.Helpers.initializeFile(source, dest, 'OCFL Root Namaste File');
        /* istanbul ignore if */
        if (!ioResults.success)
            return ioResults;

        source      = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageRootLayoutFilename);
        dest        = path.join(this.storageRootRepo, ST.OCFLStorageRootLayoutFilename);
        ioResults   = H.Helpers.initializeFile(source, dest, 'OCFL Root Layout File');
        /* istanbul ignore if */
        if (!ioResults.success)
            return ioResults;

        source      = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageRootSpecFilename);
        dest        = path.join(this.storageRootRepo, ST.OCFLStorageRootSpecFilename);
        ioResults   = H.Helpers.initializeFile(source, dest, 'OCFL Root Spec File');
        /* istanbul ignore if */
        if (!ioResults.success)
            return ioResults;

        return ioResults;
    }

    async validate(): Promise<H.IOResults> {
        let source: string          = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageRootNamasteFilename);
        let dest: string            = path.join(this.storageRootRepo, ST.OCFLStorageRootNamasteFilename);
        let ioResults: H.IOResults  = H.Helpers.filesMatch(source, dest);
        if (!ioResults.success)
            return ioResults;

        source      = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageRootLayoutFilename);
        dest        = path.join(this.storageRootRepo, ST.OCFLStorageRootLayoutFilename);
        ioResults   = H.Helpers.filesMatch(source, dest);
        if (!ioResults.success)
            return ioResults;

        source      = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageRootSpecFilename);
        dest        = path.join(this.storageRootRepo, ST.OCFLStorageRootSpecFilename);
        ioResults   = H.Helpers.filesMatch(source, dest);
        if (!ioResults.success)
            return ioResults;

        return ioResults;
    }
}
