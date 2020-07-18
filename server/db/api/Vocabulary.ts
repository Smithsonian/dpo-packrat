/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
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

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
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
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Vocabulary.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idVocabulary, idVocabularySet, SortOrder } = this;
            return await DBConnectionFactory.prisma.vocabulary.update({
                where: { idVocabulary, },
                data: {
                    VocabularySet: { connect: { idVocabularySet }, },
                    SortOrder
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Vocabulary.update', error);
            return false;
        }
    }

    static async fetch(idVocabulary: number): Promise<Vocabulary | null> {
        if (!idVocabulary)
            return null;
        try {
            return DBO.CopyObject<VocabularyBase, Vocabulary>(
                await DBConnectionFactory.prisma.vocabulary.findOne({ where: { idVocabulary, }, }), Vocabulary);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Vocabulary.fetch', error);
            return null;
        }
    }

    static async fetchFromVocabularySet(idVocabularySet: number): Promise<Vocabulary[] | null> {
        if (!idVocabularySet)
            return null;
        try {
            return DBO.CopyArray<VocabularyBase, Vocabulary>(
                await DBConnectionFactory.prisma.vocabulary.findMany({ where: { idVocabularySet } }), Vocabulary);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Vocabulary.fetchFromVocabularySet', error);
            return null;
        }
    }
}

