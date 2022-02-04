import * as COMMON from '@dpo-packrat/common';
import { IIndexer } from './IIndexer';

export type NavigationFilter = {
    idRoot: number;                         // idSystemObject of item for which we should get children; 0 means get everything
    objectTypes: COMMON.eSystemObjectType[];       // empty array means give all appropriate children types
    metadataColumns: COMMON.eMetadata[];           // empty array means give no metadata
    search: string;                         // search string from the user
    objectsToDisplay: COMMON.eSystemObjectType[];  // objects to display
    units: number[];                        // idSystemObject[] for units filter
    projects: number[];                     // idSystemObject[] for projects filter
    has: COMMON.eSystemObjectType[];               // has system object filter
    missing: COMMON.eSystemObjectType[];           // missing system object filter
    captureMethod: number[];                // idVocabulary[] for capture method filter
    variantType: number[];                  // idVocabulary[] for variant type filter
    modelPurpose: number[];                 // idVocabulary[] for model purpose filter
    modelFileType: number[];                // idVocabulary[] for model file type filter
    dateCreatedFrom: Date | null;           // Date Created filter
    dateCreatedTo: Date | null;             // Date Created filter
    rows: number;                           // max result row count; a value of 0 means "all"
    cursorMark: string;                     // a non-empty value indicates a cursor position through a set of result values, used to request the next set of values
};

export type NavigationResultEntry = {
    idSystemObject: number;                 // idSystemObject of the entry
    name: string;                           // Name of the object, for display purposes
    objectType: COMMON.eSystemObjectType;          // system object type of the entry (eProject, eUnit, eSubject, eItem, eCaptureData, etc.)
    idObject: number;                       // database ID of the object (e.g. Project.idProject, Unit.idUnit, Subject.idSubject, etc.)
    metadata: string[];                     // array of metadata values, in the order of NavigationResult.metadataColumns, matching the order of NavigationFilter.metadataColumns
};

export type NavigationResult = {
    success: boolean;
    error?: string;
    entries: NavigationResultEntry[];
    metadataColumns: COMMON.eMetadata[];
    cursorMark?: string | null;             // when provided, additional results are available by requesting another navigation, using this returned value for the NavigationFilter.cursorMark
};

export type MetadataFilter = {
    idRoot: number;                         // idSystemObject for whom to fetch metadata, either its own metadata (forAssetChildren === false) or that of its asset version childrens' metadata (forAssetChildren === true)
    forAssetChildren: boolean;              // true means metadata of asset version children; false means metadata of idRoot. True is typically desired when fetching a set of metadata for an asset grid.
    metadataColumns: string[];              // empty array means retrieve no metadata, which is an error condition
    rows: number;                           // max result row count; a value of 0 means "all"
    cursorMark?: string;                    // a non-empty value indicates a cursor position through a set of result values, used to request the next set of values
};

export type MetadataResultEntry = {
    idSystemObject: number;                 // idSystemObject of the entry
    idSystemObjectParent: number;           // idSystemObject of the owning item (if the entry is an asset version owned by another system object)
    metadata: string[];                     // array of metadata values, in the order of MetadataResult.metadataColumns, matching the order of MetadataFilter.metadataColumns
};

export type MetadataResult = {
    success: boolean;
    error?: string;
    entries: MetadataResultEntry[];
    metadataColumns: string[];
    cursorMark?: string | null;             // when provided, additional results are available by requesting another navigation, using this returned value for the MetadataFilter.cursorMark
};

export interface INavigation {
    getObjectChildren(filter: NavigationFilter): Promise<NavigationResult>;
    getMetadata(filter: MetadataFilter): Promise<MetadataResult>;
    getIndexer(): Promise<IIndexer | null>;
}