/* eslint-disable camelcase */
import { PrismaClient, Vocabulary, VocabularySet  } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createVocabulary(prisma: PrismaClient, vocabulary: Vocabulary): Promise<Vocabulary | null> {
    let createSystemObject: Vocabulary;
    const { idVocabularySet, SortOrder } = vocabulary;
    try {
        createSystemObject = await prisma.vocabulary.create({
            data: {
                VocabularySet: { connect: { idVocabularySet }, },
                SortOrder
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createVocabulary', error);
        return null;
    }
    return createSystemObject;
}

export async function createVocabularySet(prisma: PrismaClient, vocabularySet: VocabularySet): Promise<VocabularySet | null> {
    let createSystemObject: VocabularySet;
    const { Name, SystemMaintained } = vocabularySet;
    try {
        createSystemObject = await prisma.vocabularySet.create({
            data: {
                Name,
                SystemMaintained
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createVocabularySet', error);
        return null;
    }
    return createSystemObject;
}
