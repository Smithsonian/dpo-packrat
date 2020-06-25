/**
 * Type resolver for VocabularySet
 */
import { Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const VocabularySet = {
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary[] | null> => {
        const { idVocabularySet } = parent;
        const { prisma } = context;

        return prisma.vocabularySet.findOne({ where: { idVocabularySet } }).Vocabulary();
    }
};

export default VocabularySet;
