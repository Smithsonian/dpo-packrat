import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as LOG from '../../../../../utils/logger';
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
    const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromSystemObject(idSystemObject);
    if (!assetVersions) {
        LOG.info(`getAssetDetails retrieved no asset versions for ${idSystemObject}`, LOG.LS.eGQL);
        return assetDetails;
    }

    for (const assetVersion of assetVersions) {
        // We need the idSystemObject for the asset
        const oID: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAsset, eObjectType: DBAPI.eSystemObjectType.eAsset };
        const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
        if (!sID) {
            LOG.error(`getAssetDetails could not retrieve system object info for ${JSON.stringify(oID)}`, LOG.LS.eGQL);
            continue;
        }

        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
        if (!asset) {
            LOG.error(`getAssetDetails could not retrieve asset for id ${JSON.stringify(assetVersion.idAsset)}`, LOG.LS.eGQL);
            continue;
        }

        const assetDetail: AssetDetail = {
            idSystemObject: sID ? sID.idSystemObject : 0,
            idAsset: assetVersion.idAsset,
            name: assetVersion.FileName,
            path: asset.FilePath,
            assetType: asset.idVAssetType,
            version: assetVersion.Version,
            dateCreated: assetVersion.DateCreated,
            size: assetVersion.StorageSize
        };

        assetDetails.push(assetDetail);
    }

    return assetDetails;
}