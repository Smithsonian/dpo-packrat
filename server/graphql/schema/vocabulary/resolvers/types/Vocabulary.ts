/**
 * Type resolver for Vocabulary
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Vocabulary = {
    VocabularySet: async (parent: Parent): Promise<DBAPI.VocabularySet | null> => {
        return await DBAPI.VocabularySet.fetch(parent.idVocabularySet);
    }
};

export default Vocabulary;
