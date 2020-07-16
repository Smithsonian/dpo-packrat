/* eslint-disable camelcase */
import { Vocabulary as VocabularyBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Vocabulary extends DBO.DBObject<VocabularyBase> implements VocabularyBase {
    idVocabulary!: number;
    idVocabularySet!: number;
    SortOrder!: number;

    constructor(input: VocabularyBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idVocabularySet, SortOrder } = this;
            ({ idVocabulary: this.idVocabulary, idVocabularySet: this.idVocabularySet, SortOrder: this.SortOrder } =
                await DBConnectionFactory.prisma.vocabulary.create({
                    data: {
                        VocabularySet: { connect: { idVocabularySet }, },
                        SortOrder
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.Vocabulary.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idVocabulary, idVocabularySet, SortOrder } = this;
            return await DBConnectionFactory.prisma.vocabulary.update({
                where: { idVocabulary, },
                data: {
                    VocabularySet: { connect: { idVocabularySet }, },
                    SortOrder
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.Vocabulary.update', error);
            return false;
        }
    }

    static async fetch(idVocabulary: number): Promise<Vocabulary | null> {
        try {
            return DBO.CopyObject<VocabularyBase, Vocabulary>(
                await DBConnectionFactory.prisma.vocabulary.findOne({ where: { idVocabulary, }, }), Vocabulary);
        } catch (error) {
            LOG.logger.error('DBAPI.Vocabulary.fetch', error);
            return null;
        }
    }

    static async fetchFromVocabularySet(idVocabularySet: number): Promise<Vocabulary[] | null> {
        try {
            return DBO.CopyArray<VocabularyBase, Vocabulary>(
                await DBConnectionFactory.prisma.vocabulary.findMany({ where: { idVocabularySet } }), Vocabulary);
        } catch (error) {
            LOG.logger.error('DBAPI.Vocabulary.fetchFromVocabularySet', error);
            return null;
        }
    }
}

