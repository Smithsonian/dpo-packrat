/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DB from '../../db';
import * as H from '../../utils/helpers';
import { VocabularyCache, eVocabularyID, eVocabularySetID } from '../../cache';
// import * as LOG from '../../utils/logger';
/*
afterAll(async done => {
    await H.Helpers.sleep(4000);
    done();
});
*/
enum eCacheTestMode {
    eInitial,
    eClear,
    eFlush
}

const vocabularyCacheTest = (): void => {
    vocabularyCacheTestWorker(eCacheTestMode.eInitial);
    vocabularyCacheTestWorker(eCacheTestMode.eClear);
    vocabularyCacheTestWorker(eCacheTestMode.eFlush);
    vocabularyCacheTestClearFlush();
};

function vocabularyCacheTestWorker(eMode: eCacheTestMode): void {
    let vocabularyAll: DB.Vocabulary[] | null = null;
    let vocabularySetAll: DB.VocabularySet[] | null = null;
    const vocabularyMap: Map<number, DB.Vocabulary> = new Map<number, DB.Vocabulary>();
    const vocabularySetMap: Map<number, DB.VocabularySet> = new Map<number, DB.VocabularySet>();

    let description: string = '';
    switch (eMode) {
        case eCacheTestMode.eInitial: description = 'initial'; break;
        case eCacheTestMode.eClear: description = 'post clear'; break;
        case eCacheTestMode.eFlush: description = 'post flush'; break;
    }

    describe('Cache: VocabularyCache ' + description, () => {
        test('Cache: VocabularyCache Setup ' + description, async () => {
            switch (eMode) {
                case eCacheTestMode.eInitial: break;
                case eCacheTestMode.eClear: await VocabularyCache.clear(); break;
                case eCacheTestMode.eFlush: await VocabularyCache.flush(); break;
            }

            vocabularyAll = await DB.Vocabulary.fetchAll();
            expect(vocabularyAll).toBeTruthy();
            expect(vocabularyAll ? vocabularyAll.length : /* istanbul ignore next */ 0).toBeGreaterThan(0);

            vocabularySetAll = await DB.VocabularySet.fetchAll();
            expect(vocabularySetAll).toBeTruthy();
            expect(vocabularySetAll ? vocabularySetAll.length : /* istanbul ignore next */ 0).toBeGreaterThan(0);

            /* istanbul ignore else */
            if (vocabularyAll)
                for (const vocabulary of vocabularyAll)
                    vocabularyMap.set(vocabulary.idVocabulary, vocabulary);

            /* istanbul ignore else */
            if (vocabularySetAll)
                for (const vocabularySet of vocabularySetAll)
                    vocabularySetMap.set(vocabularySet.idVocabularySet, vocabularySet);
        });

        test('Cache: VocabularyCache.vocabulary ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularyAll)
                return;
            for (const vocabulary of vocabularyAll) {
                const vocabularyInCache: DB.Vocabulary | undefined =
                    await VocabularyCache.vocabulary(vocabulary.idVocabulary);
                expect(vocabularyInCache).toBeTruthy();
                /* istanbul ignore else */
                if (vocabularyInCache)
                    expect(vocabulary).toMatchObject(vocabularyInCache);
            }
        });

        test('Cache: VocabularyCache.vocabularyByEnum ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularyAll)
                return;

            // iterate through all enums of eVocabularyID; for each:
            for (const sVocabID in eVocabularyID) {
                if (!isNaN(Number(sVocabID)))
                    continue;
                const eVocabID: eVocabularyID = (<any>eVocabularyID)[sVocabID];
                const vocabulary: DB.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);

                switch (eVocabID) {
                    case eVocabularyID.eIdentifierIdentifierTypeARK: testVocabulary(vocabulary, 'ARK'); break;
                    case eVocabularyID.eIdentifierIdentifierTypeDOI: testVocabulary(vocabulary, 'DOI'); break;
                    case eVocabularyID.eIdentifierIdentifierTypeUnitCMSID: testVocabulary(vocabulary, 'Unit CMS ID'); break;

                    case eVocabularyID.eAssetAssetTypeBulkIngestion: testVocabulary(vocabulary, 'Bulk Ingestion'); break;
                    case eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry: testVocabulary(vocabulary, 'Capture Data Set: Photogrammetry'); break;
                    case eVocabularyID.eAssetAssetTypeCaptureDataSetDiconde: testVocabulary(vocabulary, 'Capture Data Set: Diconde'); break;
                    case eVocabularyID.eAssetAssetTypeCaptureDataSetDicom: testVocabulary(vocabulary, 'Capture Data Set: Dicom'); break;
                    case eVocabularyID.eAssetAssetTypeCaptureDataSetLaserLine: testVocabulary(vocabulary, 'Capture Data Set: Laser Line'); break;
                    case eVocabularyID.eAssetAssetTypeCaptureDataSetSphericalLaser: testVocabulary(vocabulary, 'Capture Data Set: Spherical Laser'); break;
                    case eVocabularyID.eAssetAssetTypeCaptureDataSetStructuredLight: testVocabulary(vocabulary, 'Capture Data Set: Structured Light'); break;
                    case eVocabularyID.eAssetAssetTypeCaptureDataSetOther: testVocabulary(vocabulary, 'Capture Data Set: Other'); break;
                    case eVocabularyID.eAssetAssetTypeCaptureDataFile: testVocabulary(vocabulary, 'Capture Data File'); break;
                    case eVocabularyID.eAssetAssetTypeModel: testVocabulary(vocabulary, 'Model'); break;
                    case eVocabularyID.eAssetAssetTypeModelGeometryFile: testVocabulary(vocabulary, 'Model Geometry File'); break;
                    case eVocabularyID.eAssetAssetTypeModelUVMapFile: testVocabulary(vocabulary, 'Model UV Map File'); break;
                    case eVocabularyID.eAssetAssetTypeScene: testVocabulary(vocabulary, 'Scene'); break;
                    case eVocabularyID.eAssetAssetTypeProjectDocumentation: testVocabulary(vocabulary, 'Project Documentation'); break;
                    case eVocabularyID.eAssetAssetTypeIntermediaryFile: testVocabulary(vocabulary, 'Intermediary File'); break;
                    case eVocabularyID.eAssetAssetTypeAttachment: testVocabulary(vocabulary, 'Attachment'); break;
                    case eVocabularyID.eAssetAssetTypeOther: testVocabulary(vocabulary, 'Other'); break;

                    case eVocabularyID.eCaptureDataCaptureMethodPhotogrammetry: testVocabulary(vocabulary, 'Photogrammetry'); break;
                    case eVocabularyID.eCaptureDataCaptureMethodCT: testVocabulary(vocabulary, 'CT'); break;
                    case eVocabularyID.eCaptureDataCaptureMethodStructuredLight: testVocabulary(vocabulary, 'Structured Light'); break;
                    case eVocabularyID.eCaptureDataCaptureMethodLaserLine: testVocabulary(vocabulary, 'Laser Line'); break;
                    case eVocabularyID.eCaptureDataCaptureMethodSphericalLaser: testVocabulary(vocabulary, 'Spherical Laser'); break;

                    case eVocabularyID.eCaptureDataFileVariantTypeRaw: testVocabulary(vocabulary, 'Raw'); break;
                    case eVocabularyID.eCaptureDataFileVariantTypeProcessed: testVocabulary(vocabulary, 'Processed'); break;
                    case eVocabularyID.eCaptureDataFileVariantTypeFromCamera: testVocabulary(vocabulary, 'From Camera'); break;

                    case eVocabularyID.eModelCreationMethodScanToMesh: testVocabulary(vocabulary, 'Scan To Mesh'); break;
                    case eVocabularyID.eModelCreationMethodCAD: testVocabulary(vocabulary, 'CAD'); break;

                    case eVocabularyID.eModelModalityPointCloud: testVocabulary(vocabulary, 'Point Cloud'); break;
                    case eVocabularyID.eModelModalityMesh: testVocabulary(vocabulary, 'Mesh'); break;

                    case eVocabularyID.eModelUnitsMicrometer: testVocabulary(vocabulary, 'Micrometer'); break;
                    case eVocabularyID.eModelUnitsMillimeter: testVocabulary(vocabulary, 'Millimeter'); break;
                    case eVocabularyID.eModelUnitsCentimeter: testVocabulary(vocabulary, 'Centimeter'); break;
                    case eVocabularyID.eModelUnitsMeter: testVocabulary(vocabulary, 'Meter'); break;
                    case eVocabularyID.eModelUnitsKilometer: testVocabulary(vocabulary, 'Kilometer'); break;
                    case eVocabularyID.eModelUnitsInch: testVocabulary(vocabulary, 'Inch'); break;
                    case eVocabularyID.eModelUnitsFoot: testVocabulary(vocabulary, 'Foot'); break;
                    case eVocabularyID.eModelUnitsYard: testVocabulary(vocabulary, 'Yard'); break;
                    case eVocabularyID.eModelUnitsMile: testVocabulary(vocabulary, 'Mile'); break;
                    case eVocabularyID.eModelUnitsAstronomicalUnit: testVocabulary(vocabulary, 'Astronomical Unit'); break;

                    case eVocabularyID.eModelPurposeMaster: testVocabulary(vocabulary, 'Master'); break;
                    case eVocabularyID.eModelPurposeWebDelivery: testVocabulary(vocabulary, 'Web Delivery'); break;
                    case eVocabularyID.eModelPurposeDownload: testVocabulary(vocabulary, 'Download'); break;
                    case eVocabularyID.eModelPurposeIntermediateProcessingStep: testVocabulary(vocabulary, 'Intermediate Processing Step'); break;

                    case eVocabularyID.eModelFileTypeobj: testVocabulary(vocabulary, 'obj - Alias Wavefront Object'); break;
                    case eVocabularyID.eModelFileTypeply: testVocabulary(vocabulary, 'ply - Stanford Polygon File Format'); break;
                    case eVocabularyID.eModelFileTypestl: testVocabulary(vocabulary, 'stl - StereoLithography'); break;
                    case eVocabularyID.eModelFileTypeglb: testVocabulary(vocabulary, 'glb - GL Transmission Format Binary'); break;
                    case eVocabularyID.eModelFileTypegltf: testVocabulary(vocabulary, 'gltf - GL Transmission Format'); break;
                    case eVocabularyID.eModelFileTypeusd: testVocabulary(vocabulary, 'usd - Universal Scene Description'); break;
                    case eVocabularyID.eModelFileTypeusdz: testVocabulary(vocabulary, 'usdz - Universal Scene Description (zipped)'); break;
                    case eVocabularyID.eModelFileTypex3d: testVocabulary(vocabulary, 'x3d'); break;
                    case eVocabularyID.eModelFileTypewrl: testVocabulary(vocabulary, 'wrl - VRML'); break;
                    case eVocabularyID.eModelFileTypedae: testVocabulary(vocabulary, 'dae - COLLADA'); break;
                    case eVocabularyID.eModelFileTypefbx: testVocabulary(vocabulary, 'fbx - Filmbox'); break;
                    case eVocabularyID.eModelFileTypema: testVocabulary(vocabulary, 'ma - Maya'); break;
                    case eVocabularyID.eModelFileType3ds: testVocabulary(vocabulary, '3ds - 3D Studio'); break;
                    case eVocabularyID.eModelFileTypeptx: testVocabulary(vocabulary, 'ptx'); break;
                    case eVocabularyID.eModelFileTypepts: testVocabulary(vocabulary, 'pts'); break;

                    case eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse: testVocabulary(vocabulary, 'Diffuse'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeSpecular: testVocabulary(vocabulary, 'Specular'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeAmbient: testVocabulary(vocabulary, 'Ambient'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeEmissive: testVocabulary(vocabulary, 'Emissive'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeBump: testVocabulary(vocabulary, 'Bump'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeNormal: testVocabulary(vocabulary, 'Normal'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeGlossiness: testVocabulary(vocabulary, 'Glossiness'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeOpacity: testVocabulary(vocabulary, 'Opacity'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeDisplacement: testVocabulary(vocabulary, 'Displacement'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeOcclusion: testVocabulary(vocabulary, 'Occlusion'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeReflection: testVocabulary(vocabulary, 'Reflection'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeMetalness: testVocabulary(vocabulary, 'Metalness'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeRoughness: testVocabulary(vocabulary, 'Roughness'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeNone: testVocabulary(vocabulary, 'None'); break;
                    case eVocabularyID.eModelMaterialChannelMaterialTypeUnknown: testVocabulary(vocabulary, 'Unknown'); break;

                    case eVocabularyID.eMetadataMetadataSourceBulkIngestion:    testVocabulary(vocabulary, 'Bulk Ingestion'); break;
                    case eVocabularyID.eMetadataMetadataSourceImage:            testVocabulary(vocabulary, 'Image'); break;

                    case eVocabularyID.eJobJobTypeCookBake:                     testVocabulary(vocabulary, 'Cook: bake'); break;
                    case eVocabularyID.eJobJobTypeCookDecimateUnwrap:           testVocabulary(vocabulary, 'Cook: decimate-unwrap'); break;
                    case eVocabularyID.eJobJobTypeCookDecimate:                 testVocabulary(vocabulary, 'Cook: decimate'); break;
                    case eVocabularyID.eJobJobTypeCookGenerateUsdz:             testVocabulary(vocabulary, 'Cook: generate-usdz'); break;
                    case eVocabularyID.eJobJobTypeCookGenerateWebGltf:          testVocabulary(vocabulary, 'Cook: generate-web-gltf'); break;
                    case eVocabularyID.eJobJobTypeCookInspectMesh:              testVocabulary(vocabulary, 'Cook: inspect-mesh'); break;
                    case eVocabularyID.eJobJobTypeCookSIArBackfillFix:          testVocabulary(vocabulary, 'Cook: si-ar-backfill-fix'); break;
                    case eVocabularyID.eJobJobTypeCookSIGenerateDownloads:      testVocabulary(vocabulary, 'Cook: si-generate-downloads'); break;
                    case eVocabularyID.eJobJobTypeCookSIOrientModelToSvx:       testVocabulary(vocabulary, 'Cook: si-orient-model-to-svx'); break;
                    case eVocabularyID.eJobJobTypeCookSIPackratInspect:         testVocabulary(vocabulary, 'Cook: si-packrat-inspect'); break;
                    case eVocabularyID.eJobJobTypeCookSIVoyagerAsset:           testVocabulary(vocabulary, 'Cook: si-voyager-asset'); break;
                    case eVocabularyID.eJobJobTypeCookSIVoyagerScene:           testVocabulary(vocabulary, 'Cook: si-voyager-scene'); break;
                    case eVocabularyID.eJobJobTypeCookUnwrap:                   testVocabulary(vocabulary, 'Cook: unwrap'); break;

                    case eVocabularyID.eWorkflowTypeCookJob:                    testVocabulary(vocabulary, 'Cook Job'); break;
                    case eVocabularyID.eWorkflowTypeIngestion:                  testVocabulary(vocabulary, 'Ingestion'); break;
                    case eVocabularyID.eWorkflowTypeUpload:                     testVocabulary(vocabulary, 'Upload'); break;

                    case eVocabularyID.eWorkflowStepTypeStart:                  testVocabulary(vocabulary, 'Start'); break;

                    case eVocabularyID.eWorkflowEventIngestionUploadAssetVersion:   testVocabulary(vocabulary, 'Ingestion: Upload Asset Version'); break;
                    case eVocabularyID.eWorkflowEventIngestionIngestObject:         testVocabulary(vocabulary, 'Ingestion: Ingest Object'); break;

                    case eVocabularyID.eEdan3DResourceAttributeUnitsmm:             testVocabulary(vocabulary, 'mm'); break;
                    case eVocabularyID.eEdan3DResourceAttributeUnitscm:             testVocabulary(vocabulary, 'cm'); break;
                    case eVocabularyID.eEdan3DResourceAttributeUnitsm:              testVocabulary(vocabulary, 'm'); break;
                    case eVocabularyID.eEdan3DResourceAttributeUnitskm:             testVocabulary(vocabulary, 'km'); break;
                    case eVocabularyID.eEdan3DResourceAttributeUnitsin:             testVocabulary(vocabulary, 'in'); break;
                    case eVocabularyID.eEdan3DResourceAttributeUnitsft:             testVocabulary(vocabulary, 'ft'); break;
                    case eVocabularyID.eEdan3DResourceAttributeUnitsyd:             testVocabulary(vocabulary, 'yd'); break;
                    case eVocabularyID.eEdan3DResourceAttributeUnitsmi:             testVocabulary(vocabulary, 'mi'); break;
                    case eVocabularyID.eEdan3DResourceAttributeModelFileTypeobj:    testVocabulary(vocabulary, 'obj'); break;
                    case eVocabularyID.eEdan3DResourceAttributeModelFileTypeply:    testVocabulary(vocabulary, 'ply'); break;
                    case eVocabularyID.eEdan3DResourceAttributeModelFileTypestl:    testVocabulary(vocabulary, 'stl'); break;
                    case eVocabularyID.eEdan3DResourceAttributeModelFileTypeglb:    testVocabulary(vocabulary, 'glb'); break;
                    case eVocabularyID.eEdan3DResourceAttributeModelFileTypex3d:    testVocabulary(vocabulary, 'x3d'); break;
                    case eVocabularyID.eEdan3DResourceAttributeModelFileTypegltf:   testVocabulary(vocabulary, 'gltf'); break;
                    case eVocabularyID.eEdan3DResourceAttributeModelFileTypeusdz:   testVocabulary(vocabulary, 'usdz'); break;
                    case eVocabularyID.eEdan3DResourceAttributeFileTypezip:         testVocabulary(vocabulary, 'zip'); break;
                    case eVocabularyID.eEdan3DResourceAttributeFileTypeglb:         testVocabulary(vocabulary, 'glb'); break;
                    case eVocabularyID.eEdan3DResourceAttributeFileTypeusdz:        testVocabulary(vocabulary, 'usdz'); break;
                    case eVocabularyID.eEdan3DResourceType3dmesh:                   testVocabulary(vocabulary, '3d mesh'); break;
                    case eVocabularyID.eEdan3DResourceTypeCADmodel:                 testVocabulary(vocabulary, 'CAD model'); break;
                    case eVocabularyID.eEdan3DResourceCategoryFullresolution:       testVocabulary(vocabulary, 'Full resolution'); break;
                    case eVocabularyID.eEdan3DResourceCategoryMediumresolution:     testVocabulary(vocabulary, 'Medium resolution'); break;
                    case eVocabularyID.eEdan3DResourceCategoryLowresolution:        testVocabulary(vocabulary, 'Low resolution'); break;
                    case eVocabularyID.eEdan3DResourceCategoryWatertight:           testVocabulary(vocabulary, 'Watertight'); break;
                    case eVocabularyID.eEdan3DResourceCategoryiOSARmodel:           testVocabulary(vocabulary, 'iOS AR model'); break;
                    case eVocabularyID.eEdanMDMFieldsLabel:                         testVocabulary(vocabulary, 'Label'); break;
                    case eVocabularyID.eEdanMDMFieldsTitle:                         testVocabulary(vocabulary, 'Title'); break;
                    case eVocabularyID.eEdanMDMFieldsRecordID:                      testVocabulary(vocabulary, 'Record ID'); break;
                    case eVocabularyID.eEdanMDMFieldsUnit:                          testVocabulary(vocabulary, 'Unit'); break;
                    case eVocabularyID.eEdanMDMFieldsLicense:                       testVocabulary(vocabulary, 'License'); break;
                    case eVocabularyID.eEdanMDMFieldsLicenseText:                   testVocabulary(vocabulary, 'License Text'); break;
                    case eVocabularyID.eEdanMDMFieldsObjectType:                    testVocabulary(vocabulary, 'Object Type'); break;
                    case eVocabularyID.eEdanMDMFieldsDate:                          testVocabulary(vocabulary, 'Date'); break;
                    case eVocabularyID.eEdanMDMFieldsPlace:                         testVocabulary(vocabulary, 'Place'); break;
                    case eVocabularyID.eEdanMDMFieldsTopic:                         testVocabulary(vocabulary, 'Topic'); break;
                    case eVocabularyID.eEdanMDMFieldsIdentifierFT:                  testVocabulary(vocabulary, 'Identifier (FT)'); break;
                    case eVocabularyID.eEdanMDMFieldsDataSourceFT:                  testVocabulary(vocabulary, 'Data Source (FT)'); break;
                    case eVocabularyID.eEdanMDMFieldsDateFT:                        testVocabulary(vocabulary, 'Date (FT)'); break;
                    case eVocabularyID.eEdanMDMFieldsNameFT:                        testVocabulary(vocabulary, 'Name (FT)'); break;
                    case eVocabularyID.eEdanMDMFieldsObjectRightsFT:                testVocabulary(vocabulary, 'Object Rights (FT)'); break;
                    case eVocabularyID.eEdanMDMFieldsPlaceFT:                       testVocabulary(vocabulary, 'Place (FT)'); break;
                    case eVocabularyID.eEdanMDMFieldsTaxonomicNameFT:               testVocabulary(vocabulary, 'Taxonomic Name (FT)'); break;
                    case eVocabularyID.eEdanMDMFieldsNotesFT:                       testVocabulary(vocabulary, 'Notes (FT)'); break;

                    case eVocabularyID.eNone: expect(vocabulary).toBeFalsy(); break;
                    default: expect(`Untested eVocabularyID enum ${eVocabularyID[eVocabID]}`).toBeFalsy(); break;
                }
            }
        });

        test('Cache: VocabularyCache.vocabularySet ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularySetAll)
                return;
            for (const vocabularySet of vocabularySetAll) {
                const vocabularySetInCache: DB.VocabularySet | undefined =
                    await VocabularyCache.vocabularySet(vocabularySet.idVocabularySet);
                expect(vocabularySetInCache).toBeTruthy();
                /* istanbul ignore else */
                if (vocabularySetInCache)
                    expect(vocabularySet).toMatchObject(vocabularySetInCache);
            }
        });

        test('Cache: VocabularyCache.vocabularySetByEnum ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularySetAll)
                return;

            // iterate through all enums of eVocabularySetID; for each:
            for (const sVocabSetID in eVocabularySetID) {
                if (!isNaN(Number(sVocabSetID)))
                    continue;
                const eVocabSetID: eVocabularySetID = (<any>eVocabularySetID)[sVocabSetID];
                const vocabularySet: DB.VocabularySet | undefined = await VocabularyCache.vocabularySetByEnum(eVocabSetID);

                switch (eVocabSetID) {
                    case eVocabularySetID.eCaptureDataCaptureMethod:
                    case eVocabularySetID.eCaptureDataDatasetType:
                    case eVocabularySetID.eCaptureDataItemPositionType:
                    case eVocabularySetID.eCaptureDataFocusType:
                    case eVocabularySetID.eCaptureDataLightSourceType:
                    case eVocabularySetID.eCaptureDataBackgroundRemovalMethod:
                    case eVocabularySetID.eCaptureDataClusterType:
                    case eVocabularySetID.eCaptureDataFileVariantType:
                    case eVocabularySetID.eModelCreationMethod:
                    case eVocabularySetID.eModelModality:
                    case eVocabularySetID.eModelUnits:
                    case eVocabularySetID.eModelPurpose:
                    case eVocabularySetID.eModelFileType:
                    case eVocabularySetID.eModelProcessingActionStepActionMethod:
                    case eVocabularySetID.eModelMaterialChannelMaterialType:
                    case eVocabularySetID.eIdentifierIdentifierType:
                    case eVocabularySetID.eIdentifierIdentifierTypeActor:
                    case eVocabularySetID.eMetadataMetadataSource:
                    case eVocabularySetID.eWorkflowStepWorkflowStepType:
                    case eVocabularySetID.eAssetAssetType:
                    case eVocabularySetID.eJobJobType:
                    case eVocabularySetID.eWorkflowType:
                    case eVocabularySetID.eWorkflowEvent:
                    case eVocabularySetID.eEdan3DResourceAttributeUnits:
                    case eVocabularySetID.eEdan3DResourceAttributeModelFileType:
                    case eVocabularySetID.eEdan3DResourceAttributeFileType:
                    case eVocabularySetID.eEdan3DResourceType:
                    case eVocabularySetID.eEdan3DResourceCategory:
                    case eVocabularySetID.eEdanMDMFields:
                        expect(vocabularySet).toBeTruthy();
                        /* istanbul ignore else */
                        if (vocabularySet)
                            expect('e' + vocabularySet.Name.replace('.', '')).toEqual(sVocabSetID);
                        break;

                    case eVocabularySetID.eNone:
                        expect(vocabularySet).toBeFalsy();
                        break;

                    default:
                        expect(`Unexpected vocabulary set ${sVocabSetID}`).toBeFalsy();
                        break;
                }
            }
        });

        test('Cache: VocabularyCache.vocabularySetEntries ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularySetAll)
                return;
            for (const vocabularySet of vocabularySetAll) {
                const vocabularySetEntriesInCache: DB.Vocabulary[] | undefined =
                    await VocabularyCache.vocabularySetEntries(vocabularySet.idVocabularySet);
                expect(vocabularySetEntriesInCache).toBeTruthy();
                /* istanbul ignore else */
                if (vocabularySetEntriesInCache) {
                    let lastSort: number = 0;
                    for (const vocabularyInCache of vocabularySetEntriesInCache) {
                        expect(vocabularyInCache.idVocabularySet).toEqual(vocabularySet.idVocabularySet);
                        if (vocabularySet.SystemMaintained) {
                            expect(vocabularyInCache.SortOrder).toBeGreaterThan(lastSort);
                            lastSort = vocabularyInCache.SortOrder;
                        }
                        expect(vocabularyMap.has(vocabularyInCache.idVocabulary)).toBeTruthy();
                        expect(vocabularyMap.get(vocabularyInCache.idVocabulary)).toMatchObject(vocabularyInCache);
                    }
                }
            }
        });

        test('Cache: VocabularyCache.vocabularySetEntriesByEnum ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularySetAll)
                return;

            const vocabNameMap: Map<string, number> = new Map<string, number>();    // Map normalized vocabulary set name -> idVocabularySet
            for (const vocabularySet of vocabularySetAll) {
                const sVocabSetNameNorm: string = vocabularySet.Name.replace('.', '').toUpperCase();
                vocabNameMap.set(sVocabSetNameNorm, vocabularySet.idVocabularySet);
            }

            // iterate through all enums of eVocabularySetID; for each:
            for (const sVocabSetID in eVocabularySetID) { // Object.keys(eVocabularySetID).filter(k => typeof eVocabularySetID[k as any] === 'number')) {
                if (!isNaN(Number(sVocabSetID)))
                    continue;
                const eVocabSetID: eVocabularySetID = (<any>eVocabularySetID)[sVocabSetID]; // <eVocabularySetID><unknown>eVocabularySetID[sVocabSetID]; // eVocabularySetID = sVocabSetID as keyof typeof eVocabularySetID; // (<any>eVocabularySetID)[sVocabSetID];
                if (eVocabSetID == eVocabularySetID.eNone)
                    continue;

                // compute the vocabulary set entries
                const vocabularySetEntriesInCacheByEnum: DB.Vocabulary[] | undefined =
                    await VocabularyCache.vocabularySetEntriesByEnum(eVocabSetID);
                expect(vocabularySetEntriesInCacheByEnum).toBeTruthy();

                // compute the vocabulary set name and ID from the enum name
                const sVocabSetNameNorm: string = sVocabSetID.substring(1).toUpperCase();
                const nVocabSetID: number | undefined = vocabNameMap.get(sVocabSetNameNorm);
                expect(nVocabSetID).toBeTruthy();
                /* istanbul ignore if */
                if (!nVocabSetID)
                    continue;

                // compute the vocabulary set entries from the enum converted to an ID
                const vocabularySetEntriesInCache: DB.Vocabulary[] | undefined =
                    await VocabularyCache.vocabularySetEntries(nVocabSetID);
                expect(vocabularySetEntriesInCache).toBeTruthy();

                // verify arrays match
                expect(H.Helpers.arraysEqual(vocabularySetEntriesInCacheByEnum, vocabularySetEntriesInCache)).toBeTruthy();
            }

            const vocabularySetEntriesInCacheByEnumNone: DB.Vocabulary[] | undefined =
                await VocabularyCache.vocabularySetEntriesByEnum(eVocabularySetID.eNone);
            expect(vocabularySetEntriesInCacheByEnumNone).toBeUndefined();
        });

        test('Cache: VocabularyCache.vocabularyBySetAndTerm ' + description, async () => {
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataCaptureMethod, 'Photogrammetry');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataCaptureMethod, 'CT');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataCaptureMethod, 'Structured Light');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataCaptureMethod, 'Laser Line');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataCaptureMethod, 'Spherical Laser');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataDatasetType, 'Photogrammetry Image Set');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataDatasetType, 'Grey Card Image Set');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataDatasetType, 'Color Card Image Set');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataDatasetType, 'Background Removal Image Set');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataDatasetType, 'Calibration Dataset');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataItemPositionType, 'Relative To Environment');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataItemPositionType, 'Relative To Turntable');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataFocusType, 'Fixed');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataFocusType, 'Variable');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataLightSourceType, 'Ambient');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataLightSourceType, 'Strobe Standard');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataLightSourceType, 'Strobe Cross');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataLightSourceType, 'Patterned/Structured');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataBackgroundRemovalMethod, 'None');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataBackgroundRemovalMethod, 'Clip Black');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataBackgroundRemovalMethod, 'Clip White');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataBackgroundRemovalMethod, 'Background Subtraction By Capture Dataset Set');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataClusterType, 'None');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataClusterType, 'Array');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataClusterType, 'Spherical Image Station');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataClusterType, 'Focal Stack Position Based');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataClusterType, 'Focal Stack Focus Based');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataFileVariantType, 'Raw');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataFileVariantType, 'Processed');
            await testVocabularyBySetAndTerm(eVocabularySetID.eCaptureDataFileVariantType, 'From Camera');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelCreationMethod, 'Scan To Mesh');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelCreationMethod, 'CAD');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelModality, 'Point Cloud');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelModality, 'Mesh');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Micrometer');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Millimeter');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Centimeter');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Meter');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Kilometer');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Inch');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Foot');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Yard');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Mile');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelUnits, 'Astronomical Unit');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelPurpose, 'Master');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelPurpose, 'Web Delivery');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelPurpose, 'Download');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelPurpose, 'Intermediate Processing Step');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'obj - Alias Wavefront Object');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'ply - Stanford Polygon File Format');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'stl - StereoLithography');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'glb - GL Transmission Format Binary');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'gltf - GL Transmission Format');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'usd - Universal Scene Description');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'usdz - Universal Scene Description (zipped)');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'x3d');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'wrl - VRML');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'dae - COLLADA');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'fbx - Filmbox');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'ma - Maya');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, '3ds - 3D Studio');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'ptx');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'pts');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Diffuse');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Specular');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Ambient');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Emissive');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Bump');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Normal');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Glossiness');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Opacity');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Displacement');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Occlusion');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Reflection');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Metalness');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Roughness');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'None');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Unknown');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierType, 'ARK');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierType, 'DOI');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierType, 'Unit CMS ID');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierTypeActor, 'ORCID');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierTypeActor, 'ISNI');
            await testVocabularyBySetAndTerm(eVocabularySetID.eMetadataMetadataSource, 'Bulk Ingestion');
            await testVocabularyBySetAndTerm(eVocabularySetID.eMetadataMetadataSource, 'Image');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Bulk Ingestion');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Capture Data Set: Photogrammetry');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Capture Data Set: Diconde');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Capture Data Set: Dicom');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Capture Data Set: Laser Line');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Capture Data Set: Spherical Laser');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Capture Data Set: Structured Light');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Capture Data Set: Other');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Capture Data File');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Model');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Model Geometry File');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Model UV Map File');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Scene');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Project Documentation');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Intermediary File');
            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'Other');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: bake');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: decimate-unwrap');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: decimate');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: generate-usdz');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: generate-web-gltf');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: inspect-mesh');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: si-ar-backfill-fix');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: si-generate-downloads');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: si-orient-model-to-svx');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: si-packrat-inspect');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: si-voyager-asset');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: si-voyager-scene');
            await testVocabularyBySetAndTerm(eVocabularySetID.eJobJobType, 'Cook: unwrap');
            await testVocabularyBySetAndTerm(eVocabularySetID.eWorkflowType, 'Cook Job');
            await testVocabularyBySetAndTerm(eVocabularySetID.eWorkflowStepWorkflowStepType, 'Start');
            await testVocabularyBySetAndTerm(eVocabularySetID.eWorkflowEvent, 'Ingestion: Upload Asset Version');
            await testVocabularyBySetAndTerm(eVocabularySetID.eWorkflowEvent, 'Ingestion: Ingest Object');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeUnits, 'mm');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeUnits, 'cm');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeUnits, 'm');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeUnits, 'km');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeUnits, 'in');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeUnits, 'ft');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeUnits, 'yd');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeUnits, 'mi');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'obj');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'ply');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'stl');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'glb');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'x3d');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'gltf');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'usdz');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeFileType, 'zip');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeFileType, 'glb');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceAttributeFileType, 'usdz');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceType, '3d mesh');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceType, 'CAD model');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceCategory, 'Full resolution');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceCategory, 'Medium resolution');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceCategory, 'Low resolution');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceCategory, 'Watertight');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdan3DResourceCategory, 'iOS AR model');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Label');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Title');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Record ID');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Unit');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'License');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'License Text');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Object Type');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Date');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Place');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Topic');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Identifier (FT)');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Data Source (FT)');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Date (FT)');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Name (FT)');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Object Rights (FT)');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Place (FT)');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Taxonomic Name (FT)');
            await testVocabularyBySetAndTerm(eVocabularySetID.eEdanMDMFields, 'Notes (FT)');

            await testVocabularyBySetAndTerm(eVocabularySetID.eAssetAssetType, 'OBVIOUSLY INVALID VALUE', false);
            await testVocabularyBySetAndTerm(eVocabularySetID.eNone, 'Other', false);
        });

        test('Cache: VocabularyCache.mapPhotogrammetryVariantType ' + description, async () => {
            await testMapPhotogrammetryVariantType('raw', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('cr2', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('cr3', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('dng', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('arw', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('cam_dng', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('tif', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('tiff', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('bmp', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('png', eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('processed', eVocabularyID.eCaptureDataFileVariantTypeProcessed);
            await testMapPhotogrammetryVariantType('col_cor', eVocabularyID.eCaptureDataFileVariantTypeProcessed);
            await testMapPhotogrammetryVariantType('zeroed', eVocabularyID.eCaptureDataFileVariantTypeProcessed);
            await testMapPhotogrammetryVariantType('from camera', eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('fromcamera', eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('jpg', eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('jpeg', eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('camerajpg', eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('camera', eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('FOOBARFAULTY', eVocabularyID.eNone);
        });

        test('Cache: VocabularyCache.mapModelFileByExtension ' + description, async () => {
            await testMapModelFileByExtension('.obj',  eVocabularyID.eModelFileTypeobj);
            await testMapModelFileByExtension('.ply',  eVocabularyID.eModelFileTypeply);
            await testMapModelFileByExtension('.stl',  eVocabularyID.eModelFileTypestl);
            await testMapModelFileByExtension('.glb' , eVocabularyID.eModelFileTypeglb);
            await testMapModelFileByExtension('.gltf', eVocabularyID.eModelFileTypegltf);
            await testMapModelFileByExtension('.usda', eVocabularyID.eModelFileTypeusd);
            await testMapModelFileByExtension('.usdc', eVocabularyID.eModelFileTypeusd);
            await testMapModelFileByExtension('.usdz', eVocabularyID.eModelFileTypeusdz);
            await testMapModelFileByExtension('.x3d',  eVocabularyID.eModelFileTypex3d);
            await testMapModelFileByExtension('.wrl',  eVocabularyID.eModelFileTypewrl);
            await testMapModelFileByExtension('.dae',  eVocabularyID.eModelFileTypedae);
            await testMapModelFileByExtension('.fbx',  eVocabularyID.eModelFileTypefbx);
            await testMapModelFileByExtension('.ma',   eVocabularyID.eModelFileTypema);
            await testMapModelFileByExtension('.3ds',  eVocabularyID.eModelFileType3ds);
            await testMapModelFileByExtension('.ptx',  eVocabularyID.eModelFileTypeptx);
            await testMapModelFileByExtension('.pts',  eVocabularyID.eModelFileTypepts);
            await testMapModelFileByExtension('FOOBARFAULTY', eVocabularyID.eNone);
        });

        test('Cache: VocabularyCache.mapModelChannelMaterialType ' + description, async () => {
            await testMapModelChannelMaterialType('diffuse',        eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse);
            await testMapModelChannelMaterialType('specular',       eVocabularyID.eModelMaterialChannelMaterialTypeSpecular);
            await testMapModelChannelMaterialType('ambient',        eVocabularyID.eModelMaterialChannelMaterialTypeAmbient);
            await testMapModelChannelMaterialType('emissive',       eVocabularyID.eModelMaterialChannelMaterialTypeEmissive);
            await testMapModelChannelMaterialType('bump',           eVocabularyID.eModelMaterialChannelMaterialTypeBump);
            await testMapModelChannelMaterialType('normal',         eVocabularyID.eModelMaterialChannelMaterialTypeNormal);
            await testMapModelChannelMaterialType('glossiness',     eVocabularyID.eModelMaterialChannelMaterialTypeGlossiness);
            await testMapModelChannelMaterialType('opacity',        eVocabularyID.eModelMaterialChannelMaterialTypeOpacity);
            await testMapModelChannelMaterialType('displacement',   eVocabularyID.eModelMaterialChannelMaterialTypeDisplacement);
            await testMapModelChannelMaterialType('occlusion',      eVocabularyID.eModelMaterialChannelMaterialTypeOcclusion);
            await testMapModelChannelMaterialType('reflection',     eVocabularyID.eModelMaterialChannelMaterialTypeReflection);
            await testMapModelChannelMaterialType('metalness',      eVocabularyID.eModelMaterialChannelMaterialTypeMetalness);
            await testMapModelChannelMaterialType('roughness',      eVocabularyID.eModelMaterialChannelMaterialTypeRoughness);
            await testMapModelChannelMaterialType('none',           eVocabularyID.eModelMaterialChannelMaterialTypeNone);
            await testMapModelChannelMaterialType('unknown',        eVocabularyID.eModelMaterialChannelMaterialTypeUnknown);
            await testMapModelChannelMaterialType('FOOBARFAULTY',   eVocabularyID.eModelMaterialChannelMaterialTypeUnknown);
        });

        test('Cache: VocabularyCache.vocabularyEnumToId and vocabularyIdToEnum ' + description, async () => {
            // iterate through all enums of eVocabularyID; for each:
            for (const sVocabID in eVocabularyID) {
                if (!isNaN(Number(sVocabID)))
                    continue;
                const eVocabID: eVocabularyID = (<any>eVocabularyID)[sVocabID];
                const idVocabulary: number | undefined = await VocabularyCache.vocabularyEnumToId(eVocabID);
                if (eVocabID != eVocabularyID.eNone)
                    expect(idVocabulary).toBeTruthy();
                else {
                    expect(idVocabulary).toBeFalsy();
                    continue;
                }

                const eVocabIDFetch: eVocabularyID | undefined = await VocabularyCache.vocabularyIdToEnum(idVocabulary || 0);
                expect(eVocabIDFetch).toBeTruthy;
                expect(eVocabIDFetch).toEqual(eVocabID);
            }
            expect(await VocabularyCache.vocabularyEnumToId(eVocabularyID.eNone)).toBeFalsy();
            expect(await VocabularyCache.vocabularyIdToEnum(0)).toBeFalsy();
        });

        test('Cache: VocabularyCache.vocabularySetEnumToId and vocabularySetIdToEnum' + description, async () => {
            // iterate through all enums of eVocabularySetID; for each:
            for (const sVocabSetID in eVocabularySetID) {
                if (!isNaN(Number(sVocabSetID)))
                    continue;
                // LOG.info(`VocabularyCache.vocabularySetEnumToId of ${sVocabSetID}`, LOG.LS.eTEST);
                const eVocabSetID: eVocabularySetID = (<any>eVocabularySetID)[sVocabSetID];
                const vocabularySet: DB.VocabularySet | undefined = await VocabularyCache.vocabularySetByEnum(eVocabSetID);
                const vocabSetID: number | undefined = await VocabularyCache.vocabularySetEnumToId(eVocabSetID);

                if (eVocabSetID != eVocabularySetID.eNone) {
                    expect(vocabularySet).toBeTruthy();
                    expect(vocabSetID).toBeTruthy();
                } else {
                    expect(vocabularySet).toBeFalsy();
                    expect(vocabSetID).toBeFalsy();
                    continue;
                }

                if (!vocabularySet)
                    continue;
                expect(vocabularySet.idVocabularySet).toEqual(vocabSetID);

                // LOG.info(`VocabularyCache.vocabularySetIdToEnum of ${vocabularySet.idVocabularySet}`, LOG.LS.eTEST);
                // fetches the VocabularySet.idVocabularySet for a given vocabulary set enum
                // static async vocabularySetIdToEnum(idVocabularySet: number): Promise<eVocabularySetID | undefined> {
                const eVocabSetIDFetch: eVocabularySetID | undefined = await VocabularyCache.vocabularySetIdToEnum(vocabularySet.idVocabularySet);
                expect(eVocabSetIDFetch).not.toBeUndefined();
                expect(eVocabSetIDFetch).toEqual(eVocabSetID);
            }
        });

        test('Cache: VocabularyCache.isVocabularyInSet ' + description, async () => {
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eCaptureDataFileVariantTypeRaw, eVocabularySetID.eCaptureDataFileVariantType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eModelCreationMethodScanToMesh, eVocabularySetID.eModelCreationMethod)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eModelModalityPointCloud, eVocabularySetID.eModelModality)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eModelUnitsMicrometer, eVocabularySetID.eModelUnits)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eModelPurposeMaster, eVocabularySetID.eModelPurpose)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eModelFileTypeobj, eVocabularySetID.eModelFileType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse, eVocabularySetID.eModelMaterialChannelMaterialType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eIdentifierIdentifierTypeARK, eVocabularySetID.eIdentifierIdentifierType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eMetadataMetadataSourceBulkIngestion, eVocabularySetID.eMetadataMetadataSource)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eAssetAssetTypeBulkIngestion, eVocabularySetID.eAssetAssetType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eJobJobTypeCookBake, eVocabularySetID.eJobJobType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eWorkflowTypeCookJob, eVocabularySetID.eWorkflowType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eWorkflowTypeIngestion, eVocabularySetID.eWorkflowType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eWorkflowTypeUpload, eVocabularySetID.eWorkflowType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eWorkflowStepTypeStart, eVocabularySetID.eWorkflowStepWorkflowStepType)).toBeTruthy();

            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eWorkflowEventIngestionUploadAssetVersion, eVocabularySetID.eWorkflowEvent)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eEdan3DResourceAttributeUnitsmm, eVocabularySetID.eEdan3DResourceAttributeUnits)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eEdan3DResourceAttributeModelFileTypeobj, eVocabularySetID.eEdan3DResourceAttributeModelFileType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eEdan3DResourceAttributeFileTypezip, eVocabularySetID.eEdan3DResourceAttributeFileType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eEdan3DResourceType3dmesh, eVocabularySetID.eEdan3DResourceType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eEdan3DResourceCategoryFullresolution, eVocabularySetID.eEdan3DResourceCategory)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eEdanMDMFieldsNameFT, eVocabularySetID.eEdanMDMFields)).toBeTruthy();

            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eNone, eVocabularySetID.eMetadataMetadataSource)).toBeFalsy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eWorkflowTypeCookJob, eVocabularySetID.eNone)).toBeFalsy();
            expect(await VocabularyCache.isVocabularyInSet(eVocabularyID.eWorkflowTypeCookJob, eVocabularySetID.eMetadataMetadataSource)).toBeFalsy();
        });
    });
}

function vocabularyCacheTestClearFlush(): void {
    describe('Cache: VocabularyCache clear/flush', () => {
        test('Cache: VocabularyCache.clear and VocabularyCache.flush', async () => {
            await VocabularyCache.clear();
            await VocabularyCache.flush();
        });
    });
}

function testVocabulary(vocabulary: DB.Vocabulary | undefined, termExpected: string): void {
    // LOG.info(`VocabularyCacheTest testVocabulary ${termExpected} ${JSON.stringify(vocabulary)}`, LOG.LS.eTEST);
    expect(vocabulary).toBeTruthy();
    /* istanbul ignore else */
    if (vocabulary)
        expect(vocabulary.Term).toEqual(termExpected);
}

async function testVocabularyBySetAndTerm(eVocabSetId: eVocabularySetID, term: string, expectSuccess: boolean = true): Promise<void> {
    const vocabulary: DB.Vocabulary | undefined = await VocabularyCache.vocabularyBySetAndTerm(eVocabSetId, term);
    if (expectSuccess)
        expect(vocabulary).toBeTruthy();
    if (vocabulary)
        expect(vocabulary.Term).toEqual(term);
}

async function testMapPhotogrammetryVariantType(variantType: string, eVocabID: eVocabularyID): Promise<void> {
    // LOG.info(`Testing ${variantType}; expecting ${eVocabularyID[eVocabID]}`, LOG.LS.eTEST);
    const vocabObserved: DB.Vocabulary | undefined = await VocabularyCache.mapPhotogrammetryVariantType(variantType);
    const vocabExpected: DB.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);
    if (eVocabID != eVocabularyID.eNone) {
        expect(vocabObserved).toBeTruthy();
        expect(vocabExpected).toBeTruthy();
    } else {
        expect(vocabObserved).toBeFalsy();
        expect(vocabExpected).toBeFalsy();
    }
    expect(vocabObserved).toEqual(vocabExpected);
}

async function testMapModelFileByExtension(modelExtension: string, eVocabID: eVocabularyID): Promise<void> {
    // LOG.info(`Testing ${variantType}; expecting ${eVocabularyID[eVocabID]}`, LOG.LS.eTEST);
    const vocabObserved: DB.Vocabulary | undefined = await VocabularyCache.mapModelFileByExtension(modelExtension);
    const vocabExpected: DB.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);
    if (eVocabID != eVocabularyID.eNone) {
        expect(vocabObserved).toBeTruthy();
        expect(vocabExpected).toBeTruthy();
    } else {
        expect(vocabObserved).toBeFalsy();
        expect(vocabExpected).toBeFalsy();
    }
    expect(vocabObserved).toEqual(vocabExpected);
}

async function testMapModelChannelMaterialType(materialType: string, eVocabID: eVocabularyID): Promise<void> {
    // LOG.info(`Testing ${variantType}; expecting ${eVocabularyID[eVocabID]}`, LOG.LS.eTEST);
    const vocabObserved: DB.Vocabulary | undefined = await VocabularyCache.mapModelChannelMaterialType(materialType);
    const vocabExpected: DB.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);
    if (eVocabID != eVocabularyID.eNone) {
        expect(vocabObserved).toBeTruthy();
        expect(vocabExpected).toBeTruthy();
    } else {
        expect(vocabObserved).toBeFalsy();
        expect(vocabExpected).toBeFalsy();
    }
    expect(vocabObserved).toEqual(vocabExpected);
}

export default vocabularyCacheTest;
