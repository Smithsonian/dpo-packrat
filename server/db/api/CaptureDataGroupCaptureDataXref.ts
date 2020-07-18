/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { CaptureDataGroupCaptureDataXref as CaptureDataGroupCaptureDataXrefBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class CaptureDataGroupCaptureDataXref extends DBO.DBObject<CaptureDataGroupCaptureDataXrefBase> implements CaptureDataGroupCaptureDataXrefBase {
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
                await DBConnectionFactory.prisma.captureDataGroupCaptureDataXref.create({
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
            return await DBConnectionFactory.prisma.captureDataGroupCaptureDataXref.update({
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
            return DBO.CopyObject<CaptureDataGroupCaptureDataXrefBase, CaptureDataGroupCaptureDataXref>(
                await DBConnectionFactory.prisma.captureDataGroupCaptureDataXref.findOne({ where: { idCaptureDataGroupCaptureDataXref, }, }),
                CaptureDataGroupCaptureDataXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataGroupCaptureDataXref.fetch', error);
            return null;
        }
    }
}
