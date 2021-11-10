import { UpdateSourceObjectsResult, MutationUpdateSourceObjectsArgs, ExistingRelationship } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';
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
                    LOG.error(`updateSourceObjects failed to create connection between ${idSystemObject} and ${newlySelected.idSystemObject}`, LOG.LS.eGQL);
                    result.status = 'warn';
                    result.message += ' ' + newlySelected.idSystemObject;
                    continue;
                }

                const wireSourceToDerived = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(newlySelected.idSystemObject, SO.idSystemObject);
                if (!wireSourceToDerived) {
                    LOG.error(`updateSourceObjects failed to wire SystemObjectXref ${JSON.stringify(wireSourceToDerived)}`, LOG.LS.eGQL);
                    continue;
                }
            }
        } else {
            LOG.error(`updateSourceObjects failed to fetch system object ${idSystemObject}`, LOG.LS.eGQL);
            return { success: false, message: `Failed to fetch system object ${idSystemObject}`, status: 'error' };
        }
    }
    return result;
}
