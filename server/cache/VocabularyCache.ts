import * as LOG from '../utils/logger';
import { CacheControl } from './CacheControl';
import { Vocabulary, VocabularySet } from '../db';
import * as path from 'path';

/**
 * enum used to provide declarative, programmatic access to sorted vocabulary for system-generated vocabulary sets
 *
 * Note: these types are also used at client/src/types/server.ts, make sure to update the enum's there as well
 * */
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

export class VocabularyCache {
    private static singleton: VocabularyCache | null = null;

    private vocabMap:               Map<number, Vocabulary>         = new Map<number, Vocabulary>();        // map of Vocab ID     -> Vocabulary object
    private vocabSetMap:            Map<number, VocabularySet>      = new Map<number, VocabularySet>();     // map of Vocab Set ID -> VocabularySet object
    private vocabSetEntries:        Map<number, Vocabulary[]>       = new Map<number, Vocabulary[]>();      // map of Vocab Set ID -> Sorted Array of Vocabulary objects
    private vocabSetEnumEntryMap:   Map<eVocabularySetID, Map<string, Vocabulary>> = new Map<eVocabularySetID, Map<string, Vocabulary>>();  // map of Vocab Set ID Enum -> map of vocabulary term, normalized -> Vocabulary record

    private vocabEnumIDMap:         Map<eVocabularyID, number>      = new Map<eVocabularyID, number>();     // map of Vocab ID Enum -> Vocab ID
    private vocabIDEnumMap:         Map<number, eVocabularyID>      = new Map<number, eVocabularyID>();     // map of Vocab ID -> Vocab ID Enum

    private vocabSetEnumIDMap:      Map<eVocabularySetID, number>   = new Map<eVocabularySetID, number>();  // map of Vocab Set ID Enum -> Vocab Set ID
    private vocabSetIDEnumMap:      Map<number, eVocabularySetID>   = new Map<number, eVocabularySetID>();  // map of Vocab Set ID -> Vocab Set ID Enum

    // **************************
    // Boilerplate Implementation
    // **************************
    private constructor() { }

    private async flushInternal(): Promise<void> {
        for (let nTry: number = 1; nTry <= CacheControl.cacheBuildTries; nTry++) {
            /* istanbul ignore else */
            if (await this.flushInternalWorker())
                break;
        }
    }

    private static async getInstance(): Promise<VocabularyCache> {
        if (!VocabularyCache.singleton) {
            VocabularyCache.singleton = new VocabularyCache();
            await VocabularyCache.singleton.flushInternal();
        }
        return VocabularyCache.singleton;
    }

    // **************************
    // Cache Construction
    // **************************
    private async flushInternalWorker(): Promise<boolean> {
        LOG.info('CACHE VocabularyCache.flushInternalWorker() start', LOG.LS.eCACHE);
        const vocabArray: Vocabulary[] | null = await Vocabulary.fetchAll();
        /* istanbul ignore if */
        if (!vocabArray)
            return false;
        const vocabSetArray: VocabularySet[] | null = await VocabularySet.fetchAll();
        /* istanbul ignore if */
        if (!vocabSetArray)
            return false;

        for (const vocabularySet of vocabSetArray) {
            this.vocabSetMap.set(vocabularySet.idVocabularySet, vocabularySet);
            this.vocabSetEntries.set(vocabularySet.idVocabularySet, []);

            let eVocabSetEnum: eVocabularySetID = eVocabularySetID.eNone;
            switch (vocabularySet.Name) {
                case 'CaptureData.CaptureMethod':               eVocabSetEnum = eVocabularySetID.eCaptureDataCaptureMethod; break;
                case 'CaptureData.DatasetType':                 eVocabSetEnum = eVocabularySetID.eCaptureDataDatasetType; break;
                case 'CaptureData.ItemPositionType':            eVocabSetEnum = eVocabularySetID.eCaptureDataItemPositionType; break;
                case 'CaptureData.FocusType':                   eVocabSetEnum = eVocabularySetID.eCaptureDataFocusType; break;
                case 'CaptureData.LightSourceType':             eVocabSetEnum = eVocabularySetID.eCaptureDataLightSourceType; break;
                case 'CaptureData.BackgroundRemovalMethod':     eVocabSetEnum = eVocabularySetID.eCaptureDataBackgroundRemovalMethod; break;
                case 'CaptureData.ClusterType':                 eVocabSetEnum = eVocabularySetID.eCaptureDataClusterType; break;
                case 'CaptureDataFile.VariantType':             eVocabSetEnum = eVocabularySetID.eCaptureDataFileVariantType; break;
                case 'Model.CreationMethod':                    eVocabSetEnum = eVocabularySetID.eModelCreationMethod; break;
                case 'Model.Modality':                          eVocabSetEnum = eVocabularySetID.eModelModality; break;
                case 'Model.Units':                             eVocabSetEnum = eVocabularySetID.eModelUnits; break;
                case 'Model.Purpose':                           eVocabSetEnum = eVocabularySetID.eModelPurpose; break;
                case 'Model.FileType':                          eVocabSetEnum = eVocabularySetID.eModelFileType; break;
                case 'ModelProcessingActionStep.ActionMethod':  eVocabSetEnum = eVocabularySetID.eModelProcessingActionStepActionMethod; break;
                case 'ModelMaterialChannel.MaterialType':       eVocabSetEnum = eVocabularySetID.eModelMaterialChannelMaterialType; break;
                case 'Identifier.IdentifierType':               eVocabSetEnum = eVocabularySetID.eIdentifierIdentifierType; break;
                case 'Identifier.IdentifierTypeActor':          eVocabSetEnum = eVocabularySetID.eIdentifierIdentifierTypeActor; break;
                case 'Metadata.MetadataSource':                 eVocabSetEnum = eVocabularySetID.eMetadataMetadataSource; break;
                case 'WorkflowStep.WorkflowStepType':           eVocabSetEnum = eVocabularySetID.eWorkflowStepWorkflowStepType; break;
                case 'Asset.AssetType':                         eVocabSetEnum = eVocabularySetID.eAssetAssetType; break;
                case 'Job.JobType':                             eVocabSetEnum = eVocabularySetID.eJobJobType; break;
                case 'Workflow.Type':                           eVocabSetEnum = eVocabularySetID.eWorkflowType; break;
                case 'Workflow.Event':                          eVocabSetEnum = eVocabularySetID.eWorkflowEvent; break;
                case 'Edan.3DResourceAttributeUnits':           eVocabSetEnum = eVocabularySetID.eEdan3DResourceAttributeUnits; break;
                case 'Edan.3DResourceAttributeModelFileType':   eVocabSetEnum = eVocabularySetID.eEdan3DResourceAttributeModelFileType; break;
                case 'Edan.3DResourceAttributeFileType':        eVocabSetEnum = eVocabularySetID.eEdan3DResourceAttributeFileType; break;
                case 'Edan.3DResourceType':                     eVocabSetEnum = eVocabularySetID.eEdan3DResourceType; break;
                case 'Edan.3DResourceCategory':                 eVocabSetEnum = eVocabularySetID.eEdan3DResourceCategory; break;
                case 'Edan.MDMFields':                          eVocabSetEnum = eVocabularySetID.eEdanMDMFields; break;
            }

            /* istanbul ignore else */
            if (eVocabSetEnum != eVocabularySetID.eNone) {
                this.vocabSetEnumIDMap.set(eVocabSetEnum, vocabularySet.idVocabularySet);
                this.vocabSetIDEnumMap.set(vocabularySet.idVocabularySet, eVocabSetEnum);
                this.vocabSetEnumEntryMap.set(eVocabSetEnum, new Map<string, Vocabulary>()); // map of Vocab Set ID Enum -> map of vocabulary term, normalized -> Vocabulary record
            }
        }

        for (const vocabulary of vocabArray) {
            this.vocabMap.set(vocabulary.idVocabulary, vocabulary);

            let eVocabEnum: eVocabularyID = eVocabularyID.eNone;
            const eVocabSetEnum: eVocabularySetID | undefined = this.vocabSetIDEnumMap.get(vocabulary.idVocabularySet); /* istanbul ignore else */
            if (eVocabSetEnum !== undefined) {
                const vocabMap = this.vocabSetEnumEntryMap.get(eVocabSetEnum); /* istanbul ignore else */
                if (vocabMap)
                    vocabMap.set(this.normalizeTerm(vocabulary.Term), vocabulary);
            }

            switch (eVocabSetEnum) {
                case eVocabularySetID.eIdentifierIdentifierType: {
                    switch (vocabulary.Term) {
                        case 'ARK':         eVocabEnum = eVocabularyID.eIdentifierIdentifierTypeARK; break;
                        case 'DOI':         eVocabEnum = eVocabularyID.eIdentifierIdentifierTypeDOI; break;
                        case 'Unit CMS ID': eVocabEnum = eVocabularyID.eIdentifierIdentifierTypeUnitCMSID; break;
                    }
                } break;

                case eVocabularySetID.eAssetAssetType: {
                    switch (vocabulary.Term) {
                        case 'Bulk Ingestion':                      eVocabEnum = eVocabularyID.eAssetAssetTypeBulkIngestion; break;
                        case 'Capture Data Set: Photogrammetry':    eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry; break;
                        case 'Capture Data Set: Diconde':           eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataSetDiconde; break;
                        case 'Capture Data Set: Dicom':             eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataSetDicom; break;
                        case 'Capture Data Set: Laser Line':        eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataSetLaserLine; break;
                        case 'Capture Data Set: Spherical Laser':   eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataSetSphericalLaser; break;
                        case 'Capture Data Set: Structured Light':  eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataSetStructuredLight; break;
                        case 'Capture Data Set: Other':             eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataSetOther; break;
                        case 'Capture Data File':                   eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataFile; break;
                        case 'Model':                               eVocabEnum = eVocabularyID.eAssetAssetTypeModel; break;
                        case 'Model Geometry File':                 eVocabEnum = eVocabularyID.eAssetAssetTypeModelGeometryFile; break;
                        case 'Model UV Map File':                   eVocabEnum = eVocabularyID.eAssetAssetTypeModelUVMapFile; break;
                        case 'Scene':                               eVocabEnum = eVocabularyID.eAssetAssetTypeScene; break;
                        case 'Project Documentation':               eVocabEnum = eVocabularyID.eAssetAssetTypeProjectDocumentation; break;
                        case 'Intermediary File':                   eVocabEnum = eVocabularyID.eAssetAssetTypeIntermediaryFile; break;
                        case 'Attachment':                          eVocabEnum = eVocabularyID.eAssetAssetTypeAttachment; break;
                        case 'Other':                               eVocabEnum = eVocabularyID.eAssetAssetTypeOther; break;
                    }
                } break;

                case eVocabularySetID.eCaptureDataCaptureMethod: {
                    switch (vocabulary.Term) {
                        case 'Photogrammetry':      eVocabEnum = eVocabularyID.eCaptureDataCaptureMethodPhotogrammetry; break;
                        case 'CT':                  eVocabEnum = eVocabularyID.eCaptureDataCaptureMethodCT; break;
                        case 'Structured Light':    eVocabEnum = eVocabularyID.eCaptureDataCaptureMethodStructuredLight; break;
                        case 'Laser Line':          eVocabEnum = eVocabularyID.eCaptureDataCaptureMethodLaserLine; break;
                        case 'Spherical Laser':     eVocabEnum = eVocabularyID.eCaptureDataCaptureMethodSphericalLaser; break;
                    }
                } break;

                case eVocabularySetID.eCaptureDataFileVariantType: {
                    switch (vocabulary.Term) {
                        case 'Raw':                 eVocabEnum = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
                        case 'Processed':           eVocabEnum = eVocabularyID.eCaptureDataFileVariantTypeProcessed; break;
                        case 'From Camera':         eVocabEnum = eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
                    }
                } break;

                case eVocabularySetID.eMetadataMetadataSource: {
                    switch (vocabulary.Term) {
                        case 'Bulk Ingestion':      eVocabEnum = eVocabularyID.eMetadataMetadataSourceBulkIngestion; break;
                        case 'Image':               eVocabEnum = eVocabularyID.eMetadataMetadataSourceImage; break;
                    }
                } break;

                case eVocabularySetID.eModelCreationMethod: {
                    switch (vocabulary.Term) {
                        case 'Scan To Mesh':        eVocabEnum = eVocabularyID.eModelCreationMethodScanToMesh; break;
                        case 'CAD':                 eVocabEnum = eVocabularyID.eModelCreationMethodCAD; break;
                    }
                } break;

                case eVocabularySetID.eModelModality: {
                    switch (vocabulary.Term) {
                        case 'Point Cloud':         eVocabEnum = eVocabularyID.eModelModalityPointCloud; break;
                        case 'Mesh':                eVocabEnum = eVocabularyID.eModelModalityMesh; break;
                    }
                } break;

                case eVocabularySetID.eModelUnits: {
                    switch (vocabulary.Term) {
                        case 'Micrometer':          eVocabEnum = eVocabularyID.eModelUnitsMicrometer; break;
                        case 'Millimeter':          eVocabEnum = eVocabularyID.eModelUnitsMillimeter; break;
                        case 'Centimeter':          eVocabEnum = eVocabularyID.eModelUnitsCentimeter; break;
                        case 'Meter':               eVocabEnum = eVocabularyID.eModelUnitsMeter; break;
                        case 'Kilometer':           eVocabEnum = eVocabularyID.eModelUnitsKilometer; break;
                        case 'Inch':                eVocabEnum = eVocabularyID.eModelUnitsInch; break;
                        case 'Foot':                eVocabEnum = eVocabularyID.eModelUnitsFoot; break;
                        case 'Yard':                eVocabEnum = eVocabularyID.eModelUnitsYard; break;
                        case 'Mile':                eVocabEnum = eVocabularyID.eModelUnitsMile; break;
                        case 'Astronomical Unit':   eVocabEnum = eVocabularyID.eModelUnitsAstronomicalUnit; break;
                    }
                } break;

                case eVocabularySetID.eModelPurpose: {
                    switch (vocabulary.Term) {
                        case 'Master':                          eVocabEnum = eVocabularyID.eModelPurposeMaster; break;
                        case 'Web Delivery':                    eVocabEnum = eVocabularyID.eModelPurposeWebDelivery; break;
                        case 'Download':                        eVocabEnum = eVocabularyID.eModelPurposeDownload; break;
                        case 'Intermediate Processing Step':    eVocabEnum = eVocabularyID.eModelPurposeIntermediateProcessingStep; break;
                    }
                } break;

                case eVocabularySetID.eModelFileType: {
                    switch (vocabulary.Term) {
                        case 'obj - Alias Wavefront Object':                eVocabEnum = eVocabularyID.eModelFileTypeobj; break;
                        case 'ply - Stanford Polygon File Format':          eVocabEnum = eVocabularyID.eModelFileTypeply; break;
                        case 'stl - StereoLithography':                     eVocabEnum = eVocabularyID.eModelFileTypestl; break;
                        case 'glb - GL Transmission Format Binary':         eVocabEnum = eVocabularyID.eModelFileTypeglb; break;
                        case 'gltf - GL Transmission Format':               eVocabEnum = eVocabularyID.eModelFileTypegltf; break;
                        case 'usd - Universal Scene Description':           eVocabEnum = eVocabularyID.eModelFileTypeusd; break;
                        case 'usdz - Universal Scene Description (zipped)': eVocabEnum = eVocabularyID.eModelFileTypeusdz; break;
                        case 'x3d':                                         eVocabEnum = eVocabularyID.eModelFileTypex3d; break;
                        case 'wrl - VRML':                                  eVocabEnum = eVocabularyID.eModelFileTypewrl; break;
                        case 'dae - COLLADA':                               eVocabEnum = eVocabularyID.eModelFileTypedae; break;
                        case 'fbx - Filmbox':                               eVocabEnum = eVocabularyID.eModelFileTypefbx; break;
                        case 'ma - Maya':                                   eVocabEnum = eVocabularyID.eModelFileTypema; break;
                        case '3ds - 3D Studio':                             eVocabEnum = eVocabularyID.eModelFileType3ds; break;
                        case 'ptx':                                         eVocabEnum = eVocabularyID.eModelFileTypeptx; break;
                        case 'pts':                                         eVocabEnum = eVocabularyID.eModelFileTypepts; break;
                    }
                } break;

                case eVocabularySetID.eModelMaterialChannelMaterialType: {
                    switch (vocabulary.Term) {
                        case 'Diffuse':         eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
                        case 'Specular':        eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
                        case 'Ambient':         eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeAmbient; break;
                        case 'Emissive':        eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeEmissive; break;
                        case 'Bump':            eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeBump; break;
                        case 'Normal':          eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeNormal; break;
                        case 'Glossiness':      eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeGlossiness; break;
                        case 'Opacity':         eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeOpacity; break;
                        case 'Displacement':    eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeDisplacement; break;
                        case 'Occlusion':       eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeOcclusion; break;
                        case 'Reflection':      eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeReflection; break;
                        case 'Metalness':       eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeMetalness; break;
                        case 'Roughness':       eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeRoughness; break;
                        case 'None':            eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeNone; break;
                        case 'Unknown':         eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeUnknown; break;
                    }
                } break;

                case eVocabularySetID.eJobJobType: {
                    switch (vocabulary.Term) {
                        case 'Cook: bake':                      eVocabEnum = eVocabularyID.eJobJobTypeCookBake; break;
                        case 'Cook: decimate-unwrap':           eVocabEnum = eVocabularyID.eJobJobTypeCookDecimateUnwrap; break;
                        case 'Cook: decimate':                  eVocabEnum = eVocabularyID.eJobJobTypeCookDecimate; break;
                        case 'Cook: generate-usdz':             eVocabEnum = eVocabularyID.eJobJobTypeCookGenerateUsdz; break;
                        case 'Cook: generate-web-gltf':         eVocabEnum = eVocabularyID.eJobJobTypeCookGenerateWebGltf; break;
                        case 'Cook: inspect-mesh':              eVocabEnum = eVocabularyID.eJobJobTypeCookInspectMesh; break;
                        case 'Cook: si-ar-backfill-fix':        eVocabEnum = eVocabularyID.eJobJobTypeCookSIArBackfillFix; break;
                        case 'Cook: si-generate-downloads':     eVocabEnum = eVocabularyID.eJobJobTypeCookSIGenerateDownloads; break;
                        case 'Cook: si-orient-model-to-svx':    eVocabEnum = eVocabularyID.eJobJobTypeCookSIOrientModelToSvx; break;
                        case 'Cook: si-packrat-inspect':        eVocabEnum = eVocabularyID.eJobJobTypeCookSIPackratInspect; break;
                        case 'Cook: si-voyager-asset':          eVocabEnum = eVocabularyID.eJobJobTypeCookSIVoyagerAsset; break;
                        case 'Cook: si-voyager-scene':          eVocabEnum = eVocabularyID.eJobJobTypeCookSIVoyagerScene; break;
                        case 'Cook: unwrap':                    eVocabEnum = eVocabularyID.eJobJobTypeCookUnwrap; break;
                    }
                } break;

                case eVocabularySetID.eWorkflowType: {
                    switch (vocabulary.Term) {
                        case 'Cook Job':                        eVocabEnum = eVocabularyID.eWorkflowTypeCookJob; break;
                        case 'Ingestion':                       eVocabEnum = eVocabularyID.eWorkflowTypeIngestion; break;
                        case 'Upload':                          eVocabEnum = eVocabularyID.eWorkflowTypeUpload; break;
                    }
                } break;

                case eVocabularySetID.eWorkflowStepWorkflowStepType: {
                    switch (vocabulary.Term) {
                        case 'Start':                           eVocabEnum = eVocabularyID.eWorkflowStepTypeStart; break;
                    }
                } break;

                case eVocabularySetID.eWorkflowEvent: {
                    switch (vocabulary.Term) {
                        case 'Ingestion: Upload Asset Version': eVocabEnum = eVocabularyID.eWorkflowEventIngestionUploadAssetVersion; break;
                        case 'Ingestion: Ingest Object':        eVocabEnum = eVocabularyID.eWorkflowEventIngestionIngestObject; break;
                    }
                } break;

                case eVocabularySetID.eEdan3DResourceAttributeUnits: {
                    switch (vocabulary.Term) {
                        case 'mm': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeUnitsmm; break;
                        case 'cm': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeUnitscm; break;
                        case 'm': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeUnitsm; break;
                        case 'km': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeUnitskm; break;
                        case 'in': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeUnitsin; break;
                        case 'ft': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeUnitsft; break;
                        case 'yd': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeUnitsyd; break;
                        case 'mi': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeUnitsmi; break;
                    }
                } break;

                case eVocabularySetID.eEdan3DResourceAttributeModelFileType: {
                    switch (vocabulary.Term) {
                        case 'obj': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeModelFileTypeobj; break;
                        case 'ply': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeModelFileTypeply; break;
                        case 'stl': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeModelFileTypestl; break;
                        case 'glb': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeModelFileTypeglb; break;
                        case 'x3d': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeModelFileTypex3d; break;
                        case 'gltf': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeModelFileTypegltf; break;
                        case 'usdz': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeModelFileTypeusdz; break;
                    }
                } break;

                case eVocabularySetID.eEdan3DResourceAttributeFileType: {
                    switch (vocabulary.Term) {
                        case 'zip': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeFileTypezip; break;
                        case 'glb': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeFileTypeglb; break;
                        case 'usdz': eVocabEnum = eVocabularyID.eEdan3DResourceAttributeFileTypeusdz; break;
                    }
                } break;

                case eVocabularySetID.eEdan3DResourceType: {
                    switch (vocabulary.Term) {
                        case '3d mesh': eVocabEnum = eVocabularyID.eEdan3DResourceType3dmesh; break;
                        case 'CAD model': eVocabEnum = eVocabularyID.eEdan3DResourceTypeCADmodel; break;
                    }
                } break;

                case eVocabularySetID.eEdan3DResourceCategory: {
                    switch (vocabulary.Term) {
                        case 'Full resolution': eVocabEnum = eVocabularyID.eEdan3DResourceCategoryFullresolution; break;
                        case 'Medium resolution': eVocabEnum = eVocabularyID.eEdan3DResourceCategoryMediumresolution; break;
                        case 'Low resolution': eVocabEnum = eVocabularyID.eEdan3DResourceCategoryLowresolution; break;
                        case 'Watertight': eVocabEnum = eVocabularyID.eEdan3DResourceCategoryWatertight; break;
                        case 'iOS AR model': eVocabEnum = eVocabularyID.eEdan3DResourceCategoryiOSARmodel; break;
                    }
                } break;

                case eVocabularySetID.eEdanMDMFields: {
                    switch (vocabulary.Term) {
                        case 'Label': eVocabEnum = eVocabularyID.eEdanMDMFieldsLabel; break;
                        case 'Title': eVocabEnum = eVocabularyID.eEdanMDMFieldsTitle; break;
                        case 'Record ID': eVocabEnum = eVocabularyID.eEdanMDMFieldsRecordID; break;
                        case 'Unit': eVocabEnum = eVocabularyID.eEdanMDMFieldsUnit; break;
                        case 'License': eVocabEnum = eVocabularyID.eEdanMDMFieldsLicense; break;
                        case 'License Text': eVocabEnum = eVocabularyID.eEdanMDMFieldsLicenseText; break;
                        case 'Object Type': eVocabEnum = eVocabularyID.eEdanMDMFieldsObjectType; break;
                        case 'Date': eVocabEnum = eVocabularyID.eEdanMDMFieldsDate; break;
                        case 'Place': eVocabEnum = eVocabularyID.eEdanMDMFieldsPlace; break;
                        case 'Topic': eVocabEnum = eVocabularyID.eEdanMDMFieldsTopic; break;
                        case 'Identifier (FT)': eVocabEnum = eVocabularyID.eEdanMDMFieldsIdentifierFT; break;
                        case 'Data Source (FT)': eVocabEnum = eVocabularyID.eEdanMDMFieldsDataSourceFT; break;
                        case 'Date (FT)': eVocabEnum = eVocabularyID.eEdanMDMFieldsDateFT; break;
                        case 'Name (FT)': eVocabEnum = eVocabularyID.eEdanMDMFieldsNameFT; break;
                        case 'Object Rights (FT)': eVocabEnum = eVocabularyID.eEdanMDMFieldsObjectRightsFT; break;
                        case 'Place (FT)': eVocabEnum = eVocabularyID.eEdanMDMFieldsPlaceFT; break;
                        case 'Taxonomic Name (FT)': eVocabEnum = eVocabularyID.eEdanMDMFieldsTaxonomicNameFT; break;
                        case 'Notes (FT)': eVocabEnum = eVocabularyID.eEdanMDMFieldsNotesFT; break;
                        case 'Physical Description (FT)': eVocabEnum = eVocabularyID.eEdanMDMFieldsPhysicalDescriptionFT; break;
                    }
                }
            }

            if (eVocabEnum != eVocabularyID.eNone) {
                this.vocabEnumIDMap.set(eVocabEnum, vocabulary.idVocabulary);
                this.vocabIDEnumMap.set(vocabulary.idVocabulary, eVocabEnum);
            }

            const vocabEntryArray: Vocabulary[] | undefined = this.vocabSetEntries.get(vocabulary.idVocabularySet);
            /* istanbul ignore else */
            if (vocabEntryArray)
                vocabEntryArray.push(vocabulary);
            else {
                LOG.error('VocabularyCache.flushInternalWorker() encountered invalid VocabularySet ID [' +
                    vocabulary.idVocabularySet + '] in vocabulary object ID [' + vocabulary.idVocabularySet + ']', LOG.LS.eCACHE);
                continue;
            }
        }

        // Now sort this.vocabSetMap entries
        for (const vocabList of this.vocabSetEntries.values())
            vocabList.sort((vocab1, vocab2) => vocab1.SortOrder - vocab2.SortOrder);

        LOG.info('CACHE VocabularyCache.flushInternalWorker() done', LOG.LS.eCACHE);
        return true;
    }

    // **************************
    // Private Interface
    // **************************
    private vocabularyInternal(idVocabulary: number): Vocabulary | undefined {
        return this.vocabMap.get(idVocabulary);
    }

    private vocabularyByEnumInternal(eVocabEnum: eVocabularyID): Vocabulary | undefined {
        const idVocabulary: number | undefined = this.vocabEnumIDMap.get(eVocabEnum);
        return idVocabulary ? this.vocabularyInternal(idVocabulary) : undefined;
    }

    private vocabularySetInternal(idVocabularySet: number): VocabularySet | undefined {
        return this.vocabSetMap.get(idVocabularySet);
    }

    private vocabularySetByEnumInternal(eVocabSetEnum: eVocabularySetID): VocabularySet | undefined {
        const idVocabularySet: number | undefined = this.vocabSetEnumIDMap.get(eVocabSetEnum);
        return idVocabularySet ? this.vocabularySetInternal(idVocabularySet) : undefined;
    }

    private vocabularySetEntriesInternal(idVocabularySet: number): Vocabulary[] | undefined {
        return this.vocabSetEntries.get(idVocabularySet);
    }

    private vocabularySetEntriesByEnumInternal(eVocabSetID: eVocabularySetID): Vocabulary[] | undefined {
        const idVocabularySet: number | undefined = this.vocabSetEnumIDMap.get(eVocabSetID);
        return idVocabularySet ? this.vocabSetEntries.get(idVocabularySet) : undefined;
    }

    private vocabularyBySetAndTermInternal(eVocabSetID: eVocabularySetID, term: string): Vocabulary | undefined {
        const vocabMap: Map<string, Vocabulary> | undefined = this.vocabSetEnumEntryMap.get(eVocabSetID);
        return (vocabMap) ? vocabMap.get(this.normalizeTerm(term)) : undefined;
    }

    private normalizeTerm(term: string) {
        return term.toLowerCase().replace(/_/g, ' ');
    }

    private vocabularyEnumToIdInternal(eVocabID: eVocabularyID): number | undefined {
        return this.vocabEnumIDMap.get(eVocabID);
    }

    /** fetches the Vocabulary.idVocabulary for a given vocabulary enum. Note that not all vocabulary are represented by eVocabularyID entries. */
    private vocabularyIdToEnumInternal(idVocabulary: number): eVocabularyID | undefined {
        return this.vocabIDEnumMap.get(idVocabulary);
    }

    private vocabularySetEnumToIdInternal(eVocabSetID: eVocabularySetID): number | undefined {
        return this.vocabSetEnumIDMap.get(eVocabSetID);
    }

    private vocabularySetIdToEnumInternal(idVocabularySet: number): eVocabularySetID | undefined {
        return this.vocabSetIDEnumMap.get(idVocabularySet);
    }

    private isVocabularyInSetInternal(eVocabEnum: eVocabularyID, eVocabSetEnum: eVocabularySetID): boolean {
        const vocab: Vocabulary | undefined = this.vocabularyByEnumInternal(eVocabEnum);
        if (!vocab) {
            // LOG.info(`isVocabularyInSetInternal ${eVocabularyID[eVocabEnum]} in ${eVocabularySetID[eVocabSetEnum]}: false 1`, { eLS: LOG.eLS.eCACHE });
            return false;
        }

        const vocabSet: VocabularySet | undefined = this.vocabularySetByEnumInternal(eVocabSetEnum);
        if (!vocabSet) {
            // LOG.info(`isVocabularyInSetInternal ${eVocabularyID[eVocabEnum]} in ${eVocabularySetID[eVocabSetEnum]}: false 2`, { eLS: LOG.eLS.eCACHE });
            return false;
        }

        if (vocabSet.idVocabularySet === vocab.idVocabularySet) {
            // LOG.info(`isVocabularyInSetInternal ${eVocabularyID[eVocabEnum]} in ${eVocabularySetID[eVocabSetEnum]}: true`, { eLS: LOG.eLS.eCACHE });
            return true;
        }
        // LOG.info(`isVocabularyInSetInternal ${eVocabularyID[eVocabEnum]} in ${eVocabularySetID[eVocabSetEnum]}: false 3`, { eLS: LOG.eLS.eCACHE });
        return false;
    }

    // **************************
    // Public Interface
    // **************************
    /**
     * Fetch vocabulary from cache
     * @param {number} idVocabulary - Vocabulary ID
     */
    static async vocabulary(idVocabulary: number): Promise<Vocabulary | undefined> {
        return (await this.getInstance()).vocabularyInternal(idVocabulary);
    }

    /**
     * Fetch vocabulary from cache by enum
     * @param {eVocabularyID} eVocabEnum - Vocabulary Enum
     */
    static async vocabularyByEnum(eVocabEnum: eVocabularyID): Promise<Vocabulary | undefined> {
        return (await this.getInstance()).vocabularyByEnumInternal(eVocabEnum);
    }

    /**
     * Fetch vocabulary set from cache
     * @param {number} idVocabularySet - Vocabulary Set ID
     */
    static async vocabularySet(idVocabularySet: number): Promise<VocabularySet | undefined> {
        return (await this.getInstance()).vocabularySetInternal(idVocabularySet);
    }

    /**
     * Fetch vocabulary set from cache by enum
     * @param {eVocabularySetID} eVocabSetEnum - Vocabulary Set Enum
     */
    static async vocabularySetByEnum(eVocabSetEnum: eVocabularySetID): Promise<VocabularySet | undefined> {
        return (await this.getInstance()).vocabularySetByEnumInternal(eVocabSetEnum);
    }

    /**
     * Fetch a vocabulary set's sorted vocabulary array from cache
     * @param {number} idVocabularySet - Vocabulary Set ID
     */
    static async vocabularySetEntries(idVocabularySet: number): Promise<Vocabulary[] | undefined> {
        return (await this.getInstance()).vocabularySetEntriesInternal(idVocabularySet);
    }

    /**
     * Fetch a vocabulary set's sorted vocabulary array from cache by vocabulary set enum
     * @param {eVocabularySetID} eVocabSetID - Vocabulary Set ID by enum
     */
    static async vocabularySetEntriesByEnum(eVocabSetID: eVocabularySetID): Promise<Vocabulary[] | undefined> {
        return (await this.getInstance()).vocabularySetEntriesByEnumInternal(eVocabSetID);
    }

    /** Fetch the vocabulary in the specified vocabulary set with the specified term.  The term is
     * normalized: case is ignored, and _ are turned into spaces
     */
    static async vocabularyBySetAndTerm(eVocabSetID: eVocabularySetID, term: string): Promise<Vocabulary | undefined> {
        return (await this.getInstance()).vocabularyBySetAndTermInternal(eVocabSetID, term);
    }

    /** fetches the Vocabulary.idVocabulary for a given vocabulary enum. */
    static async vocabularyEnumToId(eVocabID: eVocabularyID): Promise<number | undefined> {
        return (await this.getInstance()).vocabularyEnumToIdInternal(eVocabID);
    }

    /** fetches the Vocabulary.idVocabulary for a given vocabulary enum. Note that not all vocabulary are represented by eVocabularyID entries. */
    static async vocabularyIdToEnum(idVocabulary: number): Promise<eVocabularyID | undefined> {
        return (await this.getInstance()).vocabularyIdToEnumInternal(idVocabulary);
    }

    /** fetches the VocabularySet.idVocabularySet for a given vocabulary set enum. */
    static async vocabularySetEnumToId(eVocabSetID: eVocabularySetID): Promise<number | undefined> {
        return (await this.getInstance()).vocabularySetEnumToIdInternal(eVocabSetID);
    }

    /** fetches the VocabularySet.idVocabularySet for a given vocabulary set enum */
    static async vocabularySetIdToEnum(idVocabularySet: number): Promise<eVocabularySetID | undefined> {
        return (await this.getInstance()).vocabularySetIdToEnumInternal(idVocabularySet);
    }

    /** fetches the VocabularySet.idVocabularySet for a given vocabulary set enum */
    static async isVocabularyInSet(eVocabEnum: eVocabularyID, eVocabSetEnum: eVocabularySetID): Promise<boolean> {
        return (await this.getInstance()).isVocabularyInSetInternal(eVocabEnum, eVocabSetEnum);
    }

    static async mapPhotogrammetryVariantType(variantType: string): Promise<Vocabulary | undefined> {
        let eVocabID: eVocabularyID;
        switch (variantType.toLowerCase().replace(/_/g, '')) {
            case 'raw': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'cr2': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'cr3': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'dng': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'arw': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'camdng': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'tif': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'tiff': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'bmp': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'png': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'processed': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeProcessed; break;
            case 'colcor': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeProcessed; break;
            case 'zeroed': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeProcessed; break;
            case 'from camera': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'fromcamera': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'jpg': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'jpeg': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'camerajpg': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'camera': eVocabID = eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            default: return undefined;
        }
        return await VocabularyCache.vocabularyByEnum(eVocabID);
    }

    static mapModelFileByExtensionID(fileName: string): eVocabularyID | undefined {
        const extension: string = path.extname(fileName).toLowerCase() || fileName.toLowerCase();
        switch (extension) {
            case '.obj':  return eVocabularyID.eModelFileTypeobj;
            case '.ply':  return eVocabularyID.eModelFileTypeply;
            case '.stl':  return eVocabularyID.eModelFileTypestl;
            case '.glb':  return eVocabularyID.eModelFileTypeglb;
            case '.gltf': return eVocabularyID.eModelFileTypegltf;
            case '.usda': return eVocabularyID.eModelFileTypeusd;
            case '.usdc': return eVocabularyID.eModelFileTypeusd;
            case '.usdz': return eVocabularyID.eModelFileTypeusdz;
            case '.x3d':  return eVocabularyID.eModelFileTypex3d;
            case '.wrl':  return eVocabularyID.eModelFileTypewrl;
            case '.dae':  return eVocabularyID.eModelFileTypedae;
            case '.fbx':  return eVocabularyID.eModelFileTypefbx;
            case '.ma':   return eVocabularyID.eModelFileTypema;
            case '.3ds':  return eVocabularyID.eModelFileType3ds;
            case '.ptx':  return eVocabularyID.eModelFileTypeptx;
            case '.pts':  return eVocabularyID.eModelFileTypepts;
            default: return undefined;
        }
    }

    static async mapModelFileByExtension(fileName: string): Promise<Vocabulary | undefined> {
        const eVocabID: eVocabularyID | undefined = VocabularyCache.mapModelFileByExtensionID(fileName);
        // LOG.info(`VocabularyCache.mapModelFileByExtension(${fileName}) = ${eVocabularyID[eVocabID]} using ext ${extension}`, { eLS: LOG.eLS.eCACHE });
        return eVocabID ?  await VocabularyCache.vocabularyByEnum(eVocabID) : undefined;
    }

    static async mapModelChannelMaterialType(materialType: string): Promise<Vocabulary | undefined> {
        let eVocabID: eVocabularyID;

        switch (materialType.toLowerCase()) {
            case 'diffuse': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'specular': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'ambient': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeAmbient; break;
            case 'emissive': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeEmissive; break;
            case 'bump': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeBump; break;
            case 'normal': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeNormal; break;
            case 'glossiness': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeGlossiness; break;
            case 'opacity': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeOpacity; break;
            case 'displacement': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDisplacement; break;
            case 'occlusion': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeOcclusion; break;
            case 'reflection': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeReflection; break;
            case 'metalness': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeMetalness; break;
            case 'roughness': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeRoughness; break;
            case 'none': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeNone; break;
            case 'unknown': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeUnknown; break;
            default: eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeUnknown; break;
        }
        return await VocabularyCache.vocabularyByEnum(eVocabID);
    }

    static async flush(): Promise<void> {
        VocabularyCache.singleton = null;
        await this.getInstance();
    }

    static async clear(): Promise<void> {
        VocabularyCache.singleton = null;
    }
}
