import { RollbackSystemObjectVersionResult, MutationRollbackSystemObjectVersionArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';
import { AuditFactory } from '../../../../../audit/interface/AuditFactory';
import { eAuditType, eNonSystemObjectType } from '../../../../../db/api/ObjectType';
import { withAuditTransaction } from '../../../../../audit/withAuditTransaction';

export default async function rollbackSystemObjectVersion(_: Parent, args: MutationRollbackSystemObjectVersionArgs): Promise<RollbackSystemObjectVersionResult> {
    const { input } = args;
    const { idSystemObjectVersion, rollbackNotes, time } = input;

    if (!rollbackNotes || rollbackNotes.trim().length === 0)
        return { success: false, message: 'rollbackNotes is required' };

    const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetch(idSystemObjectVersion);
    if (!SOV) {
        const message: string = `rollbackSystemObjectVersion Unable to load SystemObjectVersion for ${idSystemObjectVersion}`;
        RK.logError(RK.LogSection.eGQL,'rollback system object version failed',`Unable to load SystemObjectVersion for ${idSystemObjectVersion}`,{},'GraphQL.SystemObject.ObjectVersion');
        return { success: false, message };
    }

    // Authorization: check access to the version's parent SystemObject (fail-closed)
    const ctx = Authorization.getContext();
    if (!ctx || !await Authorization.canAccessSystemObject(ctx, SOV.idSystemObject))
        return { success: false, message: AUTH_ERROR.ACCESS_DENIED };

    return withAuditTransaction(async () => {
        const timestampedRollbackNotes = `Rollback from version created at ${time}. \n ${rollbackNotes}`;
        const SOVRollback: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(SOV.idSystemObject, SOV.idSystemObjectVersion, timestampedRollbackNotes);
        if (!SOVRollback) {
            const message: string = 'rollbackSystemObjectVersion SystemObjectVersion.cloneObjectAndXrefs failed';
            RK.logError(RK.LogSection.eGQL,'rollback system object version failed','cannot clone object and xrefs',{ ...SOV },'GraphQL.SystemObject.ObjectVersion');
            return { success: false, message };
        }

        await AuditFactory.emitSemantic({
            action: eAuditType.eActionRollbackSOV,
            target: { idObject: SOVRollback.idSystemObjectVersion, eObjectType: eNonSystemObjectType.eSystemObjectVersion },
            idSystemObject: SOV.idSystemObject,
            payload: {
                rollbackNotes,
                from: { idSystemObjectVersion: SOV.idSystemObjectVersion },
                to:   { idSystemObjectVersion: SOVRollback.idSystemObjectVersion },
            },
        });

        return { success: true, message: '' };
    });
}