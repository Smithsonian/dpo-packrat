import { DeleteObjectConnectionResult, MutationDeleteObjectConnectionArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';
import { getRelatedObjects } from '../queries/getSystemObjectDetails';
import { RelatedObjectType } from '../../../../../types/graphql';
import { eSystemObjectType } from '../../../../../db';


export default async function deleteObjectConnection(_: Parent, args: MutationDeleteObjectConnectionArgs): Promise<DeleteObjectConnectionResult> {
    const { input: { idSystemObjectMaster, objectTypeMaster, idSystemObjectDerived, objectTypeDerived } } = args;
    let result = { success: true, details: 'Relationship Removed!' };

    const idSystemObjectXrefs = await DBAPI.SystemObjectXref.fetchXref(idSystemObjectMaster, idSystemObjectDerived);

    if ((objectTypeDerived === eSystemObjectType.eModel && objectTypeMaster === eSystemObjectType.eItem) || (objectTypeDerived === eSystemObjectType.eCaptureData && objectTypeMaster === eSystemObjectType.eItem)) {
        const sourceObjectsOfChild = await getRelatedObjects(idSystemObjectDerived, RelatedObjectType.Source);
        const sourceItemCount = sourceObjectsOfChild.filter(source => source.objectType === eSystemObjectType.eItem).length;
        if (sourceItemCount <= 1) {
            return { success: false, details: 'Cannot delete last item parent' };
        }
    }

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