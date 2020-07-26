/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { CaptureDataGroupCaptureDataXref as CaptureDataGroupCaptureDataXrefBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class CaptureDataGroupCaptureDataXref extends DBC.DBObject<CaptureDataGroupCaptureDataXrefBase> implements CaptureDataGroupCaptureDataXrefBase {
    idCaptureDataGroupCaptureDataXref!: number;
    idCaptureData!: number;
    idCaptureDataGroup!: number;

    constructor(input: CaptureDataGroupCaptureDataXrefBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idCaptureData, idCaptureDataGroup } = this;
            ({ idCaptureDataGroupCaptureDataXref: this.idCaptureDataGroupCaptureDataXref, idCaptureData: this.idCaptureData,
                idCaptureDataGroup: this.idCaptureDataGroup } =
                await DBC.DBConnection.prisma.captureDataGroupCaptureDataXref.create({
                    data: {
                        CaptureDataGroup:   { connect: { idCaptureDataGroup }, },
                        CaptureData:        { connect: { idCaptureData }, }
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataGroupCaptureDataXref.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idCaptureDataGroupCaptureDataXref, idCaptureData, idCaptureDataGroup } = this;
            return await DBC.DBConnection.prisma.captureDataGroupCaptureDataXref.update({
                where: { idCaptureDataGroupCaptureDataXref, },
                data: {
                    CaptureDataGroup:   { connect: { idCaptureDataGroup }, },
                    CaptureData:        { connect: { idCaptureData }, }
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataGroupCaptureDataXref.update', error);
            return false;
        }
    }

    static async fetch(idCaptureDataGroupCaptureDataXref: number): Promise<CaptureDataGroupCaptureDataXref | null> {
        if (!idCaptureDataGroupCaptureDataXref)
            return null;
        try {
            return DBC.CopyObject<CaptureDataGroupCaptureDataXrefBase, CaptureDataGroupCaptureDataXref>(
                await DBC.DBConnection.prisma.captureDataGroupCaptureDataXref.findOne({ where: { idCaptureDataGroupCaptureDataXref, }, }),
                CaptureDataGroupCaptureDataXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataGroupCaptureDataXref.fetch', error);
            return null;
        }
    }
}
