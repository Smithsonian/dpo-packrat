import { DetailVersion, GetVersionsForAssetResult, QueryGetVersionsForAssetArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { RouteBuilder, eHrefMode } from '../../../../../http/routes/routeBuilder';
import * as COMMON from '@dpo-packrat/common';

export default async function getVersionsForAsset(_: Parent, args: QueryGetVersionsForAssetArgs): Promise<GetVersionsForAssetResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const versions: DetailVersion[] = [];
    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!SO) {
        RK.logError(RK.LogSection.eGQL,'get versions for asset failed',`unable to load system object for id ${idSystemObject}`,{  },'GraphQL.SystemObject.Versions');
        return { versions };
    }
    if (!SO.idAsset) {
        RK.logError(RK.LogSection.eGQL,'get versions for asset failed','loaded non-asset system object',{ ...SO },'GraphQL.SystemObject.Versions');
        return { versions };
    }

    const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromAsset(SO.idAsset, false);
    if (!assetVersions) {
        RK.logError(RK.LogSection.eGQL,'get versions for asset failed',`unable to load asset versions for asset ${SO.idAsset}`,{  },'GraphQL.SystemObject.Versions');
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