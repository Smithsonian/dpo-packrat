import * as crypto from 'crypto';
import * as STORE from '../../interface';
import * as DBAPI from '../../../db';
import { IOResults } from '../../../utils/helpers';
import { OCFLRoot } from './OCFLRoot';

export class LocalStorage implements STORE.IStorage {
    private ocflRoot: OCFLRoot;

    constructor() {
        this.ocflRoot = new OCFLRoot();
    }

    async initialize(storageRoot: string): Promise<IOResults> {
        return await this.ocflRoot.initialize(storageRoot);
    }

    async readStream(storageKey: string, version: number): Promise<STORE.ReadStreamResult> {
        const retValue: STORE.ReadStreamResult = {
            readStream: null,
            hash: null,
            success: false,
            error: 'Not Implemented'
        };

        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetchByStorageKey(storageKey);
        if (!asset) {
            retValue.success = false;
            retValue.error = `No asset found from storageKey ${storageKey}`;
            return retValue;
        }

        const assetVersion: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchByAssetAndVersion(asset.idAsset, version);
        if (!assetVersion) {
            retValue.success = false;
            retValue.error = `No asset version found from storageKey ${storageKey}, idAsset ${asset.idAsset}, version ${version}`;
            return retValue;
        }

        // const location: string = this.ocflRoot.computeLocation(storageKey)
        return retValue;
    }

    async readStreamClose(storageKey: string): Promise<STORE.ReadStreamCloseResult> {
        const retValue: STORE.ReadStreamCloseResult = {
            success: false,
            error: 'Not Implemented'
        };
        storageKey;
        return retValue;
    }

    async writeStream(writeStreamInput: STORE.WriteStreamInput): Promise<STORE.WriteStreamResult> {
        const retValue: STORE.WriteStreamResult = {
            writeStream: null,
            storageKey: null,
            success: false,
            error: 'Not Implemented'
        };
        writeStreamInput;
        return retValue;
    }

    async writeStreamClose(storageKey: string): Promise<STORE.WriteStreamCloseResult> {
        const retValue: STORE.WriteStreamCloseResult = {
            storageKey: null,
            asset: null,
            assetVersion: null,
            success: false,
            error: 'Not Implemented'
        };
        storageKey;
        return retValue;
    }

    async hierarchyUpdated(storageKey: string): Promise<STORE.HierarchyUpdatedResults> {
        const retValue: STORE.HierarchyUpdatedResults = {
            success: false,
            error: 'Not Implemented'
        };
        storageKey;
        return retValue;
    }

    async validateHash(storageKey: string): Promise<boolean> {
        storageKey;
        return false;
    }

    async computeStorageKey(uniqueID: string): Promise<STORE.ComputeStorageKeyResults> {
        const retValue: STORE.ComputeStorageKeyResults = {
            storageKey: '',
            success: false,
            error: ''
        };

        const SHA1: crypto.Hash = crypto.createHash('SHA1');
        retValue.storageKey     = SHA1.update(uniqueID).digest('hex');
        return retValue;
    }
}

/*
    Our local storage is an implementation of the OCFL v1.0 specification (c.f. https://ocfl.io/1.0/spec/)

    Each Asset and it's associated AssetVersions are an "OCFL Object" (c.f. https://ocfl.io/1.0/spec/#object-spec).

    We'll be using an algorithm referenced here: "https://birkland.github.io/ocfl-rfc-demo/0003-truncated-ntuple-layout?n=2&depth=3&encoding=sha1"
    We're calling this the "Packrat-Truncated n-tuple Tree".  The Asset.idAsset is hashed via sha1 and rendered in hex. The resulting string is
    transformed into a directory path by building 3 subdirectories of 2 characters each from the start of the string.

    For example, the idAsset == 1 yields the SHA1 hash of 356A192B7913B04C54574D18C28D46E6395428AB.  This will yield the path:
    /35/6A/19/356A192B7913B04C54574D18C28D46E6395428AB (the entire hash is repeated at the of the n-tuple).

    Asset database ids are unique. And whether or not they are hashed, they have no meaning. So, in addition to storing the asset bits,
    we will also be storing metadata that describes the asset's relationship to other objects in the system. That metadata will be rendered in
    a JSON file, which will also be subject to versioning as metadata changes.

    It will be comprised of the following elements:
    1. ${Unit}/${SubjectARK or SubjectName}/${ItemName}/${AssetType}/${AssetID}/
    2. ${Project}/${AssetType}/${AssetID}/

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
