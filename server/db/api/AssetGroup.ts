/* eslint-disable camelcase */
import { AssetGroup as AssetGroupBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

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
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Asset.Group');
            return false;
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
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Asset.Group');
            return false;
        }
    }

    static async fetch(idAssetGroup: number): Promise<AssetGroup | null> {
        if (!idAssetGroup)
            return null;
        try {
            return DBC.CopyObject<AssetGroupBase, AssetGroup>(
                await DBC.DBConnection.prisma.assetGroup.findUnique({ where: { idAssetGroup, }, }), AssetGroup);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Asset.Group');
            return null;
        }
    }
}
