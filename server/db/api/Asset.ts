/* eslint-disable camelcase */
import { Asset as AssetBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Asset extends DBO.DBObject<AssetBase> implements AssetBase {
    idAsset!: number;
    FileName!: string;
    FilePath!: string;
    idAssetGroup!: number | null;

    constructor(input: AssetBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { FileName, FilePath, idAssetGroup } = this;
            ({ idAsset: this.idAsset, FileName: this.FileName, FilePath: this.FilePath, idAssetGroup: this.idAssetGroup } =
                await DBConnectionFactory.prisma.asset.create({
                    data: {
                        FileName,
                        FilePath,
                        AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : undefined,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.Asset.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idAsset, FileName, FilePath, idAssetGroup } = this;
            return await DBConnectionFactory.prisma.asset.update({
                where: { idAsset, },
                data: {
                    FileName,
                    FilePath,
                    AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : undefined,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.Asset.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idAsset } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idAsset, }, }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.Asset.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idAsset: number): Promise<Asset | null> {
        try {
            return DBO.CopyObject<AssetBase, Asset>(
                await DBConnectionFactory.prisma.asset.findOne({ where: { idAsset, }, }), Asset);
        } catch (error) {
            LOG.logger.error('DBAPI.Asset.fetch', error);
            return null;
        }
    }

    static async fetchSystemObjectAndAsset(idAsset: number): Promise<SystemObjectBase & { Asset: AssetBase | null} | null> {
        try {
            return await DBConnectionFactory.prisma.systemObject.findOne({ where: { idAsset, }, include: { Asset: true, }, });
        } catch (error) {
            LOG.logger.error('DBAPI.Asset.fetchSystemObjectAndAssetID', error);
            return null;
        }
    }

    static async fetchFromAssetGroup(idAssetGroup: number): Promise<Asset[] | null> {
        try {
            return DBO.CopyArray<AssetBase, Asset>(
                await DBConnectionFactory.prisma.asset.findMany({ where: { idAssetGroup } }), Asset);
        } catch (error) {
            LOG.logger.error('DBAPI.Asset.fetchFromAssetGroup', error);
            return null;
        }
    }
}
