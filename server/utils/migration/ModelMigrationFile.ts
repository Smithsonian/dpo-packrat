import * as COMMON from '@dpo-packrat/common';

export class ModelMigrationFile {
    uniqueID: string;                           // unique identifier used to group all files of a model together
    path: string;                               // path to actual files; if not specified, defaults to ../../tests/mock/models relative to this folder
    title: string;                              // title of model
    fileName: string;                           // name of file
    filePath: string;                           // path to file as part of the collection of model files; used to determine path to actual files (relative to ../../tests/mock/models) if path is not specified
    hash: string;                               // sha256 hash of file
    geometry: boolean;                          // true -> geometry file; false -> support file, such as a texture map
    eVPurpose?: COMMON.eVocabularyID;           // required for geometry
    eVCreationMethod?: COMMON.eVocabularyID;    // required for geometry
    eVModality?: COMMON.eVocabularyID;          // required for geometry
    eVUnits?: COMMON.eVocabularyID;             // required for geometry
    idSystemObjectItem?: number;                // idSystemObject of item that owns this model.
    testData?: boolean;                         // Set to true for test data; will create subject and item if idSystemObject is undefined

    constructor(uniqueID: string, path: string, title: string, fileName: string, filePath: string, hash: string,
        geometry: boolean, eVPurpose?: COMMON.eVocabularyID, eVCreationMethod?: COMMON.eVocabularyID,
        eVModality?: COMMON.eVocabularyID, eVUnits?: COMMON.eVocabularyID, idSystemObjectItem?: number, testData?: boolean) {
        this.uniqueID           = uniqueID;
        this.path               = path;
        this.title              = title;
        this.fileName           = fileName;
        this.filePath           = filePath;
        this.geometry           = geometry;
        this.hash               = hash;
        this.eVPurpose          = eVPurpose;
        this.eVCreationMethod   = eVCreationMethod;
        this.eVModality         = eVModality;
        this.eVUnits            = eVUnits;
        this.idSystemObjectItem = idSystemObjectItem;
        this.testData           = testData;
    }
}
