import * as STORE from '../interface';

export class LocalStorage implements STORE.IStorage {
    async readStream(storageKey: string): Promise<STORE.ReadStreamResult> {
        const retValue: STORE.ReadStreamResult = {
            readStream: null,
            hash: null,
            success: false,
            error: 'Not Implemented'
        };
        storageKey;
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
            storageKeyInput: storageKey,
            storageKeyOutput: null,
            asset: null,
            assetVersion: null,
            success: false,
            error: 'Not Implemented'
        };
        return retValue;
    }

    async validateHash(storageKey: string): Promise<boolean> {
        storageKey;
        return false;
    }
}

/*
    Our local storage is an implementation of the OCFL v1.0 specification (c.f. https://ocfl.io/)
    OCFL will encode paths comprised of these elements:

    1. ${Unit}/${SubjectARK}/${AssetType}/${AssetID}/${AssetVersionNum}/${AssetFilename}
    2. ${Project}/${AssetType}/${AssetID}/${AssetVersionID}/${AssetFilename}

    ${Unit}:            Abbreviation of unit in which Subject is housed
    ${Project}:         Project Name
    ${SubjectARK}:      Unique ID of subject
    ${AssetType}:       CD (CaptureData), ML (Model), SC (Scene), PD (Project Documentation), IF (Intermediary File), AO (All other assets)
    ${AssetID}:         Database ID of Asset
    ${AssetVersionNum}: Sequential Asset Version Number, starting at "1", with no leading zeros
    ${AssetFilename}:   Filename and extension of asset

    Encoding scheme 1 will be used for everything associated with a Subject
    Encoding scheme 2 will be used for everything not associated with a Subject

    We define an "OCFL object" to be an Asset and associated AssetVersions (each of which describes a file)
    - Each "OCFL Object" has a special file in the object root:  0=ocfl_object_1.0 with contents "ocfl_object_1.0\n"
    -

    Goals:
    1. Robust storage.
    2. Transparent storage: be able to know what is stored simply by walking the storage hierarchy.
    3. Metadata storage: provide on-disk backups of relational data present in the DB.

    Issues / Challenges:
    1. The storage key calculation is dependent on data that can change.  So, either:
        a. We update the storage key (and the implied directory path) when its source data is changed.
           This is hard! The storage system doesn't know when this happens, and making the storage client
           Take this action implies some crazy linkage between components.  I don't like this.
        b. We don't update the storage key when its source data is changed.
           This is easy! But then our transparency goals are not met, especially if the changed data
           was a correction of faulty information, such as a bad ARK ID of a subject.
    2. We want to store metadata in the OCFL object root. But metadata can change and will be edited over time.
       As with issue 1, we either make our client tell us when these changes are made, or we ignore such changes.

    Approaches:
    1. Ignore changes. PROs: easy. CONs: breaks transparency and metadata storage goals
    2. Handle changes. PROs: meets transparency and metadata storage goals. CONs: Very hard!
    3. Ignore changes in real time; use offline service to find and correct changes.
       Write our own OCFL client which validates the content.
       - Validates hashes
       - Compares storageKeys (i.e. file paths) with computed storage keys from live metadata. Updates storageKeys and file paths when needed.
       - Compares metadata with computed meta from live system.  Updates/versions as needed.
       I really like this approach. We avoid the nasty linkage issue, and our data store remains robust and mostly transparent,
       except for oddball cases when storage key sources are changed. There are updated as the system verification tool runs.
*/