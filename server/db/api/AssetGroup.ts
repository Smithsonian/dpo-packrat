/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { AssetGroup as AssetGroupBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class AssetGroup extends DBC.DBObject<AssetGroupBase> implements AssetGroupBase {
    idAssetGroup!: number;

    constructor(input: AssetGroupBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            ({ idAssetGroup: this.idAssetGroup } = await DBC.DBConnectionFactory.prisma.assetGroup.create({ data: { } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetGroup.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAssetGroup } = this;
            return await DBC.DBConnectionFactory.prisma.assetGroup.update({
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
            return DBC.CopyObject<AssetGroupBase, AssetGroup>(
                await DBC.DBConnectionFactory.prisma.assetGroup.findOne({ where: { idAssetGroup, }, }), AssetGroup);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.AssetGroup.fetch', error);
            return null;
        }
    }
}
