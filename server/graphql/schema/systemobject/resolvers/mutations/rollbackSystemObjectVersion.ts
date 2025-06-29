import { RollbackSystemObjectVersionResult, MutationRollbackSystemObjectVersionArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function rollbackSystemObjectVersion(_: Parent, args: MutationRollbackSystemObjectVersionArgs): Promise<RollbackSystemObjectVersionResult> {
    const { input } = args;
    const { idSystemObjectVersion, rollbackNotes, time } = input;

    const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetch(idSystemObjectVersion);
    if (!SOV) {
        const message: string = `rollbackSystemObjectVersion Unable to load SystemObjectVersion for ${idSystemObjectVersion}`;
        RK.logError(RK.LogSection.eGQL,'rollback system object version failed',`Unable to load SystemObjectVersion for ${idSystemObjectVersion}`,{},'GraphQL.SystemObject.ObjectVersion');
        return { success: false, message };
    }

    const timestampedRollbackNotes = `Rollback from version created at ${time}. \n ${rollbackNotes}`;
    const SOVRollback: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(SOV.idSystemObject, SOV.idSystemObjectVersion, timestampedRollbackNotes);
    if (!SOVRollback) {
        const message: string = 'rollbackSystemObjectVersion SystemObjectVersion.cloneObjectAndXrefs failed';
        RK.logError(RK.LogSection.eGQL,'rollback system object version failed','cannot clone object and xrefs',{ ...SOV },'GraphQL.SystemObject.ObjectVersion');
        return { success: false, message };
    }

    return { success: true, message: '' };
}