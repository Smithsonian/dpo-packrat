/* eslint-disable camelcase */
import * as PRISMA from '@prisma/client';
import * as LOG from '../../utils/logger';

// declare module 'PRISMA' {
// export interface Vocabulary {
//     create(prisma: PRISMA.PrismaClient, vocabulary: PRISMA.Vocabulary): Promise<PRISMA.Vocabulary | null>;
//     fetch(prisma: PRISMA.PrismaClient, idVocabulary: number): Promise<PRISMA.Vocabulary | null>;
// }
// }

export class Vocabulary implements PRISMA.Vocabulary {
    idVocabulary: number = 0;
    idVocabularySet: number = 0;
    SortOrder: number = 0;

    static async create(prisma: PRISMA.PrismaClient, vocabulary: PRISMA.Vocabulary): Promise<PRISMA.Vocabulary | null> {
        let createSystemObject: PRISMA.Vocabulary;
        const { idVocabularySet, SortOrder } = vocabulary;
        try {
            createSystemObject = await prisma.vocabulary.create({
                data: {
                    VocabularySet: { connect: { idVocabularySet }, },
                    SortOrder
                },
            });
        } catch (error) {
            LOG.logger.error('DBAPI.Vocabulary.create', error);
            return null;
        }
        return createSystemObject;
    }

    static async fetch(prisma: PRISMA.PrismaClient, idVocabulary: number): Promise<PRISMA.Vocabulary | null> {
        try {
            return await prisma.vocabulary.findOne({ where: { idVocabulary, }, });
        } catch (error) {
            LOG.logger.error('DBAPI.Vocabulary.fetch', error);
            return null;
        }
    }
}