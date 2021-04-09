/**
 * Type resolver for Vocabulary
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';

const Vocabulary = {
    VocabularySet: async (parent: Parent): Promise<DBAPI.VocabularySet | null> => {
        return await DBAPI.VocabularySet.fetch(parent.idVocabularySet);
    },
    eVocabID: async (parent: Parent): Promise<number | null> => {
        return await CACHE.VocabularyCache.vocabularyIdToEnum(parent.idVocabulary) || null;
    },

};

export default Vocabulary;
