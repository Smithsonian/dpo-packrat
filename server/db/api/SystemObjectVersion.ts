/* eslint-disable camelcase */
import { SystemObjectVersion as SystemObjectVersionBase } from '@prisma/client';
import { ePublishedState } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class SystemObjectVersion extends DBC.DBObject<SystemObjectVersionBase> implements SystemObjectVersionBase {
    idSystemObjectVersion!: number;
    idSystemObject!: number;
    PublishedState!: number;

    constructor(input: SystemObjectVersionBase) {
        super(input);
    }

    public fetchTableName(): string { return 'SystemObjectVersion'; }
    public fetchID(): number { return this.idSystemObjectVersion; }

    public publishedStateEnum(): ePublishedState {
        switch (this.PublishedState) {
            case 1: return ePublishedState.eRestricted;
            case 2: return ePublishedState.eViewOnly;
            case 3: return ePublishedState.eViewDownloadRestriction;
            case 4: return ePublishedState.eViewDownloadCC0;
            default: return ePublishedState.eNotPublished;
        }
    }

    public setPublishedState(eState: ePublishedState): void {
        this.PublishedState = eState;
    }

    static constructFromPrisma(systemObjectVersion: SystemObjectVersionBase): SystemObjectVersion {
        return new SystemObjectVersion({
            idSystemObjectVersion: systemObjectVersion.idSystemObjectVersion,
            idSystemObject: systemObjectVersion.idSystemObject,
            PublishedState: systemObjectVersion.PublishedState
        });
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idSystemObject, PublishedState } = this;
            ({ idSystemObjectVersion: this.idSystemObjectVersion, idSystemObject: this.idSystemObject,
                PublishedState: this.PublishedState } =
                await DBC.DBConnection.prisma.systemObjectVersion.create({
                    data: {
                        SystemObject: { connect: { idSystemObject }, },
                        PublishedState,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersion.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idSystemObjectVersion, idSystemObject, PublishedState } = this;
            return await DBC.DBConnection.prisma.systemObjectVersion.update({
                where: { idSystemObjectVersion, },
                data: {
                    SystemObject: { connect: { idSystemObject }, },
                    PublishedState,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersion.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idSystemObjectVersion: number): Promise<SystemObjectVersion | null> {
        if (!idSystemObjectVersion)
            return null;
        try {
            return DBC.CopyObject<SystemObjectVersionBase, SystemObjectVersion>(
                await DBC.DBConnection.prisma.systemObjectVersion.findUnique({ where: { idSystemObjectVersion, }, }), SystemObjectVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersion.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<SystemObjectVersion[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<SystemObjectVersionBase, SystemObjectVersion>(
                await DBC.DBConnection.prisma.systemObjectVersion.findMany({ where: { idSystemObject } }), SystemObjectVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersion.fetchFromSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchLatestFromSystemObject(idSystemObject: number): Promise<SystemObjectVersion | null> {
        if (!idSystemObject)
            return null;
        try {
            const systemObjectVersions: SystemObjectVersionBase[] | null = // DBC.CopyArray<SystemObjectVersionBase, SystemObjectVersion>(
                await DBC.DBConnection.prisma.$queryRaw<SystemObjectVersionBase[]>`
                SELECT *
                FROM SystemObjectVersion
                WHERE idSystemObject = ${idSystemObject}
                  AND idSystemObjectVersion = (SELECT MAX(idSystemObjectVersion)
                                               FROM SystemObjectVersion
                                               WHERE idSystemObject = ${idSystemObject});`; //, SystemObjectVersion);
            /* istanbul ignore if */
            if (!systemObjectVersions || systemObjectVersions.length == 0)
                return null;
            const systemObjectVersion: SystemObjectVersionBase = systemObjectVersions[0];
            // Manually construct SystemObjectVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
            return SystemObjectVersion.constructFromPrisma(systemObjectVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersion.fetchLatestFromSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }
}
