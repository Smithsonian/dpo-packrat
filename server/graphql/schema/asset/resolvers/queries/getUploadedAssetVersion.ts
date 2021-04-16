import { GetUploadedAssetVersionResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getUploadedAssetVersion(_: Parent, __: unknown, context: Context): Promise<GetUploadedAssetVersionResult> {
    const { user } = context;
    if (!user) {
        return { AssetVersion: [] };
    }

    const { idUser } = user;

    const AssetVersion: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromUserByIngested(idUser, false, false);

    if (AssetVersion) {
        return { AssetVersion };
    }

    return { AssetVersion: [] };
}
