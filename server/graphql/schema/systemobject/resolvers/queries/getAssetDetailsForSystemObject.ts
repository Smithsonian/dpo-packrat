import * as DBAPI from '../../../../../db';
import { AssetDetail, GetAssetDetailsForSystemObjectResult, QueryGetAssetDetailsForSystemObjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function getAssetDetailsForSystemObject(_: Parent, args: QueryGetAssetDetailsForSystemObjectArgs): Promise<GetAssetDetailsForSystemObjectResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const assetDetails: AssetDetail[] = await getAssetDetails(idSystemObject);

    return { assetDetails };
}

async function getAssetDetails(idSystemObject: number): Promise<AssetDetail[]> {
    const assetDetails: AssetDetail[] = [];
    const assets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(idSystemObject);
    if (assets) {
        for (const asset of assets) {
            const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromAsset(asset.idAsset);
            if (assetVersions) {
                for (const assetVersion of assetVersions) {
                    const assetDetail: AssetDetail = {
                        idSystemObject: asset.idSystemObject || 0,
                        name: assetVersion.FileName,
                        path: asset.FilePath,
                        assetType: asset.idVAssetType,
                        version: assetVersion.Version,
                        dateCreated: assetVersion.DateCreated,
                        size: assetVersion.StorageSize
                    };

                    assetDetails.push(assetDetail);
                }
            }
        }
    }

    return assetDetails;
}