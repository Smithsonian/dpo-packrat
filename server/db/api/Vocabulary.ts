/* eslint-disable camelcase */
import { PrismaClient, Vocabulary  } from '@prisma/client';
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

export async function fetchVocabulary(prisma: PrismaClient, idVocabulary: number): Promise<Vocabulary | null> {
    try {
        return await prisma.vocabulary.findOne({ where: { idVocabulary, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVocabulary', error);
        return null;
    }
}