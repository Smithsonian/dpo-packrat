/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as fs from 'fs';
import * as path from 'path';
import * as ST from './SharedTypes';
import * as STORE from '../../interface';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import { OCFLRoot, ComputeWriteStreamLocationResults } from './OCFLRoot';
import * as OO from './OCFLObject';

export class LocalStorage implements STORE.IStorage {
    private ocflRoot: OCFLRoot;

    constructor() {
        this.ocflRoot = new OCFLRoot();
    }

    async initialize(storageRoot: string): Promise<H.IOResults> {
        return await this.ocflRoot.initialize(storageRoot);
    }

    async readStream(readStreamInput: STORE.ReadStreamInput): Promise<STORE.ReadStreamResult> {
        const retValue: STORE.ReadStreamResult = {
            readStream: null,
            storageHash: null,
            success: false,
            error: ''
        };

        const { storageKey, fileName, version, staging } = readStreamInput;
        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, staging, true);
        if (!ocflObjectInitResults.success || !ocflObjectInitResults.ocflObject) {
            retValue.success = false;
            retValue.error = ocflObjectInitResults.error;
            return retValue;
        }
        retValue.storageHash = ocflObjectInitResults.ocflObject.fileHash(fileName, version);

        try {
            retValue.readStream = fs.createReadStream(ocflObjectInitResults.ocflObject.fileLocation(fileName, version));
            retValue.success = true;
            retValue.error = '';
        } catch (error) {
            LOG.logger.error('LocalStorage.readStream', error);
            retValue.success = false;
            retValue.error = JSON.stringify(error);
        }
        return retValue;
    }

    async writeStream(): Promise<STORE.WriteStreamResult> {
        const retValue: STORE.WriteStreamResult = {
            writeStream: null,
            storageKey: null,
            success: false,
            error: ''
        };

        // Compute random directory path and name in staging folder
        // Provide this as the storage key which clients must pass back to us
        const res: ComputeWriteStreamLocationResults = this.ocflRoot.computeWriteStreamLocation();
        if (!res.ioResults.success) {
            retValue.success = false;
            retValue.error = res.ioResults.error;
            return retValue;
        }

        try {
            retValue.writeStream = fs.createWriteStream(res.locationPrivate);
            retValue.storageKey = res.locationPublic;
            retValue.success = true;
            retValue.error = '';
        } catch (error) {
            LOG.logger.error('LocalStorage.writeStream', error);
            retValue.success = false;
            retValue.error = JSON.stringify(error);
        }

        return retValue;
    }

    async commitWriteStream(writeStreamCloseInput: STORE.CommitWriteStreamInput): Promise<STORE.CommitWriteStreamResult> {
        const retValue: STORE.CommitWriteStreamResult = {
            storageHash: null,
            storageSize: null,
            success: false,
            error: ''
        };

        // Compute hash
        const filePath: string = path.join(this.ocflRoot.computeLocationStagingRoot(), writeStreamCloseInput.storageKey);
        const hashResults: H.HashResults = await H.Helpers.computeHashFromFile(filePath, ST.OCFLDigestAlgorithm);
        if (!hashResults.success) {
            retValue.success = false;
            retValue.error = `Unable to compute hash from file: ${hashResults.error}`;
            return retValue;
        }

        // Validate computed hash
        if (writeStreamCloseInput.storageHash && writeStreamCloseInput.storageHash != hashResults.hash) {
            retValue.success = false;
            retValue.error = `Computed hash ${hashResults.hash} does not match specified hash ${writeStreamCloseInput.storageHash}`;
            return retValue;
        }

        // Compute filesize
        const statResults: H.StatResults = H.Helpers.stat(filePath);
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

    async promoteStagedAsset(promoteStagedAssetInput: STORE.PromoteStagedAssetInput): Promise<STORE.PromoteStagedAssetResult> {
        const { storageKeyStaged, storageKeyFinal, fileName, metadata, opInfo } = promoteStagedAssetInput;
        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKeyFinal, false, false);
        if (!ocflObjectInitResults.success)
            return ocflObjectInitResults;
        else if (!ocflObjectInitResults.ocflObject) {
            return {
                success: false,
                error: 'OCFLObject initialization failure'
            };
        }

        const pathOnDisk: string = path.join(this.ocflRoot.computeLocationStagingRoot(), storageKeyStaged);
        return await ocflObjectInitResults.ocflObject.addOrUpdate(pathOnDisk, fileName, metadata, opInfo);
    }

    async renameAsset(renameAssetInput: STORE.RenameAssetInput): Promise<STORE.RenameAssetResult> {
        const { storageKey, fileNameOld, fileNameNew, opInfo } = renameAssetInput;
        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, false, false);
        if (!ocflObjectInitResults.success)
            return ocflObjectInitResults;
        else if (!ocflObjectInitResults.ocflObject) {
            return {
                success: false,
                error: 'OCFLObject initialization failure'
            };
        }

        return await ocflObjectInitResults.ocflObject.rename(fileNameOld, fileNameNew, opInfo);
    }

    async hideAsset(hideAssetInput: STORE.HideAssetInput): Promise<STORE.HideAssetResult> {
        const { storageKey, fileName, opInfo } = hideAssetInput;
        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, false, false);
        if (!ocflObjectInitResults.success)
            return ocflObjectInitResults;
        else if (!ocflObjectInitResults.ocflObject) {
            return {
                success: false,
                error: 'OCFLObject initialization failure'
            };
        }

        return await ocflObjectInitResults.ocflObject.delete(fileName, opInfo);
    }

    async reinstateAsset(reinstateAssetInput: STORE.ReinstateAssetInput): Promise<STORE.ReinstateAssetResult> {
        const { storageKey, fileName, version, opInfo } = reinstateAssetInput;
        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, false, false);
        if (!ocflObjectInitResults.success)
            return ocflObjectInitResults;
        else if (!ocflObjectInitResults.ocflObject) {
            return {
                success: false,
                error: 'OCFLObject initialization failure'
            };
        }

        return await ocflObjectInitResults.ocflObject.reinstate(fileName, version, opInfo);
    }


    async updateMetadata(updateMetadataInput: STORE.UpdateMetadataInput): Promise<STORE.UpdateMetadataResult> {
        const { storageKey, metadata, opInfo } = updateMetadataInput;
        const promoteStagedAssetInput: STORE.PromoteStagedAssetInput = {
            storageKeyStaged: '',
            storageKeyFinal: storageKey,
            fileName: '',
            metadata,
            opInfo
        };
        return await this.promoteStagedAsset(promoteStagedAssetInput);
    }

    async validateAsset(storageKey: string): Promise<STORE.ValidateAssetResult> {
        const retValue: STORE.ValidateAssetResult = {
            success: false,
            error: ''
        };

        const ocflObjectInitResults: OO.OCFLObjectInitResults = await this.ocflRoot.ocflObject(storageKey, false, true);
        if (!ocflObjectInitResults.success) {
            retValue.success = false;
            retValue.error = ocflObjectInitResults.error;
            return retValue;
        } else if (!ocflObjectInitResults.ocflObject) {
            retValue.success = false;
            retValue.error = 'OCFLObject initialization failure';
            return retValue;
        }

        const ioResults = await ocflObjectInitResults.ocflObject.validate();
        if (!ioResults.success) {
            retValue.success = false;
            retValue.error = ioResults.error;
            return retValue;
        }

        retValue.success = true;
        return retValue;
    }

    async computeStorageKey(uniqueID: string): Promise<STORE.ComputeStorageKeyResult> {
        const retValue: STORE.ComputeStorageKeyResult = {
            storageKey: '',
            success: false,
            error: ''
        };

        retValue.storageKey     = H.Helpers.computeHashFromString(uniqueID, 'sha1');
        return retValue;
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

/*
        // Compute Object Ancestry for this asset;
        let storageKey: string = '';
        const OA: DBAPI.ObjectAncestry | null = (asset.idAsset && asset.idSystemObject) ? new DBAPI.ObjectAncestry(asset.idSystemObject) : null;
        if (OA && await OA.fetch() && (OA.unit || OA.project)) {
            // use Object Ancestry to compute storageKey
            // 1. ${Unit}/${SubjectARK}/${AssetType}/${AssetID}/
            // 2. ${Project}/${AssetType}/${AssetID}/
            const unitKey: string | null = (OA.unit) ? (OA.unit[0].Abbreviation ? OA.unit[0].Abbreviation : OA.unit[0].Name) : null;
            const subjectKey: string | null = (OA.subject) ? await this.computeSubjectStorageKeyComponent(OA.subject[0]) : null;
            const assetTypeKey: string = this.computeAssetTypeKeyComponent(OA);
            if (unitKey && subjectKey) {
                const itemKey: string | null = (OA.item) ? OA.item[0].Name : null;
                storageKey = `${unitKey}/${subjectKey}/${itemKey}/${assetTypeKey}/${asset.idAsset}`;
            } else {
                const projectKey: string | null = (OA.project) ? OA.project[0].Name : null;
                storageKey = `${projectKey}/${assetTypeKey}/${asset.idAsset}`;
            }
        } else {
            // Either this asset hasn't been ingested yet, or we could not compute a Unit or Project
            // Compute storageKey for non-ingested asset
            // OCFLRoot.tempStorageRoot + tempfoldername
        }

    private async computeSubjectStorageKeyComponent(subject: DBAPI.Subject): Promise<string> {
        const subjectIdentifier: DBAPI.Identifier | null = await DBAPI.Identifier.fetchFromSubjectPreferred(subject.idSubject);
        return subjectIdentifier ? subjectIdentifier.IdentifierValue : subject.Name; // default in the event there is no Identifier
    }

    private computeAssetTypeKeyComponent(OA: DBAPI.ObjectAncestry): string {
        if (OA.captureData)
            return 'CD';
        if (OA.model)
            return 'ML';
        if (OA.scene)
            return 'SC';
        if (OA.intermediaryFile)
            return 'IF';
        if (OA.projectDocumentation)
            return 'PD';
        return 'AO';
    }
*/
