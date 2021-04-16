import { MutationDiscardUploadedAssetVersionsArgs, DiscardUploadedAssetVersionsResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as STORE from '../../../../../storage/interface';
import * as LOG from '../../../../../utils/logger';

export default async function discardUploadedAssetVersions(
    _: Parent,
    args: MutationDiscardUploadedAssetVersionsArgs,
    _context: Context
): Promise<DiscardUploadedAssetVersionsResult | void> {
    const { idAssetVersions } = args.input;

    let success: boolean = true;
    for (const idAssetVersion of idAssetVersions) {
        const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
        if (!assetVersion) {
            LOG.error(`discardUploadedAssetVersions Unable to fetch asset version with id ${idAssetVersion}`, LOG.LS.eGQL);
            success = false;
            continue;
        }

        const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.discardAssetVersion(assetVersion);
        if (!ASR.success) {
            LOG.error(`discardUploadedAssetVersions failed to discard asset version ${JSON.stringify(assetVersion)}: ${ASR.error}`, LOG.LS.eGQL);
            success = false;
            continue;
        }
    }
    return { success };
}
