/* eslint-disable camelcase */
import { Sentinel as SentinelBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class Sentinel extends DBC.DBObject<SentinelBase> implements SentinelBase {
    idSentinel!: number;
    URLBase!: string;
    ExpirationDate!: Date;
    idUser!: number;

    constructor(input: SentinelBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Sentinel'; }
    public fetchID(): number { return this.idSentinel; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { URLBase, ExpirationDate, idUser } = this;
            ({ idSentinel: this.idSentinel, URLBase: this.URLBase, ExpirationDate: this.ExpirationDate, idUser: this.idUser } =
                await DBC.DBConnection.prisma.sentinel.create({
                    data: {
                        URLBase,
                        ExpirationDate,
                        User: { connect: { idUser }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Sentinel');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idSentinel, URLBase, ExpirationDate, idUser } = this;
            return await DBC.DBConnection.prisma.sentinel.update({
                where: { idSentinel, },
                data: {
                    URLBase,
                    ExpirationDate,
                    User: { connect: { idUser }, },
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Sentinel');
            return  false;
        }
    }

    static async fetch(idSentinel: number): Promise<Sentinel | null> {
        if (!idSentinel)
            return null;
        try {
            return DBC.CopyObject<SentinelBase, Sentinel>(
                await DBC.DBConnection.prisma.sentinel.findUnique({ where: { idSentinel, }, }), Sentinel);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Sentinel');
            return null;
        }
    }

    static async fetchByURLBase(URLBase: string): Promise<Sentinel[] | null> {
        try {
            return DBC.CopyArray<SentinelBase, Sentinel>(
                await DBC.DBConnection.prisma.sentinel.findMany({ where: { URLBase, }, }), Sentinel);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch by URL base failed',H.Helpers.getErrorString(error),{ ...this },'DB.Sentinel');
            return null;
        }
    }
}
