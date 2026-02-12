/* eslint-disable camelcase */
import { AssetVersion as AssetVersionBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject, SystemObjectBased, SystemObjectVersion } from '..';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

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
    idSOAttachment!: number | null;
    FilePath!: string;
    Comment!: string | null;

    IngestedOrig: boolean | null;

    constructor(input: AssetVersionBase) {
        super(input);
        this.IngestedOrig = this.Ingested;
    }

    protected updateCachedValues(): void {
        this.IngestedOrig = this.Ingested;
    }


    public fetchTableName(): string { return 'AssetVersion'; }
    public fetchID(): number { return this.idAssetVersion; }

    static constructFromPrisma(assetVersion: AssetVersionBase): AssetVersion {
        return new AssetVersion({
            idAssetVersion: assetVersion.idAssetVersion,
            idAsset: assetVersion.idAsset,
            Version: assetVersion.Version,
            FileName: assetVersion.FileName,
            idUserCreator: assetVersion.idUserCreator,
            DateCreated: new Date(assetVersion.DateCreated),
            StorageHash: assetVersion.StorageHash,
            StorageSize: BigInt(assetVersion.StorageSize),
            StorageKeyStaging: assetVersion.StorageKeyStaging,
            Ingested: (assetVersion.Ingested === null) ? null : (assetVersion.Ingested ? true : false), // we're expecting Prisma to send values like null, 0, and 1
            BulkIngest: assetVersion.BulkIngest ? true : false,
            idSOAttachment: assetVersion.idSOAttachment,
            FilePath: assetVersion.FilePath,
            Comment: assetVersion.Comment
        });
    }

    // TODO: replace two-step query with a call to AssetVersionCreate stored procedure
    // We likely need to engage Prisma for a fix, as well as write directly to the Node.js connector for MariaDB
    // until Prisma has fixed this issue.  https://mariadb.com/kb/en/getting-started-with-the-nodejs-connector/
    protected async createWorker(): Promise<boolean> {
        try {
            const { DateCreated, idAsset, FileName, idUserCreator, StorageHash, StorageSize, StorageKeyStaging, Ingested, BulkIngest, idSOAttachment, FilePath, Comment } = this;
            const Version: number = (Ingested) ? (await AssetVersion.computeNextVersionNumber(idAsset) || /* istanbul ignore next */ 1) : 0;   // only bump version number for Ingested asset versions
            this.Version = Version;

            ({ idAssetVersion: this.idAssetVersion, DateCreated: this.DateCreated, idAsset: this.idAsset,
                FileName: this.FileName, idUserCreator: this.idUserCreator, StorageHash: this.StorageHash, StorageSize: this.StorageSize,
                StorageKeyStaging: this.StorageKeyStaging, Ingested: this.Ingested, BulkIngest: this.BulkIngest, Version: this.Version,
                idSOAttachment: this.idSOAttachment, FilePath: this.FilePath, Comment: this.Comment } =
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
                        Version,
                        SystemObject_AssetVersion_idSOAttachmentToSystemObject: idSOAttachment ? { connect: { idSystemObject: idSOAttachment }, } : undefined,
                        FilePath,
                        Comment,
                        SystemObject_AssetVersionToSystemObject_idAssetVersion: { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Asset.Version');
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

    static async computeNextVersionNumber(idAsset: number): Promise<number | null> {
        if (!idAsset)
            return null;
        try {
            const VersionInfo: [{ Version: BigInt }] =
                await DBC.DBConnection.prisma.$queryRaw<[{ Version: BigInt }]>`
                SELECT IFNULL(MAX(AV.Version), 0) + 1 AS 'Version'
                FROM AssetVersion AS AV
                WHERE AV.idAsset = ${idAsset};`;
            return (VersionInfo && VersionInfo.length > 0) ? Number(VersionInfo[0].Version) : /* istanbul ignore next */ null;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'compute next version number failed',H.Helpers.getErrorString(error),{ idAsset, ...this },'DB.Asset.Version');
            return null;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAssetVersion, DateCreated, idAsset, FileName, idUserCreator, StorageHash, StorageSize, StorageKeyStaging,
                Ingested, BulkIngest, idSOAttachment, FilePath, Comment } = this;
            let { Version } = this; // may be updated!

            // If the asset is now Ingested, and it effectively has no version (0 or null),
            // we MUST compute the next version number.
            // Removed '!IngestedOrig' check to prevent state desync issues.
            if (Ingested && !Version) {
                const nextVersion: number | null = await AssetVersion.computeNextVersionNumber(idAsset); /* istanbul ignore next*/
                if (!nextVersion) {
                    RK.logError(RK.LogSection.eDB,'update failed','failed to compute nextVersion',{ ...this },'DB.Asset.Version');
                    return false;
                }
                Version = nextVersion;
                this.Version = Version;
            }

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
                    FilePath,
                    Comment,
                    SystemObject_AssetVersion_idSOAttachmentToSystemObject: idSOAttachment ? { connect: { idSystemObject: idSOAttachment }, } : { disconnect: true, },
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Asset.Version');
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idAssetVersion } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idAssetVersion, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch SystemObject failed',H.Helpers.getErrorString(error),{ ...this },'DB.Asset.Version');
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
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idAssetVersion, ...this },'DB.Asset.Version');
            return null;
        }
    }

    static async fetchAll(): Promise<AssetVersion[] | null> {
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany(), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all failed',H.Helpers.getErrorString(error),{ ...this },'DB.Asset.Version');
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
            RK.logError(RK.LogSection.eDB,'fetch by Asset and version failed',H.Helpers.getErrorString(error),{ idAsset, Version, ...this },'DB.Asset.Version');
            return null;
        }
    }

    static async fetchFromAsset(idAsset: number, retired?: boolean): Promise<AssetVersion[] | null> {
        if (!idAsset)
            return null;
        try {
            if (retired === undefined)
                return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                    await DBC.DBConnection.prisma.assetVersion.findMany({ where: { idAsset } }), AssetVersion);
            const assetVersions: AssetVersionBase[] | null = // DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`
                SELECT AV.*
                FROM AssetVersion AS AV
                JOIN SystemObject AS SO ON (AV.idAssetVersion = SO.idAssetVersion)
                WHERE AV.idAsset = ${idAsset}
                  AND SO.Retired = ${retired}
                ORDER BY AV.idAsset, AV.Ingested DESC, AV.Version;`; //, AssetVersion);
            /* istanbul ignore if */
            if (!assetVersions)
                return null;
            const res: AssetVersion[] = [];
            for (const assetVersion of assetVersions)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                res.push(AssetVersion.constructFromPrisma(assetVersion));
            return res;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from Asset failed',H.Helpers.getErrorString(error),{ idAsset, ...this },'DB.Asset.Version');
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
            RK.logError(RK.LogSection.eDB,'fetch from SystemObject failed',H.Helpers.getErrorString(error),{ idSystemObject, ...this },'DB.Asset.Version');
            return null;
        }
    }

    static async fetchFromSystemObjectVersion(idSystemObjectVersion: number): Promise<AssetVersion[] | null> {
        if (!idSystemObjectVersion)
            return null;
        try {
            const assetVersions: AssetVersionBase[] | null = // DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`
                SELECT AV.*
                FROM AssetVersion AS AV
                JOIN SystemObjectVersionAssetVersionXref AS SOX ON (AV.idAssetVersion = SOX.idAssetVersion)
                WHERE SOX.idSystemObjectVersion = ${idSystemObjectVersion};`; //, AssetVersion);
            /* istanbul ignore if */
            if (!assetVersions || assetVersions.length == 0)
                return null;
            const res: AssetVersion[] = [];
            for (const assetVersion of assetVersions)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                res.push(AssetVersion.constructFromPrisma(assetVersion));
            return res;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from SystemObjectVersion failed',H.Helpers.getErrorString(error),{ idSystemObjectVersion, ...this },'DB.Asset.Version');
            return null;
        }
    }

    /** First attempts to retrieve asset versions associated with the latest SystemObjectVersion for idSystemObject;
     * if there is no SystemObjectVersion, falls back to assets connected to idSystemObject */
    static async fetchLatestFromSystemObject(idSystemObject: number): Promise<AssetVersion[] | null> {
        if (!idSystemObject)
            return null;
        let assetVersions: AssetVersion[] | null = null;

        const SOV: SystemObjectVersion | null = await SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
        if (SOV) {
            assetVersions = await AssetVersion.fetchFromSystemObjectVersion(SOV.idSystemObjectVersion); /* istanbul ignore next */
            if (!assetVersions)
                RK.logInfo(RK.LogSection.eDB,'fetch latest from SystemObject',`failed to retrieve asset versions from SystemObjectVersion; falling back to all asset versions for idSystemObject ${idSystemObject}`,{ SOV, ...this },'DB.Asset.Version');
        }

        if (!assetVersions)
            assetVersions = await AssetVersion.fetchFromSystemObject(idSystemObject); /* istanbul ignore next */
        if (!assetVersions) {
            RK.logInfo(RK.LogSection.eDB,'fetch latest from SystemObject',`retrieved no asset versions for ${idSystemObject}`,{ ...this },'DB.Asset.Version');
            return null;
        }
        return assetVersions;
    }

    static async fetchFirstFromAsset(idAsset: number): Promise<AssetVersion | null> {
        if (!idAsset)
            return null;
        try {
            const assetVersions: AssetVersionBase[] | null = // DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`
                SELECT *
                FROM AssetVersion
                WHERE idAsset = ${idAsset}
                  AND VERSION = 1`; //, AssetVersion);
            /* istanbul ignore if */
            if (!assetVersions || assetVersions.length == 0)
                return null;
            const assetVersion: AssetVersionBase = assetVersions[0];
            // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
            return AssetVersion.constructFromPrisma(assetVersion);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch first from Asset failed',H.Helpers.getErrorString(error),{ idAsset, ...this },'DB.Asset.Version');
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
            RK.logError(RK.LogSection.eDB,'fetch latest from Asset failed',H.Helpers.getErrorString(error),{ idAsset, ...this },'DB.Asset.Version');
            return null;
        }
    }

    /**
     * Fetches all asset versions associated with a Scene, respecting the versioning system.
     * This includes:
     * - Direct scene assets (SVX files, attachments) via SystemObjectVersionAssetVersionXref
     * - Model assets (geometry, textures) from Models linked via SystemObjectXref
     *
     * @param idScene - The Scene ID to fetch assets for
     * @param idSystemObjectVersion - Optional specific version to fetch. If null/undefined, fetches latest version.
     * @returns Array of AssetVersion objects or null if none found/error
     */
    static async fetchFromSceneByVersion(idScene: number, idSystemObjectVersion?: number | null): Promise<AssetVersion[] | null> {
        if (!idScene)
            return null;
        try {
            let assetVersions: AssetVersionBase[] | null;

            if (idSystemObjectVersion) {
                // Fetch assets for a specific SystemObjectVersion
                assetVersions = await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`
                    SELECT DISTINCT av.*
                    FROM Scene AS scn
                    JOIN SystemObject AS scnSO ON scn.idScene = scnSO.idScene
                    JOIN SystemObjectVersion AS scnSOV ON (
                        scnSO.idSystemObject = scnSOV.idSystemObject
                        AND scnSOV.idSystemObjectVersion = ${idSystemObjectVersion}
                    )

                    -- Direct scene assets via SystemObjectVersionAssetVersionXref
                    LEFT JOIN SystemObjectVersionAssetVersionXref AS scnXref ON scnSOV.idSystemObjectVersion = scnXref.idSystemObjectVersion
                    LEFT JOIN AssetVersion AS scnAV ON scnXref.idAssetVersion = scnAV.idAssetVersion

                    -- Model assets via SystemObjectXref -> Model -> their latest assets
                    LEFT JOIN SystemObjectXref AS sox ON scnSO.idSystemObject = sox.idSystemObjectMaster
                    LEFT JOIN SystemObject AS mdlSO ON sox.idSystemObjectDerived = mdlSO.idSystemObject AND mdlSO.idModel IS NOT NULL
                    LEFT JOIN SystemObjectVersion AS mdlSOV ON (
                        mdlSO.idSystemObject = mdlSOV.idSystemObject
                        AND mdlSOV.idSystemObjectVersion = (
                            SELECT MAX(idSystemObjectVersion) FROM SystemObjectVersion WHERE idSystemObject = mdlSO.idSystemObject
                        )
                    )
                    LEFT JOIN SystemObjectVersionAssetVersionXref AS mdlXref ON mdlSOV.idSystemObjectVersion = mdlXref.idSystemObjectVersion
                    LEFT JOIN AssetVersion AS mdlAV ON mdlXref.idAssetVersion = mdlAV.idAssetVersion

                    -- Combine both paths
                    JOIN AssetVersion AS av ON av.idAssetVersion IN (scnAV.idAssetVersion, mdlAV.idAssetVersion)

                    WHERE scn.idScene = ${idScene}
                      AND av.idAssetVersion IS NOT NULL
                    ORDER BY av.FileName`;
            } else {
                // Fetch assets for the latest SystemObjectVersion
                assetVersions = await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`
                    SELECT DISTINCT av.*
                    FROM Scene AS scn
                    JOIN SystemObject AS scnSO ON scn.idScene = scnSO.idScene
                    JOIN SystemObjectVersion AS scnSOV ON (
                        scnSO.idSystemObject = scnSOV.idSystemObject
                        AND scnSOV.idSystemObjectVersion = (
                            SELECT MAX(idSystemObjectVersion) FROM SystemObjectVersion WHERE idSystemObject = scnSO.idSystemObject
                        )
                    )

                    -- Direct scene assets via SystemObjectVersionAssetVersionXref
                    LEFT JOIN SystemObjectVersionAssetVersionXref AS scnXref ON scnSOV.idSystemObjectVersion = scnXref.idSystemObjectVersion
                    LEFT JOIN AssetVersion AS scnAV ON scnXref.idAssetVersion = scnAV.idAssetVersion

                    -- Model assets via SystemObjectXref -> Model -> their latest assets
                    LEFT JOIN SystemObjectXref AS sox ON scnSO.idSystemObject = sox.idSystemObjectMaster
                    LEFT JOIN SystemObject AS mdlSO ON sox.idSystemObjectDerived = mdlSO.idSystemObject AND mdlSO.idModel IS NOT NULL
                    LEFT JOIN SystemObjectVersion AS mdlSOV ON (
                        mdlSO.idSystemObject = mdlSOV.idSystemObject
                        AND mdlSOV.idSystemObjectVersion = (
                            SELECT MAX(idSystemObjectVersion) FROM SystemObjectVersion WHERE idSystemObject = mdlSO.idSystemObject
                        )
                    )
                    LEFT JOIN SystemObjectVersionAssetVersionXref AS mdlXref ON mdlSOV.idSystemObjectVersion = mdlXref.idSystemObjectVersion
                    LEFT JOIN AssetVersion AS mdlAV ON mdlXref.idAssetVersion = mdlAV.idAssetVersion

                    -- Combine both paths
                    JOIN AssetVersion AS av ON av.idAssetVersion IN (scnAV.idAssetVersion, mdlAV.idAssetVersion)

                    WHERE scn.idScene = ${idScene}
                      AND av.idAssetVersion IS NOT NULL
                    ORDER BY av.FileName`;
            }

            /* istanbul ignore if */
            if (!assetVersions || assetVersions.length === 0)
                return null;

            const res: AssetVersion[] = [];
            for (const assetVersion of assetVersions)
                res.push(AssetVersion.constructFromPrisma(assetVersion));
            return res;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from Scene by version failed',H.Helpers.getErrorString(error),{ idScene, idSystemObjectVersion, ...this },'DB.Asset.Version');
            return null;
        }
    }

    /** Fetches the the active asset version that is being used by the given scene for Voyager SVX scene */
    static async fetchActiveVoyagerSceneFromScene(idScene: number): Promise<AssetVersion | null> {
        try {
            // get the (active) voyager scene asset associated with the Packrat scene (if any)
            // TODO: get asset type id from VocabularyID
            const idvAssetType: number = 137;
            const assetVersion: AssetVersion[] | null = DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.$queryRaw<AssetVersion[]>`
                    SELECT * FROM Scene AS scn
                    JOIN SystemObject AS scnSO ON (scnSO.idScene=scn.idScene)
                    JOIN SystemObjectVersion AS scnSOV ON (scnSOV.idSystemObject=scnSO.idSystemObject)
                    JOIN SystemObjectVersionAssetVersionXref as sovAssetXref ON (sovAssetXref.idSystemObjectVersion=scnSOV.idSystemObjectVersion)
                    JOIN AssetVersion AS av ON (av.idAssetVersion=sovAssetXref.idAssetVersion)
                    JOIN Asset AS a ON (a.idAsset=av.idAsset AND a.idVAssetType=${idvAssetType})
                    WHERE scn.idScene=${idScene}
                    ORDER BY scnSOV.DateCreated DESC
                    LIMIT 1`,AssetVersion);
            return (!assetVersion || assetVersion.length===0) ? null : assetVersion[0];
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch Voyager scene from Scene failed',H.Helpers.getErrorString(error),{ idScene, ...this },'DB.Asset.Version');
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
            RK.logError(RK.LogSection.eDB,'fetch from User failed',H.Helpers.getErrorString(error),{ idUserCreator, ...this },'DB.Asset.Version');
            return null;
        }
    }

    /** Pass in a value for Retired if you need to seek only asset versions that have or have not been retired */
    /*  Ingested:
            null  = uploaded, not processed (after bytes transfered)
            false = uploaded, processed (after transferred and inspected)
            true  = uploaded, processed, ingested (once ingested in the system) */
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
                if (!assetVersions)
                    return null;
                const res: AssetVersion[] = [];
                for (const assetVersion of assetVersions)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                    res.push(AssetVersion.constructFromPrisma(assetVersion));
                return res;
            }
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch ingested from User failed',H.Helpers.getErrorString(error),{ idUserCreator, Ingested, Retired, ...this },'DB.Asset.Version');
            return null;
        }
    }

    static async fetchByIngested(Ingested: boolean | null): Promise<AssetVersion[] | null> {
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany({ where: { Ingested } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch by ingested failed',H.Helpers.getErrorString(error),{ Ingested, ...this },'DB.Asset.Version');
            return null;
        }
    }

    static async fetchByStorageKeyStaging(StorageKeyStaging: string): Promise<AssetVersion[] | null> {
        try {
            return DBC.CopyArray<AssetVersionBase, AssetVersion>(
                await DBC.DBConnection.prisma.assetVersion.findMany({ where: { StorageKeyStaging } }), AssetVersion);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch by staging storage key failed',H.Helpers.getErrorString(error),{ StorageKeyStaging, ...this },'DB.Asset.Version');
            return null;
        }
    }

    static async countStorageKeyStaging(StorageKeyStaging: string, Ingested: boolean | null = false, Retired: boolean = false): Promise<number | null> {
        try {
            const storageKeyStagingCount: { RowCount: BigInt }[] =
                await DBC.DBConnection.prisma.$queryRaw<{ RowCount: BigInt }[]>`
                SELECT COUNT(*) AS 'RowCount'
                FROM AssetVersion AS AV
                JOIN SystemObject AS SO ON (AV.idAssetVersion = SO.idAssetVersion)
                WHERE SO.Retired = ${Retired}
                  AND AV.Ingested = ${Ingested}
                  AND AV.StorageKeyStaging = ${StorageKeyStaging};`;
            // LOG.info(`AssetVersion.countStorageKeyStaging ${JSON.stringify(this)}: ${JSON.stringify(subjectItemLinkCount)} relationships`, LOG.LS.eDB);

            /* istanbul ignore next */
            if (storageKeyStagingCount.length != 1) { // array of wrong length returned, error ... should never happen
                RK.logError(RK.LogSection.eDB,'fetch by ingested failed',`received invalid query response ${JSON.stringify(storageKeyStagingCount)}`,{ StorageKeyStaging, Ingested, Retired, ...this },'DB.Asset.Version');
                return null;
            }

            return Number(storageKeyStagingCount[0].RowCount);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'count storage key staging failed',H.Helpers.getErrorString(error),{ StorageKeyStaging, Ingested, Retired, ...this },'DB.Asset.Version');
            return null;
        }
    }
}
