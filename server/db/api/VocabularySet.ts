/* eslint-disable camelcase */
import { VocabularySet as VocabularySetBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class VocabularySet extends DBC.DBObject<VocabularySetBase> implements VocabularySetBase {
    idVocabularySet!: number;
    Name!: string;
    SystemMaintained!: boolean;

    constructor(input: VocabularySetBase) {
        super(input);
    }

    public fetchTableName(): string { return 'VocabularySet'; }
    public fetchID(): number { return this.idVocabularySet; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, SystemMaintained } = this;
            ({ idVocabularySet: this.idVocabularySet, Name: this.Name, SystemMaintained: this.SystemMaintained } =
                await DBC.DBConnection.prisma.vocabularySet.create({
                    data: {
                        Name,
                        SystemMaintained
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Vocabulary.Set');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idVocabularySet, Name, SystemMaintained } = this;
            return await DBC.DBConnection.prisma.vocabularySet.update({
                where: { idVocabularySet, },
                data: {
                    Name,
                    SystemMaintained
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Vocabulary.Set');
            return  false;
        }
    }

    static async fetch(idVocabularySet: number): Promise<VocabularySet | null> {
        if (!idVocabularySet)
            return null;
        try {
            return DBC.CopyObject<VocabularySetBase, VocabularySet>(
                await DBC.DBConnection.prisma.vocabularySet.findUnique({ where: { idVocabularySet, }, }), VocabularySet);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Vocabulary.Set');
            return null;
        }
    }

    static async fetchAll(): Promise<VocabularySet[] | null> {
        try {
            return DBC.CopyArray<VocabularySetBase, VocabularySet>(
                await DBC.DBConnection.prisma.vocabularySet.findMany(), VocabularySet);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all failed',H.Helpers.getErrorString(error),{ ...this },'DB.Vocabulary.Set');
            return null;
        }
    }
}
