import { DeleteObjectConnectionResult, MutationDeleteObjectConnectionArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function deleteObjectConnection(_: Parent, args: MutationDeleteObjectConnectionArgs): Promise<DeleteObjectConnectionResult> {
    const { input: { idSystemObjectMaster, idSystemObjectDerived } } = args;
    const idSystemObjectXrefs = await DBAPI.SystemObjectXref.fetchXref(idSystemObjectMaster, idSystemObjectDerived);
    let result;

    if (idSystemObjectXrefs) {
        idSystemObjectXrefs.forEach(async (xref) => {
            const { success, error } = await DBAPI.SystemObjectXref.deleteIfAllowed(xref.idSystemObjectXref);
            if (success) {
                LOG.info(`deleted SystemObjectXref ${xref.idSystemObjectXref}`, LOG.LS.eGQL);
            } else {
                LOG.error(`unable to delete SystemObjectXref ${xref.idSystemObjectXref} ${error}`, LOG.LS.eGQL);
                result = { success: false };
            }
            return;
        });
    } else {
        LOG.error(`deleteObjectConnection failed to fetch idSystemObjectXref for ${idSystemObjectMaster} and ${idSystemObjectDerived}`, LOG.LS.eGQL);
        return { success: false };
    }

    if (!result) {
        result = { success: true };
    }

    return result;
}