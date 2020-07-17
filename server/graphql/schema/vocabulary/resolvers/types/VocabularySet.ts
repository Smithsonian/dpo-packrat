/**
 * Type resolver for VocabularySet
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const VocabularySet = {
    Vocabulary: async (parent: Parent): Promise<DBAPI.Vocabulary[] | null> => {
        return await DBAPI.Vocabulary.fetchFromVocabularySet(parent.idVocabularySet);
    }
};

export default VocabularySet;
