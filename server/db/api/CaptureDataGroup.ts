/* eslint-disable camelcase */
import { CaptureDataGroup as CaptureDataGroupBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class CaptureDataGroup extends DBC.DBObject<CaptureDataGroupBase> implements CaptureDataGroupBase {
    idCaptureDataGroup!: number;

    constructor(input: CaptureDataGroupBase) {
        super(input);
    }

    public fetchTableName(): string { return 'CaptureDataGroup'; }
    public fetchID(): number { return this.idCaptureDataGroup; }

    protected async createWorker(): Promise<boolean> {
        try {
            ({ idCaptureDataGroup: this.idCaptureDataGroup } = await DBC.DBConnection.prisma.captureDataGroup.create({ data: { } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData.Group');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCaptureDataGroup } = this;
            return await DBC.DBConnection.prisma.captureDataGroup.update({
                where: { idCaptureDataGroup, },
                data: { },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData.Group');
            return false;
        }
    }

    static async fetch(idCaptureDataGroup: number): Promise<CaptureDataGroup | null> {
        if (!idCaptureDataGroup)
            return null;
        try {
            return DBC.CopyObject<CaptureDataGroupBase, CaptureDataGroup>(
                await DBC.DBConnection.prisma.captureDataGroup.findUnique({ where: { idCaptureDataGroup, }, }), CaptureDataGroup);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData.Group');
            return null;
        }
    }

    static async fetchFromXref(idCaptureData: number): Promise<CaptureDataGroup[] | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBC.CopyArray<CaptureDataGroupBase, CaptureDataGroup>(
                await DBC.DBConnection.prisma.captureDataGroup.findMany({
                    where: {
                        CaptureDataGroupCaptureDataXref: {
                            some: { idCaptureData },
                        },
                    },
                }), CaptureDataGroup);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from xref failed',H.Helpers.getErrorString(error),{ ...this },'DB.CaptureData.Group');
            return null;
        }
    }
}
