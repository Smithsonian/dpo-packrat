import { DeleteMetadataResult, MutationDeleteMetadataArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function deleteMetadata(_: Parent, args: MutationDeleteMetadataArgs): Promise<DeleteMetadataResult> {
    const { input: { idMetadata } } = args;
    const metadata = await DBAPI.Metadata.fetch(idMetadata);
    if (!metadata) {
        RK.logError(RK.LogSection.eGQL,'delete identifier failed',`Unable to retrieve Metadata with idMetadata ${idMetadata}`,{},'GraphQL.SystemObject.Metadata');
        return { success: false };
    }

    if (await metadata.delete()) {
        RK.logError(RK.LogSection.eGQL,'delete identifier failed',`Metadata deleted with idMetadata ${idMetadata}`,{},'GraphQL.SystemObject.Metadata');
        return { success: true };
    } else {
        RK.logError(RK.LogSection.eGQL,'delete identifier failed',`Error deleting Metadata with idMetadata ${idMetadata}`,{},'GraphQL.SystemObject.Metadata');
        return { success: false };
    }
}