import { PublishResult, MutationPublishArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as COL from '../../../../../collections/interface';
import * as DBAPI from '../../../../../db';
import * as COMMON from '@dpo-packrat/common';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';
import { AuditFactory } from '../../../../../audit/interface/AuditFactory';
import { eAuditType } from '../../../../../db/api/ObjectType';

export default async function publish(_: Parent, args: MutationPublishArgs): Promise<PublishResult> {
    const {
        input: { idSystemObject, eState }
    } = args;

    // Authorization: check access to the target SystemObject (fail-closed)
    const ctx = Authorization.getContext();
    if (!ctx || !await Authorization.canAccessSystemObject(ctx, idSystemObject))
        return { success: false, message: AUTH_ERROR.ACCESS_DENIED };

    // Capture the prior published state for the audit diff before the publish
    // call mutates SystemObjectVersion. Reads are cheap and the row may not
    // exist for a never-published object, in which case we record null.
    const SOVPrior: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
    const prevState: COMMON.ePublishedState | null = SOVPrior ? SOVPrior.publishedStateEnum() : null;

    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
    const success: boolean = await ICol.publish(idSystemObject, eState);
    if (success) {
        const isUnpublish: boolean = eState === COMMON.ePublishedState.eNotPublished;
        await AuditFactory.emitSemantic({
            action: isUnpublish ? eAuditType.eActionUnpublish : eAuditType.eActionPublish,
            idSystemObject,
            payload: {
                before: { eState: prevState, eStateName: prevState !== null ? COMMON.ePublishedState[prevState] : null },
                after:  { eState, eStateName: COMMON.ePublishedState[eState] },
            },
        });
        return { success, eState };
    }
    return { success, message: 'Error encountered during publishing' };
}
