/**
 * Type resolver for Vocabulary
 */
import { Vocabulary, VocabularySet } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Vocabulary = {
    VocabularySet: async (parent: Parent, _: Args, context: Context): Promise<VocabularySet | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return prisma.vocabulary.findOne({ where: { idVocabulary: Number.parseInt(idVocabulary) } }).VocabularySet();
    }
};

export default Vocabulary;
