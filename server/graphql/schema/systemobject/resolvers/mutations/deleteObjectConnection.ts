import { DeleteObjectConnectionResult, MutationDeleteObjectConnectionArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { getRelatedObjects } from '../queries/getSystemObjectDetails';
import { RelatedObjectType } from '../../../../../types/graphql';
import * as COMMON from '@dpo-packrat/common';

export default async function deleteObjectConnection(_: Parent, args: MutationDeleteObjectConnectionArgs): Promise<DeleteObjectConnectionResult> {
    const { input: { idSystemObjectMaster, objectTypeMaster, idSystemObjectDerived, objectTypeDerived } } = args;
    let result: DeleteObjectConnectionResult = { success: true, details: 'Relationship Removed!' };

    const idSystemObjectXrefs = await DBAPI.SystemObjectXref.fetchXref(idSystemObjectMaster, idSystemObjectDerived);

    if ((objectTypeDerived === COMMON.eSystemObjectType.eModel && objectTypeMaster === COMMON.eSystemObjectType.eItem) || (objectTypeDerived === COMMON.eSystemObjectType.eCaptureData && objectTypeMaster === COMMON.eSystemObjectType.eItem)) {
        const sourceObjectsOfChild = await getRelatedObjects(idSystemObjectDerived, RelatedObjectType.Source);
        const sourceItemCount = sourceObjectsOfChild.filter(source => source.objectType === COMMON.eSystemObjectType.eItem).length;
        if (sourceItemCount <= 1) {
            RK.logError(RK.LogSection.eGQL,'delete object connection failed','Cannot delete last media group parent',{ idSystemObjectXrefs },'GraphQL.SystemObject.ObjectConnection');
            return { success: false, details: 'Cannot delete last media group parent' };
        }
    }

    if (idSystemObjectXrefs) {
        for (let i = 0; i < idSystemObjectXrefs.length; i++) {
            const xref = idSystemObjectXrefs[i];
            const { success, error } = await DBAPI.SystemObjectXref.deleteIfAllowed(xref.idSystemObjectXref);
            if (success) {
                RK.logInfo(RK.LogSection.eGQL,'delete object connection success',undefined,{ xref },'GraphQL.SystemObject.ObjectConnection');
            } else {
                RK.logError(RK.LogSection.eGQL,'delete object connection failed',`unable to delete SystemObjectXref: ${error}`,{ xref },'GraphQL.SystemObject.ObjectConnection');
                result = { success: false, details: `unable to delete SystemObjectXref: ${error}`  };
                break;
            }
        }
    } else {
        RK.logError(RK.LogSection.eGQL,'delete object connection failed','failed to fetch idSystemObjectXref',{ idSystemObjectMaster, idSystemObjectDerived },'GraphQL.SystemObject.ObjectConnection');
        return { success: false, details: 'Failed to fetch idSystemObjectXref for ' + idSystemObjectMaster + ' and ' + idSystemObjectDerived };
    }

    return result;
}