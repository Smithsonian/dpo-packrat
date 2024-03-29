import { QueryGetContentsForAssetVersionsArgs, GetContentsForAssetVersionsResult, AssetVersionContent } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { AssetStorageAdapter } from '../../../../../storage/interface';
import { AssetVersion } from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getContentsForAssetVersions(_: Parent, args: QueryGetContentsForAssetVersionsArgs, _context: Context): Promise<GetContentsForAssetVersionsResult> {
    const { idAssetVersions } = args.input;

    const result: AssetVersionContent[] = [];
    for (const idAssetVersion of idAssetVersions) {
        const assetVersion: AssetVersion | null = await AssetVersion.fetch(idAssetVersion);
        if (assetVersion)
            result.push(await AssetStorageAdapter.getAssetVersionContents(assetVersion));
        else
            LOG.error(`GraphQL getContentsForAssetVersions unable to load AssetVersion from ID ${idAssetVersion}`, LOG.LS.eGQL);
    }

    // LOG.info(`GraphQL getContentsForAssetVersions(${JSON.stringify(idAssetVersions)}) = ${JSON.stringify(result)}`, LOG.LS.eGQL);
    return { AssetVersionContent: result };
}
