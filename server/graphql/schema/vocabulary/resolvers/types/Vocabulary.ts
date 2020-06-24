/**
 * Type resolver for Vocabulary
 */
import { Vocabulary, VocabularySet } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { resolveVocabularySetByVocabularyID } from './VocabularySet';
import { fetchVocabulary } from '../../../../../db';

const Vocabulary = {
    VocabularySet: async (parent: Parent, _: Args, context: Context): Promise<VocabularySet | null> => {
        const { idVocabulary } = parent;
        const { prisma } = context;

        return resolveVocabularySetByVocabularyID(prisma, Number.parseInt(idVocabulary));
    }
};

export async function resolveVocabularyByID(prisma: PrismaClient, idVocabulary: number): Promise<Vocabulary | null> {
    const foundVocabulary = await fetchVocabulary(prisma, idVocabulary);

    return parseVocabulary(foundVocabulary);
}

export function parseVocabulary(foundVocabulary: DB.Vocabulary | null): Vocabulary | null {
    let vocabulary;
    if (foundVocabulary) {
        const { idVocabulary, SortOrder } = foundVocabulary;
        vocabulary = {
            idVocabulary: String(idVocabulary),
            SortOrder
        };
    }

    return vocabulary;
}

export default Vocabulary;
