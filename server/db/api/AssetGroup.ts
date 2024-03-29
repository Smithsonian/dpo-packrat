/* eslint-disable camelcase */
import { AssetGroup as AssetGroupBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class AssetGroup extends DBC.DBObject<AssetGroupBase> implements AssetGroupBase {
    idAssetGroup!: number;

    constructor(input: AssetGroupBase) {
        super(input);
    }

    public fetchTableName(): string { return 'AssetGroup'; }
    public fetchID(): number { return this.idAssetGroup; }

    protected async createWorker(): Promise<boolean> {
        try {
            ({ idAssetGroup: this.idAssetGroup } = await DBC.DBConnection.prisma.assetGroup.create({ data: { } }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idAssetGroup } = this;
            return await DBC.DBConnection.prisma.assetGroup.update({
                where: { idAssetGroup, },
                data: { },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    static async fetch(idAssetGroup: number): Promise<AssetGroup | null> {
        if (!idAssetGroup)
            return null;
        try {
            return DBC.CopyObject<AssetGroupBase, AssetGroup>(
                await DBC.DBConnection.prisma.assetGroup.findUnique({ where: { idAssetGroup, }, }), AssetGroup);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.AssetGroup.fetch', LOG.LS.eDB, error);
            return null;
        }
    }
}
