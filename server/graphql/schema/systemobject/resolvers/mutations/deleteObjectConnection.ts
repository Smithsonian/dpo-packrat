import { DeleteObjectConnectionResult, MutationDeleteObjectConnectionArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function deleteObjectConnection(_: Parent, args: MutationDeleteObjectConnectionArgs): Promise<DeleteObjectConnectionResult> {
    const { input: { idSystemObjectMaster, idSystemObjectDerived } } = args;
    const idSystemObjectXrefs = await DBAPI.SystemObjectXref.fetchXref(idSystemObjectMaster, idSystemObjectDerived);
    if (idSystemObjectXrefs) {
        console.log('xrefs', idSystemObjectXrefs);
        idSystemObjectXrefs.forEach(async (xref) => {
            try {
                const result = await DBAPI.SystemObjectXref.deleteIfAllowed(xref.idSystemObjectXref);
                LOG.info(`deleted SystemObjectXref ${xref.idSystemObjectXref}`, LOG.LS.eGQL);
                console.log(result);
                return;

            } catch (error) {
                LOG.error(`unable to delete SystemObjectXref ${xref.idSystemObjectXref} ${error}`, LOG.LS.eGQL);
                return;
            }
        })
        return { success: true };

    } else {
        LOG.error(`deleteObjectConnection failed to fetch idSystemObjectXref for ${idSystemObjectMaster} and ${idSystemObjectDerived}`, LOG.LS.eGQL);
        return { success: false };
    }


}