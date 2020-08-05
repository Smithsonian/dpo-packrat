import { IStorage } from '../interface';

class LocalStorage implements IStorage {
    validateHash(): boolean {
        return true;
    }
}

export default LocalStorage;

/*
    Our local storage is an implementation of the OCFL v1.0 specification (c.f. https://ocfl.io/)
    OCFL will encode paths comprised of these elements:

    1. ${Unit}/${SubjectARK}/${AssetType}/${AssetID}/${AssetVersionID}/${AssetFilename}
    2. ${Project}/${AssetType}/${AssetID}/${AssetVersionID}/${AssetFilename}

    ${Unit}:            Abbreviation of unit in which Subject is housed
    ${Project}:         Project Name
    ${SubjectARK}:      Unique ID of subject
    ${AssetType}:       C (CaptureData), M (Model), S (Scene), P (Project Documentation), I (Intermediary File), A (All other assets)
    ${AssetID}:         Database ID of Asset
    ${AssetVersionID}:  Database ID of AssetVersion
    ${AssetFilename}:   Filename and extension of asset

    Encoding scheme 1 will be used for everything associated with a Subject
    Encoding scheme 2 will be used for everything not associated with a Subject

    We define an "OCFL object" to be an Asset and associated AssetVersions (each of which describes a file)
    - Each "OCFL Object" has a special file in the object root:  0=ocfl_object_1.0 with contents "ocfl_object_1.0\n"
    -
*/