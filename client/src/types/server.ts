/**
 * This file exists to provide a single location for enumerations, functions, strings, etc shared
 * between client and server code.
 *
 * Only add shared content like that here ... and this shared content cannot depend on external modules
 * (i.e. no imports here!)
 */

/** enum used to provide declarative, programmatic access to sorted vocabulary for system-generated vocabulary sets */
export enum eVocabularySetID {
    eCaptureDataCaptureMethod,
    eCaptureDataDatasetType,
    eCaptureDataItemPositionType,
    eCaptureDataFocusType,
    eCaptureDataLightSourceType,
    eCaptureDataBackgroundRemovalMethod,
    eCaptureDataClusterType,
    eCaptureDataFileVariantType,
    eModelCreationMethod,
    eModelModality,
    eModelUnits,
    eModelPurpose,
    eModelFileType,
    eModelProcessingActionStepActionMethod,
    eModelMaterialChannelMaterialType,
    eIdentifierIdentifierType,
    eIdentifierIdentifierTypeActor,
    eMetadataMetadataSource,
    eWorkflowStepWorkflowStepType,
    eAssetAssetType,
    eJobJobType,
    eWorkflowType,
    eWorkflowEvent,
    eEdan3DResourceAttributeUnits,
    eEdan3DResourceAttributeModelFileType,
    eEdan3DResourceAttributeFileType,
    eEdan3DResourceType,
    eEdan3DResourceCategory,
    eEdanMDMFields,
    eNone = -1
}

export enum eVocabularyID {
    eIdentifierIdentifierTypeARK,
    eIdentifierIdentifierTypeDOI,
    eIdentifierIdentifierTypeUnitCMSID,
    eAssetAssetTypeBulkIngestion,
    eAssetAssetTypeCaptureDataSetPhotogrammetry,
    eAssetAssetTypeCaptureDataSetDiconde,
    eAssetAssetTypeCaptureDataSetDicom,
    eAssetAssetTypeCaptureDataSetLaserLine,
    eAssetAssetTypeCaptureDataSetSphericalLaser,
    eAssetAssetTypeCaptureDataSetStructuredLight,
    eAssetAssetTypeCaptureDataSetOther,
    eAssetAssetTypeCaptureDataFile,
    eAssetAssetTypeModel,
    eAssetAssetTypeModelGeometryFile,
    eAssetAssetTypeModelUVMapFile,
    eAssetAssetTypeScene,
    eAssetAssetTypeProjectDocumentation,
    eAssetAssetTypeIntermediaryFile,
    eAssetAssetTypeAttachment,
    eAssetAssetTypeOther,
    eMetadataMetadataSourceBulkIngestion,
    eMetadataMetadataSourceImage,
    eCaptureDataCaptureMethodPhotogrammetry,
    eCaptureDataCaptureMethodCT,
    eCaptureDataCaptureMethodStructuredLight,
    eCaptureDataCaptureMethodLaserLine,
    eCaptureDataCaptureMethodSphericalLaser,
    eCaptureDataFileVariantTypeRaw,
    eCaptureDataFileVariantTypeProcessed,
    eCaptureDataFileVariantTypeFromCamera,
    eModelCreationMethodScanToMesh,
    eModelCreationMethodCAD,
    eModelModalityPointCloud,
    eModelModalityMesh,
    eModelUnitsMicrometer,
    eModelUnitsMillimeter,
    eModelUnitsCentimeter,
    eModelUnitsMeter,
    eModelUnitsKilometer,
    eModelUnitsInch,
    eModelUnitsFoot,
    eModelUnitsYard,
    eModelUnitsMile,
    eModelUnitsAstronomicalUnit,
    eModelPurposeMaster,
    eModelPurposeWebDelivery,
    eModelPurposeDownload,
    eModelPurposeIntermediateProcessingStep,
    eModelFileTypeobj,
    eModelFileTypeply,
    eModelFileTypestl,
    eModelFileTypeglb,
    eModelFileTypegltf,
    eModelFileTypeusd,
    eModelFileTypeusdz,
    eModelFileTypex3d,
    eModelFileTypewrl,
    eModelFileTypedae,
    eModelFileTypefbx,
    eModelFileTypema,
    eModelFileType3ds,
    eModelFileTypeptx,
    eModelFileTypepts,
    eModelMaterialChannelMaterialTypeDiffuse,
    eModelMaterialChannelMaterialTypeSpecular,
    eModelMaterialChannelMaterialTypeAmbient,
    eModelMaterialChannelMaterialTypeEmissive,
    eModelMaterialChannelMaterialTypeBump,
    eModelMaterialChannelMaterialTypeNormal,
    eModelMaterialChannelMaterialTypeGlossiness,
    eModelMaterialChannelMaterialTypeOpacity,
    eModelMaterialChannelMaterialTypeDisplacement,
    eModelMaterialChannelMaterialTypeOcclusion,
    eModelMaterialChannelMaterialTypeReflection,
    eModelMaterialChannelMaterialTypeMetalness,
    eModelMaterialChannelMaterialTypeRoughness,
    eModelMaterialChannelMaterialTypeNone,
    eModelMaterialChannelMaterialTypeUnknown,
    eJobJobTypeCookBake,
    eJobJobTypeCookDecimateUnwrap,
    eJobJobTypeCookDecimate,
    eJobJobTypeCookGenerateUsdz,
    eJobJobTypeCookGenerateWebGltf,
    eJobJobTypeCookInspectMesh,
    eJobJobTypeCookSIArBackfillFix,
    eJobJobTypeCookSIGenerateDownloads,
    eJobJobTypeCookSIOrientModelToSvx,
    eJobJobTypeCookSIPackratInspect,
    eJobJobTypeCookSIVoyagerAsset,
    eJobJobTypeCookSIVoyagerScene,
    eJobJobTypeCookUnwrap,
    eWorkflowTypeCookJob,
    eWorkflowTypeIngestion,
    eWorkflowTypeUpload,
    eWorkflowStepTypeStart,
    eWorkflowEventIngestionUploadAssetVersion,
    eWorkflowEventIngestionIngestObject,
    eEdan3DResourceAttributeUnitsmm,
    eEdan3DResourceAttributeUnitscm,
    eEdan3DResourceAttributeUnitsm,
    eEdan3DResourceAttributeUnitskm,
    eEdan3DResourceAttributeUnitsin,
    eEdan3DResourceAttributeUnitsft,
    eEdan3DResourceAttributeUnitsyd,
    eEdan3DResourceAttributeUnitsmi,
    eEdan3DResourceAttributeModelFileTypeobj,
    eEdan3DResourceAttributeModelFileTypeply,
    eEdan3DResourceAttributeModelFileTypestl,
    eEdan3DResourceAttributeModelFileTypeglb,
    eEdan3DResourceAttributeModelFileTypex3d,
    eEdan3DResourceAttributeModelFileTypegltf,
    eEdan3DResourceAttributeModelFileTypeusdz,
    eEdan3DResourceAttributeFileTypezip,
    eEdan3DResourceAttributeFileTypeglb,
    eEdan3DResourceAttributeFileTypeusdz,
    eEdan3DResourceType3dmesh,
    eEdan3DResourceTypeCADmodel,
    eEdan3DResourceCategoryFullresolution,
    eEdan3DResourceCategoryMediumresolution,
    eEdan3DResourceCategoryLowresolution,
    eEdan3DResourceCategoryWatertight,
    eEdan3DResourceCategoryiOSARmodel,
    eEdanMDMFieldsLabel,
    eEdanMDMFieldsTitle,
    eEdanMDMFieldsRecordID,
    eEdanMDMFieldsUnit,
    eEdanMDMFieldsLicense,
    eEdanMDMFieldsLicenseText,
    eEdanMDMFieldsObjectType,
    eEdanMDMFieldsDate,
    eEdanMDMFieldsPlace,
    eEdanMDMFieldsTopic,
    eEdanMDMFieldsIdentifierFT,
    eEdanMDMFieldsDataSourceFT,
    eEdanMDMFieldsDateFT,
    eEdanMDMFieldsNameFT,
    eEdanMDMFieldsObjectRightsFT,
    eEdanMDMFieldsPlaceFT,
    eEdanMDMFieldsTaxonomicNameFT,
    eEdanMDMFieldsNotesFT,
    eEdanMDMFieldsPhysicalDescriptionFT,
    eNone = -1
}

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
    eSceneCountScene,
    eSceneCountNode,
    eSceneCountCamera,
    eSceneCountLight,
    eSceneCountModel,
    eSceneCountMeta,
    eSceneCountSetup,
    eSceneCountTour,
    eSceneEdanUUID,
    eScenePosedAndQCd,
    eSceneApprovedForPublication,
    eAssetType,
    eAVFileName,
    eAVFilePath,
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

export enum eSystemObjectType {
    eUnknown = 0,
    eUnit = 1,
    eProject = 2,
    eSubject = 3,
    eItem = 4,
    eCaptureData = 5,
    eModel = 6,
    eScene = 7,
    eIntermediaryFile = 8,
    eProjectDocumentation = 9,
    eAsset = 10,
    eAssetVersion = 11,
    eActor = 12,
    eStakeholder = 13,
}

export enum eLicense {
    eViewDownloadCC0 = 1,           // 'View and Download CC0'
    eViewDownloadRestriction = 2,   // 'View and Download with usage restrictions',
    eViewOnly = 3,                  // 'View Only',
    eRestricted = 4,                // 'Restricted', default
}

export enum ePublishedState {
    eNotPublished = 0,              // 'Not Published', default
    eAPIOnly = 1,                   // 'API Only',
    ePublished = 2,                 // 'Published'
}

export enum eIdentifierIdentifierType {
    eARK = 79,
    eDOI = 80,
    eUnitCMSID = 81
}

export function LicenseEnumToString(eState: eLicense): string {
    switch (eState) {
        case eLicense.eViewDownloadCC0:         return 'View and Download CC0';
        case eLicense.eViewDownloadRestriction: return 'View and Download with usage restrictions';
        case eLicense.eViewOnly:                return 'View Only';
        default:
        case eLicense.eRestricted:              return 'Restricted';
    }
}

export function PublishedStateEnumToString(eState: ePublishedState): string {
    switch (eState) {
        case ePublishedState.eAPIOnly:                  return 'API Only';
        case ePublishedState.ePublished:                return 'Published';
        default:
        case ePublishedState.eNotPublished:             return 'Not Published';
    }
}

export enum eSubjectUnitIdentifierSortColumns {
    eUnitAbbreviation = 1,
    eSubjectName = 2,
    eIdentifierValue = 3,
    eDefault = 0
}

export enum eIcon {
    eIconDownload = 1
}

export enum eLinkOrigin {
    eClient = 1,
    eServer = 2,
    eNone = 0
}

export enum eAssetGridColumnType {
    eString = 0,
    eNumber = 1,
    eBoolean = 2,
    eHyperLink = 3,
    eDate = 4,
    eFileSize = 5
}

// Keep this in sync with SQL in WorkflowListResult.search()
export enum eWorkflowJobRunStatus {
    eUnitialized = 0,
    eCreated = 1,
    eRunning = 2,
    eWaiting = 3,
    eDone = 4,
    eError = 5,
    eCancelled = 6,
}

export enum eWorkflowListSortColumns {
    eSet = 1,
    eType = 2,
    eState = 3,
    eOwner = 4,
    eStart = 5,
    eLast = 6,
    eReport = 7,
    eJobRun = 8,
    eError = 9,
    eDefault = 0
}

export const authenticationFailureMessage: string = 'GraphQL user is not authenticated';

export const repositoryRowCount = 300;
