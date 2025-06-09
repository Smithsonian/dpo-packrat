import { UpdateDerivedObjectsResult, MutationUpdateDerivedObjectsArgs, ExistingRelationship, RelatedObjectType } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { getRelatedObjects } from '../queries/getSystemObjectDetails';
import { isValidParentChildRelationship } from '../../../ingestion/resolvers/mutations/ingestData';

export default async function updateDerivedObjects(_: Parent, args: MutationUpdateDerivedObjectsArgs): Promise<UpdateDerivedObjectsResult> {
    const { input } = args;
    const { idSystemObject, Derivatives, PreviouslySelected, ParentObjectType } = input;
    const uniqueHash = {};
    PreviouslySelected.forEach(previous => (uniqueHash[previous.idSystemObject] = previous));
    const newlySelectedArr: ExistingRelationship[] = [];
    Derivatives.forEach(derivative => {
        if (!uniqueHash[derivative.idSystemObject]) {
            newlySelectedArr.push(derivative);
        }
    });

    const result = { success: true, message: '', status: 'success' };

    if (Derivatives && Derivatives.length > 0 && newlySelectedArr.length > 0) {
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (SO) {
            for (const newlySelected of newlySelectedArr) {
                const parentsOfNewlySelected = await getRelatedObjects(newlySelected.idSystemObject, RelatedObjectType.Source);
                const isValidRelationship = isValidParentChildRelationship(ParentObjectType, newlySelected.objectType, Derivatives, parentsOfNewlySelected, false);
                if (!isValidRelationship) {
                    RK.logError(RK.LogSection.eGQL,'update dervied objects failed','failed to create connection between system objects',{ old: idSystemObject, new: newlySelected.idSystemObject },'GraphQL.SystemObject.DerivedObjects');
                    result.status = 'warn';
                    result.message += ' ' + newlySelected.idSystemObject;
                    continue;
                }

                const wireSourceToDerived = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(SO.idSystemObject, newlySelected.idSystemObject);
                if (!wireSourceToDerived) {
                    RK.logError(RK.LogSection.eGQL,'update dervied objects failed','failed to wire SystemObjectXref',{ wireSourceToDerived },'GraphQL.SystemObject.DerivedObjects');
                    continue;
                }
            }
        } else {
            RK.logError(RK.LogSection.eGQL,'update dervied objects failed',`failed to fetch system object ${idSystemObject}`,{},'GraphQL.SystemObject.DerivedObjects');
            return { success: false, message: `Failed to fetch system object ${idSystemObject}`, status: 'error' };
        }
    }
    return result;
}
