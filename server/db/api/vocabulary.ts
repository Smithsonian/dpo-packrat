/* eslint-disable camelcase */
import { PrismaClient, Vocabulary, VocabularySet  } from '@prisma/client';

export async function createVocabulary(prisma: PrismaClient, vocabulary: Vocabulary): Promise<Vocabulary> {
    const { idVocabularySet, SortOrder } = vocabulary;
    const createSystemObject: Vocabulary = await prisma.vocabulary.create({
        data: {
            VocabularySet: { connect: { idVocabularySet }, },
            SortOrder
        },
    });

    return createSystemObject;
}

export async function createVocabularySet(prisma: PrismaClient, vocabularySet: VocabularySet): Promise<VocabularySet> {
    const { Name, SystemMaintained } = vocabularySet;
    const createSystemObject: VocabularySet = await prisma.vocabularySet.create({
        data: {
            Name,
            SystemMaintained
        },
    });

    return createSystemObject;
}
