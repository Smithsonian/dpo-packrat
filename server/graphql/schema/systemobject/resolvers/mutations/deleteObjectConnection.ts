import { DeleteObjectConnectionResult, MutationDeleteObjectConnectionArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function deleteObjectConnection(_: Parent, args: MutationDeleteObjectConnectionArgs): Promise<DeleteObjectConnectionResult> {
    const { input: { idSystemObjectMaster, idSystemObjectDerived } } = args;
    let result = { success: true, details: 'Relationship Removed!' };
    const idSystemObjectXrefs = await DBAPI.SystemObjectXref.fetchXref(idSystemObjectMaster, idSystemObjectDerived);

    if (idSystemObjectXrefs) {
        for (let i = 0; i < idSystemObjectXrefs.length; i++) {
            const xref = idSystemObjectXrefs[i];
            const { success, error } = await DBAPI.SystemObjectXref.deleteIfAllowed(xref.idSystemObjectXref);
            if (success) {
                LOG.info(`deleted SystemObjectXref ${xref.idSystemObjectXref}`, LOG.LS.eGQL);
            } else {
                LOG.error(`unable to delete SystemObjectXref ${xref.idSystemObjectXref} ${error}`, LOG.LS.eGQL);
                result = { success: false, details: error };
                break;
            }
        }
    } else {
        LOG.error(`deleteObjectConnection failed to fetch idSystemObjectXref for ${idSystemObjectMaster} and ${idSystemObjectDerived}`, LOG.LS.eGQL);
        return { success: false, details: 'Failed to fetch idSystemObjectXref for ' + idSystemObjectMaster + ' and ' + idSystemObjectDerived };
    }

    return result;
}