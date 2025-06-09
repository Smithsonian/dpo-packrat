import { QueryGetContentsForAssetVersionsArgs, GetContentsForAssetVersionsResult, AssetVersionContent } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { AssetStorageAdapter } from '../../../../../storage/interface';
import { AssetVersion } from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function getContentsForAssetVersions(_: Parent, args: QueryGetContentsForAssetVersionsArgs, _context: Context): Promise<GetContentsForAssetVersionsResult> {
    const { idAssetVersions } = args.input;

    const result: AssetVersionContent[] = [];
    for (const idAssetVersion of idAssetVersions) {
        const assetVersion: AssetVersion | null = await AssetVersion.fetch(idAssetVersion);
        if (assetVersion)
            result.push(await AssetStorageAdapter.getAssetVersionContents(assetVersion));
        else
            RK.logError(RK.LogSection.eGQL,'get contents for asset versions failed',`unable to load AssetVersion from ID ${idAssetVersion}`,{},'GraphQL.Asset');
    }

    // LOG.info(`GraphQL getContentsForAssetVersions(${JSON.stringify(idAssetVersions)}) = ${JSON.stringify(result)}`, LOG.LS.eGQL);
    return { AssetVersionContent: result };
}
