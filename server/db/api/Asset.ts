/* eslint-disable camelcase */
import { Asset as AssetBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Asset extends DBC.DBObject<AssetBase> implements AssetBase, SystemObjectBased {
    idAsset!: number;
    FileName!: string;
    FilePath!: string;
    idAssetGroup!: number | null;
    idVAssetType!: number;
    idSystemObject!: number | null;
    StorageKey!: string;

    private idAssetGroupOrig!: number | null;
    private idSystemObjectOrig!: number | null;

    constructor(input: AssetBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetGroupOrig = this.idAssetGroup;
        this.idSystemObjectOrig = this.idSystemObject;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { FileName, FilePath, idAssetGroup, idVAssetType, idSystemObject, StorageKey } = this;
            ({ idAsset: this.idAsset, FileName: this.FileName, FilePath: this.FilePath, idAssetGroup: this.idAssetGroup,
                idVAssetType: this.idVAssetType, idSystemObject: this.idSystemObject, StorageKey: this.StorageKey } =
                await DBC.DBConnection.prisma.asset.create({
                    data: {
                        FileName,
                        FilePath,
                        AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : undefined,
                        Vocabulary:     { connect: { idVocabulary: idVAssetType }, },
                        SystemObject_Asset_idSystemObjectToSystemObject: idSystemObject ? { connect: { idSystemObject }, } : undefined,
                        SystemObject_AssetToSystemObject_idAsset:   { create: { Retired: false }, },
                        StorageKey,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAsset, FileName, FilePath, idAssetGroup, idVAssetType, idSystemObject, StorageKey, idAssetGroupOrig, idSystemObjectOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.asset.update({
                where: { idAsset, },
                data: {
                    FileName,
                    FilePath,
                    AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : idAssetGroupOrig ? { disconnect: true, } : undefined,
                    Vocabulary:     { connect: { idVocabulary: idVAssetType }, },
                    SystemObject_Asset_idSystemObjectToSystemObject: idSystemObject ? { connect: { idSystemObject }, } : idSystemObjectOrig ? { disconnect: true, } : undefined,
                    StorageKey,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.update', error);
            return false;
        }
    }

    /** This method returns the SystemObject that represents this asset. Use fetchSourceSystemObject() to retrieve the system object to which this asset belongs. */
    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idAsset } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idAsset, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idAsset: number): Promise<Asset | null> {
        if (!idAsset)
            return null;
        try {
            return DBC.CopyObject<AssetBase, Asset>(
                await DBC.DBConnection.prisma.asset.findOne({ where: { idAsset, }, }), Asset);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetch', error);
            return null;
        }
    }

    static async fetchByStorageKey(StorageKey: string): Promise<Asset | null> {
        if (!StorageKey)
            return null;
        try {
            return DBC.CopyObject<AssetBase, Asset>(
                await DBC.DBConnection.prisma.asset.findOne({ where: { StorageKey, }, }), Asset);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetchByStorageKey', error);
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
            LOG.logger.error('DBAPI.Asset.fetchFromAssetGroup', error);
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
            LOG.logger.error('DBAPI.Asset.fetchFromSystemObject', error);
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
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idSystemObject, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetchSourceSystemObject', error);
            return null;
        }
    }

    // Simplify assigning an asset to an appropriate system object:
    // Subject: as a thumbnail
    // Item: as a thumbnail
    // CaptureData: as a thumbnail, and as an asset representing all or part of a CaptureData set (explicitly connected to CaptureDataFile)
    // Model: as a thumbnail, and as an asset representing all or part of a Model (explicitly connected to ModelGeometryFile and ModelMVMapFile)
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
}
