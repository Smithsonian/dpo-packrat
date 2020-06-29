import Vocabulary from './types/Vocabulary';
import VocabularySet from './types/VocabularySet';
import getVocabulary from './queries/getVocabulary';

const resolvers = {
    Query: {
        getVocabulary
    },
    Vocabulary,
    VocabularySet
};

export default resolvers;
