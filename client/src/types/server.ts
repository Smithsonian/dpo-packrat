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
    eModelGeometryFileModelFileType,
    eModelProcessingActionStepActionMethod,
    eModelUVMapChannelUVMapType,
    eIdentifierIdentifierType,
    eIdentifierIdentifierTypeActor,
    eMetadataMetadataSource,
    eWorkflowStepWorkflowStepType,
    eAssetAssetType,
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
    eAssetAssetTypeOther,
    eCaptureDataCaptureMethodPhotogrammetry,
    eCaptureDataCaptureMethodCT,
    eCaptureDataCaptureMethodStructuredLight,
    eCaptureDataCaptureMethodLaserLine,
    eCaptureDataCaptureMethodSphericalLaser,
    eCaptureDataFileVariantTypeRaw,
    eCaptureDataFileVariantTypeProcessed,
    eCaptureDataFileVariantTypeFromCamera,
    eMetadataMetadataSourceBulkIngestion,
    eNone = -1
}

export enum eMetadata {
    eUnitAbbreviation,
    eSubjectIdentifier,
    eItemName
}

export enum eSystemObjectType {
    eUnit,
    eProject,
    eSubject,
    eItem,
    eCaptureData,
    eModel,
    eScene,
    eIntermediaryFile,
    eProjectDocumentation,
    eAsset,
    eAssetVersion,
    eActor,
    eStakeholder,
    eUnknown
}
