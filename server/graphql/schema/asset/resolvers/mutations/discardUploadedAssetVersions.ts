import { MutationDiscardUploadedAssetVersionsArgs, DiscardUploadedAssetVersionsResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as LOG from '../../../../../utils/logger';

export default async function discardUploadedAssetVersions(
    _: Parent,
    args: MutationDiscardUploadedAssetVersionsArgs,
    context: Context
): Promise<DiscardUploadedAssetVersionsResult | void> {
    const { user } = context;
    const { idAssetVersions } = args.input;
    if (!user) {
        LOG.logger.error('uploadAsset unable to retrieve user context');
        return { success: false };
    }

    // TODO: remove the asset versions
    console.log('discardUploadedAssetVersions', idAssetVersions);

    return { success: true };
}
