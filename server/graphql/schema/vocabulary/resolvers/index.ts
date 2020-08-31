import Vocabulary from './types/Vocabulary';
import VocabularySet from './types/VocabularySet';
import getVocabulary from './queries/getVocabulary';
import createVocabulary from './mutations/createVocabulary';
import createVocabularySet from './mutations/createVocabularySet';
import getVocabularyEntries from './queries/getVocabularyEntries';

const resolvers = {
    Query: {
        getVocabulary,
        getVocabularyEntries
    },
    Mutation: {
        createVocabulary,
        createVocabularySet
    },
    Vocabulary,
    VocabularySet
};

export default resolvers;
