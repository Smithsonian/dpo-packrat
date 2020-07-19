/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { VocabularySet as VocabularySetBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class VocabularySet extends DBC.DBObject<VocabularySetBase> implements VocabularySetBase {
    idVocabularySet!: number;
    Name!: string;
    SystemMaintained!: boolean;

    constructor(input: VocabularySetBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, SystemMaintained } = this;
            ({ idVocabularySet: this.idVocabularySet, Name: this.Name, SystemMaintained: this.SystemMaintained } =
                await DBC.DBConnectionFactory.prisma.vocabularySet.create({
                    data: {
                        Name,
                        SystemMaintained
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.VocabularySet.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idVocabularySet, Name, SystemMaintained } = this;
            return await DBC.DBConnectionFactory.prisma.vocabularySet.update({
                where: { idVocabularySet, },
                data: {
                    Name,
                    SystemMaintained
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.VocabularySet.update', error);
            return false;
        }
    }

    static async fetch(idVocabularySet: number): Promise<VocabularySet | null> {
        if (!idVocabularySet)
            return null;
        try {
            return DBC.CopyObject<VocabularySetBase, VocabularySet>(
                await DBC.DBConnectionFactory.prisma.vocabularySet.findOne({ where: { idVocabularySet, }, }), VocabularySet);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.VocabularySet.fetch', error);
            return null;
        }
    }
}
