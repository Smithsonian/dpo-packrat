/* eslint-disable camelcase */
import { Asset as AssetBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import { VocabularyCache } from '../../cache';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import * as COMMON from '@dpo-packrat/common';

export class Asset extends DBC.DBObject<AssetBase> implements AssetBase, SystemObjectBased {
    idAsset!: number;
    FileName!: string;
    idAssetGroup!: number | null;
    idVAssetType!: number;
    idSystemObject!: number | null;
    StorageKey!: string | null;

    constructor(input: AssetBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Asset'; }
    public fetchID(): number { return this.idAsset; }

    static constructFromPrisma(asset: AssetBase): Asset {
        return new Asset({
            idAsset: asset.idAsset,
            FileName: asset.FileName,
            idAssetGroup: asset.idAssetGroup,
            idVAssetType: asset.idVAssetType,
            idSystemObject: asset.idSystemObject,
            StorageKey: asset.StorageKey
        });
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { FileName, idAssetGroup, idVAssetType, idSystemObject, StorageKey } = this;
            ({ idAsset: this.idAsset, FileName: this.FileName, idAssetGroup: this.idAssetGroup,
                idVAssetType: this.idVAssetType, idSystemObject: this.idSystemObject, StorageKey: this.StorageKey } =
                await DBC.DBConnection.prisma.asset.create({
                    data: {
                        FileName,
                        AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : undefined,
                        Vocabulary:     { connect: { idVocabulary: idVAssetType }, },
                        SystemObject_Asset_idSystemObjectToSystemObject: idSystemObject ? { connect: { idSystemObject }, } : undefined,
                        SystemObject_AssetToSystemObject_idAsset:   { create: { Retired: false }, },
                        StorageKey,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAsset, FileName, idAssetGroup, idVAssetType, idSystemObject, StorageKey, } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.asset.update({
                where: { idAsset, },
                data: {
                    FileName,
                    AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : { disconnect: true, },
                    Vocabulary:     { connect: { idVocabulary: idVAssetType }, },
                    SystemObject_Asset_idSystemObjectToSystemObject: idSystemObject ? { connect: { idSystemObject }, } : { disconnect: true, },
                    StorageKey,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    /** This method returns the SystemObject that represents this asset. Use fetchSourceSystemObject() to retrieve the system object to which this asset belongs. */
    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idAsset } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idAsset, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Asset.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idAsset: number): Promise<Asset | null> {
        if (!idAsset)
            return null;
        try {
            return DBC.CopyObject<AssetBase, Asset>(
                await DBC.DBConnection.prisma.asset.findUnique({ where: { idAsset, }, }), Asset);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Asset.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Asset[] | null> {
        try {
            return DBC.CopyArray<AssetBase, Asset>(
                await DBC.DBConnection.prisma.asset.findMany(), Asset);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Asset.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchByStorageKey(StorageKey: string): Promise<Asset | null> {
        if (!StorageKey)
            return null;
        try {
            return DBC.CopyObject<AssetBase, Asset>(
                await DBC.DBConnection.prisma.asset.findUnique({ where: { StorageKey, }, }), Asset);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Asset.fetchByStorageKey', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromAssetGroup(idAssetGroup: number): Promise<Asset[] | null> {
        if (!idAssetGroup)
            return null;
        try {
            return DBC.CopyArray<AssetBase, Asset>(
                await DBC.DBConnection.prisma.asset.findMany({ where: { idAssetGroup } }), Asset);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Asset.fetchFromAssetGroup', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<Asset[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<AssetBase, Asset>(
                await DBC.DBConnection.prisma.asset.findMany({ where: { SystemObject_Asset_idSystemObjectToSystemObject: { idSystemObject } } }), Asset);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Asset.fetchFromSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    /** Fetches assets that are connected to the specified idSystemObject (via that object's last SystemObjectVersion,
     * and that SystemObjectVersionAssetVersionXref's records). For those assets, we look for a match on FileName, idVAssetType */
    static async fetchMatching(idSystemObject: number, FileName: string, idVAssetType: number): Promise<Asset | null> {
        if (!idSystemObject)
            return null;
        try {
            const assets: AssetBase[] | null = // DBC.CopyArray<AssetBase, Asset>(
                await DBC.DBConnection.prisma.$queryRaw<Asset[]>`
                SELECT DISTINCT A.*
                FROM SystemObjectVersion AS SOV
                JOIN SystemObjectVersionAssetVersionXref AS XREF ON (SOV.idSystemObjectVersion = XREF.idSystemObjectVersion)
                JOIN AssetVersion AS AV ON (XREF.idAssetVersion = AV.idAssetVersion)
                JOIN Asset AS A ON (AV.idAsset = A.idAsset)
                WHERE SOV.idSystemObject = ${idSystemObject}
                  AND SOV.idSystemObjectVersion = (SELECT MAX(idSystemObjectVersion)
                                                   FROM SystemObjectVersion
                                                   WHERE idSystemObject = ${idSystemObject})
                  AND A.FileName = ${FileName} 
                  AND A.idVAssetType = ${idVAssetType}
                ORDER BY SOV.idSystemObjectVersion DESC
                LIMIT 1;`; //, Asset);
            /* istanbul ignore if */
            if (!assets || assets.length == 0)
                return null;
            return Asset.constructFromPrisma(assets[0]);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Asset.fetchMatching', LOG.LS.eDB, error);
            return null;
        }
    }

    /** Returns a map of idAsset -> Version Count for the specified idAssets */
    static async computeVersionCountMap(idAssets: number[]): Promise<Map<number, number> | null> {
        const retValue: Map<number, number> = new Map<number, number>();
        try {
            const versionCounts: { idAsset: number, RowCount: BigInt }[] =
                await DBC.DBConnection.prisma.$queryRaw<{ idAsset: number, RowCount: BigInt }[]>`
                SELECT A.idAsset, COUNT(*) AS 'RowCount'
                FROM Asset AS A
                JOIN AssetVersion AS AV ON (AV.idAsset = A.idAsset)
                WHERE A.idAsset IN (${Prisma.join(idAssets)})
                GROUP BY A.idAsset`;

            for (const countInfo of versionCounts)
                retValue.set(countInfo.idAsset, Number(countInfo.RowCount));
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Asset.computeVersionCountMap', LOG.LS.eDB, error);
            return null;
        }
    }

    /** This method returns the SystemObject to which this asset belongs. Use fetchSystemObject to fetch the SystemObject that represents this asset. */
    async fetchSourceSystemObject(): Promise<SystemObject | null> {
        const { idSystemObject } = this;
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idSystemObject, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Asset.fetchSourceSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    // Simplify assigning an asset to an appropriate system object:
    // Subject: as a thumbnail
    // Item: as a thumbnail
    // CaptureData: as a thumbnail, and as an asset representing all or part of a CaptureData set (explicitly connected to CaptureDataFile)
    // Model: as a thumbnail, and as an asset representing all or part of a Model (implicity connected via SystemObjectXref, and explicitly connected to ModelMaterialUVMap)
    // Scene: as a thumbnail, and as an asset representing all or part of a Scene
    // IntermediaryFile: as an asset representing all or part of an IntermediaryFile
    // ProjectDocumentation: as an asset representing all or part of a ProjectDocumentation

    /** Updates idSystemObject with the correct value for the specified SystemObjectBased object */
    async assignOwner(soBased: SystemObjectBased): Promise<boolean> {
        const SO: SystemObject | null = await soBased.fetchSystemObject();
        /* istanbul ignore if */
        if (!SO)
            return false;
        this.idSystemObject = SO.idSystemObject;
        return this.updateWorker();
    }

    async assetType(): Promise<COMMON.eVocabularyID | undefined> {
        return await VocabularyCache.vocabularyIdToEnum(this.idVAssetType);
    }

    /** Don't forget to call update! */
    async setAssetType(eVocabID: COMMON.eVocabularyID): Promise<boolean> {
        const idVocabulary: number | undefined = await VocabularyCache.vocabularyEnumToId(eVocabID);
        if (!idVocabulary)
            return false;
        this.idVAssetType = idVocabulary;
        return true;
    }
}
