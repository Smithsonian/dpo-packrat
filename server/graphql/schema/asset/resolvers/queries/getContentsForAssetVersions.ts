import { QueryGetContentsForAssetVersionsArgs, GetContentsForAssetVersionsResult, AssetVersionContent } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { AssetStorageAdapter } from '../../../../../storage/interface';
import { AssetVersion } from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getContentsForAssetVersions(_: Parent, args: QueryGetContentsForAssetVersionsArgs, context: Context): Promise<GetContentsForAssetVersionsResult> {
    const { user } = context;

    if (!user) {
        return { AssetVersionContent: [] };
    }

    const { idAssetVersions } = args.input;

    const result: AssetVersionContent[] = [];

    idAssetVersions.forEach(async idAssetVersion => {
        const assetVersion: AssetVersion | null = await AssetVersion.fetch(idAssetVersion);
        if (assetVersion)
            result.push(await AssetStorageAdapter.getAssetVersionContents(assetVersion));
        else
            LOG.logger.error(`getContentsForAssetVersions unable to load AssetVersion from ID ${idAssetVersion}`);
    });

    return { AssetVersionContent: result };
}
