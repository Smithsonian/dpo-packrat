/* eslint-disable camelcase */
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

    async create(): Promise<boolean> {
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
        } catch (error) {
            LOG.logger.error('DBAPI.CaptureDataGroupCaptureDataXref.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idCaptureDataGroupCaptureDataXref, idCaptureData, idCaptureDataGroup } = this;
            return await DBConnectionFactory.prisma.captureDataGroupCaptureDataXref.update({
                where: { idCaptureDataGroupCaptureDataXref, },
                data: {
                    CaptureDataGroup:   { connect: { idCaptureDataGroup }, },
                    CaptureData:        { connect: { idCaptureData }, }
                },
            }) ? true : false;
        } catch (error) {
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
        } catch (error) {
            LOG.logger.error('DBAPI.CaptureDataGroupCaptureDataXref.fetch', error);
            return null;
        }
    }
}
