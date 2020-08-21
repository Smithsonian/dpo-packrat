/* eslint-disable camelcase */
import { AssetVersion as AssetVersionBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class AssetVersion extends DBC.DBObject<AssetVersionBase> implements AssetVersionBase {
    idAssetVersion!: number;
    idAsset!: number;
    idUserCreator!: number;
    DateCreated!: Date;
    StorageChecksum!: string;
    StorageSize!: number;
    Ingested!: boolean;
    Version!: number;

    constructor(input: AssetVersionBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    // TODO: replace two-step query with a call to AssetVersionCreate stored procedure
    // We likely need to engage Prisma for a fix, as well as write directly to the Node.js connector for MariaDB
    // until Prisma has fixed this issue.  https://mariadb.com/kb/en/getting-started-with-the-nodejs-connector/
    protected async createWorker(): Promise<boolean> {
        try {
            const { DateCreated, idAsset, idUserCreator, StorageChecksum, StorageSize, Ingested } = this;
            const nextVersion: number | null = await AssetVersion.computeNextVersionNumber(idAsset);

            ({ idAssetVersion: this.idAssetVersion, DateCreated: this.DateCreated, idAsset: this.idAsset,
                idUserCreator: this.idUserCreator, StorageChecksum: this.StorageChecksum,
                StorageSize: this.StorageSize, Ingested: this.Ingested, Version: this.Version } =
                await DBC.DBConnection.prisma.assetVersion.create({
                    data: {
                        Asset:              { connect: { idAsset }, },
                        User:               { connect: { idUser: idUserCreator }, },
                        DateCreated,
                        StorageChecksum,
                        StorageSize,
                        Ingested,
                        Version: nextVersion ? nextVersion : /* istanbul ignore next */ 1,
                        SystemObject:       { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.create', error);
            return false;
        }

        /*
         * NOT WORKING:
        try {
            const { idAsset, idUserCreator, DateCreated, StorageChecksum, StorageSize, Ingested } = this;
            const assetVersion: AssetVersion[] | null = DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`CALL AssetVersionCreate(${idAsset}, ${idUserCreator}, ${DateCreated}, ${StorageChecksum}, ${StorageSize}, ${Ingested})`, AssetVersion);
            if (assetVersion && assetVersion.length == 1) {
                this.idAssetVersion = assetVersion[0].idAssetVersion;
                this.Version = assetVersion[0].Version;
                return true;
            }
            return false;
        } catch (error) {
            LOG.logger.error('DBAPI.AssetVersion.create', error);
            return false;
        }
        */
    }

    // TODO: remove this abhorent method and approach once we can call stored procedures from createWorker
    static async computeNextVersionNumber(idAsset: number): Promise<number | null> {
        if (!idAsset)
            return null;
        try {
            const VersionInfo: [{ Version: number }] =
                await DBC.DBConnection.prisma.$queryRaw<[{ Version: number }]>`
                SELECT IFNULL(MAX(AV.Version), 0) + 1 AS 'Version'
                FROM AssetVersion AS AV
                WHERE AV.idAsset = ${idAsset};`;
            return (VersionInfo && VersionInfo.length > 0) ? VersionInfo[0].Version : /* istanbul ignore next */ null;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.computeNextVersionNumber', error);
            return null;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAssetVersion, DateCreated, idAsset, idUserCreator, StorageChecksum, StorageSize, Ingested, Version } = this;
            return await DBC.DBConnection.prisma.assetVersion.update({
                where: { idAssetVersion, },
                data: {
                    Asset:              { connect: { idAsset }, },
                    User:               { connect: { idUser: idUserCreator }, },
                    DateCreated,
                    StorageChecksum,
                    StorageSize,
                    Ingested,
                    Version,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idAssetVersion } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idAssetVersion, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idAssetVersion: number): Promise<AssetVersion | null> {
        if (!idAssetVersion)
            return null;
        try {
            return DBC.CopyObject<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findOne({ where: { idAssetVersion, }, }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.fetch', error);
            return null;
        }
    }

    static async fetchByAssetAndVersion(idAsset: number, Version: number): Promise<AssetVersion[] | null> {
        if (!idAsset)
            return null;
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany({ where: { idAsset, Version }, }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.fetch', error);
            return null;
        }
    }

    static async fetchFromAsset(idAsset: number): Promise<AssetVersion[] | null> {
        if (!idAsset)
            return null;
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany({ where: { idAsset } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.fetchFromAsset', error);
            return null;
        }
    }

    static async fetchLatestFromAsset(idAsset: number): Promise<AssetVersion | null> {
        if (!idAsset)
            return null;
        try {
            const assetVersions: AssetVersionBase[] | null = // DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`
                SELECT *
                FROM AssetVersion
                WHERE idAsset = ${idAsset}
                  AND VERSION = (SELECT MAX(VERSION)
                                 FROM AssetVersion
                                 WHERE idAsset = ${idAsset});`; //, AssetVersion);
            /* istanbul ignore if */
            if (!assetVersions || assetVersions.length == 0)
                return null;
            const assetVersion: AssetVersionBase = assetVersions[0];
            // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
            return new AssetVersion({
                idAssetVersion: assetVersion.idAssetVersion,
                idAsset: assetVersion.idAsset,
                idUserCreator: assetVersion.idUserCreator,
                DateCreated: new Date(assetVersion.DateCreated),
                StorageChecksum: assetVersion.StorageChecksum,
                StorageSize: assetVersion.StorageSize,
                Ingested: assetVersion.Ingested ? true : false,
                Version: assetVersion.Version
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetVersion.fetchLatestFromAsset', error);
            return null;
        }
    }

    static async fetchFromUser(idUserCreator: number): Promise<AssetVersion[] | null> {
        if (!idUserCreator)
            return null;
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany({ where: { idUserCreator } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetchFromUser', error);
            return null;
        }
    }

    static async fetchFromUserByIngested(idUserCreator: number, Ingested: boolean): Promise<AssetVersion[] | null> {
        if (!idUserCreator)
            return null;
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany({ where: { idUserCreator, Ingested } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetchFromUserByIngested', error);
            return null;
        }
    }

    static async fetchByIngested(Ingested: boolean): Promise<AssetVersion[] | null> {
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany({ where: { Ingested } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetchByIngested', error);
            return null;
        }
    }
}
