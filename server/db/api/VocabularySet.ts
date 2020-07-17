/* eslint-disable camelcase */
import { VocabularySet as VocabularySetBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class VocabularySet extends DBO.DBObject<VocabularySetBase> implements VocabularySetBase {
    idVocabularySet!: number;
    Name!: string;
    SystemMaintained!: boolean;

    constructor(input: VocabularySetBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { Name, SystemMaintained } = this;
            ({ idVocabularySet: this.idVocabularySet, Name: this.Name, SystemMaintained: this.SystemMaintained } =
                await DBConnectionFactory.prisma.vocabularySet.create({
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

    async update(): Promise<boolean> {
        try {
            const { idVocabularySet, Name, SystemMaintained } = this;
            return await DBConnectionFactory.prisma.vocabularySet.update({
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
            return DBO.CopyObject<VocabularySetBase, VocabularySet>(
                await DBConnectionFactory.prisma.vocabularySet.findOne({ where: { idVocabularySet, }, }), VocabularySet);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.VocabularySet.fetch', error);
            return null;
        }
    }
}
