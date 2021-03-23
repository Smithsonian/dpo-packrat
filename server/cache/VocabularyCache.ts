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
    eMetadataMetadataSourceBulkIngestion,
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
    eModelPurposePrintDelivery,
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
    eModelMaterialChannelMaterialTypeNormalTangentSpace,
    eModelMaterialChannelMaterialTypeNormalObjectSpace,
    eModelMaterialChannelMaterialTypeAmbientOcclusion,
    eModelMaterialChannelMaterialTypeRoughness,
    eModelMaterialChannelMaterialTypeMetalness,
    eModelMaterialChannelMaterialTypeSpecular,
    eModelMaterialChannelMaterialTypeTransparency,
    eModelMaterialChannelMaterialTypeBRDF,
    eModelMaterialChannelMaterialTypeHoleFill,
    eModelMaterialChannelMaterialTypeReflection,
    eModelMaterialChannelMaterialTypeRefraction,
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
        LOG.logger.info('CACHE: VocabularyCache.flushInternalWorker() start');
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
                        case 'Print Delivery':                  eVocabEnum = eVocabularyID.eModelPurposePrintDelivery; break;
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
                        case 'Diffuse':                 eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
                        case 'Normal: Tangent Space':   eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeNormalTangentSpace; break;
                        case 'Normal: Object Space':    eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeNormalObjectSpace; break;
                        case 'Ambient Occlusion':       eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeAmbientOcclusion; break;
                        case 'Roughness':               eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeRoughness; break;
                        case 'Metalness':               eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeMetalness; break;
                        case 'Specular':                eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
                        case 'Transparency':            eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeTransparency; break;
                        case 'BRDF':                    eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeBRDF; break;
                        case 'Hole Fill':               eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeHoleFill; break;
                        case 'Reflection':              eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeReflection; break;
                        case 'Refraction':              eVocabEnum = eVocabularyID.eModelMaterialChannelMaterialTypeRefraction; break;
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
                LOG.logger.error('VocabularyCache.flushInternalWorker() encountered invalid VocabularySet ID [' +
                    vocabulary.idVocabularySet + '] in vocabulary object ID [' + vocabulary.idVocabularySet + ']');
                continue;
            }
        }

        // Now sort this.vocabSetMap entries
        for (const vocabList of this.vocabSetEntries.values())
            vocabList.sort((vocab1, vocab2) => vocab1.SortOrder - vocab2.SortOrder);

        LOG.logger.info('CACHE: VocabularyCache.flushInternalWorker() done');
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

    static async mapModelFileByExtension(fileName: string): Promise<Vocabulary | undefined> {
        let eVocabID: eVocabularyID;
        const extension: string = path.extname(fileName).toLowerCase() || fileName.toLowerCase();

        switch (extension) {
            case '.obj':  eVocabID = eVocabularyID.eModelFileTypeobj; break;
            case '.ply':  eVocabID = eVocabularyID.eModelFileTypeply; break;
            case '.stl':  eVocabID = eVocabularyID.eModelFileTypestl; break;
            case '.glb':  eVocabID = eVocabularyID.eModelFileTypeglb; break;
            case '.gltf': eVocabID = eVocabularyID.eModelFileTypegltf; break;
            case '.usda': eVocabID = eVocabularyID.eModelFileTypeusd; break;
            case '.usdc': eVocabID = eVocabularyID.eModelFileTypeusd; break;
            case '.usdz': eVocabID = eVocabularyID.eModelFileTypeusdz; break;
            case '.x3d':  eVocabID = eVocabularyID.eModelFileTypex3d; break;
            case '.wrl':  eVocabID = eVocabularyID.eModelFileTypewrl; break;
            case '.dae':  eVocabID = eVocabularyID.eModelFileTypedae; break;
            case '.fbx':  eVocabID = eVocabularyID.eModelFileTypefbx; break;
            case '.ma':   eVocabID = eVocabularyID.eModelFileTypema; break;
            case '.3ds':  eVocabID = eVocabularyID.eModelFileType3ds; break;
            case '.ptx':  eVocabID = eVocabularyID.eModelFileTypeptx; break;
            case '.pts':  eVocabID = eVocabularyID.eModelFileTypepts; break;
            default:
                // LOG.logger.info(`VocabularyCache.mapModelFileByExtension(${fileName}) using unrecognized ext ${extension}`);
                return undefined;
        }
        // LOG.logger.info(`VocabularyCache.mapModelFileByExtension(${fileName}) = ${eVocabularyID[eVocabID]} using ext ${extension}`);
        return await VocabularyCache.vocabularyByEnum(eVocabID);
    }

    static async mapModelChannelMaterialType(materialType: string): Promise<Vocabulary | undefined> {
        let eVocabID: eVocabularyID;

        switch (materialType.toLowerCase()) {
            case 'diffuse': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'diffusetexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'diffuse color': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'basetexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'basecolorfactor [rgba]': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'basecolortexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'diffusefactor': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'diffusecolor': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse; break;
            case 'normal: tangent space': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeNormalTangentSpace; break;
            case 'normal: object space': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeNormalObjectSpace; break;
            case 'normaltexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeNormalObjectSpace; break;
            case 'normal': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeNormalObjectSpace; break;
            case 'ambient occlusion': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeAmbientOcclusion; break;
            case 'ambienttexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeAmbientOcclusion; break;
            case 'ambient color': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeAmbientOcclusion; break;
            case 'roughness': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeRoughness; break;
            case 'roughnessfactor': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeRoughness; break;
            case 'metalness': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeMetalness; break;
            case 'metallicfactor': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeMetalness; break;
            case 'metallicroughnesstexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeMetalness; break;
            case 'metallic': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeMetalness; break;
            case 'specular': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'speculartexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'specularitytexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'specular color': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'specular exponent': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'specularfactor': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'specularglossinesstexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'specularcolor': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeSpecular; break;
            case 'transparency': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeTransparency; break;
            case 'brdf': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeBRDF; break;
            case 'hole fill': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeHoleFill; break;
            case 'reflection': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeReflection; break;
            case 'reflectiontexture': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeReflection; break;
            case 'refraction': eVocabID = eVocabularyID.eModelMaterialChannelMaterialTypeRefraction; break;
            default:
                // LOG.logger.info(`VocabularyCache.mapModelChannelMaterialType unrecognized ${materialType}`);
                return undefined;
        }
        // LOG.logger.info(`VocabularyCache.mapModelChannelMaterialType(${materialType}) = ${eVocabularyID[eVocabID]}`);
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
