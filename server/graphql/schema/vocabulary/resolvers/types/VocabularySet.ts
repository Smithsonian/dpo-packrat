/**
 * Type resolver for VocabularySet
 */
import { Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const VocabularySet = {
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary[] | null> => {
        const { idVocabularySet } = parent;
        const { prisma } = context;

        return await DBAPI.fetchVocabularyFromVocabularySet(prisma, idVocabularySet);
    }
};

export default VocabularySet;
