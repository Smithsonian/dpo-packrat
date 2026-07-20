import { DeleteIdentifierResult, MutationDeleteIdentifierArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';
import { withAuditTransaction } from '../../../../../audit/withAuditTransaction';

export default async function deleteIdentifier(_: Parent, args: MutationDeleteIdentifierArgs): Promise<DeleteIdentifierResult> {
    const { input: { idIdentifier } } = args;
    const identifier = await DBAPI.Identifier.fetch(idIdentifier);
    if (!identifier) {
        RK.logError(RK.LogSection.eGQL,'delete identifier failed',`Unable to retrieve identifier ${idIdentifier}`,{},'GraphQL.SystemObject.Identifier');
        return { success: false };
    }

    // Authorization: check access to the identifier's parent SystemObject (fail-closed)
    const ctx = Authorization.getContext();
    if (identifier.idSystemObject) {
        if (!ctx || !await Authorization.canAccessSystemObject(ctx, identifier.idSystemObject))
            return { success: false, message: AUTH_ERROR.ACCESS_DENIED };

        // Editing a Subject's identifiers requires admin (for the moment), matching updateObjectDetails.
        const oID = await CACHE.SystemObjectCache.getObjectFromSystem(identifier.idSystemObject);
        if (oID?.eObjectType === COMMON.eSystemObjectType.eSubject && !ctx.isAdmin)
            return { success: false, message: AUTH_ERROR.ADMIN_REQUIRED };
    }

    return withAuditTransaction(async () => {
        if (await identifier.delete()) {
            RK.logInfo(RK.LogSection.eGQL,'delete identifier',`Identifier deleted ${idIdentifier}`,{},'GraphQL.SystemObject.Identifier');
            return { success: true };
        }
        RK.logError(RK.LogSection.eGQL,'delete identifier failed',`Error deleting identifier ${idIdentifier}`,{},'GraphQL.SystemObject.Identifier');
        return { success: false };
    });
}