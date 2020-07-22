/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Vocabulary as VocabularyBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Vocabulary extends DBC.DBObject<VocabularyBase> implements VocabularyBase {
    idVocabulary!: number;
    idVocabularySet!: number;
    SortOrder!: number;
    Term!: string;

    constructor(input: VocabularyBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idVocabularySet, SortOrder, Term } = this;
            ({ idVocabulary: this.idVocabulary, idVocabularySet: this.idVocabularySet, SortOrder: this.SortOrder, Term: this.Term } =
                await DBC.DBConnection.prisma.vocabulary.create({
                    data: {
                        VocabularySet: { connect: { idVocabularySet }, },
                        SortOrder,
                        Term
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
            const { idVocabulary, idVocabularySet, SortOrder, Term } = this;
            return await DBC.DBConnection.prisma.vocabulary.update({
                where: { idVocabulary, },
                data: {
                    VocabularySet: { connect: { idVocabularySet }, },
                    SortOrder,
                    Term
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
            return DBC.CopyObject<VocabularyBase, Vocabulary>(
                await DBC.DBConnection.prisma.vocabulary.findOne({ where: { idVocabulary, }, }), Vocabulary);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Vocabulary.fetch', error);
            return null;
        }
    }

    static async fetchFromVocabularySet(idVocabularySet: number): Promise<Vocabulary[] | null> {
        if (!idVocabularySet)
            return null;
        try {
            return DBC.CopyArray<VocabularyBase, Vocabulary>(
                await DBC.DBConnection.prisma.vocabulary.findMany({ where: { idVocabularySet } }), Vocabulary);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Vocabulary.fetchFromVocabularySet', error);
            return null;
        }
    }
}

