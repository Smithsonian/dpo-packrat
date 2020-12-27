import { eSystemObjectType } from '../../db';

export enum eMetadata {
    eUnitAbbreviation,
    eSubjectIdentifier,
    eItemName
}

export type NavigationFilter = {
    idRoot: number,                         // idSystemObject of item for which we should get children; 0 means get everything
    objectTypes: eSystemObjectType[],       // empty array means give all appropriate children types
    metadataColumns: eMetadata[],           // empty array means give no metadata
    search: string,                         // search string from the user
    objectsToDisplay: eSystemObjectType[],  // objects to display
    units: number[],                        // idSystemObject[] for units filter
    projects: number[],                     // idSystemObject[] for projects filter
    has: eSystemObjectType[],               // has system object filter
    missing: eSystemObjectType[],           // missing system object filter
    captureMethod: number[],                // idVocabulary[] for capture method filter
    variantType: number[],                  // idVocabulary[] for variant type filter
    modelPurpose: number[],                 // idVocabulary[] for model purpose filter
    modelFileType: number[],                // idVocabulary[] for model file type filter
};

export type NavigationResultEntry = {
    idSystemObject: number,                 // idSystemObject of the entry
    name: string,                           // Name of the object, for display purposes
    objectType: eSystemObjectType,          // system object type of the entry (eProject, eUnit, eSubject, eItem, eCaptureData, etc.)
    idObject: number,                       // database ID of the object (e.g. Project.idProject, Unit.idUnit, Subject.idSubject, etc.)
    metadata: string[]                      // array of metadata values, in the order of NavigationResult.metadataColumns, matching the order of NavigationFilter.metadataColumns
};

export type NavigationResult = {
    success: boolean,
    error: string,
    entries: NavigationResultEntry[],
    metadataColumns: eMetadata[]
};

export interface INavigation {
    getObjectChildren(filter: NavigationFilter): Promise<NavigationResult>;
}