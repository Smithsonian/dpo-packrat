/* eslint-disable camelcase */
import { AssetGroup as AssetGroupBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AssetGroup extends DBO.DBObject<AssetGroupBase> implements AssetGroupBase {
    idAssetGroup!: number;

    constructor(input: AssetGroupBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            ({ idAssetGroup: this.idAssetGroup } = await DBConnectionFactory.prisma.assetGroup.create({ data: { } }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.AssetGroup.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idAssetGroup } = this;
            return await DBConnectionFactory.prisma.assetGroup.update({
                where: { idAssetGroup, },
                data: { },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.AssetGroup.update', error);
            return false;
        }
    }

    static async fetch(idAssetGroup: number): Promise<AssetGroup | null> {
        if (!idAssetGroup)
            return null;
        try {
            return DBO.CopyObject<AssetGroupBase, AssetGroup>(
                await DBConnectionFactory.prisma.assetGroup.findOne({ where: { idAssetGroup, }, }), AssetGroup);
        } catch (error) {
            LOG.logger.error('DBAPI.AssetGroup.fetch', error);
            return null;
        }
    }
}
