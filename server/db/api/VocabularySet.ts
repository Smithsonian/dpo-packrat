/* eslint-disable camelcase */
import { PrismaClient, VocabularySet } from '@prisma/client';
import * as LOG from '../../utils/logger';

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

export async function fetchVocabularySet(prisma: PrismaClient, idVocabularySet: number): Promise<VocabularySet | null> {
    try {
        return await prisma.vocabularySet.findOne({ where: { idVocabularySet, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVocabularySet', error);
        return null;
    }
}
