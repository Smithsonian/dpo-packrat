/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import { OCFLRoot } from './OCFLRoot';
import * as INV from './OCFLInventory';
import * as ST from './SharedTypes';
import * as H from '../../../utils/helpers';

export type OCFLObjectInitResults = {
    ocflObject: OCFLObject | null,
    success: boolean,
    error: string,
};

export class OCFLObject {
    private _ocflRoot: OCFLRoot;
    private _storageKey: string = '';
    private _fileName: string = '';
    private _version: number = 0;
    private _staging: boolean = false;

    private _objectRoot: string = '';
    private _location: string = '';
    private _hash: string = '';

    constructor(ocflRoot: OCFLRoot) {
        this._ocflRoot = ocflRoot;
    }

    private computeObjectRoot(storageKey: string, staging: boolean): string {
        return this._ocflRoot.computeLocationObjectRoot(storageKey, staging);
    }

    /** Computes path to version root for a given storageKey and version */
    computeLocationObjectVersionRoot(storageKey: string, version: number, staging: boolean): string {
        if (version < 1)
            version = 1;
        return path.join(this.computeObjectRoot(storageKey, staging), `v${version}`);
    }

    /** Computes path to file for a given storageKey, version, and filename */
    computeLocationObjectVersionContent(storageKey: string, version: number, filename: string, staging: boolean): string {
        return path.join(this.computeLocationObjectVersionRoot(storageKey, version, staging), ST.OCFLStorageObjectContentFolder, filename);
    }

    async initialize(storageKey: string, fileName: string, version: number, staging: boolean, forReading: boolean): Promise<OCFLObjectInitResults> {
        this._storageKey = storageKey;
        this._fileName = fileName;  // may be ''
        this._version = version;    // may be 0
        this._staging = staging;
        this._objectRoot = this.computeObjectRoot(this._storageKey, this._staging);

        const retValue: OCFLObjectInitResults = {
            ocflObject: null,
            success: false,
            error: ''
        };

        // Verify structure / create structure
        let ioResults = await this.initializeStructure(forReading);
        if (!ioResults.success) {
            retValue.success = false;
            retValue.error = ioResults.error;
            return retValue;
        }

        // load up details from storage
        ioResults = await this.loadFromStorage(false);
        if (!ioResults.success) {
            retValue.success = false;
            retValue.error = ioResults.error;
            return retValue;
        }

        retValue.success = true;
        retValue.ocflObject = this;
        return retValue;
    }

    /**
     * Addition: Adds a new file path and corresponding content to an OCFL Object. The path cannot exist in the previous version of the object,
     * and the content cannot have existed in any earlier versions of the object.
     * Updating: Changes the content pointed to by an content path. The path must exist in the previous version of the OCFL Object,
     * and the content cannot have existed in any earlier versions of the object.
     * @param pathOnDisk Full path to added content's bits on disk; may be null if only metadata is being updated
     * @param fileName Name (and path) of added content's bits; may be null if only metadata is being updated
     * @param metadata Optional metadata record that accompanies this content addition
     */
    async addOrUpdate(pathOnDisk: string | null, fileName: string | null, metadata: any | null): Promise<H.IOResults> {
        const results: H.IOResults = {
            success: false,
            error: 'Not Implemented'
        };
        pathOnDisk;
        fileName;
        metadata;
        return results;
        // Prepare/Compute OCFLObject
        // Ensure OCFLObject is initialized
        // For new & existing OCFLObjects, prepare supporting files in staging area (manifest, hash, folder structure)
        // Move files into place as atomically as possible
        // Catch and handle exceptions
        // Return output
    }

    /**
     * Renaming: Changes the file path of existing content. The path cannot exist in the previous version of the OCFL Object,
     * and the content cannot have existed in any earlier versions of the object.
     * @param fileNameOld
     * @param fileNameNew
     */
    async rename(fileNameOld: string, fileNameNew: string): Promise<H.IOResults> {
        const results: H.IOResults = {
            success: false,
            error: 'Not Implemented'
        };
        fileNameOld;
        fileNameNew;
        return results;
    }

    /**
     * Deletion: Removes a file path and corresponding content from the current version of an OCFL Object.
     * The path and content remain available in earlier versions of the object.
     * @param fileName
     */
    async delete(fileName: string): Promise<H.IOResults> {
        const results: H.IOResults = {
            success: false,
            error: 'Not Implemented'
        };
        fileName;
        return results;
    }

    /**
     * Reinstatement: Makes content from a version earlier than the previous version available in the current version of an OCFL Object.
     * The content must exist in an earlier version, and not the previous version. The file path may exist in the previous version,
     * effectively updating the file path with older content, or it may not, effectively adding the older content as a new file.
     * @param fileName
     */
    async reinstate(fileName: string): Promise<H.IOResults> {
        const results: H.IOResults = {
            success: false,
            error: 'Not Implemented'
        };
        fileName;
        return results;
    }

    /**
     * Purging: (As distinct from deletion) covers the complete removal of a file path and corresponding content from all versions
     * of an OCFL Object.
     *
     * Sometimes a file needs to be deleted from all versions of an object, perhaps for legal reasons. Doing this to an OCFL Object breaks
     * the previous version immutability assumption. The correct way to do this is to create a new object that excludes the offending file,
     * with a revised version history taking this into account. The original object can then be deleted in its entirety. Creating the new object
     * first is good practice as it avoids any risk of data loss that may occur if an object were to be deleted before the new object is created.
     * The new object need not have the same identifier as the original object. In this case, the deleted object may be replaced by a placeholder
     * object using the original identifier and location in the OCFL Storage Root. This is a standard OCFL object with content that redirects users
     * and software to the new version - possibly with an indication of why the new object was created, if appropriate. The OCFL does not define
     * redirect mechanisms, the interpretation of object contents is purely a client application concern.
     *
     * @param fileName
     */
    async purge(fileName: string): Promise<H.IOResults> {
        const results: H.IOResults = {
            success: false,
            error: 'Not Implemented'
        };
        fileName;
        return results;
    }

    async validate(): Promise<H.IOResults> {
        const results: H.IOResults = {
            success: false,
            error: 'Not Implemented'
        };
        return results;
    }

    get hash(): string {
        return this._hash;
    }

    get location(): string {
        return this._location;
    }

    get objectRoot(): string {
        return this._objectRoot;
    }

    versionRoot(version: number): string {
        return path.join(this._objectRoot, `v${version}`);
    }

    private async initializeStructure(forReading: boolean): Promise<H.IOResults> {
        // Ensure object root directory exists
        let ioResults: H.IOResults;
        ioResults = forReading
            ? H.Helpers.fileOrDirExists(this._objectRoot)
            : H.Helpers.initializeDirectory(this._objectRoot, 'OCFL Object Root');
        if (!ioResults.success)
            return ioResults;

        // Ensure initialization of OCFL Object Root "NAMASTE" file
        const source: string = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageObjectNamasteFilename);
        let dest: string = path.join(this._objectRoot, ST.OCFLStorageObjectNamasteFilename);
        ioResults = forReading
            ? H.Helpers.fileOrDirExists(dest)
            : H.Helpers.initializeFile(source, dest, 'OCFL Object Root Namaste File');
        if (!ioResults.success)
            return ioResults;

        // If reading, validate that the root inventory file exists
        if (forReading) {
            const invResults = INV.OCFLInventory.readFromDisk(this);
            if (!invResults.success || !invResults.ocflInventory) {
                ioResults.success = false;
                ioResults.error = invResults.error ? invResults.error : `Failed to read inventory for ${this}`;
                return ioResults;
            }

            const ocflInventory: INV.OCFLInventory = invResults.ocflInventory;
            if (ocflInventory.headVersion <= 0) {
                ioResults.success = false;
                ioResults.error = `Invalid inventory file for ${this}`;
                return ioResults;
            }

            // additional validations here, when needed:
            // validate that headVersion's inventory matches root inventory
        }

        // Validate version information:
        if (this._version > 0) {
            dest = this.computeLocationObjectVersionRoot(this._storageKey, this._version, this._staging);
            ioResults = H.Helpers.fileOrDirExists(dest);
            if (forReading) {
                // if reading, validate that the version root exists
                if (!ioResults.success)
                    return ioResults;
            } else {
                // if writing, validate that the current version root does not exist, and the previous version root (if any) exists
                if (ioResults.success) {
                    ioResults.success = false;
                    ioResults.error = 'Attempting to write to existing version!';
                    return ioResults;
                }

                for (let ver = this._version - 1; ver > 0; ver--) {
                    dest = this.computeLocationObjectVersionRoot(this._storageKey, ver, this._staging);
                    ioResults = H.Helpers.fileOrDirExists(dest);
                    if (!ioResults.success)
                        return ioResults;
                }
            }
        }

        // Validate filename information:
        if (this._fileName) {
            dest = this.computeLocationObjectVersionContent(this._storageKey, this._version, this._fileName, this._staging);
            ioResults = H.Helpers.fileOrDirExists(dest);
            if (forReading) {
                // if reading, validate that the content exists:
                if (!ioResults.success)
                    return ioResults;
            } else {
                // if writing, validate the the content does not exist
                if (ioResults.success) {
                    ioResults.success = false;
                    ioResults.error = 'Attempting to write to existing file!';
                    return ioResults;
                }
            }
        }

        ioResults.success = true;
        return ioResults;
    }

    private loadFromStorage(validate: boolean): H.IOResults {
        validate;
        return {
            success: false,
            error: 'Not implemented'
        };
    }
}