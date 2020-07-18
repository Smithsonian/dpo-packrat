/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { SystemObjectVersion as SystemObjectVersionBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class SystemObjectVersion extends DBC.DBObject<SystemObjectVersionBase> implements SystemObjectVersionBase {
    idSystemObjectVersion!: number;
    idSystemObject!: number;
    PublishedState!: number;

    constructor(input: SystemObjectVersionBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idSystemObject, PublishedState } = this;
            ({ idSystemObjectVersion: this.idSystemObjectVersion, idSystemObject: this.idSystemObject,
                PublishedState: this.PublishedState } =
                await DBC.DBConnectionFactory.prisma.systemObjectVersion.create({
                    data: {
                        SystemObject: { connect: { idSystemObject }, },
                        PublishedState,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectVersion.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idSystemObjectVersion, idSystemObject, PublishedState } = this;
            return await DBC.DBConnectionFactory.prisma.systemObjectVersion.update({
                where: { idSystemObjectVersion, },
                data: {
                    SystemObject: { connect: { idSystemObject }, },
                    PublishedState,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectVersion.update', error);
            return false;
        }
    }

    static async fetch(idSystemObjectVersion: number): Promise<SystemObjectVersion | null> {
        if (!idSystemObjectVersion)
            return null;
        try {
            return DBC.CopyObject<SystemObjectVersionBase, SystemObjectVersion>(
                await DBC.DBConnectionFactory.prisma.systemObjectVersion.findOne({ where: { idSystemObjectVersion, }, }), SystemObjectVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectVersion.fetch', error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<SystemObjectVersion[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<SystemObjectVersionBase, SystemObjectVersion>(
                await DBC.DBConnectionFactory.prisma.systemObjectVersion.findMany({ where: { idSystemObject } }), SystemObjectVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.SystemObjectVersion.fetchFromSystemObject', error);
            return null;
        }
    }
}
