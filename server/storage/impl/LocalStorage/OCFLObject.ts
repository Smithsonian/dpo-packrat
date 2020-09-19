/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs-extra';
import * as path from 'path';
import * as L from 'lodash';
import { OperationInfo } from '../../interface/IStorage';
import * as INV from './OCFLInventory';
import * as ST from './SharedTypes';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';

export type OCFLObjectInitResults = {
    ocflObject: OCFLObject | null,
    success: boolean,
    error: string,
};

export type OCFLPathAndHash = {
    path: string;
    hash: string;
};

export class OCFLObject {
    private _storageKey: string = '';
    private _createIfMissing: boolean = false;

    private _objectRoot: string = '';
    private _ocflInventory: INV.OCFLInventory | null = null;
    private _newObject: boolean = false;

    async initialize(storageKey: string, objectRoot: string, createIfMissing: boolean): Promise<OCFLObjectInitResults> {
        this._storageKey = storageKey;
        this._objectRoot = objectRoot;
        this._createIfMissing = createIfMissing;

        const retValue: OCFLObjectInitResults = {
            ocflObject: null,
            success: false,
            error: ''
        };

        // Verify structure / create structure
        let ioResults = await this.initializeStructure(); // sets this._newObject
        if (!ioResults.success) {
            retValue.success = false;
            retValue.error = ioResults.error;
            return retValue;
        }

        // load inventory
        ioResults = await this.ensureInventoryIsLoaded();
        /* istanbul ignore next */
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
     * Updating: Changes the content pointed to by a content path. The path must exist in the previous version of the OCFL Object,
     * and the content cannot have existed in any earlier versions of the object.
     * @param pathOnDisk Full path to added content's bits on disk; may be null if only metadata is being updated; must be null if inputStream is specified
     * @param inputStream Readable stream of added content's bits; may be null if only metadata is being updated; must be null if pathOnDisk is specified
     * @param fileName Name (and path) of added content's bits; may be null if only metadata is being updated
     * @param metadata Optional metadata record that accompanies this content addition
     * @param opInfo Operation Info, specifying a message and user context for the operation
     */
    async addOrUpdate(pathOnDisk: string | null, inputStream: NodeJS.ReadableStream | null,
        fileName: string | null, metadata: any | null, opInfo: OperationInfo): Promise<H.IOResults> {
        if (pathOnDisk && inputStream) {
            const error: string = 'OCFLObject.addOrUpdate called with both a file and a stream';
            LOG.logger.error(error);
            return { success: false, error };
        }

        // Prepare new version in inventory
        let results: H.IOResults = await this.addVersion(opInfo);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        results = await this.addOrUpdateWorker(pathOnDisk, inputStream, fileName, metadata);
        if (!results.success)
            await this.rollbackVersion();
        return results;
    }

    private async addOrUpdateWorker(pathOnDisk: string | null, inputStream: NodeJS.ReadableStream | null,
        fileName: string | null, metadata: any | null): Promise<H.IOResults> {
        let results: H.IOResults = {
            success: false,
            error: ''
        };

        if (!((pathOnDisk || inputStream) && fileName) && !metadata) {
            results.success = false;
            results.error = 'No information specified';
            return results;
        }

        // Read current inventory, if any
        /* istanbul ignore next */
        if (!this._ocflInventory) {
            results.success = false;
            results.error = 'Unable to compute OCFL Inventory';
            return results;
        }

        const version: number = this._ocflInventory.headVersion;
        const destFolder: string = this.versionContentFullPath(version);
        const contentPath: string = OCFLObject.versionContentPartialPath(version);

        if (fileName) {
            const destName = path.join(destFolder, fileName);
            let hashResults: H.HashResults = { hash: '', success: false, error: '' };
            if (pathOnDisk) {
                // Compute hash
                hashResults = await H.Helpers.computeHashFromFile(pathOnDisk, ST.OCFLDigestAlgorithm);
                if (!hashResults.success)
                    return hashResults;     // if we fail to compute the hash, don't move the file below!

                // Move file to new version folder
                results = await H.Helpers.moveFile(pathOnDisk, destName);
            } else /* istanbul ignore else */ if (inputStream) {
                // We need to both compute the hash and stream bytes to the right location
                const hashResultsPromise = H.Helpers.computeHashFromStream(inputStream, ST.OCFLDigestAlgorithm);
                const writeFilesPromise = H.Helpers.writeStreamToStream(inputStream, fs.createWriteStream(destName));
                const resultsArray = await Promise.all([hashResultsPromise, writeFilesPromise]);
                [ hashResults, results ] = resultsArray;
                if (!hashResults.success)
                    return hashResults;
            }
            if (!results.success)
                return results;
            // Update Inventory
            this._ocflInventory.addContent(path.join(contentPath, fileName), fileName, hashResults.hash);
        }

        /* istanbul ignore else */
        if (metadata) {
            // serialize metadata to new version folder & compute hash
            const metadataFilename: string = ST.OCFLMetadataFilename;
            const hashResults: H.HashResults = await H.Helpers.writeJsonAndComputeHash(path.join(destFolder, metadataFilename), metadata, ST.OCFLDigestAlgorithm);
            /* istanbul ignore next */
            if (!hashResults.success)
                return hashResults;

            // Update Inventory
            this._ocflInventory.addContent(path.join(contentPath, metadataFilename), metadataFilename, hashResults.hash);
        }

        // Save Inventory and Inventory Digest to new version folder
        results = await this._ocflInventory.writeToDiskVersion(this);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        // Save Inventory and Inventory Digest to root folder
        results = await this._ocflInventory.writeToDisk(this);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        return results;
    }

    /**
     * Renaming: Changes the file path of existing content. The path cannot exist in the previous version of the OCFL Object,
     * and the content cannot have existed in any earlier versions of the object.
     * @param fileNameOld
     * @param fileNameNew
     */
    async rename(fileNameOld: string, fileNameNew: string, opInfo: OperationInfo): Promise<H.IOResults> {
        // Prepare new version in inventory
        let results: H.IOResults = await this.addVersion(opInfo);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        results = await this.renameReinstateWorker(fileNameOld, fileNameNew, -1); // -1 means most recent version
        if (!results.success)
            await this.rollbackVersion();
        return results;
    }

    /**
     * Reinstatement: Makes content from a version earlier than the previous version available in the current version
     * of an OCFL Object. The content must exist in an earlier version (removed "and not the previous version"). The file path may
     * exist in the previous version, effectively updating the file path with older content, or it may not, effectively
     * adding the older content as a new file.
     * @param fileName File to reinstate
     * @param version Version number to reinstate; -1 means most recent version
     */
    async reinstate(fileName: string, version: number, opInfo: OperationInfo): Promise<H.IOResults> {
        // Prepare new version in inventory
        let results: H.IOResults = await this.addVersion(opInfo);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        results = await this.renameReinstateWorker(fileName, fileName, version);
        if (!results.success)
            await this.rollbackVersion();
        return results;
    }

    async renameReinstateWorker(fileNameOld: string, fileNameNew: string, versionToReinstate: number): Promise<H.IOResults> {
        let results: H.IOResults;

        // update inventory with new version
        // Read current inventory, if any
        /* istanbul ignore next */
        if (!this._ocflInventory) {
            return {
                success: false,
                error: 'Unable to compute OCFL Inventory'
            };
        }

        // find the versionToReinstate of old file in inventory; -1 -> most recent version
        const { path: contentPathSource, hash } = this._ocflInventory.getContentPathAndHash(fileNameOld, versionToReinstate);
        if (!contentPathSource) {
            return {
                success: false,
                error: `OCFLObject.rename: Unable to locate old file ${fileNameOld}`
            };
        }

        const version: number = this._ocflInventory.headVersion;

        // copy old file to new file in new version
        const fullPathSource: string = path.join(this._objectRoot, contentPathSource);
        const fullPathDest: string = this.fileLocationExplicit(fileNameNew, version);
        // LOG.logger.info(`Copying ${fullPathSource} to ${fullPathDest}`);
        results = await H.Helpers.copyFile(fullPathSource, fullPathDest, false);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        // record copied, renamed file
        const contentPathDest: string = path.join(OCFLObject.versionContentPartialPath(version), fileNameNew);
        // LOG.logger.info(`Calling OFCLInventory.addContent for ${fileNameNew} at ${contentPathDest}`);
        this._ocflInventory.addContent(contentPathDest, fileNameNew, hash);

        // remove old file from inventory, if we're changing names (reinstate uses this code, with fileNameOld === fileNameNew)
        // LOG.logger.info(`Calling OFCLInventory.removeContent for ${fileNameOld} at ${contentPathSource}`);
        /* istanbul ignore next */
        if (fileNameOld != fileNameNew && !this._ocflInventory.removeContent(contentPathSource, fileNameOld, hash))
            return {
                success: false,
                error: `Unable to remove ${fileNameOld} from OCFL Inventory`
            };

        // Save Inventory and Inventory Digest to new version folder
        results = await this._ocflInventory.writeToDiskVersion(this);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        // Save Inventory and Inventory Digest to root folder
        results = await this._ocflInventory.writeToDisk(this);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        return results;
    }

    /**
     * Deletion: Removes a file path and corresponding content from the current version of an OCFL Object.
     * The path and content remain available in earlier versions of the object.
     */
    async delete(fileName: string, opInfo: OperationInfo): Promise<H.IOResults> {
        // Prepare new version in inventory
        let results: H.IOResults = await this.addVersion(opInfo);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        results = await this.deleteWorker(fileName);
        if (!results.success)
            await this.rollbackVersion();
        return results;
    }

    async deleteWorker(fileName: string): Promise<H.IOResults> {
        // update inventory with new version
        // Read current inventory, if any
        /* istanbul ignore next */
        if (!this._ocflInventory) {
            return {
                success: false,
                error: 'Unable to compute OCFL Inventory'
            };
        }

        // find most recent version of old file in inventory -- locate path
        const { path: contentPathSource, hash } = this._ocflInventory.getContentPathAndHash(fileName);
        if (!contentPathSource) {
            return {
                success: false,
                error: `OCFLObject.rename: Unable to locate old file ${fileName}`
            };
        }

        // remove old file from inventory
        if (!this._ocflInventory.removeContent(contentPathSource, fileName, hash))
            return {
                success: false,
                error: `Unable to remove ${fileName} from OCFL Inventory`
            };

        // Save Inventory and Inventory Digest to new version folder
        let results: H.IOResults = await this._ocflInventory.writeToDiskVersion(this);
        /* istanbul ignore next */
        if (!results.success)
            return results;

        // Save Inventory and Inventory Digest to root folder
        results = await this._ocflInventory.writeToDisk(this);
        /* istanbul ignore next */
        if (!results.success)
            return results;

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
        let ioResults: H.IOResults;
        let dest: string = this._objectRoot;

        // Confirm directory exists
        ioResults = await H.Helpers.fileOrDirExists(dest);
        if (!ioResults.success)
            return ioResults;

        // Confirm namaste exists and is valid
        dest = path.join(this._objectRoot, ST.OCFLStorageObjectNamasteFilename);
        ioResults = await H.Helpers.fileOrDirExists(dest);
        if (!ioResults.success)
            return ioResults;

        ioResults = await H.Helpers.filesMatch(dest, path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageObjectNamasteFilename));
        if (!ioResults.success)
            return ioResults;

        // Confirm root inventory exists
        let invResults = await INV.OCFLInventory.readFromDisk(this);
        if (!invResults.success || !invResults.ocflInventory) {
            ioResults.success = false;
            ioResults.error = invResults.error ? invResults.error : /* istanbul ignore next */ `Failed to read inventory for ${this._storageKey}`;
            return ioResults;
        }

        const ocflInventoryRoot: INV.OCFLInventory = invResults.ocflInventory;
        const maxVersion: number = ocflInventoryRoot.headVersion;
        /* istanbul ignore next */
        if (maxVersion <= 0) {
            ioResults.success = false;
            ioResults.error = `Invalid inventory file for ${this._storageKey}`;
            LOG.logger.error(ioResults.error);
            return ioResults;
        }
        ioResults = await ocflInventoryRoot.validate(this, true);
        if (!ioResults.success) {
            LOG.logger.error(ioResults.error);
            return ioResults;
        }

        // Validate each inventory
        for (let version: number = 1; version <= maxVersion; version++) {
            invResults = await INV.OCFLInventory.readFromDiskVersion(this, version);
            if (!invResults.success || !invResults.ocflInventory) {
                ioResults.success = false;
                ioResults.error = invResults.error ? invResults.error : /* istanbul ignore next */ `Failed to read inventory for ${this._storageKey}, version ${version}`;
                LOG.logger.error(ioResults.error);
                return ioResults;
            }

            const ocflInventory: INV.OCFLInventory = invResults.ocflInventory;
            ioResults = await ocflInventory.validate(this, false);
            /* istanbul ignore next */
            if (!ioResults.success) {
                LOG.logger.error(ioResults.error);
                return ioResults;
            }

            // Confirm root inventory matches latest version inventory
            if (version == ocflInventoryRoot.headVersion) {
                if (!L.isEqual(ocflInventory, ocflInventoryRoot)) {
                    ioResults.success = false;
                    ioResults.error = `Root inventory does not match head inventory for ${this._storageKey}`;
                    LOG.logger.error(ioResults.error);
                    return ioResults;
                }
            }

            // Confirm inventory version number matches
            if (version != ocflInventory.headVersion) {
                ioResults.success = false;
                ioResults.error = `Invalid inventory version for ${this._storageKey}: observed ${ocflInventory.headVersion}, expected ${version}`;
                LOG.logger.error(ioResults.error);
                return ioResults;
            }
        }

        // Confirm all files on disk are present in root inventory and have correct hashes
        const fileMap: Map<string, string> = ocflInventoryRoot.manifest.getFileMap();
        const fileList: string[] | null = await H.Helpers.getDirectoryEntriesRecursive(this._objectRoot);
        /* istanbul ignore if */
        if (!fileList) {
            ioResults.success = false;
            ioResults.error = `Unable to read filelist from directory from ${this._objectRoot}`;
            LOG.logger.error(ioResults.error);
            return ioResults;
        }

        for (const fileName of fileList) {
            const relName: string = path.relative(this._objectRoot, fileName);
            const baseName: string = path.basename(fileName);
            // LOG.logger.info(`Examining ${fileName}; relName ${relName}; basename ${baseName}`);

            // Skip Inventory, Inventory Digest, and Namaste file
            if (baseName == ST.OCFLStorageObjectInventoryFilename ||
                baseName == ST.OCFLStorageObjectInventoryDigestFilename ||
                baseName == ST.OCFLStorageObjectNamasteFilename)
                continue;

            const hash: string | undefined = fileMap.get(relName);
            if (!hash) {
                ioResults.success = false;
                ioResults.error = `No hash found for ${relName} in manifest ${JSON.stringify(fileMap)}`;
                LOG.logger.error(ioResults.error);
                return ioResults;
            }

            ioResults = await H.Helpers.fileOrDirExists(fileName);
            /* istanbul ignore if */
            if (!ioResults.success) {
                LOG.logger.error(ioResults.error);
                return ioResults;
            }

            const hashResults: H.HashResults = await H.Helpers.computeHashFromFile(fileName, ST.OCFLDigestAlgorithm);
            /* istanbul ignore if */
            if (!hashResults.success) {
                LOG.logger.error(hashResults.error);
                return hashResults;
            }

            if (hash != hashResults.hash) {
                ioResults.success = false;
                ioResults.error = `Computed hash for ${fileName} does not match; expected ${hash}; observed ${hashResults.hash}`;
                LOG.logger.error(ioResults.error);
                return ioResults;
            }
        }

        ioResults.success = true;
        return ioResults;
    }

    /** e.g. STORAGEROOT/REPO/35/6a/19/356a192b7913b04c54574d18c28d46e6395428ab/ */
    get objectRoot(): string {
        return this._objectRoot;
    }

    /** e.g. STORAGEROOT/REPO/35/6a/19/356a192b7913b04c54574d18c28d46e6395428ab/v1 */
    versionRoot(version: number): string {
        return path.join(this._objectRoot, OCFLObject.versionFolderName(version));
    }

    /** e.g. STORAGEROOT/REPO/35/6a/19/356a192b7913b04c54574d18c28d46e6395428ab/v1/content */
    versionContentFullPath(version: number): string {
        return path.join(this.versionRoot(version), ST.OCFLStorageObjectContentFolder);
    }

    /** e.g. v1/content */
    static versionContentPartialPath(version: number): string {
        return path.join(OCFLObject.versionFolderName(version), ST.OCFLStorageObjectContentFolder);
    }

    /** e.g. v1 */
    static versionFolderName(version: number): string {
        return `v${version}`;
    }

    /** Use to compute the location in which to place a specific version of a specific file. Note that files stored may be in a different location due to
     * 'delta versioning', in which we don't make unnecessary copies of files when a new version is added to the OCFL Inventory.
     * e.g. STORAGEROOT/REPO/35/6a/19/356a192b7913b04c54574d18c28d46e6395428ab/v1/content/fileName */
    fileLocationExplicit(fileName: string, version: number): string {
        return path.join(this.versionContentFullPath(version), fileName);
    }

    /** version == -1 -> most recent version */
    fileLocationAndHash(fileName: string, version: number): OCFLPathAndHash | null {
        /* istanbul ignore next */
        if (!this._ocflInventory)
            return null;
        const pathAndHash: OCFLPathAndHash = this._ocflInventory.getContentPathAndHash(fileName, version);
        if (!pathAndHash.hash && !pathAndHash.path)
            return null;
        pathAndHash.path = path.join(this._objectRoot, pathAndHash.path);   // prepend object root to content path
        return pathAndHash;
    }

    /*
    fileHash(fileName: string, version: number): string {
        const pathAndHash: OCFLPathAndHash | null = this.fileLocationAndHash(fileName, version);
        return pathAndHash ? pathAndHash.hash : '';
    }

    fileLocation(fileName: string, version: number): string {
        const pathAndHash: OCFLPathAndHash | null = this.fileLocationAndHash(fileName, version);
        return pathAndHash ? pathAndHash.path : '';
    }
    */

    headVersion(): number {
        return this._ocflInventory ? this._ocflInventory.headVersion : /* istanbul ignore next */ 0;
    }

    private async initializeStructure(): Promise<H.IOResults> {
        // Ensure object root directory exists
        let ioResults: H.IOResults;
        ioResults = await H.Helpers.fileOrDirExists(this._objectRoot);
        if (!ioResults.success)
            this._newObject = true;
        if (this._createIfMissing)
            ioResults = await H.Helpers.initializeDirectory(this._objectRoot, 'OCFLObject Root');
        if (!ioResults.success)
            return ioResults;

        // Ensure initialization of OCFL Object Root "NAMASTE" file
        const source: string = path.join(ST.OCFLSourceDocsPath, ST.OCFLStorageObjectNamasteFilename);
        const dest: string = path.join(this._objectRoot, ST.OCFLStorageObjectNamasteFilename);
        ioResults = this._createIfMissing
            ? await H.Helpers.initializeFile(source, dest, 'OCFLObject Root Namaste File')
            : await H.Helpers.fileOrDirExists(dest);
        return ioResults;
    }

    private async ensureInventoryIsLoaded(): Promise<H.IOResults> {
        /* istanbul ignore else */
        if (!this._ocflInventory) {
            if (!this._newObject) {
                const results = await INV.OCFLInventory.readFromDisk(this);
                /* istanbul ignore if */
                if (!results.success || !results.ocflInventory) {
                    return {
                        success: false,
                        error: results.error
                    };
                }
                this._ocflInventory = results.ocflInventory;
            } else {
                this._ocflInventory = new INV.OCFLInventory();
                this._ocflInventory.id = this._storageKey;
            }
        }
        return {
            success: true,
            error: ''
        };
    }

    private async addVersion(opInfo: OperationInfo): Promise<H.IOResults> {
        // Read current inventory, if any
        /* istanbul ignore next */
        if (!this._ocflInventory)
            return {
                success: false,
                error: 'Unable to compute OCFL Inventory',
            };

        // Prepare new version in inventory
        this._ocflInventory.addVersion(opInfo);

        // Ensure new version folder exists
        const version: number = this._ocflInventory.headVersion;
        const destFolder: string = this.versionContentFullPath(version);
        return await H.Helpers.initializeDirectory(destFolder, 'OCFLObject Version');
    }

    private async rollbackVersion(): Promise<H.IOResults> {
        let retValue: H.IOResults = {
            success: false,
            error: ''
        };

        /* istanbul ignore next */
        if (!this._ocflInventory) {
            retValue.success = false;
            retValue.error = 'Unable to compute OCFL Inventory';
            return retValue;
        }

        const version: number = this._ocflInventory.headVersion;
        /* istanbul ignore else */
        if (version) {
            const destFolder: string = this.versionRoot(version);
            retValue = await H.Helpers.removeDirectory(destFolder, true);
        }
        /* istanbul ignore next */
        if (!this._ocflInventory.rollbackVersion()) {
            retValue.success = false;
            retValue.error = 'OCL Object Unable to roll back Inventory version';
            return retValue;
        }
        retValue.success = true;
        return retValue;
    }
}

