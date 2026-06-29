/**
 * This file exists to provide a single location for enumerations, functions, strings, etc shared
 * between client and server code.
 *
 * Only add shared content like that here ... and this shared content cannot depend on external modules
 * (i.e. no imports here!)
 */

/** enum used to provide declarative, programmatic access to sorted vocabulary for system-generated vocabulary sets
 * Note: all new sets need to go at the bottom of the list so they match IDs added to the DB
*/
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
    eCaptureDataDatasetUse,
    eModelVariant,
    eCaptureDataVolumeModality,
    eCaptureDataVolumeScanType,
    eCaptureDataVolumeContentType,
    eCaptureDataVolumeFilterLocation,
    eCaptureDataVolumeVoxelSizeUnit,
    eCaptureDataVolumeSpecimenPreparation,
    eNone = -1
}

export enum eVocabularyID {
    eIdentifierIdentifierTypeARK,
    eIdentifierIdentifierTypeDOI,
    eIdentifierIdentifierTypeEdanRecordID,
    eIdentifierIdentifierTypeAccession,
    eIdentifierIdentifierTypeAccessionNumber,
    eIdentifierIdentifierTypeArchivesCollectionNumber,
    eIdentifierIdentifierTypeBankCharterNumber,
    eIdentifierIdentifierTypeBarcode,
    eIdentifierIdentifierTypeCallNumber,
    eIdentifierIdentifierTypeCatalogID,
    eIdentifierIdentifierTypeCatalogNumber,
    eIdentifierIdentifierTypeCollectorDonorNumber,
    eIdentifierIdentifierTypeControlNumber,
    eIdentifierIdentifierTypeDesignPatentNumber,
    eIdentifierIdentifierTypeDesignerNumber,
    eIdentifierIdentifierTypeFieldIdentifier,
    eIdentifierIdentifierTypeGUID,
    eIdentifierIdentifierTypeIDNumber,
    eIdentifierIdentifierTypeIdentifier,
    eIdentifierIdentifierTypeImageID,
    eIdentifierIdentifierTypeImageNumber,
    eIdentifierIdentifierTypeInventoryNumber,
    eIdentifierIdentifierTypeISBN,
    eIdentifierIdentifierTypeISSN,
    eIdentifierIdentifierTypeLabelNumber,
    eIdentifierIdentifierTypeLicenseNumber,
    eIdentifierIdentifierTypeLocalNumber,
    eIdentifierIdentifierTypeMakerNumber,
    eIdentifierIdentifierTypeModelNumber,
    eIdentifierIdentifierTypeNonaccessionNumber,
    eIdentifierIdentifierTypeObjectNumber,
    eIdentifierIdentifierTypeOriginalObjectIdentifier,
    eIdentifierIdentifierTypeOtherNumbers,
    eIdentifierIdentifierTypePatentNumber,
    eIdentifierIdentifierTypePlateLetters,
    eIdentifierIdentifierTypePlateNumber,
    eIdentifierIdentifierTypePublisherNumber,
    eIdentifierIdentifierTypeRecordID,
    eIdentifierIdentifierTypeRecordNumber,
    eIdentifierIdentifierTypeSerialNumber,
    eIdentifierIdentifierTypeSeriesStandardNumber,
    eIdentifierIdentifierTypeStandardNumber,
    eIdentifierIdentifierTypeUSNMNumber,
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
    eMetadataMetadataSourceVolumetric,
    eCaptureDataCaptureMethodPhotogrammetry,
    eCaptureDataCaptureMethodVolumetric,
    eCaptureDataCaptureMethodStructuredLight,
    eCaptureDataCaptureMethodLaserLine,
    eCaptureDataCaptureMethodSphericalLaser,
    eCaptureDataDatasetTypePhotogrammetryImageSet,
    eCaptureDataDatasetTypeGreyCardImageSet,
    eCaptureDataDatasetTypeColorCardImageSet,
    eCaptureDataDatasetTypeBackgroundRemovalImageSet,
    eCaptureDataDatasetTypeCalibrationDataset,
    eCaptureDataFileVariantTypeRaw,
    eCaptureDataFileVariantTypeProcessed,
    eCaptureDataFileVariantTypeFromCamera,
    eCaptureDataFileVariantTypeMasks,
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
    eModelPurposeVoyagerSceneModel,
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
    eWorkflowTypeAuditRetention,
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
    eCaptureDataDatasetUseAlignment,
    eCaptureDataDatasetUseReconstruction,
    eCaptureDataDatasetUseTextureGeneration,
    eModelVariantRawClean,
    eModelVariantPresentation,
    eAssetAssetTypeCaptureDataSetVolumetric,
    eJobJobTypeVolumeInspect,
    eWorkflowTypeJob,
    eCaptureDataVolumeModalityMedicalCT,
    eCaptureDataVolumeModalityMicroCT,
    eCaptureDataVolumeModalityNanoCT,
    eCaptureDataVolumeModalitySynchrotron,
    eCaptureDataVolumeModalityMRI,
    eCaptureDataVolumeScanTypeRaw,
    eCaptureDataVolumeScanTypeReconstructed,
    eCaptureDataVolumeContentTypeImageStack,
    eCaptureDataVolumeContentTypeDICOM,
    eCaptureDataVolumeContentTypeOther,
    eCaptureDataVolumeFilterLocationNone,
    eCaptureDataVolumeFilterLocationSourceSide,
    eCaptureDataVolumeFilterLocationDetectorSide,
    eCaptureDataVolumeFilterLocationBoth,
    eCaptureDataVolumeVoxelSizeUnitMicrometer,
    eCaptureDataVolumeVoxelSizeUnitMillimeter,
    eCaptureDataVolumeSpecimenPreparationFluidPreserved,
    eCaptureDataVolumeSpecimenPreparationDry,
    eCaptureDataVolumeSpecimenPreparationStained,
    eCaptureDataVolumeSpecimenPreparationFrozen,
    eCaptureDataVolumeSpecimenPreparationEmbedded,
    eCaptureDataVolumeSpecimenPreparationLive,
    eCaptureDataVolumeSpecimenPreparationOther,
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
    eModelCountAnimations,
    eModelCountCameras,
    eModelCountFaces,
    eModelCountTriangles,
    eModelCountLights,
    eModelCountMaterials,
    eModelCountMeshes,
    eModelCountVertices,
    eModelCountEmbeddedTextures,
    eModelCountLinkedTextures,
    eModelFileEncoding,
    eModelIsDracoCompressed,
    eModelMaterialName,
    eModelMaterialChannelType,
    eModelMaterialChannelTypeOther,
    eModelMaterialChannelUVMapEmbedded,
    eModelMaterialChannelPosition,
    eModelMaterialChannelWidth,
    eModelMaterialChannelValues,
    eModelMaterialChannelAdditionalAttributes,
    eModelMaterialUVMapEdgeLength,
    eModelObjectBoundingBoxP1X,
    eModelObjectBoundingBoxP1Y,
    eModelObjectBoundingBoxP1Z,
    eModelObjectBoundingBoxP2X,
    eModelObjectBoundingBoxP2Y,
    eModelObjectBoundingBoxP2Z,
    eModelObjectCountVertices,
    eModelObjectCountFaces,
    eModelObjectCountTriangles,
    eModelObjectCountColorChannels,
    eModelObjectCountTextureCoordinateChannels,
    eModelObjectHasBones,
    eModelObjectHasFaceNormals,
    eModelObjectHasTangents,
    eModelObjectHasTextureCoordinates,
    eModelObjectHasVertexNormals,
    eModelObjectHasVertexColor,
    eModelObjectIsTwoManifoldUnbounded,
    eModelObjectIsTwoManifoldBounded,
    eModelObjectIsWatertight,
    eModelObjectSelfIntersecting,
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
    eCDVolumeModality,
    eCDVolumeContentType,
    eCDVolumeScanType,
    eCDVolumeSpecimenPreparation,
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
    eViewDownloadCC0 = 1,           // CC0, Publishable w/ Downloads
    eViewDownloadRestriction = 2,   // SI ToU, Publishable w/ Downloads
    eViewOnly = 3,                  // SI ToU, Publishable Only
    eRestricted = 4,                // Restricted, Not Publishable, default
}

export enum ePublishedState {
    eNotPublished = 0,              // 'Not Published', default
    eAPIOnly = 1,                   // 'API Only',
    ePublished = 2,                 // 'Published'
    eInternal = 3,                  // 'Internal' use only. similar to eNotPublished for EDAN flags
}

export function LicenseEnumToString(eState: eLicense): string {
    switch (eState) {
        case eLicense.eViewDownloadCC0:         return 'CC0, Publishable w/ Downloads';
        case eLicense.eViewDownloadRestriction: return 'SI ToU, Publishable w/ Downloads';
        case eLicense.eViewOnly:                return 'SI ToU, Publishable Only';
        default:
        case eLicense.eRestricted:              return 'Restricted, Not Publishable';
    }
}

export function PublishedStateEnumToString(eState: ePublishedState): string {
    switch (eState) {
        case ePublishedState.eAPIOnly:                  return 'Public (Unlisted)';
        case ePublishedState.ePublished:                return 'Public';
        case ePublishedState.eInternal:                 return 'Internal';
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
    eFileSize = 5,
    eTruncate = 6
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
    eProject = 10,
    eDefault = 0
}

export const authenticationFailureMessage: string = 'GraphQL user is not authenticated';

export const repositoryRowCount = 300;

// Single source of truth mapping a file's extension to a coarse category, used to reason about which
// asset type(s) an uploaded package is compatible with. This is intentionally separate from the
// model-file-TYPE vocabulary map (VocabularyCache.mapModelFileByExtensionID), which resolves an
// extension to a specific Model.FileType vocabulary row.
export enum eFileCategory {
    eMesh = 'mesh',
    eModelMaterial = 'modelMaterial',
    eImage = 'image',
    eVolumetricSlice = 'volumetricSlice',
    eVolumetricSidecar = 'volumetricSidecar',
    eSceneDescriptor = 'sceneDescriptor',
    eDocument = 'document',
    eAudio = 'audio',
    eUnknown = 'unknown',
}

// Mesh / geometry extensions. Mirrors VocabularyCache.mapModelFileByExtensionID's supported set.
export const ModelFileExtensions: string[] = [
    '.obj', '.ply', '.stl', '.glb', '.gltf', '.usda', '.usdc', '.usdz',
    '.x3d', '.wrl', '.dae', '.fbx', '.ma', '.3ds', '.ptx', '.pts',
];

// Model support files (accompany a mesh).
export const ModelMaterialFileExtensions: string[] = ['.mtl'];

// Raster image extensions: processed formats plus raw camera formats.
export const ImageFileExtensions: string[] = [
    '.jpg', '.jpeg', '.png', '.tif', '.tiff', '.tga', '.bmp', '.gif', '.webp', '.avif', '.svg',
    '.cr2', '.cr3', '.nef', '.arw', '.dng', '.raf', '.rw2', '.orf', '.camdng',
];

// Volumetric slice data — the only hard volumetric signal (actual slices).
export const VolumetricSliceFileExtensions: string[] = ['.dcm', '.dicom', '.ima'];

// Volumetric scan sidecars (Phoenix acquisition/reconstruction logs). These are documents that also
// veto a Photogrammetry reading when slice/stack data is present; they are not volumetric data alone.
export const VolumetricSidecarFileExtensions: string[] = ['.pca', '.pcr'];

// Document formats (sidecars also count as documents).
export const DocumentFileExtensions: string[] = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odf', '.html', '.htm'];

export const AudioFileExtensions: string[] = ['.mp3', '.wav', '.aif', '.aiff', '.flac'];

// Union of the two volumetric tiers. Consumed by the upload-time volumetric guard.
export const VolumetricFileExtensions: string[] = [...VolumetricSliceFileExtensions, ...VolumetricSidecarFileExtensions];

export const fileExtension = (fileName: string): string => {
    const lower: string = fileName.toLowerCase();
    const dot: number = lower.lastIndexOf('.');
    return dot >= 0 ? lower.slice(dot) : '';
};

export function classifyFile(fileName: string): eFileCategory {
    if (fileName.toLowerCase().endsWith('.svx.json'))   return eFileCategory.eSceneDescriptor;
    const ext: string = fileExtension(fileName);
    if (ModelFileExtensions.includes(ext))              return eFileCategory.eMesh;
    if (ModelMaterialFileExtensions.includes(ext))      return eFileCategory.eModelMaterial;
    if (VolumetricSliceFileExtensions.includes(ext))    return eFileCategory.eVolumetricSlice;
    if (VolumetricSidecarFileExtensions.includes(ext))  return eFileCategory.eVolumetricSidecar;
    if (ImageFileExtensions.includes(ext))              return eFileCategory.eImage;
    if (DocumentFileExtensions.includes(ext))           return eFileCategory.eDocument;
    if (AudioFileExtensions.includes(ext))              return eFileCategory.eAudio;
    return eFileCategory.eUnknown;
}

export const isVolumetricFileExtension = (extOrName: string): boolean => {
    const lower: string = extOrName.toLowerCase();
    return VolumetricFileExtensions.some(ext => lower === ext || lower.endsWith(ext));
};

// Single source of truth for Cook-generated download filename conventions. Each Cook download type
// has two filename forms used across the codebase:
//   - suffixShort: a substring match (String.includes), used by ModelSceneXref.isDownloadable()
//   - suffixFull:  a dashed/resolution-prefixed suffix match (String.endsWith), used by Cook
//                  verification, scene-zip detection, and orphan-download inference
// suffixShort is always a substring of suffixFull. Keep this the ONLY place these strings live.
export interface CookDownloadDescriptor {
    typeKey: string;       // Cook download type key, e.g. 'objZipLow'
    suffixShort: string;   // includes-form, e.g. '4096-obj_std.zip'
    suffixFull: string;    // endsWith-form, e.g. '-150k-4096-obj_std.zip'
}
export const CookDownloadDescriptors: CookDownloadDescriptor[] = [
    { typeKey: 'webAssetGlbLowUncompressed', suffixShort: '4096_std.glb',                suffixFull: '-150k-4096_std.glb' },
    { typeKey: 'webAssetGlbARCompressed',    suffixShort: '2048_std_draco.glb',          suffixFull: '-100k-2048_std_draco.glb' },
    { typeKey: 'usdz',                       suffixShort: '2048_std.usdz',               suffixFull: '-100k-2048_std.usdz' },
    { typeKey: 'objZipFull',                 suffixShort: 'full_resolution-obj_std.zip', suffixFull: '-full_resolution-obj_std.zip' },
    { typeKey: 'gltfZipLow',                 suffixShort: '4096-gltf_std.zip',           suffixFull: '-150k-4096-gltf_std.zip' },
    { typeKey: 'objZipLow',                  suffixShort: '4096-obj_std.zip',            suffixFull: '-150k-4096-obj_std.zip' },
];

// Cook download suffixes in the requested form. Pass 'short' for the includes-form (isDownloadable),
// 'full' for the endsWith-form (Cook verification / detection).
export const cookDownloadSuffixes = (form: 'short' | 'full'): string[] =>
    CookDownloadDescriptors.map(d => form === 'short' ? d.suffixShort : d.suffixFull);

// Cook-generated download filename suffixes (short/includes form). Used to reject custom downloads
// whose filename would masquerade as a Cook output, and by ModelSceneXref.isDownloadable().
export const CookDownloadFileSuffixes: string[] = cookDownloadSuffixes('short');

// User-selectable custom (non-Cook) download types. Drives the ingestion dropdown and the
// server-side whitelist. These are fixed protocol values, not deployment settings.
export const CustomDownloadTypes: string[] = ['watertight', 'other'];

// Upload file extensions a custom download may use as-is: each maps directly to an EDAN file_type.
export const CustomDownloadAcceptedExtensions: string[] = ['.glb', '.ply', '.usdz', '.zip'];

// Valid model formats that have no standalone EDAN file_type and must be delivered zipped.
export const CustomDownloadMustZipExtensions: string[] = ['.obj', '.stl'];

// The ModelSceneXref.Usage string for a custom download of the given type ('Download:watertight').
export const customDownloadUsage = (type: string): string => `Download:${type}`;

// True when a Usage string identifies a custom (non-Cook) download.
export const isCustomDownloadUsage = (usage: string | null | undefined): boolean =>
    !!usage && CustomDownloadTypes.includes(usage.replace('Download:', ''));

// EDAN-accepted deliverable container types (the resource file_type / FILE_TYPE wire token).
// USDZ is accepted by EDAN even though the published 3D API doc omits it.
export const EdanFileTypes: string[] = ['glb', 'ply', 'zip', 'usdz'];

// Single source of truth for translating a Packrat-internal resource category to the EDAN
// file_quality wire token. Keeps internal vocabulary clean (e.g. 'Watertight') while emitting the
// exact tokens EDAN indexes. The resolution categories use the underscore form (matching the SI 3D
// API file_quality values); 'Watertight' -> 'Water_tight' (space->underscore can't derive this).
// 'iOS AR model' is not a documented file_quality value and is stored as-is.
export const EdanFileQualityMap: { [internal: string]: string } = {
    'Full resolution':   'Full_resolution',
    'Medium resolution': 'Medium_resolution',
    'Low resolution':    'Low_resolution',
    'Watertight':        'Water_tight',
    'iOS AR model':      'iOS AR model',
};

export const toEdanFileQuality = (internal: string): string => EdanFileQualityMap[internal] ?? internal;
