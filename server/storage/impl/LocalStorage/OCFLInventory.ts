import * as fs from 'fs-extra';
import * as path from 'path';
import * as L from 'lodash';
import { OperationInfo } from '../../interface/IStorage';
import { OCFLObject } from './OCFLObject';
import * as ST from './SharedTypes';
import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';

export type OCFLInventoryManifestEntry = {
    hash: string;
    files: string[];
};

/** Represents manifest information for either the entire inventory file or for a version state block.
 * Either way, this is an object whose property keys are file hashes and whose values are the list of
 * files with that hash. For the inventory file manifest, the filenames are the partial path to the file,
 * including the version number and content folder name, e.g. v1/content/LogicalPath/LogicalFilename.ext.
 * For the version state manifest, the filenames are just the logical portion of the name,
 * e.g. LogicalPath/LogicalFilename.ext. */
export class OCFLInventoryManifest {
    addContent(fileName: string, hash: string): void {
        hash = hash.toLowerCase();
        // LOG.logger.info(`OCFLInventoryManifest.addContent ${fileName}: ${hash}`);

        // Look for fileName in existing data
        const fileMap: Map<string, string> = this.getFileMap();
        const existingHash: string | undefined = fileMap.get(fileName);
        if (existingHash) {                     // if we found it,
            if (existingHash === hash)          // and it matches our added hash
                return;                         // we're all done
            this.removeContent(fileName, existingHash); // otherwise, yank old entry
        }

        if (!this[hash])
            this[hash] = [fileName];
        else
            this[hash].push(fileName);
    }

    removeContent(fileName: string, hash: string): boolean {
        // LOG.logger.info(`OCFLInventoryManifest.removeContent ${fileName}: ${hash}`);
        hash = hash.toLowerCase();
        if (!this[hash])    // if we can't find this hash
            return false;   // error

        const stringArray: Array<string> = <Array<string>><unknown>this[hash];
        const matchIndex = stringArray.indexOf(fileName);
        if (matchIndex == -1)   // if we can't find our filename in the array
            return false;       // error

        // LOG.logger.info(`OCFLInventory.Manifest.removeContent found ${fileName} at ${matchIndex} in ${JSON.stringify(stringArray)}`);
        stringArray.splice(matchIndex, 1);     // yank our item
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
                // strip off v###/content/ and look for exact match on remainder ... check for both Windows and Unix path separators
                let contentIndex = name.indexOf('/' + ST.OCFLStorageObjectContentFolder + '/');
                if (contentIndex == -1)
                    contentIndex = name.indexOf('\\' + ST.OCFLStorageObjectContentFolder + '\\');
                if (contentIndex == -1)
                    continue;
                if (name.substring(contentIndex + ST.OCFLStorageObjectContentFolder.length + 2) === fileName) // + 2 for slashes
                    matches.push({ path: name, hash });
            }
        }

        if (matches.length == 0)
            return { path: '', hash: '' };
        matches.sort((s1, s2) => s2.path.localeCompare(s1.path)); // sort descending
        return matches[0];
    }

    getEntries(): OCFLInventoryManifestEntry[] {
        const entries: OCFLInventoryManifestEntry[] = [];
        for (const hash in this) {
            // LOG.logger.info(`OCFLInventoryManifest.getEntries hash = ${hash}; value = ${JSON.stringify(this[hash])}`);
            if (!Array.isArray(this[hash]))
                continue;
            const files: Array<string> = <Array<string>><unknown>this[hash];
            // LOG.logger.info(`OCFLInventoryManifest.getEntries pushing hash = ${hash}; files = ${JSON.stringify(files)}`);
            entries.push ({ hash, files });
        }
        // LOG.logger.info(`OCFLInventoryManifest.getEntries returning ${JSON.stringify(entries)}`);
        return entries;
    }

    /** Computes a map of fileName -> hash for each entry in the manifest */
    getFileMap(): Map<string, string> {
        const fileMap: Map<string, string> = new Map<string, string>(); // map of fileName -> hash
        for (const manifestEntry of this.getEntries()) {
            // LOG.logger.info(`OCFLInventoryManifest.getFileMap manifestEntry = ${JSON.stringify(manifestEntry)}`);
            for (const fileName of manifestEntry.files)
                fileMap.set(fileName, manifestEntry.hash);
        }
        return fileMap;
    }

    copy(prevState: OCFLInventoryManifest): void {
        for (const manifestEntry of prevState.getEntries())
            this[manifestEntry.hash] = L.clone(manifestEntry.files);
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
    addVersion(version: string, oldVersion: string, opInfo: OperationInfo): boolean {
        if (this[version])
            return false;
        this[version] = new OCFLInventoryVersion(opInfo);

        if (oldVersion && this[oldVersion]) {
            const prevState: OCFLInventoryManifest | undefined = this[oldVersion].state;
            if (prevState)
                this[version].state.copy(prevState);
        }
        return true;
    }

    removeVersion(version: string): boolean {
        if (!this[version])
            return false;
        delete this[version];
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

    getHashForFilename(version: string, fileName: string): string {
        const inventoryVersion: OCFLInventoryVersion | null = this.getInventoryVersion(version);
        if (!inventoryVersion || !inventoryVersion.state)
            return '';
        return inventoryVersion.state.getHashForFilename(fileName);
    }

    private getInventoryVersion(version: string): OCFLInventoryVersion | null {
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

export type OCFLInventoryType = {
    id: string;
    head: string;
    digestAlgorithm: string;
    type: string;
    manifest: OCFLInventoryManifest;
    versions: OCFLInventoryVersions;
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
export class OCFLInventory implements OCFLInventoryType {
    id: string = '';
    head: string = '';
    digestAlgorithm: string = ST.OCFLDigestAlgorithm;
    type: string = 'https://ocfl.io/1.0/spec/#inventory';
    manifest: OCFLInventoryManifest = new OCFLInventoryManifest();
    versions: OCFLInventoryVersions = new OCFLInventoryVersions();

    copy(source: OCFLInventoryType): void {
        this.id = source.id;
        this.head = source.head;
        this.digestAlgorithm = source.digestAlgorithm;
        this.type = source.type;
        Object.assign(this.manifest, source.manifest);
        Object.assign(this.versions, source.versions);
    }

    get headVersion(): number {
        return (!this.head) ? 0 : parseInt(this.head.substring(1));
    }

    hash(fileName: string, version: number): string {
        const versionString: string = OCFLObject.versionFolderName(version);
        return this.versions.getHashForFilename(versionString, fileName);
    }

    /** Call this before recording content! */
    addVersion(opInfo: OperationInfo): void {
        const oldVersion: number = this.headVersion;
        const version: number = oldVersion + 1;
        const oldVersionString: string = (oldVersion > 0) ? OCFLObject.versionFolderName(oldVersion) : '';

        this.head = OCFLObject.versionFolderName(version);
        this.versions.addVersion(this.head, oldVersionString, opInfo);
    }

    /** Call this when a transaction fails */
    rollbackVersion(): boolean {
        if (this.headVersion <= 0)
            return true;
        const oldVersion: number = this.headVersion - 1;
        const oldVersionString: string = (oldVersion > 0) ? OCFLObject.versionFolderName(oldVersion) : '';
        this.head = oldVersionString;
        return this.versions.removeVersion(this.head);
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
        contentPath;
        // if (!this.manifest.removeContent(contentPath, hash))
        //     return false;
        if (!this.versions.removeContentFromState(this.head, logicalPath, hash))
            return false;
        return true;
    }

    async validate(ocflObject: OCFLObject, isRootInventory: boolean): Promise<H.IOResults> {
        // LOG.logger.info(`OCFLInventory.validate ${JSON.stringify(this)}`);
        let results: H.IOResults;

        // Confirm conformance to spec
        // Confirm inventory hash exists, is well-formed, and matches inventory
        const inventoryFilename: string = OCFLInventory.inventoryFilePath(ocflObject, isRootInventory ? 0 : this.headVersion);
        results = H.Helpers.fileOrDirExists(inventoryFilename);
        if (!results.success)
            return results;

        const digestFilename: string = OCFLInventory.inventoryDigestPath(ocflObject, isRootInventory ? 0 : this.headVersion);
        results = H.Helpers.fileOrDirExists(digestFilename);
        if (!results.success)
            return results;

        let hashResults: H.HashResults = await H.Helpers.computeHashFromFile(inventoryFilename, ST.OCFLDigestAlgorithm);
        if (!hashResults.success)
            return hashResults;

        try {
            const digestContentsExpected: string = OCFLInventory.digestContents(hashResults.hash);
            const digestContents: string = fs.readFileSync(digestFilename);
            if (digestContentsExpected != digestContents) {
                results.success = false;
                results.error = `Inventory digest ${digestFilename} did not have expected contents; expected ${digestContentsExpected}; found ${digestContents}`;
                return results;
            }
        } catch (error) {
            results.success = false;
            results.error = `OCFLInventory.validate failed to read digestFile ${digestFilename}: ${error}`;
            LOG.logger.error(results.error, error);
            return results;
        }

        // Confirm files described in manifest exist and have correct hashes
        for (const manifestEntry of this.manifest.getEntries()) {
            for (const fileName of manifestEntry.files) {
                const filePath: string = path.join(ocflObject.objectRoot, fileName);
                hashResults = await H.Helpers.computeHashFromFile(filePath, ST.OCFLDigestAlgorithm);
                if (!hashResults.success)
                    return hashResults;
                if (hashResults.hash != manifestEntry.hash) {
                    results.success = false;
                    results.error = `OCFLInventory.validate found a different hash for ${filePath}; expected ${manifestEntry.hash}; found ${hashResults.hash}`;
                }
            }
        }

        // LOG.logger.info('OCFLInventory.validate done');
        results.success = true;
        return results;
    }

    /** Write root inventory to disk */
    async writeToDisk(ocflObject: OCFLObject): Promise<H.IOResults> {
        return await this.writeToDiskWorker(ocflObject, 0);
    }

    /** Write version inventory to disk */
    async writeToDiskVersion(ocflObject: OCFLObject): Promise<H.IOResults> {
        return await this.writeToDiskWorker(ocflObject, this.headVersion);
    }

    static digestContents(hash: string): string {
        return `${hash} ${ST.OCFLStorageObjectInventoryFilename}`;
    }

    async writeToDiskWorker(ocflObject: OCFLObject, version: number): Promise<H.IOResults> {
        const dest: string = OCFLInventory.inventoryFilePath(ocflObject, version);
        const hashResults: H.HashResults = await H.Helpers.writeJsonAndComputeHash(dest, this, ST.OCFLDigestAlgorithm);
        if (!hashResults.success)
            return hashResults;

        try {
            // write hash to inventory digest
            const digestContents: string = OCFLInventory.digestContents(hashResults.hash);
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
        // LOG.logger.info(`OCFLInventory.readFromDiskWorker ${dest}`);
        const ioResults = H.Helpers.fileOrDirExists(dest);
        if (!ioResults.success) {
            retValue.success = false;
            retValue.error = ioResults.error;
            LOG.logger.error(retValue.error);
            return retValue;
        }

        try {
            retValue.ocflInventory = new OCFLInventory();
            retValue.ocflInventory.copy(JSON.parse(fs.readFileSync(dest, { encoding: 'utf8' })));
            retValue.success = true;
        } catch (error) {
            LOG.logger.error('OCFLInventory.readFromDisk', error);
            retValue.success = false;
            retValue.error = JSON.stringify(error);
            LOG.logger.error(retValue.error);
        }

        // LOG.logger.info(`OCFLInventory.readFromDiskWorker ${dest} done`);
        return retValue;
    }
}