import { UpdateDerivedObjectsResult, MutationUpdateDerivedObjectsArgs, ExistingRelationship, RelatedObjectType } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';
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
                    LOG.error(`updateDerivedObjects failed to create connection between ${idSystemObject} and ${newlySelected.idSystemObject}`, LOG.LS.eGQL);
                    result.status = 'warn';
                    result.message += ' ' + newlySelected.idSystemObject;
                    continue;
                }

                const xref: DBAPI.SystemObjectXref = new DBAPI.SystemObjectXref({
                    idSystemObjectMaster: SO.idSystemObject,
                    idSystemObjectDerived: newlySelected.idSystemObject,
                    idSystemObjectXref: 0
                });
                if (!(await xref.create())) {
                    LOG.error(`updateDerivedObjects failed to create SystemObjectXref ${JSON.stringify(xref)}`, LOG.LS.eGQL);
                    continue;
                }
            }
        } else {
            LOG.error(`updateDerivedObjects failed to fetch system object ${idSystemObject}`, LOG.LS.eGQL);
            return { success: false, message: `Failed to fetch system object ${idSystemObject}`, status: 'error' };
        }
    }
    return result;
}
