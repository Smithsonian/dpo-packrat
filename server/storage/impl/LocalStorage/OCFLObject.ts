/* eslint-disable @typescript-eslint/no-explicit-any */
import { OCFLRoot } from './OCFLRoot';
//import * as ST from './SharedTypes';
//import * as STORE from '../../interface';
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

    async initialize(storageKey: string, fileName: string, version: number, staging: boolean): Promise<OCFLObjectInitResults> {
        this._storageKey = storageKey;
        this._fileName = fileName;  // may be ''
        this._version = version;    // may be 0
        this._staging = staging;
        this._objectRoot = this._ocflRoot.computeLocationObjectRoot(this._storageKey, this._staging);

        return await this.initializeStructure();
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

    private async initializeStructure(): Promise<OCFLObjectInitResults> {
        this._fileName;
        this._version;
        this._objectRoot;
        // check for existence of directory
        return { ocflObject: null, success: false, error: 'Not Implemented' };
    }
}