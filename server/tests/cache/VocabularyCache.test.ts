/* eslint-disable @typescript-eslint/no-explicit-any */
import * as CACHE from '../../cache';
import * as DB from '../../db';
import * as H from '../../utils/helpers';
import { VocabularyCache, eVocabularyID, eVocabularySetID } from '../../cache';
// import * as LOG from '../../utils/logger';

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
                case eCacheTestMode.eClear: await CACHE.VocabularyCache.clear(); break;
                case eCacheTestMode.eFlush: await CACHE.VocabularyCache.flush(); break;
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
                    await CACHE.VocabularyCache.vocabulary(vocabulary.idVocabulary);
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

                    case eVocabularyID.eNone: expect(vocabulary).toBeFalsy(); break;
                }
            }
        });

        test('Cache: VocabularyCache.vocabularySet ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularySetAll)
                return;
            for (const vocabularySet of vocabularySetAll) {
                const vocabularySetInCache: DB.VocabularySet | undefined =
                    await CACHE.VocabularyCache.vocabularySet(vocabularySet.idVocabularySet);
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
                    case eVocabularySetID.eModelGeometryFileModelFileType:
                    case eVocabularySetID.eModelProcessingActionStepActionMethod:
                    case eVocabularySetID.eModelUVMapChannelUVMapType:
                    case eVocabularySetID.eIdentifierIdentifierType:
                    case eVocabularySetID.eMetadataMetadataSource:
                    case eVocabularySetID.eWorkflowStepWorkflowStepType:
                        expect(vocabularySet).toBeTruthy();
                        /* istanbul ignore else */
                        if (vocabularySet)
                            expect('e' + vocabularySet.Name.replace('.', '')).toEqual(sVocabSetID);
                        break;

                    case eVocabularySetID.eNone:
                        expect(vocabularySet).toBeFalsy();
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
                    await CACHE.VocabularyCache.vocabularySetEntries(vocabularySet.idVocabularySet);
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
                    await CACHE.VocabularyCache.vocabularySetEntriesByEnum(eVocabSetID);
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
                    await CACHE.VocabularyCache.vocabularySetEntries(nVocabSetID);
                expect(vocabularySetEntriesInCache).toBeTruthy();

                // verify arrays match
                expect(H.Helpers.arraysEqual(vocabularySetEntriesInCacheByEnum, vocabularySetEntriesInCache)).toBeTruthy();
            }

            const vocabularySetEntriesInCacheByEnumNone: DB.Vocabulary[] | undefined =
                await CACHE.VocabularyCache.vocabularySetEntriesByEnum(eVocabularySetID.eNone);
            expect(vocabularySetEntriesInCacheByEnumNone).toBeUndefined();
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

export default vocabularyCacheTest;
