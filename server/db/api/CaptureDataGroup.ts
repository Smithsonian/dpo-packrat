/* eslint-disable camelcase */
import { CaptureDataGroup as CaptureDataGroupBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class CaptureDataGroup extends DBO.DBObject<CaptureDataGroupBase> implements CaptureDataGroupBase {
    idCaptureDataGroup!: number;

    constructor(input: CaptureDataGroupBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            ({ idCaptureDataGroup: this.idCaptureDataGroup } = await DBConnectionFactory.prisma.captureDataGroup.create({ data: { } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataGroup.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idCaptureDataGroup } = this;
            return await DBConnectionFactory.prisma.captureDataGroup.update({
                where: { idCaptureDataGroup, },
                data: { },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataGroup.update', error);
            return false;
        }
    }

    static async fetch(idCaptureDataGroup: number): Promise<CaptureDataGroup | null> {
        if (!idCaptureDataGroup)
            return null;
        try {
            return DBO.CopyObject<CaptureDataGroupBase, CaptureDataGroup>(
                await DBConnectionFactory.prisma.captureDataGroup.findOne({ where: { idCaptureDataGroup, }, }), CaptureDataGroup);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataGroup.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idCaptureData: number): Promise<CaptureDataGroup[] | null> {
        if (!idCaptureData)
            return null;
        try {
            return DBO.CopyArray<CaptureDataGroupBase, CaptureDataGroup>(
                await DBConnectionFactory.prisma.captureDataGroup.findMany({
                    where: {
                        CaptureDataGroupCaptureDataXref: {
                            some: { idCaptureData },
                        },
                    },
                }), CaptureDataGroup);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataGroup.fetchFromXref', error);
            return null;
        }
    }
}
