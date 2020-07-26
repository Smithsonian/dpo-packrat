import Vocabulary from './types/Vocabulary';
import VocabularySet from './types/VocabularySet';
import getVocabulary from './queries/getVocabulary';
import createVocabulary from './mutations/createVocabulary';
import createVocabularySet from './mutations/createVocabularySet';

const resolvers = {
    Query: {
        getVocabulary
    },
    Mutation: {
        createVocabulary,
        createVocabularySet
    },
    Vocabulary,
    VocabularySet
};

export default resolvers;
