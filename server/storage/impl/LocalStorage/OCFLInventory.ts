import * as fs from 'fs-extra';
import * as path from 'path';
import { OperationInfo } from '../../interface/IStorage';
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
    addContent(filename: string, hash: string): void {
        hash = hash.toLowerCase();
        if (!this[hash])
            this[hash] = [filename];
        else
            this[hash].push(filename);
    }

    removeContent(filename: string, hash: string): boolean {
        hash = hash.toLowerCase();
        if (!this[hash])    // if we can't find this hash
            return false;   // error

        const stringArray: Array<string> = <Array<string>><unknown>this[hash];
        const matchIndex = stringArray.indexOf(filename);
        if (matchIndex == -1)   // if we can't find our filename in the array
            return false;       // error

        stringArray.splice(matchIndex);     // yank our item
        if (stringArray.length > 0)
            this[hash] = stringArray;       // if there are still entries, record the updated list
        else
            delete this[hash];              // otherwise, remove the entry for this hash
        return true;
    }

    getFilenameForHash(hash: string): string[] {
        hash = hash.toLowerCase();
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

    getLatestContentPathAndHash(fileName: string): { path: string, hash: string } {
        // Walk properties
        // For each, walk value arrays
        const matches: { path: string, hash: string }[] = [];
        for (const hash in this) {
            if (!Array.isArray(this[hash]))
                continue;
            const stringArray: Array<string> = <Array<string>><unknown>this[hash];
            for (const name of stringArray) {
                // strip off v###/content/ and look for exact match on remainder
                const contentIndex = name.indexOf('/content/');
                if (contentIndex == -1)
                    continue;
                if (name.substring(contentIndex + 9) === fileName)
                    matches.push({ path: name, hash });
            }
        }

        if (matches.length == 0)
            return { path: '', hash: '' };
        matches.sort((s1, s2) => s2.path.localeCompare(s1.path)); // sort descending
        return matches[0];
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
    constructor(opInfo: OperationInfo) {
        this.created = new Date().toISOString();
        this.message = opInfo.message;
        this.user = new OFCLInventoryUser(opInfo.userEmailAddress, opInfo.userName);
    }
    created: string = '';
    message: string = '';
    user: OFCLInventoryUser | undefined = undefined;
    state: OCFLInventoryManifest = new OCFLInventoryManifest();
}

/** Container object for OCFLInventoryVersion(s).  Note that each version is storage as a property, value pair.
 * The property is the string "v1", "v2", etc -- the version number; the value is an OCFLInventoryVersion object */
export class OCFLInventoryVersions {
    addVersion(version: string, opInfo: OperationInfo): boolean {
        if (this[version])
            return false;
        this[version] = new OCFLInventoryVersion(opInfo);
        return true;
    }

    addContentToState(version: string, logicalPath: string, hash: string): boolean {
        const inventoryVersion: OCFLInventoryVersion | null = this.getInventoryVersion(version);
        if (!inventoryVersion)
            return false;
        inventoryVersion.state.addContent(logicalPath, hash);
        return true;
    }

    removeContentFromState(version: string, logicalPath: string, hash: string): boolean {
        const inventoryVersion: OCFLInventoryVersion | null = this.getInventoryVersion(version);
        if (!inventoryVersion)
            return false;
        return inventoryVersion.state.removeContent(logicalPath, hash);
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
 * Usage For Existing Items, to add a new version:
 *      - Create an OCFLInventory object via readFromDisk(); don't specify a version -- read the root inventory
 * And then:
 *      - Call addVersion(), passing in an optional message ('Ingestion') and user email address and name
 *      - Call recordContent() once for each file present in the asset
 *      - Persist via writeToDisk().  Note that OCFL wants you to place this both in the object root and in the latest version folder
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
        const versionString: string = OCFLObject.versionFolderName(version);
        const ocflInventoryVersion: OCFLInventoryVersion | null = this.versions.getInventoryVersion(versionString);
        if (!ocflInventoryVersion || !ocflInventoryVersion.state)
            return '';
        return ocflInventoryVersion.state.getHashForFilename(fileName);
    }

    /** Call this before recording content! */
    addVersion(opInfo: OperationInfo): void {
        const version: number = 1 + this.headVersion;
        this.head = OCFLObject.versionFolderName(version);
        this.versions.addVersion(this.head, opInfo);
    }

    /**
     * Call this after calling addVersion()
     * @param contentPath Path to content, including version number and 'content', e.g. v1/content/subdir/FOOBAR.txt
     * @param logicalPath Path to logical content, not including version number, e.g. subdir/FOOBAR.txt
     */
    addContent(contentPath: string, logicalPath: string, hash: string): void {
        this.manifest.addContent(contentPath, hash);
        this.versions.addContentToState(this.head, logicalPath, hash);
    }

    removeContent(contentPath: string, logicalPath: string, hash: string): boolean {
        if (!this.manifest.removeContent(contentPath, hash))
            return false;
        if (!this.versions.removeContentFromState(this.head, logicalPath, hash))
            return false;
        return true;
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
        const hashResults: H.HashResults = await H.Helpers.writeJsonAndComputeHash(dest, this, 'sha512');
        if (!hashResults.success)
            return hashResults;

        try {
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