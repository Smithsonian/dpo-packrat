/* eslint-disable camelcase */
import { SystemObjectVersionAssetVersionXref as SystemObjectVersionAssetVersionXrefBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class SystemObjectVersionAssetVersionXref extends DBC.DBObject<SystemObjectVersionAssetVersionXrefBase> implements SystemObjectVersionAssetVersionXrefBase {
    idSystemObjectVersionAssetVersionXref!: number;
    idSystemObjectVersion!: number;
    idAssetVersion!: number;

    constructor(input: SystemObjectVersionAssetVersionXrefBase) {
        super(input);
    }

    public fetchTableName(): string { return 'SystemObjectVersionAssetVersionXref'; }
    public fetchID(): number { return this.idSystemObjectVersionAssetVersionXref; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idSystemObjectVersion, idAssetVersion } = this;
            ({ idSystemObjectVersionAssetVersionXref: this.idSystemObjectVersionAssetVersionXref,
                idSystemObjectVersion: this.idSystemObjectVersion, idAssetVersion: this.idAssetVersion } =
                await DBC.DBConnection.prisma.systemObjectVersionAssetVersionXref.create({
                    data: {
                        SystemObjectVersion: { connect: { idSystemObjectVersion }, },
                        AssetVersion: { connect: { idAssetVersion }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersionAssetVersionXref.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idSystemObjectVersionAssetVersionXref, idSystemObjectVersion, idAssetVersion } = this;
            return await DBC.DBConnection.prisma.systemObjectVersionAssetVersionXref.update({
                where: { idSystemObjectVersionAssetVersionXref, },
                data: {
                    SystemObjectVersion: { connect: { idSystemObjectVersion }, },
                    AssetVersion: { connect: { idAssetVersion }, },
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersionAssetVersionXref.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idSystemObjectVersionAssetVersionXref: number): Promise<SystemObjectVersionAssetVersionXref | null> {
        if (!idSystemObjectVersionAssetVersionXref)
            return null;
        try {
            return DBC.CopyObject<SystemObjectVersionAssetVersionXrefBase, SystemObjectVersionAssetVersionXref>(
                await DBC.DBConnection.prisma.systemObjectVersionAssetVersionXref.findUnique({ where: { idSystemObjectVersionAssetVersionXref, }, }), SystemObjectVersionAssetVersionXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersionAssetVersionXref.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSystemObjectVersion(idSystemObjectVersion: number): Promise<SystemObjectVersionAssetVersionXref[] | null> {
        if (!idSystemObjectVersion)
            return null;
        try {
            return DBC.CopyArray<SystemObjectVersionAssetVersionXrefBase, SystemObjectVersionAssetVersionXref>(
                await DBC.DBConnection.prisma.systemObjectVersionAssetVersionXref.findMany({ where: { idSystemObjectVersion } }), SystemObjectVersionAssetVersionXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersionAssetVersionXref.fetchFromSystemObjectVersion', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromAssetVersion(idAssetVersion: number): Promise<SystemObjectVersionAssetVersionXref[] | null> {
        if (!idAssetVersion)
            return null;
        try {
            return DBC.CopyArray<SystemObjectVersionAssetVersionXrefBase, SystemObjectVersionAssetVersionXref>(
                await DBC.DBConnection.prisma.systemObjectVersionAssetVersionXref.findMany({ where: { idAssetVersion } }), SystemObjectVersionAssetVersionXref);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersionAssetVersionXref.fetchFromAssetVersion', LOG.LS.eDB, error);
            return null;
        }
    }

    /** Computes the map of idAsset -> idAssetVersion for the specified idSystemObjectVersion */
    static async fetchAssetVersionMap(idSystemObjectVersion: number): Promise<Map<number, number> | null> {
        LOG.info(`DBAPI.SystemObjectVersionAssetVersionXref.fetchAssetVersionMap(${idSystemObjectVersion})`, LOG.LS.eDB);
        if (!idSystemObjectVersion)
            return null;
        try {
            const versions: { idAsset: number, idAssetVersion: number }[] | null =
                await DBC.DBConnection.prisma.$queryRaw<{ idAsset: number, idAssetVersion: number }[]>`
                SELECT AV.idAsset AS 'idAsset', MAX(AV.idAssetVersion) AS 'idAssetVersion'
                FROM SystemObjectVersionAssetVersionXref AS SOX
                JOIN AssetVersion AS AV ON (SOX.idAssetVersion = AV.idAssetVersion)
                WHERE SOX.idSystemObjectVersion = ${idSystemObjectVersion}
                GROUP BY AV.idAsset`; //, SystemObjectVersion);
            /* istanbul ignore if */
            if (!versions)
                return null;

            const assetVersionMap: Map<number, number> = new Map<number, number>(); // map from idAsset -> idAssetVersion
            for (const assetPair of versions)
                assetVersionMap.set(assetPair.idAsset, assetPair.idAssetVersion);
            // LOG.info(`DBAPI.SystemObjectVersionAssetVersionXref.fetchAssetVersionMap(${idSystemObjectVersion}) = ${JSON.stringify(versions)} -> ${JSON.stringify(assetVersionMap, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eDB);
            return assetVersionMap;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersionAssetVersionXref.fetchAssetVersionMap', LOG.LS.eDB, error);
            return null;
        }
    }

    /** Computes the map of idAsset -> idAssetVersion for the most recent system object version for the specified idSystemObject */
    static async fetchLatestAssetVersionMap(idSystemObject: number): Promise<Map<number, number> | null> {
        LOG.info(`DBAPI.SystemObjectVersionAssetVersionXref.fetchLatestAssetVersionMap(${idSystemObject})`, LOG.LS.eDB);
        if (!idSystemObject)
            return null;
        try {
            const versions: { idAsset: number, idAssetVersion: number }[] | null =
                await DBC.DBConnection.prisma.$queryRaw<{ idAsset: number, idAssetVersion: number }[]>`
                SELECT AV.idAsset AS 'idAsset', MAX(AV.idAssetVersion) AS 'idAssetVersion'
                FROM SystemObjectVersionAssetVersionXref AS SOX
                JOIN AssetVersion AS AV ON (SOX.idAssetVersion = AV.idAssetVersion)
                WHERE SOX.idSystemObjectVersion = (SELECT MAX(idSystemObjectVersion)
                                                   FROM SystemObjectVersion
                                                   WHERE idSystemObject = ${idSystemObject})
                GROUP BY AV.idAsset`; //, SystemObjectVersion);
            /* istanbul ignore if */
            if (!versions)
                return null;

            const assetVersionMap: Map<number, number> = new Map<number, number>(); // map from idAsset -> idAssetVersion
            for (const assetPair of versions)
                assetVersionMap.set(assetPair.idAsset, assetPair.idAssetVersion);
            // LOG.info(`DBAPI.SystemObjectVersionAssetVersionXref.fetchLatestAssetVersionMap(${idSystemObject}) = ${JSON.stringify(versions)} -> ${JSON.stringify(assetVersionMap, H.Helpers.stringifyMapsAndBigints)}`, LOG.LS.eDB);
            return assetVersionMap;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.SystemObjectVersionAssetVersionXref.fetchLatestAssetVersionMap', LOG.LS.eDB, error);
            return null;
        }
    }
}
