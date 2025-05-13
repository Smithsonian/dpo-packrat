/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as fs from 'fs';
import * as path from 'path';
import * as ST from './SharedTypes';
import * as STORE from '../../interface';
import * as H from '../../../utils/helpers';
import { OCFLRoot, ComputeWriteStreamLocationResults } from './OCFLRoot';
import * as OO from './OCFLObject';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export class LocalStorage implements STORE.IStorage {
    private ocflRoot: OCFLRoot;

    constructor() {
        this.ocflRoot = new OCFLRoot();
    }

    async initialize(rootRepository: string, rootStaging: string): Promise<H.IOResults> {
        const result: H.IOResults = await this.ocflRoot.initialize(rootRepository, rootStaging);
        if(!result.success)
            RK.logError(RK.LogSection.eSTR,'storage initialize failed',result.error,{ rootRepository, rootStaging },'LocalStorage');
        else
            RK.logInfo(RK.LogSection.eSTR,'storage initialize success',undefined,{ rootRepository, rootStaging },'LocalStorage');
        return result;
    }

    async readStream(readStreamInput: STORE.ReadStreamInput): Promise<STORE.ReadStreamResult> {
        RK.logInfo(RK.LogSection.eSTR,'read stream started',undefined,{ ...readStreamInput },'LocalStorage');

        const retValue: STORE.ReadStreamResult = {
            readStream: null,
            fileName: null,
            storageHash: null,
            success: false
        };

        let filePath: string;
        let fileHash: string;
        const { storageKey, fileName, version, staging } = readStreamInput;
        if (!staging) { // non-staging files are found under OCFL's Repository Root and accessed via OCFLObject's; storageKey essentially specifies a folder path
            const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, false);
            if (!ocflObjectInitResults.success || !ocflObjectInitResults.ocflObject) {
                retValue.success = false;
                retValue.error = `OFCL error: ${ocflObjectInitResults.error}`;
                RK.logError(RK.LogSection.eSTR,'read stream failed',retValue.error,{ ...readStreamInput },'LocalStorage');
                return retValue;
            }

             const pathAndHash: OO.OCFLPathAndHash | null = ocflObjectInitResults.ocflObject.fileLocationAndHash(fileName, version);
            if (!pathAndHash) {
                retValue.success = false;
                 retValue.error = 'unable to compute path and hash';
                RK.logError(RK.LogSection.eSTR,'read stream failed',retValue.error,{ ...readStreamInput },'LocalStorage');
                return retValue;
            }
            filePath = pathAndHash.path;
            fileHash = pathAndHash.hash;
        } else { // staging files are found under the OCFL staging root, located in the directory and file specified by storageKey
            filePath = path.join(this.ocflRoot.computeLocationStagingRoot(), storageKey);
            const hashResults = await H.Helpers.computeHashFromFile(filePath, ST.OCFLDigestAlgorithm);
            if (!hashResults.success) {
                retValue.success = false;
                retValue.error = hashResults.error;
                RK.logError(RK.LogSection.eSTR,'read stream failed',retValue.error,{ ...readStreamInput },'LocalStorage');
                return retValue;
            }
            fileHash = hashResults.hash;
        }

        retValue.storageHash = fileHash;

        try {
            // set our watermark level higher (64kb) to reduce potential backpressure
            retValue.readStream = fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 });
            retValue.fileName = fileName;
            retValue.success = true;
            retValue.error = '';
            RK.logInfo(RK.LogSection.eSTR,'read stream success',undefined,{ filePath, ...readStreamInput },'LocalStorage');
        } catch (error) /* istanbul ignore next */ {
            retValue.success = false;
            retValue.error = `stream error: ${H.Helpers.getErrorString(error)}`;
            RK.logError(RK.LogSection.eSTR,'read stream failed',retValue.error,{ ...readStreamInput },'LocalStorage');
        }
        return retValue;
    }

    async stagingFileName(storageKey: string): Promise<string> {
        return path.join(this.ocflRoot.computeLocationStagingRoot(), storageKey);
    }
    async repositoryFileName(storageKey: string, version?: number): Promise<string> {
        let result: string = path.join(this.ocflRoot.computeLocationObjectRoot(storageKey));

        // if a 'version' was provided then we return the root to that version content
        if(version)
            result = path.join(result,`v${version}`,'content');

        return result;
    }

    /**
     * Files are placed in staging storage for all content. This storage is local due to these facts:
     * 1. Cracking zips without reading everything into memory requires random access to the bits in the zip
     *    This amounts to having access to a file.  Isilon storage, across the network, is not a proper choice here.
     * 2. Bulk ingestion zips won't be stored in the repository.  Instead, these are cracked apart, and the various
     *    assets inside are handled separately. So, we can't "move" these into place from a staging area in Isilon
     *    because the first step is to decompress and extract the contents, which should be done locally, per 1 above.
     * 3. Our client streams uploads to the server. At some point, we need to stream these bits to Isilon. This
     *    network transit from server to Isilon happens once, no matter if staging is located locally or on Isilon.
     */
    async writeStream(fileName: string): Promise<STORE.WriteStreamResult> {
        const retValue: STORE.WriteStreamResult = {
            writeStream: null,
            storageKey: null,
            success: false
        };

        // Compute random directory path and name in staging folder
        // Provide this as the storage key which clients must pass back to us
        const res: ComputeWriteStreamLocationResults = await this.ocflRoot.computeWriteStreamLocation(fileName);
        /* istanbul ignore if */
        if (!res.ioResults.success) {
            retValue.success = false;
            retValue.error = `compute stream location error: ${res.ioResults.error}`;
            RK.logError(RK.LogSection.eSTR,'write stream failed',retValue.error,{ fileName },'LocalStorage');
            return retValue;
        }

        try {
            // set our watermark level higher (1MB) to reduce potential backpressure
            retValue.writeStream = fs.createWriteStream(res.locationPrivate, { highWaterMark: 1024 * 1024 });
            retValue.storageKey = res.locationPublic;
            retValue.success = true;
            retValue.error = '';
            RK.logInfo(RK.LogSection.eSTR,'write stream success',undefined,{ fileName, storageKey: retValue.storageKey },'LocalStorage');
        } catch (error) /* istanbul ignore next */ {
            retValue.success = false;
            retValue.error = `stream error: ${H.Helpers.getErrorString(error)}`;
            RK.logError(RK.LogSection.eSTR,'write stream failed',retValue.error,{ fileName, locationPrivate: res.locationPrivate },'LocalStorage');
        }

        return retValue;
    }

    async commitWriteStream(CommitWriteStreamInput: STORE.CommitWriteStreamInput): Promise<STORE.CommitWriteStreamResult> {

        const retValue: STORE.CommitWriteStreamResult = {
            storageHash: null,
            storageSize: null,
            success: false
        };

        if (CommitWriteStreamInput.storageKey.includes('..') || CommitWriteStreamInput.storageKey.includes(':')) {
            retValue.error = 'Invalid storagekey';
            return retValue;
        }

        // Compute hash
        const filePath: string = path.join(this.ocflRoot.computeLocationStagingRoot(), CommitWriteStreamInput.storageKey);
        const hashResults: H.HashResults = await H.Helpers.computeHashFromFile(filePath, ST.OCFLDigestAlgorithm);
        if (!hashResults.success) {
            retValue.success = false;
            retValue.error = `Unable to compute hash from file: ${hashResults.error}`;
            return retValue;
        }

        // Validate computed hash
        if (CommitWriteStreamInput.storageHash && CommitWriteStreamInput.storageHash != hashResults.hash) {
            retValue.success = false;
            retValue.error = `Computed hash ${hashResults.hash} does not match specified hash ${CommitWriteStreamInput.storageHash}`;
            return retValue;
        }

        // Compute filesize
        const statResults: H.StatResults = await H.Helpers.stat(filePath);
        /* istanbul ignore if */
        if (!statResults.success || !statResults.stat) {
            retValue.success = false;
            retValue.error = `Unable to compute file stats: ${statResults.error}`;
            return retValue;
        }

        retValue.success = true;
        retValue.storageHash = hashResults.hash;
        retValue.storageSize = statResults.stat.size;
        return retValue;
    }

    async discardWriteStream(discardWriteStreamInput: STORE.DiscardWriteStreamInput): Promise<STORE.DiscardWriteStreamResult> {
        if (discardWriteStreamInput.storageKey.includes('..') || discardWriteStreamInput.storageKey.includes(':')) {
            RK.logError(RK.LogSection.eSTR,'writer stream discard failed','called with invalid storage key',{ ...discardWriteStreamInput },'LocalStorage');
            return { success: false, error: 'Invalid storagekey' };
        }

        const filePath: string = path.join(this.ocflRoot.computeLocationStagingRoot(), discardWriteStreamInput.storageKey);

        const resRemove: H.IOResults = await H.Helpers.removeFile(filePath);
        if (!resRemove.success) { // perhaps the file has already been removed?  If so, log this but treat it as success
            const resExists: H.IOResults = await H.Helpers.fileOrDirExists(filePath);
            if (!resExists.success) {
                RK.logWarning(RK.LogSection.eSTR,'write stream discard failed','cannot remove file. already deleted or does not exist',{ filePath, ...discardWriteStreamInput },'LocalStorage');
                return { success: true };
            } else {
                RK.logError(RK.LogSection.eSTR,'write stream discard failed',`unknown error: ${resRemove.error}`,{ filePath, ...discardWriteStreamInput },'LocalStorage');
            }
        }

        // Attempt to remove directory, which may not be empty... so allow failures.  Attempt up to 3 times, with sleeps in between, in case the OS is slow to release locks on an empty folder
        const fileDir: string = path.dirname(filePath);
        const maxTries: number = 3;
        this.removeStagedFolder(fileDir, discardWriteStreamInput.storageKey, maxTries); // DO NOT AWAIT, so our main thread does not block

        // TODO: should wait for folder success befor returning that the operation was successful.
        //       this is done so the rest of the process can continue even is risdue is left behind.
        return resRemove;
    }

    async removeStagedFolder(fileDir: string, storageKey: string, maxTries: number): Promise<H.IOResults> {
        let resDirRemove: H.IOResults = { success: true };
        for (let tryCount: number = 1; tryCount <= maxTries; tryCount++) {
            resDirRemove = await H.Helpers.removeDirectory(fileDir, false, false);
            if (resDirRemove.success) {
                RK.logDebug(RK.LogSection.eSTR,'staged folder remove success',undefined,{ fileDir, storageKey, tryCount, maxTries },'LocalStorage');
                return resDirRemove;
            }

            const dirNotEmpty: boolean = (resDirRemove.error ?? '').includes('ENOTEMPTY');
            if (tryCount >= maxTries || !dirNotEmpty) // final try or not a dir not empty error? log result
                RK.logError(RK.LogSection.eSTR,'staged folder remove failed',H.Helpers.getErrorString(resDirRemove.error),{ fileDir, storageKey, tryCount, maxTries },'LocalStorage');

            if (dirNotEmpty) // not empty? sleep && try again
                await H.Helpers.sleep(5000);
            else
                break;
        }
        return resDirRemove;
    }

    async promoteStagedAsset(promoteStagedAssetInput: STORE.PromoteStagedAssetInput): Promise<STORE.PromoteStagedAssetResult> {

        const { storageKeyStaged, storageKeyFinal, fileName, inputStream, metadata, opInfo } = promoteStagedAssetInput;
        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKeyFinal, true);
        /* istanbul ignore next */
        if (!ocflObjectInitResults.success) {
            RK.logError(RK.LogSection.eSTR,'asset promotion failed',ocflObjectInitResults.error,{ ...promoteStagedAssetInput },'LocalStorage');
            return ocflObjectInitResults;
        } else if (!ocflObjectInitResults.ocflObject) {
            RK.logError(RK.LogSection.eSTR,'asset promotion failed','OCFLObject initialization failure',{ ...promoteStagedAssetInput },'LocalStorage');
            return {
                success: false,
                error: 'OCFLObject initialization failure'
            };
        }

        // figure out our path on disk for the staging file, and make sure it exists
        const pathOnDisk: string = (inputStream) ? '' : path.join(this.ocflRoot.computeLocationStagingRoot(), storageKeyStaged);

        // if we have data then update the OCFL object
        const PSAR: STORE.PromoteStagedAssetResult = await ocflObjectInitResults.ocflObject.addOrUpdate(pathOnDisk, inputStream, fileName, metadata, opInfo); // moves staged file, or streams file, if present

        if (!PSAR.success) {
            RK.logError(RK.LogSection.eSTR,'asset promotion failed',PSAR.error,{ ...promoteStagedAssetInput, pathOnDisk },'LocalStorage');
            return PSAR;
        }

        // cleanup staged directory if we have a staged file
        if (!inputStream && fileName) {
            const result = await H.Helpers.removeDirectory(path.dirname(pathOnDisk), false);
            if (!result.success) {
                RK.logError(RK.LogSection.eSTR, 'staged asset promotion failed', result.error, { ...promoteStagedAssetInput }, 'LocalStorage');
                return result;
            }
        }

        RK.logDebug(RK.LogSection.eSTR, 'staged asset promotion success', undefined, { fileName, storageKeyStaged, storageKeyFinal }, 'LocalStorage');
        return PSAR;
    }

    async renameAsset(renameAssetInput: STORE.RenameAssetInput): Promise<STORE.RenameAssetResult> {

        const { storageKey, fileNameOld, fileNameNew, opInfo } = renameAssetInput;
        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, false);
        /* istanbul ignore else */
        if (!ocflObjectInitResults.success) {
            RK.logError(RK.LogSection.eSTR,'asset rename failed',ocflObjectInitResults.error,{ storageKey, fileNameOld, fileNameNew },'LocalStorage');
            return ocflObjectInitResults;
        } else if (!ocflObjectInitResults.ocflObject) {
            RK.logError(RK.LogSection.eSTR,'asset rename failed','OCFLObject initialization failure',{ storageKey, fileNameOld, fileNameNew },'LocalStorage');
            return {
                success: false,
                error: 'OCFLObject initialization failure'
            };
        }

        const result: H.IOResults = await ocflObjectInitResults.ocflObject.rename(fileNameOld, fileNameNew, opInfo);
        if(!result.success)
            RK.logError(RK.LogSection.eSTR,'asset rename failed',result.error,{ storageKey, fileNameOld, fileNameNew },'LocalStorage');
        else
            RK.logDebug(RK.LogSection.eSTR,'asset rename success',undefined,{ storageKey, fileNameOld, fileNameNew },'LocalStorage');

        return result;
    }

    async hideAsset(hideAssetInput: STORE.HideAssetInput): Promise<STORE.HideAssetResult> {

        const { storageKey, fileName, opInfo } = hideAssetInput;
        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, false);
        /* istanbul ignore else */
        if (!ocflObjectInitResults.success) {
            RK.logError(RK.LogSection.eSTR,'asset hide failed',ocflObjectInitResults.error,{ storageKey, fileName },'LocalStorage');
            return ocflObjectInitResults;
        } else if (!ocflObjectInitResults.ocflObject) {
            RK.logError(RK.LogSection.eSTR,'asset hide failed','OCFLObject initialization failure',{ storageKey, fileName },'LocalStorage');
            return {
                success: false,
                error: 'OCFLObject initialization failure'
            };
        }

        const result: H.IOResults = await ocflObjectInitResults.ocflObject.delete(fileName, opInfo);
        if(!result.success)
            RK.logError(RK.LogSection.eSTR,'asset hide failed',result.error,{ storageKey, fileName },'LocalStorage');
        else
            RK.logDebug(RK.LogSection.eSTR,'asset hide success',undefined,{ storageKey, fileName },'LocalStorage');
        return result;
    }

    async reinstateAsset(reinstateAssetInput: STORE.ReinstateAssetInput): Promise<STORE.ReinstateAssetResult> {
        const { storageKey, fileName, version, opInfo } = reinstateAssetInput;
        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, false);
        /* istanbul ignore else */
        if (!ocflObjectInitResults.success) {
            RK.logError(RK.LogSection.eSTR,'asset reinstate failed',ocflObjectInitResults.error,{ storageKey, fileName, version },'LocalStorage');
            return ocflObjectInitResults;
        } else if (!ocflObjectInitResults.ocflObject) {
            RK.logError(RK.LogSection.eSTR,'asset reinstate failed','OCFLObject initialization failure',{ storageKey, fileName, version },'LocalStorage');
            return {
                success: false,
                error: 'OCFLObject initialization failure'
            };
        }

        const result: H.IOResults = await ocflObjectInitResults.ocflObject.reinstate(fileName, version, opInfo);
        if(!result.success)
            RK.logError(RK.LogSection.eSTR,'asset reinstate failed',result.error,{ storageKey, fileName, version },'LocalStorage');
        else
            RK.logDebug(RK.LogSection.eSTR,'asset reinstate success',undefined,{ storageKey, fileName, version },'LocalStorage');
        return result;
    }

    async updateMetadata(updateMetadataInput: STORE.UpdateMetadataInput): Promise<STORE.UpdateMetadataResult> {

        const { storageKey, metadata, opInfo } = updateMetadataInput;
        const promoteStagedAssetInput: STORE.PromoteStagedAssetInput = {
            storageKeyStaged: '',
            storageKeyFinal: storageKey,
            fileName: '',
            inputStream: null,
            metadata,
            opInfo
        };

        const result: H.IOResults = await this.promoteStagedAsset(promoteStagedAssetInput);
        if(!result.success)
            RK.logError(RK.LogSection.eSTR,'metadata update failed',result.error,{ storageKey, metadata },'LocalStorage');
        else
            RK.logDebug(RK.LogSection.eSTR,'metadata update success',undefined,{ storageKey, metadata },'LocalStorage');
        return result;
    }

    async validateAsset(storageKey: string): Promise<STORE.ValidateAssetResult> {
        const retValue: STORE.ValidateAssetResult = {
            success: false
        };

        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, false);
        /* istanbul ignore else */
        if (!ocflObjectInitResults.success) {
            retValue.success = false;
            retValue.error = ocflObjectInitResults.error;
            RK.logError(RK.LogSection.eSTR,'asset validate failed',ocflObjectInitResults.error,{ storageKey },'LocalStorage');
            return retValue;
        } else if (!ocflObjectInitResults.ocflObject) {
            retValue.success = false;
            retValue.error = 'OCFLObject initialization failure';
            RK.logError(RK.LogSection.eSTR,'asset validate failed',retValue.error,{ storageKey },'LocalStorage');
            return retValue;
        }

        const ioResults = await ocflObjectInitResults.ocflObject.validate();
        /* istanbul ignore next */
        if (!ioResults.success) {
            retValue.success = false;
            retValue.error = ioResults.error;
            RK.logError(RK.LogSection.eSTR,'asset validate failed',`validate error: ${retValue.error}`,{ storageKey },'LocalStorage');
            return retValue;
        }

        RK.logError(RK.LogSection.eSTR,'asset validate success',undefined,{ storageKey },'LocalStorage');
        retValue.success = true;
        return retValue;
    }

    async computeStorageKey(uniqueID: string): Promise<STORE.ComputeStorageKeyResult> {
        return { success: true, storageKey: H.Helpers.computeHashFromString(uniqueID, 'sha1') };
    }
}

/*
    Our local storage is an implementation of the OCFL v1.0 specification (c.f. https://ocfl.io/1.0/spec/)

    Each Asset and it's associated AssetVersions are an "OCFL Object" (c.f. https://ocfl.io/1.0/spec/#object-spec). Note that OCFL
    is setup to allow multiple files to be associated with a single OCFL Object.  For Packrat, we are choosing to store just a single
    file in each OCFL Object.

    To implement OCFL, we need to map our content to directory paths relative to the OCFL storage root.  To do this, we'll be using
    an algorithm referenced here: "https://birkland.github.io/ocfl-rfc-demo/0003-truncated-ntuple-layout?n=2&depth=3&encoding=sha1"
    We're calling this the "Packrat-Truncated n-tuple Tree".  The Asset.idAsset is hashed via sha1 and rendered in hex. The resulting string is
    transformed into a directory path by building 3 subdirectories of 2 characters each from the start of the string.

    For example, the idAsset == 1 yields the sha1 hash of 356A192B7913B04C54574D18C28D46E6395428AB.  This will yield the path:
    /35/6A/19/356A192B7913B04C54574D18C28D46E6395428AB (the entire hash is repeated at the of the n-tuple).

    Asset database ids are unique. And whether or not they are hashed, they have no meaning. So, in addition to storing the asset bits,
    we will also be storing metadata that describes the asset's relationship to other objects in the system. That metadata will be rendered in
    a JSON file, which will also be subject to versioning as metadata changes.

    It will be comprised of the following elements:
    Unit(s):            Abbreviation of unit in which Subject is housed. Immutable, but our items can be associated with multiple subjects, which in turn may imply multiple units.
    Projects(s):        Name of project. Not immutable, but changes are unlikely. Assets can be associated with multiple Projects.
    Subject(s):         Unique ARK ID and name of subject. Not immutable, but changes infrequently. Assets can be associated with multiple Subjects.
    Items:              Item Name. Not immutable. Typically, an asset is associated with 1 Item. But ... some assets are associated with no items, such as Project Documentation.
    Asset Type:         One of CaptureData, Model, Scene, Intermediary File, Project Documentation, other
    AssetID:            Database ID of Asset

    These are used within the OCFL Object:
    ${AssetVersionNum}: Sequential Asset Version Number, starting at "1", with no leading zeros
    ${AssetFilename}:   Filename and extension of asset

    - Each "OCFL Object" has a special file in the object root:  0=ocfl_object_1.0 with contents "ocfl_object_1.0\n"

    Goals:
    1. Robust storage.
    2. Transparent storage: be able to know what is stored simply by walking the storage hierarchy.
    3. Metadata storage: provide on-disk backups of relational data present in the DB.
*/
