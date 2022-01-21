/* eslint-disable camelcase */
import { PrismaClient, SystemObjectVersion as SystemObjectVersionBase } from '@prisma/client';
import { SystemObjectVersionAssetVersionXref } from '..';
import * as COMMON from '../../../client/src/types/server';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
// import * as H from '../../utils/helpers';

export class SystemObjectVersion extends DBC.DBObject<SystemObjectVersionBase> implements SystemObjectVersionBase {
    idSystemObjectVersion!: number;
    idSystemObject!: number;
    PublishedState!: number;
    DateCreated!: Date;
    Comment!: string | null;

    constructor(input: SystemObjectVersionBase) {
        super(input);
    }

    public fetchTableName(): string { return 'SystemObjectVersion'; }
    public fetchID(): number { return this.idSystemObjectVersion; }

    public publishedStateEnum(): COMMON.ePublishedState {
        switch (this.PublishedState) {
            case 1: return COMMON.ePublishedState.eAPIOnly;
            case 2: return COMMON.ePublishedState.ePublished;
            default: return COMMON.ePublishedState.eNotPublished;
        }
    }

    public setPublishedState(eState: COMMON.ePublishedState): void {
        this.PublishedState = eState;
    }

    static constructFromPrisma(systemObjectVersion: SystemObjectVersionBase): SystemObjectVersion {
        return new SystemObjectVersion({
            idSystemObjectVersion: systemObjectVersion.idSystemObjectVersion,
            idSystemObject: systemObjectVersion.idSystemObject,
            PublishedState: systemObjectVersion.PublishedState,
            DateCreated: systemObjectVersion.DateCreated,
            Comment: systemObjectVersion.Comment
        });
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idSystemObject, PublishedState, DateCreated, Comment } = this;
            ({ idSystemObjectVersion: this.idSystemObjectVersion, idSystemObject: this.idSystemObject,
                PublishedState: this.PublishedState, DateCreated: this.DateCreated, Comment: this.Comment } =
                await DBC.DBConnection.prisma.systemObjectVersion.create({
                    data: {
                        SystemObject: { connect: { idSystemObject }, },
                        PublishedState,
                        DateCreated,
                        Comment
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
            const { idSystemObjectVersion, idSystemObject, PublishedState, DateCreated, Comment } = this;
            return await DBC.DBConnection.prisma.systemObjectVersion.update({
                where: { idSystemObjectVersion, },
                data: {
                    SystemObject: { connect: { idSystemObject }, },
                    PublishedState,
                    DateCreated,
                    Comment,
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
            if (!systemObjectVersions || systemObjectVersions.length === 0)
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
     * We make a copy of the SystemObjectVersion, and if !assetsUnzipped, its related SystemObjectVersionAssetVersionXref records.
     * The published state of the clone is set to COMMON.ePublishedState.eNotPublished. An optional assetVersionOverrideMap may
     * be supplied; this mapping from idAsset to idAssetVersion can be used to override the cloned xref records.
     * Returns the newly created SystemObjectVersion or null if failure */
    static async cloneObjectAndXrefs(idSystemObject: number, idSystemObjectVersion: number | null, Comment: string | null,
        assetVersionOverrideMap?: Map<number, number> | undefined, assetsUnzipped?: boolean | undefined): Promise<SystemObjectVersion | null> {
        if (!idSystemObject)
            return null;
        try {
            const prismaClient: PrismaClient | DBC.PrismaClientTrans = DBC.DBConnection.prisma;
            // if our current prisma client does not have the $transaction method, then we're in a transaction already, so just do the work
            /* istanbul ignore next */
            if (!DBC.DBConnection.isFullPrismaClient(prismaClient))
                return SystemObjectVersion.cloneObjectAndXrefsTrans(idSystemObject, idSystemObjectVersion, Comment, assetVersionOverrideMap, assetsUnzipped);

            // otherwise, start a new transaction:
            // LOG.info('DBAPI.SystemObjectVersion.cloneObjectAndXrefs starting a new DB transaction', LOG.LS.eDB);
            return await prismaClient.$transaction(async (prisma) => {
                const transactionNumber: number = await DBC.DBConnection.setPrismaTransaction(prisma);
                const retValue: SystemObjectVersion | null = await SystemObjectVersion.cloneObjectAndXrefsTrans(idSystemObject, idSystemObjectVersion, Comment, assetVersionOverrideMap, assetsUnzipped);
                DBC.DBConnection.clearPrismaTransaction(transactionNumber);
                return retValue;
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersion.cloneObjectAndXrefs', LOG.LS.eDB, error);
            return null;
        }
    }

    private static async cloneObjectAndXrefsTrans(idSystemObject: number, idSystemObjectVersion: number | null,
        Comment: string | null, assetVersionOverrideMap?: Map<number, number> | undefined, assetsUnzipped?: boolean | undefined): Promise<SystemObjectVersion | null> {
        try {
            // LOG.info(`DBAPI.SystemObjectVersion.cloneObjectAndXrefsTrans(${idSystemObject}, ${idSystemObjectVersion}, ${JSON.stringify(assetVersionOverrideMap, H.Helpers.saferStringify)})`, LOG.LS.eDB);
            // fetch latest SystemObjectVerion's mapping of idAsset -> idAssetVersion
            let assetVersionMap: Map<number, number> | null = null;
            if (idSystemObjectVersion)
                assetVersionMap = await SystemObjectVersionAssetVersionXref.fetchAssetVersionMap(idSystemObjectVersion);
            else if (!assetsUnzipped)
                assetVersionMap = await SystemObjectVersionAssetVersionXref.fetchLatestAssetVersionMap(idSystemObject); /* istanbul ignore next */
            else // unzipped assets -- don't use old asset versions; the unzipped assets will be our full set of assets
                assetVersionMap = new Map<number, number>();

            /* istanbul ignore next */
            if (!assetVersionMap) {
                LOG.error(`DBAPI.SystemObjectVersion.cloneObjectAndXrefsTrans unable to fetch assetVersionMap from idSystemObject ${idSystemObject}, idSystemObjectVersion ${idSystemObjectVersion}`, LOG.LS.eDB);
                return null;
            }

            // create new SystemObjectVersion
            const SOV: SystemObjectVersion = new SystemObjectVersion({
                idSystemObjectVersion: 0,
                idSystemObject,
                PublishedState: COMMON.ePublishedState.eNotPublished,
                DateCreated: new Date(),
                Comment
            }); /* istanbul ignore next */

            if (!await SOV.create()) {
                LOG.error(`DBAPI.SystemObjectVersion.cloneObjectAndXrefsTrans failed to create new SystemObjectVersion for ${idSystemObject}`, LOG.LS.eDB);
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
                // LOG.info(`DBAPI.SystemObjectVersion.cloneObjectAndXrefsTrans(${idSystemObject}, ${idSystemObjectVersion}) created ${JSON.stringify(SOVAVX, H.Helpers.saferStringify)})`, LOG.LS.eDB);
            } /* istanbul ignore next */

            if (!success) {
                LOG.error(`DBAPI.SystemObjectVersion.cloneObjectAndXrefsTrans failed to create all SystemObjectVersionAssetVersionXref's for ${JSON.stringify(SOV)}`, LOG.LS.eDB);
                return null;
            }
            return SOV;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersion.cloneObjectAndXrefsTrans', LOG.LS.eDB, error);
            return null;
        }
    }
}
