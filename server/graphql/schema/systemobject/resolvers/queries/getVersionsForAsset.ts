import { DetailVersion, GetVersionsForAssetResult, QueryGetVersionsForAssetArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as LOG from '../../../../../utils/logger';
import { RouteBuilder, eHrefMode } from '../../../../../http/routes/routeBuilder';
import * as COMMON from '@dpo-packrat/common';

export default async function getVersionsForAsset(_: Parent, args: QueryGetVersionsForAssetArgs): Promise<GetVersionsForAssetResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const versions: DetailVersion[] = [];
    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!SO) {
        LOG.error(`getVersionsForAsset unable to load system object for id ${idSystemObject}`, LOG.LS.eGQL);
        return { versions };
    }
    if (!SO.idAsset) {
        LOG.error(`getVersionsForAsset loaded non-asset system object ${JSON.stringify(SO)}`, LOG.LS.eGQL);
        return { versions };
    }

    const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromAsset(SO.idAsset, false);
    if (!assetVersions) {
        LOG.error(`getVersionsForAsset unable to load asset versions for asset ${SO.idAsset}`, LOG.LS.eGQL);
        return { versions };
    }

    for (const assetVersion of assetVersions) {
        const user: DBAPI.User | undefined = await CACHE.UserCache.getUser(assetVersion.idUserCreator);
        const oID: DBAPI.ObjectIDAndType = { idObject: assetVersion.idAssetVersion, eObjectType: COMMON.eSystemObjectType.eAssetVersion };
        const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
        const DV: DetailVersion = {
            idSystemObject: sID ? sID.idSystemObject : 0,
            idAssetVersion: assetVersion.idAssetVersion,
            version: assetVersion.Version,
            name: assetVersion.FileName,
            creator: user ? user.Name : '',
            dateCreated: assetVersion.DateCreated,
            size: assetVersion.StorageSize,
            hash: assetVersion.StorageHash,
            ingested: assetVersion.Ingested ?? false,
            Comment: assetVersion.Comment,
            CommentLink: assetVersion.Comment && assetVersion.Comment.length <= 300
                ? null : RouteBuilder.DownloadAssetVersionComment(assetVersion.idAssetVersion, eHrefMode.ePrependServerURL)
        };
        versions.push(DV);
    }

    return { versions };
}