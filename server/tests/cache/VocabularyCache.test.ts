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
                    case eVocabularyID.eAssetAssetTypeOther: testVocabulary(vocabulary, 'Other'); break;
                    case eVocabularyID.eCaptureDataCaptureMethodPhotogrammetry: testVocabulary(vocabulary, 'Photogrammetry'); break;
                    case eVocabularyID.eCaptureDataCaptureMethodCT: testVocabulary(vocabulary, 'CT'); break;
                    case eVocabularyID.eCaptureDataCaptureMethodStructuredLight: testVocabulary(vocabulary, 'Structured Light'); break;
                    case eVocabularyID.eCaptureDataCaptureMethodLaserLine: testVocabulary(vocabulary, 'Laser Line'); break;
                    case eVocabularyID.eCaptureDataCaptureMethodSphericalLaser: testVocabulary(vocabulary, 'Spherical Laser'); break;
                    case eVocabularyID.eCaptureDataFileVariantTypeRaw: testVocabulary(vocabulary, 'Raw'); break;
                    case eVocabularyID.eCaptureDataFileVariantTypeProcessed: testVocabulary(vocabulary, 'Processed'); break;
                    case eVocabularyID.eCaptureDataFileVariantTypeFromCamera: testVocabulary(vocabulary, 'From Camera'); break;
                    case eVocabularyID.eMetadataMetadataSourceBulkIngestion: testVocabulary(vocabulary, 'Bulk Ingestion'); break;
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
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelPurpose, 'Print Delivery');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelPurpose, 'Intermediate Processing Step');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'obj - Alias Wavefront Object');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'ply - Stanford Polygon File Format');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'stl - StereoLithography');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'glb - GL Transmission Format Binary');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelFileType, 'gltf - GL Transmission Format');
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
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Normal: Tangent Space');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Normal: Object Space');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Ambient Occlusion');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Roughness');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Metalness');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Specular');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Transparency');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'BRDF');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Hole Fill');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Reflection');
            await testVocabularyBySetAndTerm(eVocabularySetID.eModelMaterialChannelMaterialType, 'Refraction');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierType, 'ARK');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierType, 'DOI');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierType, 'Unit CMS ID');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierTypeActor, 'ORCID');
            await testVocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierTypeActor, 'ISNI');
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
            await testVocabularyBySetAndTerm(eVocabularySetID.eMetadataMetadataSource, 'Bulk Ingestion');
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
    // LOG.logger.info(`Testing ${variantType}; expecting ${eVocabularyID[eVocabID]}`);
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


export default vocabularyCacheTest;
