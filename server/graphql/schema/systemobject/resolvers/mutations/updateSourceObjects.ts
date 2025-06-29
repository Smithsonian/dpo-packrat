import { UpdateSourceObjectsResult, MutationUpdateSourceObjectsArgs, ExistingRelationship } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { isValidParentChildRelationship } from '../../../ingestion/resolvers/mutations/ingestData';

export default async function updateSourceObjects(_: Parent, args: MutationUpdateSourceObjectsArgs): Promise<UpdateSourceObjectsResult> {
    const { input } = args;
    const { idSystemObject, Sources, PreviouslySelected, ChildObjectType } = input;
    const uniqueHash = {};
    PreviouslySelected.forEach(previous => (uniqueHash[previous.idSystemObject] = previous));
    const newlySelectedArr: ExistingRelationship[] = [];
    Sources.forEach(source => {
        if (!uniqueHash[source.idSystemObject]) {
            newlySelectedArr.push(source);
        }
    });

    const result = { success: true, message: '', status: 'success' };

    if (Sources && Sources.length > 0 && newlySelectedArr.length > 0) {
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (SO) {
            for (const newlySelected of newlySelectedArr) {
                const isValidRelationship = isValidParentChildRelationship(newlySelected.objectType, ChildObjectType, Sources, PreviouslySelected, true);
                if (!isValidRelationship) {
                    RK.logError(RK.LogSection.eGQL,'update source objects failed',`failed to create connection between ${idSystemObject} and ${newlySelected.idSystemObject}`,{},'GraphQL.SystemObject.SourceObject');
                    result.status = 'warn';
                    result.message += ' ' + newlySelected.idSystemObject;
                    continue;
                }

                const wireSourceToDerived = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(newlySelected.idSystemObject, SO.idSystemObject);
                if (!wireSourceToDerived) {
                    RK.logError(RK.LogSection.eGQL,'update source objects failed','failed to wire SystemObjectXref',{ wireSourceToDerived },'GraphQL.SystemObject.SourceObject');
                    continue;
                }
            }
        } else {
            RK.logError(RK.LogSection.eGQL,'update source objects failed',`failed to fetch system object ${idSystemObject}`,{},'GraphQL.SystemObject.SourceObject');
            return { success: false, message: `Failed to fetch system object ${idSystemObject}`, status: 'error' };
        }
    }
    return result;
}
