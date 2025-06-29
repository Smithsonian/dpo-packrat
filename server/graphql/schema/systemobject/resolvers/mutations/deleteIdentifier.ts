import { DeleteIdentifierResult, MutationDeleteIdentifierArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function deleteIdentifier(_: Parent, args: MutationDeleteIdentifierArgs): Promise<DeleteIdentifierResult> {
    const { input: { idIdentifier } } = args;
    const identifier = await DBAPI.Identifier.fetch(idIdentifier);
    if (!identifier) {
        RK.logError(RK.LogSection.eGQL,'delete identifier failed',`Unable to retrieve identifier ${idIdentifier}`,{},'GraphQL.SystemObject.Identifier');
        return { success: false };
    }
    if (await identifier?.delete()) {
        RK.logError(RK.LogSection.eGQL,'delete identifier failed',`Identifier deleted ${idIdentifier}`,{},'GraphQL.SystemObject.Identifier');
        return { success: true };
    } else {
        RK.logError(RK.LogSection.eGQL,'delete identifier failed',`Error deleting identifier ${idIdentifier}`,{},'GraphQL.SystemObject.Identifier');
        return { success: false };
    }
}