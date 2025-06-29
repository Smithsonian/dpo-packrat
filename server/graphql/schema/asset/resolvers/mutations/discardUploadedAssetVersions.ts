import { MutationDiscardUploadedAssetVersionsArgs, DiscardUploadedAssetVersionsResult } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as STORE from '../../../../../storage/interface';
// import * as H from '../../../../../utils/helpers';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

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
            RK.logError(RK.LogSection.eGQL,'discard upload asset versions failed',`Unable to fetch asset version with id ${idAssetVersion}`,{ ...args.input },'GraphQL.Asset');
            success = false;
            continue;
        }

        const ASR: STORE.AssetStorageResult = await STORE.AssetStorageAdapter.discardAssetVersion(assetVersion);
        if (!ASR.success) {
            RK.logError(RK.LogSection.eGQL,'discard upload asset versions failed',`failed to discard asset version: ${ASR.error}`,{ assetVersion, ...args.input },'GraphQL.Asset');
            success = false;
            continue;
        }
    }
    return { success };
}
