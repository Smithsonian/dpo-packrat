import * as DBAPI from '../../../db';
import { Asset as AssetBase } from '@prisma/client';

export async function createAssetTest(base: AssetBase): Promise<DBAPI.Asset> {
    const asset: DBAPI.Asset = new DBAPI.Asset(base);
    const created: boolean = await asset.create();
    expect(created).toBeTruthy();
    expect(asset.idAsset).toBeGreaterThan(0);
    return asset;
}