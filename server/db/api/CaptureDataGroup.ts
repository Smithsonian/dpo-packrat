/* eslint-disable camelcase */
import { CaptureDataGroup as CaptureDataGroupBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class CaptureDataGroup extends DBC.DBObject<CaptureDataGroupBase> implements CaptureDataGroupBase {
    idCaptureDataGroup!: number;

    constructor(input: CaptureDataGroupBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            ({ idCaptureDataGroup: this.idCaptureDataGroup } = await DBC.DBConnection.prisma.captureDataGroup.create({ data: { } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.CaptureDataGroup.create', error);
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
            LOG.logger.error('DBAPI.CaptureDataGroup.update', error);
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
            LOG.logger.error('DBAPI.CaptureDataGroup.fetch', error);
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
            LOG.logger.error('DBAPI.CaptureDataGroup.fetchFromXref', error);
            return null;
        }
    }
}
