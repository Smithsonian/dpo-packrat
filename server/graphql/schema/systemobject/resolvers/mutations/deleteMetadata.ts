import { DeleteMetadataResult, MutationDeleteMetadataArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function deleteMetadata(_: Parent, args: MutationDeleteMetadataArgs): Promise<DeleteMetadataResult> {
    const { input: { idMetadata } } = args;
    const metadata = await DBAPI.Metadata.fetch(idMetadata);
    if (!metadata) {
        LOG.error(`Unable to retrieve Metadata with idMetadata ${idMetadata}`, LOG.LS.eGQL);
        return { success: false };
    }

    if (await metadata.delete()) {
        LOG.info(`Metadata deleted with idMetadata ${idMetadata}`, LOG.LS.eGQL);
        return { success: true };
    } else {
        LOG.error(`Error deleting Metadata with idMetadata ${idMetadata}`, LOG.LS.eGQL);
        return { success: false };
    }
}