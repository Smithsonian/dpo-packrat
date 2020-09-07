import * as fs from 'fs-extra';
import { join } from 'path';
import * as LOG from '../logger';
import * as H from '../helpers';
import * as ZIP from '../zipStream';
// import { logStringArray } from '../../tests/utils/zipStream.test';

const BAGIT_BAG_DECLARATION: string = 'bagit.txt';
const BAGIT_BAG_METADATA: string = 'bag-info.txt';
const BAGIT_DATA_DIRECTORY: string = 'data/';

// Detect special bagit files
// match[2] = prefix directory name
// match[3] = special file name
// match[4] = 'tag' if this is a tag-manifest
// match[5] != '' if this is a manifest
const BAGIT_SPECIAL_FILES_REGEX = /((.*)[/\\])?(bagit.txt|bag-info.txt|(tag)?manifest-(.+).txt)$/;
const BAGIT_MANIFEST_ENTRY_REGEX = /(.*)\s+(.*)/;

/** c.f. https://tools.ietf.org/html/draft-kunze-bagit-17 */
export class BagitReader {
    private _zip: ZIP.ZipStream | null = null;
    private _files: string[] = [];
    private _fileValidationMap: Map<string, boolean> = new Map<string, boolean>(); // map of filename.ToLowerCase() -> present in manifest with valid hash; these names are potentially prefixed with a folder in which the bagit contents are found

    private _dataFileMap: Map<string, string> = new Map<string, string>(); // Map of data filename -> hash
    private _hashAlgorithm: string = '';

    private _validated: boolean = false;
    private _valid: boolean = false;
    private _prefixDir: string | null = null;

    async loadFromZipStream(inputStream: NodeJS.ReadableStream, validate: boolean): Promise<H.IOResults> {
        this._zip = new ZIP.ZipStream(inputStream);
        const results: H.IOResults = await this._zip.load();
        if (!results.success)
            return results;
        this._files = this._zip.justFiles;

        // logStringArray(this._files, 'ZIP ');
        return validate ? await this.validate() : results;
    }

    async loadFromDirectory(directory: string, validate: boolean): Promise<H.IOResults> {
        const fileList: string[] | null = await H.Helpers.getDirectoryEntriesRecursive(directory);
        if (!fileList)
            return { success: false, error: `Unable to read ${directory}` };
        this._files = fileList;

        // logStringArray(this._files, 'DIR ');
        return validate ? await this.validate() : { success: true, error: '' };
    }

    private prefixedFilename(file: string): string {
        /* istanbul ignore else */
        if (this._prefixDir) {
            if (!file.startsWith(this._prefixDir)) {
                file = join(this._prefixDir, file);
                if (this._zip)
                    file = file.replace(/\\/g, '/'); // if we are reading from a zip and on a Windows system, update path separators to be / after the join call above
            }
        }
        return file;
    }

    async getFileStream(file: string): Promise<NodeJS.ReadableStream | null> {
        const fileName: string = this.prefixedFilename(file);
        // LOG.logger.info(`getFileStream(${file}) looking in ${fileName}`);

        return (this._zip)
            ? await this._zip.streamContent(fileName)
            : await fs.createReadStream(fileName);
    }

    async getValid(): Promise<boolean> {
        return this._validated ? this._valid : (await this.validate()).success;
    }

    async getDataFileMap(): Promise<Map<string, string>> {
        if (!this._validated)
            await this.validate();
        return this._dataFileMap; // new Map<string, string>(this._dataFileMap);
    }

    async getHashAlgorithm(): Promise<string> {
        if (!this._validated)
            await this.validate();
        return this._hashAlgorithm;
    }

    async validate(): Promise<H.IOResults> {
        if (this._validated)
            return { success: this._valid, error: '' };

        this._validated = true;
        if (this._files.length == 0)
            return { success: false, error: 'No files found' };

        const algorithmMapManifest: Map<string, string> = new Map<string, string>(); // map of algorithm -> manifest file name
        const algorithmMapTagManifest: Map<string, string> = new Map<string, string>(); // map of algorithm -> manifest file name
        const bagSpecialRegex: RegExp = new RegExp(BAGIT_SPECIAL_FILES_REGEX);

        let foundBagDeclaration: boolean = false;
        let foundBagMetadata: boolean = false;
        let foundManifest: boolean = false;
        let foundTagManifest: boolean = false;
        let foundDataDirectory: boolean = false;
        for (const file of this._files) {
            let recordValidated: boolean = false; // set to false initially until after we parse the manifest
            // file = file.replace(/\\/g, '/');

            // look for special files
            // match[2] = prefix directory name
            // match[3] = special file name
            // match[4] = 'tag' if this is a tag-manifest
            // match[5] != '' if this is a manifest
            const regexResults = bagSpecialRegex.exec(file);
            if (regexResults && regexResults.length == 6) {
                const prefixDirInstance: string = regexResults[2];
                if (this._prefixDir == null)
                    this._prefixDir = prefixDirInstance;
                else if (this._prefixDir != prefixDirInstance)
                    return { success: false, error: `Inconsistent prefix directory ${prefixDirInstance} vs ${this._prefixDir}` };

                switch(regexResults[3].toLowerCase()) {
                    case BAGIT_BAG_DECLARATION:
                        foundBagDeclaration = true;
                        // LOG.logger.info(`Found Bag Declaration ${file}`);
                        break;
                    case BAGIT_BAG_METADATA:
                        foundBagMetadata = true;
                        // LOG.logger.info(`Found Bag Metadata ${file}`);
                        break;
                }

                const foundTag: string = regexResults[4];
                const algorithm: string = regexResults[5] ? regexResults[5].toLowerCase() : '';

                // look for manifest files; extract algorithm
                if (algorithm) {
                    // validate algorithm:
                    switch (algorithm) {
                        case 'md4': break;      // ok
                        case 'md5': break;      // ok
                        case 'sha1': break;     // ok
                        case 'sha256': break;   // ok
                        case 'sha384': break;   // ok
                        case 'sha512': break;   // ok
                        default:
                            return { success: false, error: `Unexpected manifest algorithm ${algorithm} for manifest ${file}` };
                    }

                    if (!foundTag) {
                        foundManifest = true;
                        algorithmMapManifest.set(algorithm, file);
                        // LOG.logger.info(`Found Manifest ${file}, Algorithm ${algorithm}`);
                    } else {
                        foundTagManifest = true;
                        algorithmMapTagManifest.set(algorithm, file);
                        // LOG.logger.info(`Found Tag Manifest ${file}, Algorithm ${algorithm}`);
                        recordValidated = true; // tag manifests are not themselves present in other manifests, so record them in our fileValidationMap as valid
                    }
                }
            } else /* istanbul ignore next */ {
                if (this._prefixDir && !file.startsWith(this._prefixDir))
                    return { success: false, error: `File ${file} does not start with prefix directory ${this._prefixDir}` };
            }

            // LOG.logger.info(`FileValidation Adding ${file.toLowerCase()} -> ${recordValidated}`);
            this._fileValidationMap.set(file.toLowerCase(), recordValidated);
            if (file.toLowerCase().replace(/\\/g, '/').includes(BAGIT_DATA_DIRECTORY.toLowerCase()))    // adjust path delimeter for this test
                foundDataDirectory = true;
        }

        // verify bagit.txt exists; contents must match:
        // BagIt-Version: M.N
        // Tag-File-Character-Encoding: ENCODING (should be UTF-8)
        if (!foundBagDeclaration)
            return { success: false, error: `Invalid Bagit: missing ${BAGIT_BAG_DECLARATION} bag declaration` };

        // verify bag-info.txt exists; ignore contents for now
        if (!foundBagMetadata)
            return { success: false, error: `Invalid Bagit: missing ${BAGIT_BAG_METADATA} bag metadata` };

        // verify manifest-XXX.txt exists,    where XXX is the hashing algorithm being used (expect sha1, sha512, sha256) ... may be multiple
        if (!foundManifest)
            return { success: false, error: 'Invalid Bagit: missing manifest' };
        // verify tagmanifest-XXX.txt exists, where XXX is the hashing algorithm being used (expect sha1, sha512, sha256) ... may be multiple
        if (!foundTagManifest)
            return { success: false, error: 'Invalid Bagit: missing tag manifest' };

        // verify that algorithms for manifest and tag manifest have been specified and match
        if (!H.Helpers.iterablesEqual(algorithmMapManifest.keys(), algorithmMapTagManifest.keys()))
            return { success: false, error: 'Invalid Bagit: manifests have differing hash algorithms' };

        // verify that the data/ folder exists
        if (!foundDataDirectory)
            return { success: false, error: `Invalid Bagit: missing ${BAGIT_DATA_DIRECTORY} directory` };

        // construct full list of files
        //     for each, compute the XXX hash
        //     confirm that the hash and file appear in the correct manifest file
        //         manifest-XXX.txt for items in data/
        //         tagmanifest-XXX.txt for non data/
        //         the file tagmanifest-XXX.txt should not be present in either file
        for (const algorithm of algorithmMapManifest.keys()) {
            this._hashAlgorithm = algorithm; // last one wins

            // validate data manifest entries
            let manifestFile: string | undefined = algorithmMapManifest.get(algorithm);
            /* istanbul ignore if */
            if (!manifestFile) {
                LOG.logger.error(`Unexpected hash algorithm ${algorithm}`);
                continue;
            }

            let validateManifestResults = await this.validateManifest(manifestFile, algorithm);
            if (!validateManifestResults.success)
                return validateManifestResults;

            // validate tag manifest entries
            manifestFile = algorithmMapTagManifest.get(algorithm);
            /* istanbul ignore if */
            if (!manifestFile) {
                LOG.logger.error(`Unexpected hash algorithm ${algorithm}`);
                continue;
            }

            validateManifestResults = await this.validateManifest(manifestFile, algorithm);
            if (!validateManifestResults.success)
                return validateManifestResults;
        }

        // scan this._fileMap for unvalidated files
        for (const [file, validated] of this._fileValidationMap) {
            // LOG.logger.info(`Final validation of ${file}: ${validated}`);
            if (!validated)
                return { success: false, error: `Invalid Bagit: file ${file} not found in manifest` };
        }

        this._valid = true;
        return { success: true, error: '' };
    }

    private async validateManifest(manifestFile: string, algorithm: string): Promise<H.IOResults> {
        const manifestEntryRegex: RegExp = new RegExp(BAGIT_MANIFEST_ENTRY_REGEX);
        // LOG.logger.info(`Validate Manifest ${manifestFile}, algorithm ${algorithm}`);

        // load manifest file
        const stream: NodeJS.ReadableStream | null = await this.getFileStream(manifestFile); /* istanbul ignore next */
        if (!stream)
            return { success: false, error: `Invalid Bagit: unable to read manifest ${manifestFile}` };
        const buffer: Buffer | null = await H.Helpers.readFileFromStream(stream); /* istanbul ignore next */
        if (!buffer)
            return { success: false, error: `Invalid Bagit: unable to read manifest ${manifestFile}` };

        let manifestData: string = '';
        try {
            manifestData = buffer.toString('utf8');
            // LOG.logger.info(`Parsing manifest data:\n${manifestData}`);
        } catch (error) /* istanbul ignore next */ {
            return { success: false, error: `Invalid Bagit: invalid manifest ${manifestFile}` };
        }

        // parse into map of file -> hash
        const manifestLines: string[] = manifestData.split(/[\r\n]+/);
        for (const line of manifestLines) {
            // LOG.logger.info(`Processing manifest line ${line}`);
            if (!line)
                continue;
            const regexResult = manifestEntryRegex.exec(line);
            if (!regexResult || regexResult.length != 3)
                return { success: false, error: `Invalid Bagit: invalid manifest entry in ${manifestFile}` };
            const hash: string = regexResult[1];
            const fileName: string = regexResult[2];
            const manifestEntryStream: NodeJS.ReadableStream | null = await this.getFileStream(fileName);
            if (!manifestEntryStream)
                return { success: false, error: `Invalid Bagit: invalid manifest entry ${fileName} in ${manifestFile} ` };

            // verify file exists; compute & verify hashes; mark files as validated in this._fileMap
            const hashResults = await H.Helpers.computeHashFromStream(manifestEntryStream, algorithm); /* istanbul ignore next */
            if (!hashResults.success)
                return hashResults;

            if (hashResults.hash != hash)
                return { success: false, error: `Invalid Bagit: invalid manifest ${algorithm} hash for ${fileName}` };

            const prefixedFileName: string = this.prefixedFilename(fileName); /* istanbul ignore next */
            if (!this._fileValidationMap.has(prefixedFileName.toLowerCase()))
                return { success: false, error: `Invalid Bagit: manifest entry ${prefixedFileName} not found in bagit` };

            // File exists and has a valid hash; record it in our local validation this._fileMap, and record data in our persistent dataFileMap
            this._fileValidationMap.set(prefixedFileName.toLowerCase(), true);
            this._dataFileMap.set(fileName, hash); // last one wins
        }
        return { success: true, error: '' };
    }
}
