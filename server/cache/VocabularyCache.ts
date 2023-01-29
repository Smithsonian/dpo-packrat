import * as LOG from '../utils/logger';
import { CacheControl } from './CacheControl';
import { Vocabulary, VocabularySet, SystemObject } from '../db';
import * as COMMON from '@dpo-packrat/common';
import * as path from 'path';

export class VocabularyCache {
    private static singleton: VocabularyCache | null = null;

    private vocabMap:               Map<number, Vocabulary>         = new Map<number, Vocabulary>();        // map of Vocab ID     -> Vocabulary object
    private vocabSetMap:            Map<number, VocabularySet>      = new Map<number, VocabularySet>();     // map of Vocab Set ID -> VocabularySet object
    private vocabSetEntries:        Map<number, Vocabulary[]>       = new Map<number, Vocabulary[]>();      // map of Vocab Set ID -> Sorted Array of Vocabulary objects
    private vocabSetEnumEntryMap:   Map<COMMON.eVocabularySetID, Map<string, Vocabulary>> = new Map<COMMON.eVocabularySetID, Map<string, Vocabulary>>();  // map of Vocab Set ID Enum -> map of vocabulary term, normalized -> Vocabulary record

    private vocabEnumIDMap:         Map<COMMON.eVocabularyID, number>      = new Map<COMMON.eVocabularyID, number>();     // map of Vocab ID Enum -> Vocab ID
    private vocabIDEnumMap:         Map<number, COMMON.eVocabularyID>      = new Map<number, COMMON.eVocabularyID>();     // map of Vocab ID -> Vocab ID Enum

    private vocabSetEnumIDMap:      Map<COMMON.eVocabularySetID, number>   = new Map<COMMON.eVocabularySetID, number>();  // map of Vocab Set ID Enum -> Vocab Set ID
    private vocabSetIDEnumMap:      Map<number, COMMON.eVocabularySetID>   = new Map<number, COMMON.eVocabularySetID>();  // map of Vocab Set ID -> Vocab Set ID Enum

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

            let eVocabSetEnum: COMMON.eVocabularySetID = COMMON.eVocabularySetID.eNone;
            switch (vocabularySet.Name) {
                case 'CaptureData.CaptureMethod':               eVocabSetEnum = COMMON.eVocabularySetID.eCaptureDataCaptureMethod; break;
                case 'CaptureData.DatasetType':                 eVocabSetEnum = COMMON.eVocabularySetID.eCaptureDataDatasetType; break;
                case 'CaptureData.ItemPositionType':            eVocabSetEnum = COMMON.eVocabularySetID.eCaptureDataItemPositionType; break;
                case 'CaptureData.FocusType':                   eVocabSetEnum = COMMON.eVocabularySetID.eCaptureDataFocusType; break;
                case 'CaptureData.LightSourceType':             eVocabSetEnum = COMMON.eVocabularySetID.eCaptureDataLightSourceType; break;
                case 'CaptureData.BackgroundRemovalMethod':     eVocabSetEnum = COMMON.eVocabularySetID.eCaptureDataBackgroundRemovalMethod; break;
                case 'CaptureData.ClusterType':                 eVocabSetEnum = COMMON.eVocabularySetID.eCaptureDataClusterType; break;
                case 'CaptureDataFile.VariantType':             eVocabSetEnum = COMMON.eVocabularySetID.eCaptureDataFileVariantType; break;
                case 'Model.CreationMethod':                    eVocabSetEnum = COMMON.eVocabularySetID.eModelCreationMethod; break;
                case 'Model.Modality':                          eVocabSetEnum = COMMON.eVocabularySetID.eModelModality; break;
                case 'Model.Units':                             eVocabSetEnum = COMMON.eVocabularySetID.eModelUnits; break;
                case 'Model.Purpose':                           eVocabSetEnum = COMMON.eVocabularySetID.eModelPurpose; break;
                case 'Model.FileType':                          eVocabSetEnum = COMMON.eVocabularySetID.eModelFileType; break;
                case 'ModelProcessingActionStep.ActionMethod':  eVocabSetEnum = COMMON.eVocabularySetID.eModelProcessingActionStepActionMethod; break;
                case 'ModelMaterialChannel.MaterialType':       eVocabSetEnum = COMMON.eVocabularySetID.eModelMaterialChannelMaterialType; break;
                case 'Identifier.IdentifierType':               eVocabSetEnum = COMMON.eVocabularySetID.eIdentifierIdentifierType; break;
                case 'Identifier.IdentifierTypeActor':          eVocabSetEnum = COMMON.eVocabularySetID.eIdentifierIdentifierTypeActor; break;
                case 'Metadata.MetadataSource':                 eVocabSetEnum = COMMON.eVocabularySetID.eMetadataMetadataSource; break;
                case 'WorkflowStep.WorkflowStepType':           eVocabSetEnum = COMMON.eVocabularySetID.eWorkflowStepWorkflowStepType; break;
                case 'Asset.AssetType':                         eVocabSetEnum = COMMON.eVocabularySetID.eAssetAssetType; break;
                case 'Job.JobType':                             eVocabSetEnum = COMMON.eVocabularySetID.eJobJobType; break;
                case 'Workflow.Type':                           eVocabSetEnum = COMMON.eVocabularySetID.eWorkflowType; break;
                case 'Workflow.Event':                          eVocabSetEnum = COMMON.eVocabularySetID.eWorkflowEvent; break;
                case 'Edan.3DResourceAttributeUnits':           eVocabSetEnum = COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits; break;
                case 'Edan.3DResourceAttributeModelFileType':   eVocabSetEnum = COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType; break;
                case 'Edan.3DResourceAttributeFileType':        eVocabSetEnum = COMMON.eVocabularySetID.eEdan3DResourceAttributeFileType; break;
                case 'Edan.3DResourceType':                     eVocabSetEnum = COMMON.eVocabularySetID.eEdan3DResourceType; break;
                case 'Edan.3DResourceCategory':                 eVocabSetEnum = COMMON.eVocabularySetID.eEdan3DResourceCategory; break;
                case 'Edan.MDMFields':                          eVocabSetEnum = COMMON.eVocabularySetID.eEdanMDMFields; break;
            }

            /* istanbul ignore else */
            if (eVocabSetEnum != COMMON.eVocabularySetID.eNone) {
                this.vocabSetEnumIDMap.set(eVocabSetEnum, vocabularySet.idVocabularySet);
                this.vocabSetIDEnumMap.set(vocabularySet.idVocabularySet, eVocabSetEnum);
                this.vocabSetEnumEntryMap.set(eVocabSetEnum, new Map<string, Vocabulary>()); // map of Vocab Set ID Enum -> map of vocabulary term, normalized -> Vocabulary record
            }
        }

        for (const vocabulary of vocabArray) {
            this.vocabMap.set(vocabulary.idVocabulary, vocabulary);

            let eVocabEnum: COMMON.eVocabularyID = COMMON.eVocabularyID.eNone;
            const eVocabSetEnum: COMMON.eVocabularySetID | undefined = this.vocabSetIDEnumMap.get(vocabulary.idVocabularySet); /* istanbul ignore else */
            if (eVocabSetEnum !== undefined) {
                const vocabMap = this.vocabSetEnumEntryMap.get(eVocabSetEnum); /* istanbul ignore else */
                if (vocabMap)
                    vocabMap.set(this.normalizeTerm(vocabulary.Term), vocabulary);
            }

            switch (eVocabSetEnum) {
                case COMMON.eVocabularySetID.eIdentifierIdentifierType: {
                    switch (vocabulary.Term) {
                        case 'ARK':                         eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeARK; break;
                        case 'DOI':                         eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeDOI; break;
                        case 'Edan Record ID':              eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID; break;
                        case 'Accession #':                 eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeAccession; break;
                        case 'Accession Number':            eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeAccessionNumber; break;
                        case 'Archives Collection Number':  eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeArchivesCollectionNumber; break;
                        case 'Bank Charter Number':         eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeBankCharterNumber; break;
                        case 'Barcode':                     eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeBarcode; break;
                        case 'Call Number':                 eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeCallNumber; break;
                        case 'Catalog ID':                  eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeCatalogID; break;
                        case 'Catalog Number':              eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeCatalogNumber; break;
                        case 'Collector/Donor Number':      eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeCollectorDonorNumber; break;
                        case 'Control Number':              eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeControlNumber; break;
                        case 'Design Patent Number':        eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeDesignPatentNumber; break;
                        case 'Designer Number':             eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeDesignerNumber; break;
                        case 'Field Identifier':            eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeFieldIdentifier; break;
                        case 'GUID':                        eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeGUID; break;
                        case 'ID Number':                   eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeIDNumber; break;
                        case 'Identifier':                  eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeIdentifier; break;
                        case 'Image ID':                    eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeImageID; break;
                        case 'Image Number':                eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeImageNumber; break;
                        case 'Inventory Number':            eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeInventoryNumber; break;
                        case 'ISBN':                        eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeISBN; break;
                        case 'ISSN':                        eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeISSN; break;
                        case 'Label Number':                eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeLabelNumber; break;
                        case 'License Number':              eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeLicenseNumber; break;
                        case 'Local Number':                eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeLocalNumber; break;
                        case 'Maker Number':                eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeMakerNumber; break;
                        case 'Model Number':                eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeModelNumber; break;
                        case 'Nonaccession Number':         eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeNonaccessionNumber; break;
                        case 'Object Number':               eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeObjectNumber; break;
                        case 'Original Object Identifier':  eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeOriginalObjectIdentifier; break;
                        case 'Other Numbers':               eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeOtherNumbers; break;
                        case 'Patent Number':               eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypePatentNumber; break;
                        case 'Plate Letters':               eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypePlateLetters; break;
                        case 'Plate Number':                eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypePlateNumber; break;
                        case 'Publisher Number':            eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypePublisherNumber; break;
                        case 'Record ID':                   eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeRecordID; break;
                        case 'Record Number':               eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeRecordNumber; break;
                        case 'Serial Number':               eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeSerialNumber; break;
                        case 'Series Standard Number':      eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeSeriesStandardNumber; break;
                        case 'Standard Number':             eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeStandardNumber; break;
                        case 'USNM Number':                 eVocabEnum = COMMON.eVocabularyID.eIdentifierIdentifierTypeUSNMNumber; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eAssetAssetType: {
                    switch (vocabulary.Term) {
                        case 'Bulk Ingestion':                      eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeBulkIngestion; break;
                        case 'Capture Data Set: Photogrammetry':    eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry; break;
                        case 'Capture Data Set: Diconde':           eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetDiconde; break;
                        case 'Capture Data Set: Dicom':             eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetDicom; break;
                        case 'Capture Data Set: Laser Line':        eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetLaserLine; break;
                        case 'Capture Data Set: Spherical Laser':   eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetSphericalLaser; break;
                        case 'Capture Data Set: Structured Light':  eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetStructuredLight; break;
                        case 'Capture Data Set: Other':             eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetOther; break;
                        case 'Capture Data File':                   eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeCaptureDataFile; break;
                        case 'Model':                               eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeModel; break;
                        case 'Model Geometry File':                 eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile; break;
                        case 'Model UV Map File':                   eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile; break;
                        case 'Scene':                               eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeScene; break;
                        case 'Project Documentation':               eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeProjectDocumentation; break;
                        case 'Intermediary File':                   eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeIntermediaryFile; break;
                        case 'Attachment':                          eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeAttachment; break;
                        case 'Other':                               eVocabEnum = COMMON.eVocabularyID.eAssetAssetTypeOther; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eCaptureDataCaptureMethod: {
                    switch (vocabulary.Term) {
                        case 'Photogrammetry':      eVocabEnum = COMMON.eVocabularyID.eCaptureDataCaptureMethodPhotogrammetry; break;
                        case 'CT':                  eVocabEnum = COMMON.eVocabularyID.eCaptureDataCaptureMethodCT; break;
                        case 'Structured Light':    eVocabEnum = COMMON.eVocabularyID.eCaptureDataCaptureMethodStructuredLight; break;
                        case 'Laser Line':          eVocabEnum = COMMON.eVocabularyID.eCaptureDataCaptureMethodLaserLine; break;
                        case 'Spherical Laser':     eVocabEnum = COMMON.eVocabularyID.eCaptureDataCaptureMethodSphericalLaser; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eCaptureDataFileVariantType: {
                    switch (vocabulary.Term) {
                        case 'Raw':                 eVocabEnum = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
                        case 'Processed':           eVocabEnum = COMMON.eVocabularyID.eCaptureDataFileVariantTypeProcessed; break;
                        case 'From Camera':         eVocabEnum = COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eMetadataMetadataSource: {
                    switch (vocabulary.Term) {
                        case 'Bulk Ingestion':      eVocabEnum = COMMON.eVocabularyID.eMetadataMetadataSourceBulkIngestion; break;
                        case 'Image':               eVocabEnum = COMMON.eVocabularyID.eMetadataMetadataSourceImage; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eModelCreationMethod: {
                    switch (vocabulary.Term) {
                        case 'Scan To Mesh':        eVocabEnum = COMMON.eVocabularyID.eModelCreationMethodScanToMesh; break;
                        case 'CAD':                 eVocabEnum = COMMON.eVocabularyID.eModelCreationMethodCAD; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eModelModality: {
                    switch (vocabulary.Term) {
                        case 'Point Cloud':         eVocabEnum = COMMON.eVocabularyID.eModelModalityPointCloud; break;
                        case 'Mesh':                eVocabEnum = COMMON.eVocabularyID.eModelModalityMesh; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eModelUnits: {
                    switch (vocabulary.Term) {
                        case 'Micrometer':          eVocabEnum = COMMON.eVocabularyID.eModelUnitsMicrometer; break;
                        case 'Millimeter':          eVocabEnum = COMMON.eVocabularyID.eModelUnitsMillimeter; break;
                        case 'Centimeter':          eVocabEnum = COMMON.eVocabularyID.eModelUnitsCentimeter; break;
                        case 'Meter':               eVocabEnum = COMMON.eVocabularyID.eModelUnitsMeter; break;
                        case 'Kilometer':           eVocabEnum = COMMON.eVocabularyID.eModelUnitsKilometer; break;
                        case 'Inch':                eVocabEnum = COMMON.eVocabularyID.eModelUnitsInch; break;
                        case 'Foot':                eVocabEnum = COMMON.eVocabularyID.eModelUnitsFoot; break;
                        case 'Yard':                eVocabEnum = COMMON.eVocabularyID.eModelUnitsYard; break;
                        case 'Mile':                eVocabEnum = COMMON.eVocabularyID.eModelUnitsMile; break;
                        case 'Astronomical Unit':   eVocabEnum = COMMON.eVocabularyID.eModelUnitsAstronomicalUnit; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eModelPurpose: {
                    switch (vocabulary.Term) {
                        case 'Master':                          eVocabEnum = COMMON.eVocabularyID.eModelPurposeMaster; break;
                        case 'Voyager Scene Model':             eVocabEnum = COMMON.eVocabularyID.eModelPurposeVoyagerSceneModel; break;
                        case 'Download':                        eVocabEnum = COMMON.eVocabularyID.eModelPurposeDownload; break;
                        case 'Intermediate Processing Step':    eVocabEnum = COMMON.eVocabularyID.eModelPurposeIntermediateProcessingStep; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eModelFileType: {
                    switch (vocabulary.Term) {
                        case 'obj - Alias Wavefront Object':                eVocabEnum = COMMON.eVocabularyID.eModelFileTypeobj; break;
                        case 'ply - Stanford Polygon File Format':          eVocabEnum = COMMON.eVocabularyID.eModelFileTypeply; break;
                        case 'stl - StereoLithography':                     eVocabEnum = COMMON.eVocabularyID.eModelFileTypestl; break;
                        case 'glb - GL Transmission Format Binary':         eVocabEnum = COMMON.eVocabularyID.eModelFileTypeglb; break;
                        case 'gltf - GL Transmission Format':               eVocabEnum = COMMON.eVocabularyID.eModelFileTypegltf; break;
                        case 'usd - Universal Scene Description':           eVocabEnum = COMMON.eVocabularyID.eModelFileTypeusd; break;
                        case 'usdz - Universal Scene Description (zipped)': eVocabEnum = COMMON.eVocabularyID.eModelFileTypeusdz; break;
                        case 'x3d':                                         eVocabEnum = COMMON.eVocabularyID.eModelFileTypex3d; break;
                        case 'wrl - VRML':                                  eVocabEnum = COMMON.eVocabularyID.eModelFileTypewrl; break;
                        case 'dae - COLLADA':                               eVocabEnum = COMMON.eVocabularyID.eModelFileTypedae; break;
                        case 'fbx - Filmbox':                               eVocabEnum = COMMON.eVocabularyID.eModelFileTypefbx; break;
                        case 'ma - Maya':                                   eVocabEnum = COMMON.eVocabularyID.eModelFileTypema; break;
                        case '3ds - 3D Studio':                             eVocabEnum = COMMON.eVocabularyID.eModelFileType3ds; break;
                        case 'ptx':                                         eVocabEnum = COMMON.eVocabularyID.eModelFileTypeptx; break;
                        case 'pts':                                         eVocabEnum = COMMON.eVocabularyID.eModelFileTypepts; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eModelMaterialChannelMaterialType: {
                    switch (vocabulary.Term) {
                        case 'Diffuse':         eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
                        case 'Specular':        eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
                        case 'Ambient':         eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeAmbient; break;
                        case 'Emissive':        eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeEmissive; break;
                        case 'Bump':            eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeBump; break;
                        case 'Normal':          eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeNormal; break;
                        case 'Glossiness':      eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeGlossiness; break;
                        case 'Opacity':         eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeOpacity; break;
                        case 'Displacement':    eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDisplacement; break;
                        case 'Occlusion':       eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeOcclusion; break;
                        case 'Reflection':      eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeReflection; break;
                        case 'Metalness':       eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeMetalness; break;
                        case 'Roughness':       eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeRoughness; break;
                        case 'None':            eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeNone; break;
                        case 'Unknown':         eVocabEnum = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeUnknown; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eJobJobType: {
                    switch (vocabulary.Term) {
                        case 'Cook: bake':                      eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookBake; break;
                        case 'Cook: decimate-unwrap':           eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookDecimateUnwrap; break;
                        case 'Cook: decimate':                  eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookDecimate; break;
                        case 'Cook: generate-usdz':             eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookGenerateUsdz; break;
                        case 'Cook: generate-web-gltf':         eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookGenerateWebGltf; break;
                        case 'Cook: inspect-mesh':              eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookInspectMesh; break;
                        case 'Cook: si-ar-backfill-fix':        eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookSIArBackfillFix; break;
                        case 'Cook: si-generate-downloads':     eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads; break;
                        case 'Cook: si-orient-model-to-svx':    eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookSIOrientModelToSvx; break;
                        case 'Cook: si-packrat-inspect':        eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect; break;
                        case 'Cook: si-voyager-asset':          eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookSIVoyagerAsset; break;
                        case 'Cook: si-voyager-scene':          eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookSIVoyagerScene; break;
                        case 'Cook: unwrap':                    eVocabEnum = COMMON.eVocabularyID.eJobJobTypeCookUnwrap; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eWorkflowType: {
                    switch (vocabulary.Term) {
                        case 'Cook Job':                        eVocabEnum = COMMON.eVocabularyID.eWorkflowTypeCookJob; break;
                        case 'Ingestion':                       eVocabEnum = COMMON.eVocabularyID.eWorkflowTypeIngestion; break;
                        case 'Upload':                          eVocabEnum = COMMON.eVocabularyID.eWorkflowTypeUpload; break;
                        case 'Verifier':                        eVocabEnum = COMMON.eVocabularyID.eWorkflowTypeVerifier; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eWorkflowStepWorkflowStepType: {
                    switch (vocabulary.Term) {
                        case 'Start':                           eVocabEnum = COMMON.eVocabularyID.eWorkflowStepTypeStart; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eWorkflowEvent: {
                    switch (vocabulary.Term) {
                        case 'Ingestion: Upload Asset Version': eVocabEnum = COMMON.eVocabularyID.eWorkflowEventIngestionUploadAssetVersion; break;
                        case 'Ingestion: Ingest Object':        eVocabEnum = COMMON.eVocabularyID.eWorkflowEventIngestionIngestObject; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits: {
                    switch (vocabulary.Term) {
                        case 'mm': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsmm; break;
                        case 'cm': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitscm; break;
                        case 'm':  eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsm; break;
                        case 'km': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitskm; break;
                        case 'in': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsin; break;
                        case 'ft': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsft; break;
                        case 'yd': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsyd; break;
                        case 'mi': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsmi; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType: {
                    switch (vocabulary.Term) {
                        case 'obj': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypeobj; break;
                        case 'ply': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypeply; break;
                        case 'stl': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypestl; break;
                        case 'glb': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypeglb; break;
                        case 'x3d': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypex3d; break;
                        case 'gltf': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypegltf; break;
                        case 'usdz': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypeusdz; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eEdan3DResourceAttributeFileType: {
                    switch (vocabulary.Term) {
                        case 'zip': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeFileTypezip; break;
                        case 'glb': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeFileTypeglb; break;
                        case 'usdz': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceAttributeFileTypeusdz; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eEdan3DResourceType: {
                    switch (vocabulary.Term) {
                        case '3d mesh': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceType3dmesh; break;
                        case 'CAD model': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceTypeCADmodel; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eEdan3DResourceCategory: {
                    switch (vocabulary.Term) {
                        case 'Full resolution': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceCategoryFullresolution; break;
                        case 'Medium resolution': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceCategoryMediumresolution; break;
                        case 'Low resolution': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceCategoryLowresolution; break;
                        case 'Watertight': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceCategoryWatertight; break;
                        case 'iOS AR model': eVocabEnum = COMMON.eVocabularyID.eEdan3DResourceCategoryiOSARmodel; break;
                    }
                } break;

                case COMMON.eVocabularySetID.eEdanMDMFields: {
                    switch (vocabulary.Term) {
                        case 'Label': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsLabel; break;
                        case 'Title': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsTitle; break;
                        case 'Record ID': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsRecordID; break;
                        case 'Unit': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsUnit; break;
                        case 'License': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsLicense; break;
                        case 'License Text': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsLicenseText; break;
                        case 'Object Type': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsObjectType; break;
                        case 'Date': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsDate; break;
                        case 'Place': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsPlace; break;
                        case 'Topic': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsTopic; break;
                        case 'Identifier (FT)': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsIdentifierFT; break;
                        case 'Data Source (FT)': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsDataSourceFT; break;
                        case 'Date (FT)': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsDateFT; break;
                        case 'Name (FT)': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsNameFT; break;
                        case 'Object Rights (FT)': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsObjectRightsFT; break;
                        case 'Place (FT)': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsPlaceFT; break;
                        case 'Taxonomic Name (FT)': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsTaxonomicNameFT; break;
                        case 'Notes (FT)': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsNotesFT; break;
                        case 'Physical Description (FT)': eVocabEnum = COMMON.eVocabularyID.eEdanMDMFieldsPhysicalDescriptionFT; break;
                    }
                }
            }

            if (eVocabEnum != COMMON.eVocabularyID.eNone) {
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

    private vocabularyByEnumInternal(eVocabEnum: COMMON.eVocabularyID): Vocabulary | undefined {
        const idVocabulary: number | undefined = this.vocabEnumIDMap.get(eVocabEnum);
        return idVocabulary ? this.vocabularyInternal(idVocabulary) : undefined;
    }

    private vocabularySetInternal(idVocabularySet: number): VocabularySet | undefined {
        return this.vocabSetMap.get(idVocabularySet);
    }

    private vocabularySetByEnumInternal(eVocabSetEnum: COMMON.eVocabularySetID): VocabularySet | undefined {
        const idVocabularySet: number | undefined = this.vocabSetEnumIDMap.get(eVocabSetEnum);
        return idVocabularySet ? this.vocabularySetInternal(idVocabularySet) : undefined;
    }

    private vocabularySetEntriesInternal(idVocabularySet: number): Vocabulary[] | undefined {
        return this.vocabSetEntries.get(idVocabularySet);
    }

    private vocabularySetEntriesByEnumInternal(eVocabSetID: COMMON.eVocabularySetID): Vocabulary[] | undefined {
        const idVocabularySet: number | undefined = this.vocabSetEnumIDMap.get(eVocabSetID);
        return idVocabularySet ? this.vocabSetEntries.get(idVocabularySet) : undefined;
    }

    private vocabularyBySetAndTermInternal(eVocabSetID: COMMON.eVocabularySetID, term: string): Vocabulary | undefined {
        const vocabMap: Map<string, Vocabulary> | undefined = this.vocabSetEnumEntryMap.get(eVocabSetID);
        return (vocabMap) ? vocabMap.get(this.normalizeTerm(term)) : undefined;
    }

    private normalizeTerm(term: string) {
        return term.toLowerCase().replace(/_/g, ' ');
    }

    private vocabularyEnumToIdInternal(eVocabID: COMMON.eVocabularyID): number | undefined {
        return this.vocabEnumIDMap.get(eVocabID);
    }

    /** fetches the Vocabulary.idVocabulary for a given vocabulary enum. Note that not all vocabulary are represented by COMMON.eVocabularyID entries. */
    private vocabularyIdToEnumInternal(idVocabulary: number): COMMON.eVocabularyID | undefined {
        return this.vocabIDEnumMap.get(idVocabulary);
    }

    private vocabularySetEnumToIdInternal(eVocabSetID: COMMON.eVocabularySetID): number | undefined {
        return this.vocabSetEnumIDMap.get(eVocabSetID);
    }

    private vocabularySetIdToEnumInternal(idVocabularySet: number): COMMON.eVocabularySetID | undefined {
        return this.vocabSetIDEnumMap.get(idVocabularySet);
    }

    private isVocabularyInSetInternal(eVocabEnum: COMMON.eVocabularyID, eVocabSetEnum: COMMON.eVocabularySetID): boolean {
        const vocab: Vocabulary | undefined = this.vocabularyByEnumInternal(eVocabEnum);
        if (!vocab) {
            // LOG.info(`isVocabularyInSetInternal ${COMMON.eVocabularyID[eVocabEnum]} in ${COMMON.eVocabularySetID[eVocabSetEnum]}: false 1`, { eLS: LOG.eLS.eCACHE });
            return false;
        }

        const vocabSet: VocabularySet | undefined = this.vocabularySetByEnumInternal(eVocabSetEnum);
        if (!vocabSet) {
            // LOG.info(`isVocabularyInSetInternal ${COMMON.eVocabularyID[eVocabEnum]} in ${COMMON.eVocabularySetID[eVocabSetEnum]}: false 2`, { eLS: LOG.eLS.eCACHE });
            return false;
        }

        if (vocabSet.idVocabularySet === vocab.idVocabularySet) {
            // LOG.info(`isVocabularyInSetInternal ${COMMON.eVocabularyID[eVocabEnum]} in ${COMMON.eVocabularySetID[eVocabSetEnum]}: true`, { eLS: LOG.eLS.eCACHE });
            return true;
        }
        // LOG.info(`isVocabularyInSetInternal ${COMMON.eVocabularyID[eVocabEnum]} in ${COMMON.eVocabularySetID[eVocabSetEnum]}: false 3`, { eLS: LOG.eLS.eCACHE });
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
     * @param {COMMON.eVocabularyID} eVocabEnum - Vocabulary Enum
     */
    static async vocabularyByEnum(eVocabEnum: COMMON.eVocabularyID): Promise<Vocabulary | undefined> {
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
     * @param {COMMON.eVocabularySetID} eVocabSetEnum - Vocabulary Set Enum
     */
    static async vocabularySetByEnum(eVocabSetEnum: COMMON.eVocabularySetID): Promise<VocabularySet | undefined> {
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
     * @param {COMMON.eVocabularySetID} eVocabSetID - Vocabulary Set ID by enum
     */
    static async vocabularySetEntriesByEnum(eVocabSetID: COMMON.eVocabularySetID): Promise<Vocabulary[] | undefined> {
        return (await this.getInstance()).vocabularySetEntriesByEnumInternal(eVocabSetID);
    }

    /** Fetch the vocabulary in the specified vocabulary set with the specified term.  The term is
     * normalized: case is ignored, and _ are turned into spaces
     */
    static async vocabularyBySetAndTerm(eVocabSetID: COMMON.eVocabularySetID, term: string): Promise<Vocabulary | undefined> {
        return (await this.getInstance()).vocabularyBySetAndTermInternal(eVocabSetID, term);
    }

    /** fetches the Vocabulary.idVocabulary for a given vocabulary enum. */
    static async vocabularyEnumToId(eVocabID: COMMON.eVocabularyID): Promise<number | undefined> {
        return (await this.getInstance()).vocabularyEnumToIdInternal(eVocabID);
    }

    /** fetches the Vocabulary.idVocabulary for a given vocabulary enum. Note that not all vocabulary are represented by COMMON.eVocabularyID entries. */
    static async vocabularyIdToEnum(idVocabulary: number): Promise<COMMON.eVocabularyID | undefined> {
        return (await this.getInstance()).vocabularyIdToEnumInternal(idVocabulary);
    }

    /** fetches the VocabularySet.idVocabularySet for a given vocabulary set enum. */
    static async vocabularySetEnumToId(eVocabSetID: COMMON.eVocabularySetID): Promise<number | undefined> {
        return (await this.getInstance()).vocabularySetEnumToIdInternal(eVocabSetID);
    }

    /** fetches the VocabularySet.idVocabularySet for a given vocabulary set enum */
    static async vocabularySetIdToEnum(idVocabularySet: number): Promise<COMMON.eVocabularySetID | undefined> {
        return (await this.getInstance()).vocabularySetIdToEnumInternal(idVocabularySet);
    }

    /** fetches the VocabularySet.idVocabularySet for a given vocabulary set enum */
    static async isVocabularyInSet(eVocabEnum: COMMON.eVocabularyID, eVocabSetEnum: COMMON.eVocabularySetID): Promise<boolean> {
        return (await this.getInstance()).isVocabularyInSetInternal(eVocabEnum, eVocabSetEnum);
    }

    static mapModelAssetType(fileName: string): COMMON.eVocabularyID | undefined {
        // does this file have an extension recognizable as geometry?
        const eModelType: COMMON.eVocabularyID | undefined = VocabularyCache.mapModelFileByExtensionID(fileName);
        if (eModelType)
            return COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile;

        // if not, is it one of our recognized model support file extensions?
        const extension: string = path.extname(fileName).toLowerCase() || fileName.toLowerCase();
        switch (extension) {
            case '.mtl':    // for OBJ
            case '.bin':    // for GLTF
                return COMMON.eVocabularyID.eAssetAssetTypeOther;
        }

        // Otherwise, assume this is a UV Map
        return COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile;
    }

    static async mapPhotogrammetryVariantType(variantType: string): Promise<Vocabulary | undefined> {
        let eVocabID: COMMON.eVocabularyID;
        switch (variantType.toLowerCase().replace(/_/g, '')) {
            case 'raw': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'cr2': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'cr3': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'dng': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'arw': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'camdng': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'tif': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'tiff': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'bmp': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'png': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw; break;
            case 'processed': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeProcessed; break;
            case 'colcor': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeProcessed; break;
            case 'zeroed': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeProcessed; break;
            case 'from camera': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'fromcamera': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'jpg': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'jpeg': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'camerajpg': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            case 'camera': eVocabID = COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera; break;
            default: return undefined;
        }
        return await VocabularyCache.vocabularyByEnum(eVocabID);
    }

    static mapModelFileByExtensionID(fileName: string): COMMON.eVocabularyID | undefined {
        const extension: string = path.extname(fileName).toLowerCase() || fileName.toLowerCase();
        switch (extension) {
            case '.obj':  return COMMON.eVocabularyID.eModelFileTypeobj;
            case '.ply':  return COMMON.eVocabularyID.eModelFileTypeply;
            case '.stl':  return COMMON.eVocabularyID.eModelFileTypestl;
            case '.glb':  return COMMON.eVocabularyID.eModelFileTypeglb;
            case '.gltf': return COMMON.eVocabularyID.eModelFileTypegltf;
            case '.usda': return COMMON.eVocabularyID.eModelFileTypeusd;
            case '.usdc': return COMMON.eVocabularyID.eModelFileTypeusd;
            case '.usdz': return COMMON.eVocabularyID.eModelFileTypeusdz;
            case '.x3d':  return COMMON.eVocabularyID.eModelFileTypex3d;
            case '.wrl':  return COMMON.eVocabularyID.eModelFileTypewrl;
            case '.dae':  return COMMON.eVocabularyID.eModelFileTypedae;
            case '.fbx':  return COMMON.eVocabularyID.eModelFileTypefbx;
            case '.ma':   return COMMON.eVocabularyID.eModelFileTypema;
            case '.3ds':  return COMMON.eVocabularyID.eModelFileType3ds;
            case '.ptx':  return COMMON.eVocabularyID.eModelFileTypeptx;
            case '.pts':  return COMMON.eVocabularyID.eModelFileTypepts;
            default: return undefined;
        }
    }

    static async mapModelFileByExtension(fileName: string): Promise<Vocabulary | undefined> {
        const eVocabID: COMMON.eVocabularyID | undefined = VocabularyCache.mapModelFileByExtensionID(fileName);
        // LOG.info(`VocabularyCache.mapModelFileByExtension(${fileName}) = ${COMMON.eVocabularyID[eVocabID]} using ext ${extension}`, { eLS: LOG.eLS.eCACHE });
        return eVocabID ?  await VocabularyCache.vocabularyByEnum(eVocabID) : undefined;
    }

    static async mapModelChannelMaterialType(materialType: string): Promise<Vocabulary | undefined> {
        let eVocabID: COMMON.eVocabularyID;

        switch (materialType.toLowerCase()) {
            case 'diffuse': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'specular': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'ambient': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeAmbient; break;
            case 'emissive': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeEmissive; break;
            case 'bump': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeBump; break;
            case 'normal': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeNormal; break;
            case 'glossiness': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeGlossiness; break;
            case 'opacity': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeOpacity; break;
            case 'displacement': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDisplacement; break;
            case 'occlusion': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeOcclusion; break;
            case 'reflection': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeReflection; break;
            case 'metalness': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeMetalness; break;
            case 'roughness': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeRoughness; break;
            case 'none': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeNone; break;
            case 'unknown': eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeUnknown; break;
            default: eVocabID = COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeUnknown; break;
        }
        return await VocabularyCache.vocabularyByEnum(eVocabID);
    }

    static mapIdentifierTypeID(identifierType: string): COMMON.eVocabularyID | undefined {
        switch (identifierType.toLowerCase()) {
            case 'ark':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeARK;
            case 'doi':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeDOI;
            case 'edanmdm':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID;
            case 'edan record id':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID;
            case 'accession #':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeAccession;
            case 'accession number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeAccessionNumber;
            case 'archives collection number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeArchivesCollectionNumber;
            case 'bank charter number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeBankCharterNumber;
            case 'barcode':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeBarcode;
            case 'call number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeCallNumber;
            case 'catalog id':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeCatalogID;
            case 'catalog number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeCatalogNumber;
            case 'collector/donor number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeCollectorDonorNumber;
            case 'control number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeControlNumber;
            case 'design patent number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeDesignPatentNumber;
            case 'designer number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeDesignerNumber;
            case 'field identifier':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeFieldIdentifier;
            case 'guid':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeGUID;
            case 'id number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeIDNumber;
            case 'identifier':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeIdentifier;
            case 'image id':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeImageID;
            case 'image number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeImageNumber;
            case 'inventory number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeInventoryNumber;
            case 'isbn':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeISBN;
            case 'issn':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeISSN;
            case 'label number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeLabelNumber;
            case 'license number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeLicenseNumber;
            case 'local number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeLocalNumber;
            case 'maker number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeMakerNumber;
            case 'model number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeModelNumber;
            case 'nonaccession number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeNonaccessionNumber;
            case 'object number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeObjectNumber;
            case 'original object identifier':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeOriginalObjectIdentifier;
            case 'other numbers':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeOtherNumbers;
            case 'patent number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypePatentNumber;
            case 'plate letters':  return COMMON.eVocabularyID.eIdentifierIdentifierTypePlateLetters;
            case 'plate number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypePlateNumber;
            case 'publisher number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypePublisherNumber;
            case 'record id':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeRecordID;
            case 'record number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeRecordNumber;
            case 'serial number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeSerialNumber;
            case 'series standard number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeSeriesStandardNumber;
            case 'standard number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeStandardNumber;
            case 'usnm number':  return COMMON.eVocabularyID.eIdentifierIdentifierTypeUSNMNumber;
            default: return undefined;
        }
    }

    static async mapIdentifierType(identifierType: string): Promise<Vocabulary | undefined>  {
        const eVocabID: COMMON.eVocabularyID | undefined = VocabularyCache.mapIdentifierTypeID(identifierType);
        // LOG.info(`VocabularyCache.mapIdentifierType(${identifierType}) = ${COMMON.eVocabularyID[eVocabID]}, { eLS: LOG.eLS.eCACHE });
        return eVocabID ?  await VocabularyCache.vocabularyByEnum(eVocabID) : undefined;
    }

    static async isPreferredAsset(idVAssetType: number, SO: SystemObject): Promise<boolean> {
        switch (await VocabularyCache.vocabularyIdToEnum(idVAssetType)) {
            case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry:
            case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetDiconde:
            case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetDicom:
            case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetLaserLine:
            case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetSphericalLaser:
            case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetStructuredLight:
            case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetOther:
                return SO.idCaptureData ? true : false;

            case COMMON.eVocabularyID.eAssetAssetTypeModel:
            case COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile:
                return SO.idModel ? true : false;

            case COMMON.eVocabularyID.eAssetAssetTypeScene:
                return SO.idScene ? true : false;

            case COMMON.eVocabularyID.eAssetAssetTypeProjectDocumentation:
                return SO.idProjectDocumentation ? true : false;

            case COMMON.eVocabularyID.eAssetAssetTypeIntermediaryFile:
                return SO.idIntermediaryFile ? true : false;

            case COMMON.eVocabularyID.eAssetAssetTypeBulkIngestion:
            case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataFile:
            case COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile:
            case COMMON.eVocabularyID.eAssetAssetTypeAttachment:
            case COMMON.eVocabularyID.eAssetAssetTypeOther:
            case undefined:
            default:
                return false;
        }
    }

    static async flush(): Promise<void> {
        VocabularyCache.singleton = null;
        await this.getInstance();
    }

    static async clear(): Promise<void> {
        VocabularyCache.singleton = null;
    }
}
