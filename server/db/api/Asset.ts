/* eslint-disable camelcase */
import { Asset as AssetBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Asset extends DBC.DBObject<AssetBase> implements AssetBase {
    idAsset!: number;
    FileName!: string;
    FilePath!: string;
    idAssetGroup!: number | null;

    private idAssetGroupOrig!: number | null;

    constructor(input: AssetBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetGroupOrig = this.idAssetGroup;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { FileName, FilePath, idAssetGroup } = this;
            ({ idAsset: this.idAsset, FileName: this.FileName, FilePath: this.FilePath, idAssetGroup: this.idAssetGroup } =
                await DBC.DBConnectionFactory.prisma.asset.create({
                    data: {
                        FileName,
                        FilePath,
                        AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : undefined,
                        SystemObject:   { create: { Retired: false }, },
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
            const { idAsset, FileName, FilePath, idAssetGroup, idAssetGroupOrig } = this;
            const retValue: boolean = await DBC.DBConnectionFactory.prisma.asset.update({
                where: { idAsset, },
                data: {
                    FileName,
                    FilePath,
                    AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : idAssetGroupOrig ? { disconnect: true, } : undefined,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idAsset } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idAsset, }, }), SystemObject);
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
                await DBC.DBConnectionFactory.prisma.asset.findOne({ where: { idAsset, }, }), Asset);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetch', error);
            return null;
        }
    }

    static async fetchFromAssetGroup(idAssetGroup: number): Promise<Asset[] | null> {
        if (!idAssetGroup)
            return null;
        try {
            return DBC.CopyArray<AssetBase, Asset>(
                await DBC.DBConnectionFactory.prisma.asset.findMany({ where: { idAssetGroup } }), Asset);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Asset.fetchFromAssetGroup', error);
            return null;
        }
    }
}
