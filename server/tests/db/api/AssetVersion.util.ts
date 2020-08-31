import * as DBAPI from '../../../db';
import { AssetVersion as AssetVersionBase } from '@prisma/client';

export async function createAssetVersionTest(base: AssetVersionBase): Promise<DBAPI.AssetVersion> {
    const assetVersion: DBAPI.AssetVersion = new DBAPI.AssetVersion(base);
    const created: boolean = await assetVersion.create();
    expect(created).toBeTruthy();
    expect(assetVersion.idAssetVersion).toBeGreaterThan(0);
    expect(assetVersion.Version).toBeGreaterThan(0);
    return assetVersion;
}