import { MutationDiscardUploadedAssetVersionsArgs, DiscardUploadedAssetVersionsResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as STORE from '../../../../../storage/interface';
import * as LOG from '../../../../../utils/logger';

export default async function discardUploadedAssetVersions(
    _: Parent,
    args: MutationDiscardUploadedAssetVersionsArgs,
    context: Context
): Promise<DiscardUploadedAssetVersionsResult | void> {
    const { user } = context;
    const { idAssetVersions } = args.input;
    if (!user) {
        LOG.logger.error('GQL discardUploadedAssetVersions unable to retrieve user context');
        return { success: false };
    }

    let success: boolean = true;
    for (const idAssetVersion of idAssetVersions) {
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (!assetVersion) {
            LOG.logger.error(`GQL discardUploadedAssetVersions Unable to fetch asset version with id ${idAssetVersion}`);
            success = false;
            continue;
        }

        const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.discardAssetVersion(assetVersion);
        if (!ASR.success) {
            LOG.logger.error(`GQL discardUploadedAssetVersions failed to discard asset version ${JSON.stringify(assetVersion)}: ${ASR.error}`);
            success = false;
            continue;
        }
    }
    return { success };
}
