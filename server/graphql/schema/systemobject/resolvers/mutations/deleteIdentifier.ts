import { DeleteIdentifierResult, MutationDeleteIdentifierArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function deleteObjectConnection(_: Parent, args: MutationDeleteIdentifierArgs): Promise<DeleteIdentifierResult> {
    const { input: { idIdentifier } } = args;
    const identifier = await DBAPI.Identifier.fetch(idIdentifier);
    if (!identifier) {
        LOG.error(`Unable to retrieve identifier ${idIdentifier}`, LOG.LS.eDB);
        return { success: false };
    }
    if (await identifier?.delete()) {
        LOG.info(`Identifier deleted ${idIdentifier}`, LOG.LS.eDB);
        return { success: true };
    } else {
        LOG.error(`Error in deleting identifier ${idIdentifier}`, LOG.LS.eDB);
        return { success: false };
    }
}