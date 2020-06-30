/**
 * Type resolver for Vocabulary
 */
import { Vocabulary, VocabularySet } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Vocabulary = {
    VocabularySet: async (parent: Parent, _: Args, context: Context): Promise<VocabularySet | null> => {
        const { idVocabularySet } = parent;
        const { prisma } = context;

        return await DBAPI.fetchVocabularySet(prisma, idVocabularySet);
    }
};

export default Vocabulary;
