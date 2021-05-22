/* eslint-disable camelcase */
import { SystemObjectVersion as SystemObjectVersionBase } from '@prisma/client';
import { ePublishedState, SystemObjectVersionAssetVersionXref } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class SystemObjectVersion extends DBC.DBObject<SystemObjectVersionBase> implements SystemObjectVersionBase {
    idSystemObjectVersion!: number;
    idSystemObject!: number;
    PublishedState!: number;
    DateCreated!: Date;

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
            PublishedState: systemObjectVersion.PublishedState,
            DateCreated: systemObjectVersion.DateCreated
        });
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idSystemObject, PublishedState, DateCreated } = this;
            ({ idSystemObjectVersion: this.idSystemObjectVersion, idSystemObject: this.idSystemObject,
                PublishedState: this.PublishedState, DateCreated: this.DateCreated } =
                await DBC.DBConnection.prisma.systemObjectVersion.create({
                    data: {
                        SystemObject: { connect: { idSystemObject }, },
                        PublishedState,
                        DateCreated,
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
            const { idSystemObjectVersion, idSystemObject, PublishedState, DateCreated } = this;
            return await DBC.DBConnection.prisma.systemObjectVersion.update({
                where: { idSystemObjectVersion, },
                data: {
                    SystemObject: { connect: { idSystemObject }, },
                    PublishedState,
                    DateCreated,
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
                await DBC.DBConnection.prisma.systemObjectVersion.findMany({ where: { idSystemObject }, orderBy: { idSystemObjectVersion: 'asc' } }), SystemObjectVersion);
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
                WHERE idSystemObjectVersion = (SELECT MAX(idSystemObjectVersion)
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

    /** Clones the specified SystemObject's version. If idSystemObjectVersion is specified, we clone that specific record;
     * otherwise, we clone the latest SystemObjectVersion for idSystemObject.
     * We make copies of both the SystemObjectVersion and its related SystemObjectVersionAssetVersionXref records.
     * The published state of the clone is set to ePublishedState.eNotPublished. An optional assetVersionOverrideMap may
     * be supplied; this mapping from idAsset to idAssetVersion can be used to override the cloned xref records.
     * Returns the newly created SystemObjectVersion or null if failure */
    static async cloneObjectAndXrefs(idSystemObject: number, idSystemObjectVersion: number | null,
        assetVersionOverrideMap?: Map<number, number> | undefined): Promise<SystemObjectVersion | null> {
        if (!idSystemObject)
            return null;
        try {
            // fetch latest SystemObjectVerion's mapping of idAsset -> idAssetVersion
            const assetVersionMap: Map<number, number> | null = idSystemObjectVersion
                ? await SystemObjectVersionAssetVersionXref.fetchAssetVersionMap(idSystemObjectVersion)
                : await SystemObjectVersionAssetVersionXref.fetchLatestAssetVersionMap(idSystemObject); /* istanbul ignore next */
            if (!assetVersionMap) {
                LOG.error(`DBAPI.SystemObjectVersion.cloneObjectAndXrefs unable to fetch assetVersionMap from idSystemObject ${idSystemObject}, idSystemObjectVersion ${idSystemObjectVersion}`, LOG.LS.eDB);
                return null;
            }

            // create new SystemObjectVersion
            const SOV: SystemObjectVersion = new SystemObjectVersion({
                idSystemObjectVersion: 0,
                idSystemObject,
                PublishedState: ePublishedState.eNotPublished,
                DateCreated: new Date()
            }); /* istanbul ignore next */

            if (!await SOV.create()) {
                LOG.error(`DBAPI.SystemObjectVersion.cloneObjectAndXrefs failed to create new SystemObjectVersion for ${idSystemObject}`, LOG.LS.eDB);
                return null;
            }

            // apply overrides, specifying asset versions for specific assets
            if (assetVersionOverrideMap) {
                for (const [idAsset, idAssetVersion] of assetVersionOverrideMap)
                    assetVersionMap.set(idAsset, idAssetVersion);
            }

            // Create new xref records for these asset versions:
            let success: boolean = true;
            for (const idAssetVersion of assetVersionMap.values()) {
                const SOVAVX: SystemObjectVersionAssetVersionXref = new SystemObjectVersionAssetVersionXref({
                    idSystemObjectVersionAssetVersionXref: 0,
                    idSystemObjectVersion: SOV.idSystemObjectVersion,
                    idAssetVersion
                });
                success = await SOVAVX.create() && success;
            } /* istanbul ignore next */

            if (!success) {
                LOG.error(`DBAPI.SystemObjectVersion.cloneObjectAndXrefs failed to create all SystemObjectVersionAssetVersionXref's for ${JSON.stringify(SOV)}`, LOG.LS.eDB);
                return null;
            }
            return SOV;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersion.cloneObjectAndXrefs', LOG.LS.eDB, error);
            return null;
        }
    }
}
