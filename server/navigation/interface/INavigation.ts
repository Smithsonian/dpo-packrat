import { eSystemObjectType } from '../../db';
import { IIndexer } from './IIndexer';

export enum eMetadata {
    eCommonName,
    eCommonDescription,
    eCommonIdentifier,
    eCommonDateCreated,
    eCommonOrganizationName,
    eHierarchyUnit,
    eHierarchyProject,
    eHierarchySubject,
    eHierarchyItem,
    eUnitARKPrefix,
    eSubjectIdentifierPreferred,
    eItemEntireSubject,
    eCDCaptureMethod,
    eCDDatasetType,
    eCDDatasetFieldID,
    eCDItemPositionType,
    eCDItemPositionFieldID,
    eCDItemArrangementFieldID,
    eCDFocusType,
    eCDLightSourceType,
    eCDBackgroundRemovalMethod,
    eCDClusterType,
    eCDClusterGeometryFieldID,
    eCDCameraSettingsUniform,
    eCDVariantType,
    eModelCreationMethod,
    eModelModality,
    eModelUnits,
    eModelPurpose,
    eModelFileType,
    eModelRoughness,
    eModelMetalness,
    eModelPointCount,
    eModelFaceCount,
    eModelIsWatertight,
    eModelHasNormals,
    eModelHasVertexColor,
    eModelHasUVSpace,
    eModelBoundingBoxP1X,
    eModelBoundingBoxP1Y,
    eModelBoundingBoxP1Z,
    eModelBoundingBoxP2X,
    eModelBoundingBoxP2Y,
    eModelBoundingBoxP2Z,
    eModelUVMapEdgeLength,
    eModelChannelPosition,
    eModelChannelWidth,
    eModelUVMapType,
    eSceneIsOriented,
    eSceneHasBeenQCd,
    eSceneCountScene,
    eSceneCountNode,
    eSceneCountCamera,
    eSceneCountLight,
    eSceneCountModel,
    eSceneCountMeta,
    eSceneCountSetup,
    eSceneCountTour,
    eAssetFileName,
    eAssetFilePath,
    eAssetType,
    eAVUserCreator,
    eAVStorageHash,
    eAVStorageSize,
    eAVIngested,
    eAVBulkIngest,
    eStakeholderEmailAddress,
    eStakeholderPhoneNumberMobile,
    eStakeholderPhoneNumberOffice,
    eStakeholderMailingAddress,
}

export type NavigationFilter = {
    idRoot: number;                         // idSystemObject of item for which we should get children; 0 means get everything
    objectTypes: eSystemObjectType[];       // empty array means give all appropriate children types
    metadataColumns: eMetadata[];           // empty array means give no metadata
    search: string;                         // search string from the user
    objectsToDisplay: eSystemObjectType[];  // objects to display
    units: number[];                        // idSystemObject[] for units filter
    projects: number[];                     // idSystemObject[] for projects filter
    has: eSystemObjectType[];               // has system object filter
    missing: eSystemObjectType[];           // missing system object filter
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
    objectType: eSystemObjectType;          // system object type of the entry (eProject, eUnit, eSubject, eItem, eCaptureData, etc.)
    idObject: number;                       // database ID of the object (e.g. Project.idProject, Unit.idUnit, Subject.idSubject, etc.)
    metadata: string[];                     // array of metadata values, in the order of NavigationResult.metadataColumns, matching the order of NavigationFilter.metadataColumns
};

export type NavigationResult = {
    success: boolean;
    error: string;
    entries: NavigationResultEntry[];
    metadataColumns: eMetadata[];
    cursorMark?: string | null;             // when provided, additional results are available by requesting another navigation, using this returned value for the NavigationFilter.cursorMark
};

export interface INavigation {
    getObjectChildren(filter: NavigationFilter): Promise<NavigationResult>;
    getIndexer(): Promise<IIndexer | null>;
}