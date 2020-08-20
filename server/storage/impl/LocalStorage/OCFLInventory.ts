import * as fs from 'fs-extra';
import * as path from 'path';
import { OCFLObject } from './OCFLObject';
import * as ST from './SharedTypes';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';

/** Represents manifest information for either the entire inventory file or for a version state block.
 * Either way, this is an object whose property keys are file hashes and whose values are the list of
 * files with that hash. For the inventory file manifest, the filenames are the partial path to the file,
 * including the version number and content folder name, e.g. v1/content/LogicalPath/LogicalFilename.ext.
 * For the version state manifest, the filenames are just the logical portion of the name,
 * e.g. LogicalPath/LogicalFilename.ext. */
export class OCFLInventoryManifest {
    recordContent(filename: string, hash: string): void {
        if (!this[hash])
            this[hash] = [filename];
        else
            this[hash].push(filename);
    }

    getFilenameForHash(hash: string): string[] {
        if (!this[hash])
            return [];
        return this[hash];
    }

    getHashForFilename(fileName: string): string {
        // Walk properties
        // For each, walk value arrays
        for (const hash in this) {
            if (!Array.isArray(this[hash]))
                continue;
            const stringArray: Array<string> = <Array<string>><unknown>this[hash];
            for (const name of stringArray) {
                if (name === fileName)
                    return hash;
            }
        }
        return '';
    }
}

export class OFCLInventoryUser {
    constructor (userEmailAddress: string, userName: string) {
        this.address = userEmailAddress;
        this.name = userName;
    }
    address: string = '';
    name: string = '';
}

/** Represents information for a single version in the Inventory file. Contains creation information (date & user),
 * as well as an OCFLInventoryManifest (associated with the key "state"). This manifest is an object whose property keys
 * are file hashes, and whose values are the list of files that have that hash. Each file is represented by the logical
 * path to the content -- not using version numbers and "content" folders */
export class OCFLInventoryVersion {
    constructor(message: string, user: OFCLInventoryUser) {
        this.created = new Date().toISOString();
        this.message = message;
        this.user = user;
    }
    created: string = '';
    message: string = '';
    user: OFCLInventoryUser | undefined = undefined;
    state: OCFLInventoryManifest = new OCFLInventoryManifest();
}

/** Container object for OCFLInventoryVersion(s).  Note that each version is storage as a property, value pair.
 * The property is the string "v1", "v2", etc -- the version number; the value is an OCFLInventoryVersion object */
export class OCFLInventoryVersions {
    recordVersion(version: string, message: string, userEmailAddress: string, userName: string): boolean {
        if (this[version])
            return false;
        const user: OFCLInventoryUser = new OFCLInventoryUser(userEmailAddress, userName);
        this[version] = new OCFLInventoryVersion(message, user);
        return true;
    }

    recordState(version: string, logicalPath: string, hash: string): boolean {
        const inventoryVersion: OCFLInventoryVersion | null = this.getInventoryVersion(version);
        if (!inventoryVersion)
            return false;
        inventoryVersion.state.recordContent(logicalPath, hash);
        return true;
    }

    getInventoryVersion(version: string): OCFLInventoryVersion | null {
        if (!this[version])
            return null;
        return <OCFLInventoryVersion>(this[version]);
    }
}

export type OCFLInventoryReadResults = {
    ocflInventory: OCFLInventory | null;
    success: boolean;
    error: string;
};

/** Represents an OCFL Inventory file found both in the object root and in each version root.
 * The object root inventory matches the one found in the "head" version -- the most recent version.
 * Usage For New Items:
 *      - Create an OCFLInventory object via new OCFLInventory('UniqueIdentifier');
 *      - Call addVersion(), passing in an optional message ('Ingestion') and user email address and name
 *      - Call recordContent() once for each file present in the asset
 *      - Persist via writeToDisk().  Note that OCFL wants you to place this both in the object root and in the v1 folder
 * Usage For Existing Items, to add a new version:
 *      - Create an OCFLInventory object via readFromDisk(); don't specify a version -- read the root inventory
 *      - Call addVersion()
 *      - Call recordContent()
 *      - Persist via writeToDisk().  Note that OCFL wants you to place this both in the object root and in the new version folder
 */
export class OCFLInventory {
    id: string = '';
    head: string = '';
    digestAlgorithm: string = 'sha512';
    type: string = 'https://ocfl.io/1.0/spec/#inventory';
    manifest: OCFLInventoryManifest = new OCFLInventoryManifest();
    versions: OCFLInventoryVersions = new OCFLInventoryVersions();

    constructor(id: string) {
        this.id = id;
    }

    get headVersion(): number {
        return (!this.head) ? 0 : parseInt(this.head.substring(1));
    }

    hash(fileName: string, version: number): string {
        const versionString: string = OCFLObject.versionFolder(version);
        const ocflInventoryVersion: OCFLInventoryVersion | null = this.versions.getInventoryVersion(versionString);
        if (!ocflInventoryVersion || !ocflInventoryVersion.state)
            return '';
        return ocflInventoryVersion.state.getHashForFilename(fileName);
    }

    /** Call this before recording content! */
    addVersion(message: string, userEmailAddress: string, userName: string): void {
        const version: number = 1 + this.headVersion;
        this.head = OCFLObject.versionFolder(version);
        this.versions.recordVersion(this.head, message, userEmailAddress, userName);
    }

    /**
     * Call this after calling addVersion()
     * @param contentPath Path to content, including version number and 'content', e.g. v1/content/subdir/FOOBAR.txt
     * @param logicalPath Path to logical content, not including version number, e.g. subdir/FOOBAR.txt
     */
    recordContent(contentPath: string, logicalPath: string, hash: string): void {
        this.manifest.recordContent(contentPath, hash);
        this.versions.recordState(this.head, logicalPath, hash);
    }

    /** Write root inventory to disk */
    async writeToDisk(ocflObject: OCFLObject): Promise<H.IOResults> {
        return await this.writeToDiskWorker(ocflObject, 0);
    }

    /** Write version inventory to disk */
    async writeToDiskVersion(ocflObject: OCFLObject, version: number): Promise<H.IOResults> {
        return await this.writeToDiskWorker(ocflObject, version);
    }

    async writeToDiskWorker(ocflObject: OCFLObject, version: number): Promise<H.IOResults> {
        const dest: string = OCFLInventory.inventoryFilePath(ocflObject, version);
        try {
            fs.writeJsonSync(dest, this);

            // Compute hash
            const hashResults: H.HashResults = await H.Helpers.computeHashFromFile(dest, 'sha512');
            if (!hashResults.success)
                return hashResults;

            // write hash to inventory digest
            const digestContents: string = `${hashResults.hash} ${ST.OCFLStorageObjectInventoryFilename}`;
            const destDigest: string = OCFLInventory.inventoryDigestPath(ocflObject, version);
            fs.writeFileSync(destDigest, digestContents);

            return {
                success: true,
                error: ''
            };
        } catch (error) {
            LOG.logger.error('OCFLInventory.writeToDesk', error);
            return {
                success: false,
                error: JSON.stringify(error)
            };
        }
    }

    static inventoryFilePath(ocflObject: OCFLObject, version: number): string {
        const foldername: string = (version == 0) ? ocflObject.objectRoot : ocflObject.versionRoot(version);
        return path.join(foldername, ST.OCFLStorageObjectInventoryFilename);
    }

    static inventoryDigestPath(ocflObject: OCFLObject, version: number): string {
        const foldername: string = (version == 0) ? ocflObject.objectRoot : ocflObject.versionRoot(version);
        return path.join(foldername, ST.OCFLStorageObjectInventoryDigestFilename);
    }

    /** Read root inventory from disk */
    static readFromDisk(ocflObject: OCFLObject): OCFLInventoryReadResults {
        return OCFLInventory.readFromDiskWorker(ocflObject, 0);
    }

    /** Read version inventory from disk */
    static readFromDiskVersion(ocflObject: OCFLObject, version: number): OCFLInventoryReadResults {
        return OCFLInventory.readFromDiskWorker(ocflObject, version);
    }

    private static readFromDiskWorker(ocflObject: OCFLObject, version: number): OCFLInventoryReadResults {
        const retValue: OCFLInventoryReadResults = {
            ocflInventory: null,
            success: false,
            error: ''
        };

        const dest: string = OCFLInventory.inventoryFilePath(ocflObject, version);
        const ioResults = H.Helpers.fileOrDirExists(dest);
        if (!ioResults.success) {
            retValue.success = false;
            retValue.error = ioResults.error;
            return retValue;
        }

        try {
            retValue.ocflInventory = JSON.parse(fs.readFileSync(dest, { encoding: 'utf8' }));
        } catch (error) {
            LOG.logger.error('OCFLInventory.readFromDisk', error);
            retValue.success = false;
            retValue.error = JSON.stringify(error);
        }

        return retValue;
    }
}