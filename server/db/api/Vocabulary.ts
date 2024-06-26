/* eslint-disable camelcase */
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

    public fetchTableName(): string { return 'Vocabulary'; }
    public fetchID(): number { return this.idVocabulary; }

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
            return this.logError('create', error);
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
            return this.logError('update', error);
        }
    }

    static async fetch(idVocabulary: number): Promise<Vocabulary | null> {
        if (!idVocabulary)
            return null;
        try {
            return DBC.CopyObject<VocabularyBase, Vocabulary>(
                await DBC.DBConnection.prisma.vocabulary.findUnique({ where: { idVocabulary, }, }), Vocabulary);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Vocabulary.fetch', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Vocabulary.fetchFromVocabularySet', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Vocabulary[] | null> {
        try {
            return DBC.CopyArray<VocabularyBase, Vocabulary>(
                await DBC.DBConnection.prisma.vocabulary.findMany(), Vocabulary);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Vocabulary.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }
}

