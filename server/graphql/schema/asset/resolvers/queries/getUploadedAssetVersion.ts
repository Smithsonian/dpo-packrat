import { GetUploadedAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getUploadedAssetVersion(_: Parent, __: unknown, context: Context): Promise<GetUploadedAssetVersionResult> {
    const { user } = context;
    if (!user)
        return { AssetVersion: [], idAssetVersionsUpdated: [] };

    const { idUser } = user;

    // fetch asset versions that have "false" for ingested and are not retired for this user.
    // Note that there may be some asset versions with "null" for ingested, which we are ignoring --
    // these have been uploaded but are still being processed in a post-upload workflow
    const AssetVersion: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromUserByIngested(idUser, false, false);
    if (!AssetVersion) {
        LOG.error(`getUploadedAssetVersion failed on AssetVersion.fetchFromUserByIngested(${idUser}, false, false)`, LOG.LS.eGQL);
        return { AssetVersion: [], idAssetVersionsUpdated: [] };
    }
    if (AssetVersion.length == 0)
        return { AssetVersion: [], idAssetVersionsUpdated: [] };

    // compute map of idAsset -> idAssetVersion for asset versions
    const assetMap: Map<number, number> = new Map<number, number>();
    for (const assetVersion of AssetVersion)
        assetMap.set(assetVersion.idAsset, assetVersion.idAssetVersion);

    // compute asset version counts for each asset
    const idAssets: number[] = [ ...assetMap.keys() ];
    const versionCountMap: Map<number, number> | null = await DBAPI.Asset.computeVersionCountMap(idAssets);
    if (!versionCountMap) {
        LOG.error(`getUploadedAssetVersion failed on Asset.computeVersionCountMap(${JSON.stringify(idAssets)})`, LOG.LS.eGQL);
        return { AssetVersion: [], idAssetVersionsUpdated: [] };
    }

    // let caller know which asset versions are updates -- those with version counts > 1
    const idAssetVersionsUpdated: number[] = [];
    for (const [key, value] of versionCountMap) {
        const idAsset: number = key;
        const versionCount: number = value;
        if (versionCount > 1) {
            const idAssetVersion: number | undefined = assetMap.get(idAsset);
            if (idAssetVersion === undefined) {
                LOG.error(`getUploadedAssetVersion skipping unexpected idAsset ${idAsset}`, LOG.LS.eGQL);
                continue;
            }
            idAssetVersionsUpdated.push(idAssetVersion);
        }
    }

    return { AssetVersion, idAssetVersionsUpdated };
}
