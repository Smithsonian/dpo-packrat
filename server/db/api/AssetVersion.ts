/* eslint-disable camelcase */
import { AssetVersion as AssetVersionBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class AssetVersion extends DBC.DBObject<AssetVersionBase> implements AssetVersionBase, SystemObjectBased {
    idAssetVersion!: number;
    idAsset!: number;
    Version!: number;
    FileName!: string;
    idUserCreator!: number;
    DateCreated!: Date;
    StorageHash!: string;
    StorageSize!: bigint;
    StorageKeyStaging!: string;
    Ingested!: boolean | null;  // null means uploaded, not processed; false means uploaded and processed, true means uploaded, processed, and ingested
    BulkIngest!: boolean;

    constructor(input: AssetVersionBase) {
        super(input);
    }

    public fetchTableName(): string { return 'AssetVersion'; }
    public fetchID(): number { return this.idAssetVersion; }

    static constructFromPrisma(assetVersion: AssetVersionBase): AssetVersion {
        return new AssetVersion({
            idAssetVersion: assetVersion.idAssetVersion,
            idAsset: assetVersion.idAsset,
            FileName: assetVersion.FileName,
            idUserCreator: assetVersion.idUserCreator,
            DateCreated: new Date(assetVersion.DateCreated),
            StorageHash: assetVersion.StorageHash,
            StorageSize: BigInt(assetVersion.StorageSize),
            StorageKeyStaging: assetVersion.StorageKeyStaging,
            Ingested: (assetVersion.Ingested === null) ? null : (assetVersion.Ingested ? true : false), // we're expecting Prisma to send values like null, 0, and 1
            BulkIngest: assetVersion.BulkIngest ? true : false,
            Version: assetVersion.Version
        });
    }

    // TODO: replace two-step query with a call to AssetVersionCreate stored procedure
    // We likely need to engage Prisma for a fix, as well as write directly to the Node.js connector for MariaDB
    // until Prisma has fixed this issue.  https://mariadb.com/kb/en/getting-started-with-the-nodejs-connector/
    protected async createWorker(): Promise<boolean> {
        try {
            const { DateCreated, idAsset, FileName, idUserCreator, StorageHash, StorageSize, StorageKeyStaging, Ingested, BulkIngest } = this;
            const nextVersion: number | null = await AssetVersion.computeNextVersionNumber(idAsset);

            ({ idAssetVersion: this.idAssetVersion, DateCreated: this.DateCreated, idAsset: this.idAsset,
                FileName: this.FileName, idUserCreator: this.idUserCreator, StorageHash: this.StorageHash, StorageSize: this.StorageSize,
                StorageKeyStaging: this.StorageKeyStaging, Ingested: this.Ingested, BulkIngest: this.BulkIngest, Version: this.Version } =
                await DBC.DBConnection.prisma.assetVersion.create({
                    data: {
                        Asset:              { connect: { idAsset }, },
                        User:               { connect: { idUser: idUserCreator }, },
                        FileName,
                        DateCreated,
                        StorageHash,
                        StorageSize,
                        StorageKeyStaging,
                        Ingested,
                        BulkIngest,
                        Version: nextVersion ? nextVersion : /* istanbul ignore next */ 1,
                        SystemObject:       { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.create', LOG.LS.eDB, error);
            return false;
        }

        /*
         * NOT WORKING:
        try {
            const { idAsset, FileName, idUserCreator, DateCreated, StorageHash, StorageSize, StorageKeyStaging, Ingested, BulkIngest } = this;
            const assetVersion: AssetVersion[] | null = DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`CALL AssetVersionCreate(${idAsset}, ${FileName}, ${idUserCreator}, ${DateCreated}, ${StorageHash}, ${StorageSize}, ${StorageKeyStaging}, ${Ingested}, ${BulkIngest})`, AssetVersion);
            if (assetVersion && assetVersion.length == 1) {
                this.idAssetVersion = assetVersion[0].idAssetVersion;
                this.Version = assetVersion[0].Version;
                return true;
            }
            return false;
        } catch (error) {
            LOG.error('DBAPI.AssetVersion.create', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.AssetVersion.computeNextVersionNumber', LOG.LS.eDB, error);
            return null;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAssetVersion, DateCreated, idAsset, FileName, idUserCreator, StorageHash, StorageSize, StorageKeyStaging, Ingested, BulkIngest, Version } = this;
            return await DBC.DBConnection.prisma.assetVersion.update({
                where: { idAssetVersion, },
                data: {
                    Asset:              { connect: { idAsset }, },
                    User:               { connect: { idUser: idUserCreator }, },
                    FileName,
                    DateCreated,
                    StorageHash,
                    StorageSize,
                    StorageKeyStaging,
                    Ingested,
                    BulkIngest,
                    Version,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.update', LOG.LS.eDB, error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idAssetVersion } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idAssetVersion, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idAssetVersion: number): Promise<AssetVersion | null> {
        if (!idAssetVersion)
            return null;
        try {
            return DBC.CopyObject<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findUnique({ where: { idAssetVersion, }, }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<AssetVersion[] | null> {
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany(), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.fetchAll', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.AssetVersion.fetch', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.AssetVersion.fetchFromAsset', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<AssetVersion[] | null> {
        if (!idSystemObject)
            return null;
        try {
            const assetVersions: AssetVersionBase[] | null = // DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`
                SELECT AV.*
                FROM AssetVersion AS AV
                JOIN Asset AS A ON (AV.idAsset = A.idAsset)
                WHERE A.idSystemObject = ${idSystemObject}
                  AND VERSION = (SELECT MAX(VERSION)
                                 FROM AssetVersion AS AVI
                                 WHERE AVI.idAsset = AV.idAsset);`; //, AssetVersion);
            /* istanbul ignore if */
            if (!assetVersions || assetVersions.length == 0)
                return null;
            const res: AssetVersion[] = [];
            for (const assetVersion of assetVersions)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                res.push(AssetVersion.constructFromPrisma(assetVersion));
            return res;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.fetchFromSystemObject', LOG.LS.eDB, error);
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
            return AssetVersion.constructFromPrisma(assetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.fetchLatestFromAsset', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.AssetVersion.fetchFromUser', LOG.LS.eDB, error);
            return null;
        }
    }

    /** Pass in a value for Retired if you need to seek only asset versions that have or have not been retired */
    static async fetchFromUserByIngested(idUserCreator: number, Ingested: boolean | null, Retired: boolean | null = null): Promise<AssetVersion[] | null> {
        if (!idUserCreator)
            return null;
        try {
            if (Retired === null)
                return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                    await DBC.DBConnection.prisma.assetVersion.findMany({ where: { idUserCreator, Ingested } }), AssetVersion);
            else {
                const assetVersions: AssetVersionBase[] | null = // DBC.CopyArray<AssetVersionBase, AssetVersion>(
                    await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`
                    SELECT AV.*
                    FROM AssetVersion AS AV
                    JOIN SystemObject AS SO ON (AV.idAssetVersion = SO.idAssetVersion)
                    JOIN Asset AS A ON (AV.idAsset = A.idAsset)
                    WHERE AV.idUserCreator = ${idUserCreator}
                      AND AV.Ingested = ${Ingested}
                      AND SO.Retired = ${Retired}`; //, AssetVersion);
                /* istanbul ignore if */
                if (!assetVersions || assetVersions.length == 0)
                    return null;
                const res: AssetVersion[] = [];
                for (const assetVersion of assetVersions)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                    res.push(AssetVersion.constructFromPrisma(assetVersion));
                return res;
            }
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.fetchFromUserByIngested', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchByIngested(Ingested: boolean | null): Promise<AssetVersion[] | null> {
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany({ where: { Ingested } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.fetchByIngested', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchByStorageKeyStaging(StorageKeyStaging: string): Promise<AssetVersion[] | null> {
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany({ where: { StorageKeyStaging } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetVersion.fetchByStorageKeyStaging', LOG.LS.eDB, error);
            return null;
        }
    }
}
