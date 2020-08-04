import * as CACHE from '../../cache';
import * as DB from '../../db';
import { VocabularyCache } from '../../cache';
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

export default vocabularyCacheTest;
