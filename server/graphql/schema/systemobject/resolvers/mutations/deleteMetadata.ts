import { DeleteMetadataResult, MutationDeleteMetadataArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function deleteMetadata(_: Parent, args: MutationDeleteMetadataArgs): Promise<DeleteMetadataResult> {
    const { input: { idMetadata } } = args;
    const Metadata = await DBAPI.Metadata.fetch(idMetadata);
    if (!Metadata) {
        LOG.error(`Unable to retrieve Metadata ${idMetadata}`, LOG.LS.eDB);
        return { success: false };
    }
    if (await Metadata?.delete()) {
        LOG.info(`Metadata deleted ${idMetadata}`, LOG.LS.eDB);
        return { success: true };
    } else {
        LOG.error(`Error deleting Metadata ${idMetadata}`, LOG.LS.eDB);
        return { success: false };
    }
}