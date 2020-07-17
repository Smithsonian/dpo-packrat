/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { AssetGroup as AssetGroupBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class AssetGroup extends DBO.DBObject<AssetGroupBase> implements AssetGroupBase {
    idAssetGroup!: number;

    constructor(input: AssetGroupBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            ({ idAssetGroup: this.idAssetGroup } = await DBConnectionFactory.prisma.assetGroup.create({ data: { } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetGroup.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAssetGroup } = this;
            return await DBConnectionFactory.prisma.assetGroup.update({
                where: { idAssetGroup, },
                data: { },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
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
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetGroup.fetch', error);
            return null;
        }
    }
}
