import * as COMMON from '@dpo-packrat/common';

export class ModelMigrationFile {
    uniqueID: string;                           // unique identifier used to group all files of a model together
    path: string;                               // path to actual files; if not specified, defaults to ../../tests/mock/models relative to this folder
    fileName: string;                           // name of file
    filePath: string;                           // path to file as part of the collection of model files; used to determine path to actual files (relative to ../../tests/mock/models) if path is not specified
    name: string;                               // name of model
    title: string;                              // title of model
    geometry: boolean;                          // true -> geometry file; false -> support file, such as a texture map
    hash?: string;                              // sha256 hash of file
    eVPurpose?: COMMON.eVocabularyID;           // required for geometry
    eVCreationMethod?: COMMON.eVocabularyID;    // required for geometry
    eVModality?: COMMON.eVocabularyID;          // required for geometry
    eVUnits?: COMMON.eVocabularyID;             // required for geometry
    License?: COMMON.eLicense;
    PublishedState?: COMMON.ePublishedState;
    idSystemObjectItem?: number;                // idSystemObject of item that owns this model.
    testData?: boolean;                         // Set to true for test data; will create subject and item if idSystemObject is undefined

    constructor(uniqueID: string, path: string, fileName: string, filePath: string, title: string, name: string,
        geometry: boolean, hash?: string, eVPurpose?: COMMON.eVocabularyID, eVCreationMethod?: COMMON.eVocabularyID,
        eVModality?: COMMON.eVocabularyID, eVUnits?: COMMON.eVocabularyID,
        License?: COMMON.eLicense, PublishedState?: COMMON.ePublishedState, idSystemObjectItem?: number, testData?: boolean) {
        this.uniqueID           = uniqueID;
        this.path               = path;
        this.fileName           = fileName;
        this.filePath           = filePath;
        this.name               = name;
        this.title              = title;
        this.geometry           = geometry;
        this.hash               = hash;
        this.eVPurpose          = eVPurpose;
        this.eVCreationMethod   = eVCreationMethod;
        this.eVModality         = eVModality;
        this.eVUnits            = eVUnits;
        this.License                = License;
        this.PublishedState         = PublishedState;
        this.idSystemObjectItem = idSystemObjectItem;
        this.testData           = testData;
    }
}
