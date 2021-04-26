import * as fs from 'fs-extra';
import * as path from 'path';
import * as LOG from '../logger';
import * as H from '../helpers';
import * as ZIPS from '../zipStream';
import * as ZIPF from '../zipFile';
import { IZip, zipFilterResults } from '../IZip';

const BAGIT_BAG_DECLARATION: string = 'bagit.txt';
const BAGIT_BAG_METADATA: string = 'bag-info.txt';
export const BAGIT_DATA_DIRECTORY: string = 'data/';

// Detect special bagit files
// match[2] = prefix directory name
// match[3] = special file name
// match[4] = 'tag' if this is a tag-manifest
// match[5] != '' if this is a manifest
const BAGIT_SPECIAL_FILES_REGEX = /((.*)[/\\])?(bagit.txt|bag-info.txt|(tag)?manifest-(.+).txt)$/;
const BAGIT_MANIFEST_ENTRY_REGEX = /(.*)\s+(.*)/;

/** exactly one of zipFileName, zipStream, or directory must be non-null */
export type BagitReaderParams = {
    zipFileName: string | null,                 // specifies path to on-disk zip file when non-null
    zipStream: NodeJS.ReadableStream | null,    // specifies stream of zip bits when non-null
    directory: string | null,                   // specifies directory within which is a bagit structure
    validate: boolean,                          // validate bagit structure and manifest
    validateContent: boolean                    // validate content (stream bits, compute hashes, and compare to values in the manifest)
};

/** c.f. https://tools.ietf.org/html/draft-kunze-bagit-17 */
export class BagitReader implements IZip {
    private _zip: IZip | null = null;
    private _files: string[] = [];
    private _fileValidationMap: Map<string, boolean> = new Map<string, boolean>(); // map of filename.ToLowerCase() -> present in manifest with valid hash; these names are potentially prefixed with a folder in which the bagit contents are found

    private _dataFileMap: Map<string, string> = new Map<string, string>(); // Map of data filename -> hash
    private _hashAlgorithm: string = '';

    private _validated: boolean = false;
    private _valid: boolean = false;
    private _prefixDir: string | null = null;

    private _dataDirectories: string[] = [];
    private _dataFiles: string[] = [];

    private _params: BagitReaderParams;

    constructor(params: BagitReaderParams) {
        this._params = params;
    }

    async load(): Promise<H.IOResults> {
        if (this._params.zipFileName)
            return await this.loadFromZipFile(this._params.zipFileName, this._params.validate);
        else if (this._params.zipStream)
            return await this.loadFromZipStream(this._params.zipStream, this._params.validate);
        else if (this._params.directory)
            return await this.loadFromDirectory(this._params.directory, this._params.validate);
        else
            return { success: false, error: 'Invalid BagitReader constructor params' };
    }

    async add(_fileNameAndPath: string, _inputStream: NodeJS.ReadableStream): Promise<H.IOResults> {
        return { success: false, error: 'Not Implemented' };
    }

    async getAllEntries(filter: string | null): Promise<string[]> {
        if (!this._validated)
            await this.validate();
        return zipFilterResults(this._files, filter);
    }

    async getJustFiles(filter: string | null): Promise<string[]> {
        if (!this._validated)
            await this.validate();
        if (!filter)
            return this._dataFiles;

        const allFiltered: string[] = zipFilterResults(this._files, filter);
        // LOG.info(`*JF* All ${JSON.stringify(this._dataFiles)}`, LOG.LS.eSYS);
        // LOG.info(`*JF* Filtered ${JSON.stringify(allFiltered)}`, LOG.LS.eSYS);

        const results: string[] = [];
        for (const fileName of allFiltered) {
            const { dirname, basename } = this.extractDirectoryAndBasename(fileName, true); /* istanbul ignore else */
            if (dirname && dirname.startsWith(filter)) {
                results.push(basename);
                // LOG.info(`*JF* *** ${fileName} -> ${dirname} ... ${basename}`, LOG.LS.eSYS);
            }
        }
        return results;
    }

    async getJustDirectories(filter: string | null): Promise<string[]> {
        if (!this._validated)
            await this.validate();
        if (!filter)
            return this._dataDirectories;
        const allFiltered: string[] = zipFilterResults(this._files, filter);
        const dirMap: Map<string, boolean> = new Map<string, boolean>();
        const results: string[] = [];
        for (const fileName of allFiltered) {
            const { dirname } = this.extractDirectoryAndBasename(fileName, true); /* istanbul ignore else */
            if (dirname && dirname.startsWith(filter))
                dirMap.set(dirname, true);
        }
        for (const dirname of dirMap.keys())
            results.push(dirname);
        return results;
    }

    async loadFromZipFile(fileName: string, validate: boolean): Promise<H.IOResults> {
        try {
            this._zip = new ZIPF.ZipFile(fileName);
            const results: H.IOResults = await this._zip.load();
            if (!results.success)
                return results;
            this._files = await this._zip.getJustFiles(null);

            return validate ? await this.validate() : results;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('bagitReader.loadFromZipFile', LOG.LS.eSYS, error);
            return { success: false, error: `bagitReader.loadFromZipFile ${JSON.stringify(error)}` };
        }
    }

    async loadFromZipStream(inputStream: NodeJS.ReadableStream, validate: boolean): Promise<H.IOResults> {
        try {
            this._zip = new ZIPS.ZipStream(inputStream);
            const results: H.IOResults = await this._zip.load();
            if (!results.success)
                return results;
            this._files = await this._zip.getJustFiles(null);

            return validate ? await this.validate() : results;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('bagitReader.loadFromZipStream', LOG.LS.eSYS, error);
            return { success: false, error: `bagitReader.loadFromZipStream ${JSON.stringify(error)}` };
        }
    }

    async loadFromDirectory(directory: string, validate: boolean): Promise<H.IOResults> {
        const fileList: string[] | null = await H.Helpers.getDirectoryEntriesRecursive(directory);
        if (!fileList)
            return { success: false, error: `Unable to read ${directory}` };
        this._files = fileList;

        return validate ? await this.validate() : { success: true, error: '' };
    }

    async close(): Promise<H.IOResults> {
        if (this._zip)
            return await this._zip.close();
        else
            return { success: true, error: '' };
    }

    private prefixedFilename(file: string): string {
        /* istanbul ignore else */
        if (this._prefixDir) {
            if (!file.startsWith(this._prefixDir)) {
                file = path.join(this._prefixDir, file);
                if (this._zip)
                    file = file.replace(/\\/g, '/'); // if we are reading from a zip and on a Windows system, update path separators to be / after the join call above
            }
        }
        return file;
    }

    async streamContent(file: string | null): Promise<NodeJS.ReadableStream | null> {
        if (!this._validated) { /* istanbul ignore if */
            if (!(await this.validate()).success)
                return null;
        }

        try {
            const fileName: string | null = file ? this.prefixedFilename(file) : null;
            // LOG.info(`getFileStream(${file}) looking in ${fileName} with prefixDir of ${this._prefixDir}`, LOG.LS.eSYS);

            return (this._zip)
                ? this._zip.streamContent(fileName)
                : fileName ? fs.createReadStream(fileName) : null;
        } catch (error) /* istanbul ignore next */ {
            LOG.info(`bagitReader.streamContent unable to read ${file}: ${JSON.stringify(error)}`, LOG.LS.eSYS);
            return null;
        }
    }

    async uncompressedSize(file: string): Promise<number | null> {
        if (!this._validated) { /* istanbul ignore if */
            if (!(await this.validate()).success)
                return null;
        }

        try {
            const fileName: string = this.prefixedFilename(file);
            // LOG.info(`getFileStream(${file}) looking in ${fileName} with prefixDir of ${this._prefixDir}`, LOG.LS.eSYS);

            if (this._zip)
                return await this._zip.uncompressedSize(fileName);
            const statResults: H.StatResults = await H.Helpers.stat(fileName);
            return (statResults.success && statResults.stat) ? statResults.stat.size : /* istanbul ignore next */ null;
        } catch (error) /* istanbul ignore next */ {
            LOG.info(`bagitReader.uncompressedSize unable to read ${file}: ${JSON.stringify(error)}`, LOG.LS.eSYS);
            return null;
        }
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
                        // LOG.info(`Found Bag Declaration ${file}`, LOG.LS.eSYS);
                        break;
                    case BAGIT_BAG_METADATA:
                        foundBagMetadata = true;
                        // LOG.info(`Found Bag Metadata ${file}`, LOG.LS.eSYS);
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
                        // LOG.info(`Found Manifest ${file}, Algorithm ${algorithm}`, LOG.LS.eSYS);
                    } else {
                        foundTagManifest = true;
                        algorithmMapTagManifest.set(algorithm, file);
                        // LOG.info(`Found Tag Manifest ${file}, Algorithm ${algorithm}`, LOG.LS.eSYS);
                        recordValidated = true; // tag manifests are not themselves present in other manifests, so record them in our fileValidationMap as valid
                    }
                }
            } else /* istanbul ignore next */ {
                if (this._prefixDir && !file.startsWith(this._prefixDir))
                    return { success: false, error: `File ${file} does not start with prefix directory ${this._prefixDir}` };
            }

            // LOG.info(`FileValidation Adding ${file.toLowerCase()} -> ${recordValidated}`, LOG.LS.eSYS);
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
                LOG.error(`Unexpected hash algorithm ${algorithm}`, LOG.LS.eSYS);
                continue;
            }

            let validateManifestResults = await this.validateManifest(manifestFile, algorithm, true);
            if (!validateManifestResults.success)
                return validateManifestResults;

            // validate tag manifest entries
            manifestFile = algorithmMapTagManifest.get(algorithm);
            /* istanbul ignore if */
            if (!manifestFile) {
                LOG.error(`Unexpected hash algorithm ${algorithm}`, LOG.LS.eSYS);
                continue;
            }

            validateManifestResults = await this.validateManifest(manifestFile, algorithm, false);
            if (!validateManifestResults.success)
                return validateManifestResults;
        }

        // scan this._fileMap for unvalidated files
        for (const [file, validated] of this._fileValidationMap) {
            // LOG.info(`Final validation of ${file}: ${validated}`, LOG.LS.eSYS);
            if (!validated)
                return { success: false, error: `Invalid Bagit: file ${file} not found in manifest` };
        }

        this._valid = true;
        return { success: true, error: '' };
    }

    private async validateManifest(manifestFile: string, algorithm: string, extractDataFiles: boolean): Promise<H.IOResults> {
        const manifestEntryRegex: RegExp = new RegExp(BAGIT_MANIFEST_ENTRY_REGEX);
        // LOG.info(`Validate Manifest ${manifestFile}, algorithm ${algorithm}`, LOG.LS.eSYS);

        // load manifest file
        const stream: NodeJS.ReadableStream | null = await this.streamContent(manifestFile); /* istanbul ignore next */
        if (!stream)
            return { success: false, error: `Invalid Bagit: unable to read manifest ${manifestFile}` };
        const buffer: Buffer | null = await H.Helpers.readFileFromStream(stream); /* istanbul ignore next */
        if (!buffer)
            return { success: false, error: `Invalid Bagit: unable to read manifest ${manifestFile}` };

        let manifestData: string = '';
        try {
            manifestData = buffer.toString('utf8');
            // LOG.info(`Parsing manifest data:\n${manifestData}`, LOG.LS.eSYS);
        } catch (error) /* istanbul ignore next */ {
            return { success: false, error: `Invalid Bagit: invalid manifest ${manifestFile}` };
        }

        // parse into map of file -> hash
        const directoryMap: Map<string, boolean> = new Map<string, boolean>();
        const fileMap: Map<string, boolean> = new Map<string, boolean>();

        const manifestLines: string[] = manifestData.split(/[\r\n]+/);
        for (const line of manifestLines) {
            // LOG.info(`Processing manifest line ${line}`, LOG.LS.eSYS);
            if (!line)
                continue;
            const regexResult = manifestEntryRegex.exec(line);
            if (!regexResult || regexResult.length != 3)
                return { success: false, error: `Invalid Bagit: invalid manifest entry in ${manifestFile}` };
            const hash: string = regexResult[1];
            const fileName: string = regexResult[2];

            if (this._params.validateContent) {
                const manifestEntryStream: NodeJS.ReadableStream | null = await this.streamContent(fileName);
                if (!manifestEntryStream)
                    return { success: false, error: `Invalid Bagit: invalid manifest entry ${fileName} in ${manifestFile} ` };

                // verify file exists; compute & verify hashes; mark files as validated in this._fileMap
                const hashResults = await H.Helpers.computeHashFromStream(manifestEntryStream, algorithm); /* istanbul ignore next */
                if (!hashResults.success)
                    return hashResults;

                if (hashResults.hash != hash)
                    return { success: false, error: `Invalid Bagit: invalid manifest ${algorithm} hash for ${fileName}` };
            }

            const prefixedFileName: string = this.prefixedFilename(fileName); /* istanbul ignore next */
            if (!this._fileValidationMap.has(prefixedFileName.toLowerCase()))
                return { success: false, error: `Invalid Bagit: manifest entry ${prefixedFileName} not found in bagit` };

            if (extractDataFiles) {
                // we expect fileName to start with "data/" -- there's an error if that's not the case!
                /* istanbul ignore next */
                if (!fileName.toLowerCase().startsWith(BAGIT_DATA_DIRECTORY))
                    return { success: false, error: `Invalid Bagit: data manifest entry ${fileName} does not start with ${BAGIT_DATA_DIRECTORY}` };
                // strip of "data/" ... then split results into folder names and file names
                const { dirname, basename } = this.extractDirectoryAndBasename(fileName, false);
                if (dirname)
                    directoryMap.set(dirname, true);
                fileMap.set(basename, true);
            }

            // File exists and has a valid hash; record it in our local validation this._fileMap, and record data in our persistent dataFileMap
            this._fileValidationMap.set(prefixedFileName.toLowerCase(), true);
            this._dataFileMap.set(fileName, hash); // last one wins
        }

        if (this._dataDirectories.length == 0)
            for (const [directory, flag] of directoryMap) {
                this._dataDirectories.push(directory); flag;
            }
        if (this._dataFiles.length == 0)
            for (const [file, flag] of fileMap) {
                this._dataFiles.push(file); flag;
            }

        return { success: true, error: '' };
    }

    private extractDirectoryAndBasename(fileName: string, removePrefix: boolean): { dirname: string | null, basename: string } {
        let strippedFileName: string = (removePrefix && this._prefixDir) ? fileName.replace(this._prefixDir + '/', '') : fileName;
        strippedFileName = strippedFileName.replace(BAGIT_DATA_DIRECTORY, '');

        let dirname: string | null = path.dirname(strippedFileName);
        if (!dirname || dirname == '.')
            dirname = null;
        const basename: string = path.basename(strippedFileName);
        // if (removePrefix) LOG.info(`extractDirectoryAndBasename (prefix ${this._prefixDir}, fileName: ${fileName}) -> { ${dirname}, ${basename}}`, LOG.LS.eSYS);
        return { dirname, basename };
    }
}
