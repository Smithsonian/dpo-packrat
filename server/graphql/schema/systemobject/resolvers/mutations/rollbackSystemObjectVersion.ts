import { RollbackSystemObjectVersionResult, MutationRollbackSystemObjectVersionArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function rollbackSystemObjectVersion(_: Parent, args: MutationRollbackSystemObjectVersionArgs): Promise<RollbackSystemObjectVersionResult> {
    const { input } = args;
    const { idSystemObjectVersion, rollbackNotes, time } = input;

    const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetch(idSystemObjectVersion);
    if (!SOV) {
        const message: string = `rollbackSystemObjectVersion Unable to load SystemObjectVersion for ${idSystemObjectVersion}`;
        LOG.error(message, LOG.LS.eGQL);
        return { success: false, message };
    }

    const timestampedRollbackNotes = `Rollback from version created at ${time}. \n ${rollbackNotes}`;
    const SOVRollback: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(SOV.idSystemObject, SOV.idSystemObjectVersion, timestampedRollbackNotes);
    if (!SOVRollback) {
        const message: string = 'rollbackSystemObjectVersion SystemObjectVersion.cloneObjectAndXrefs failed';
        LOG.error(message, LOG.LS.eGQL);
        return { success: false, message };
    }

    return { success: true, message: '' };
}