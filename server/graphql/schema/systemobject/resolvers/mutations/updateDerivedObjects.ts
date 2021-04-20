import { UpdateDerivedObjectsResult, MutationUpdateDerivedObjectsArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function updateDerivedObjects(_: Parent, args: MutationUpdateDerivedObjectsArgs): Promise<UpdateDerivedObjectsResult> {
    const { input } = args;
    const { idSystemObject, Derivatives, PreviouslySelected } = input;
    const uniqueHash = {};
    PreviouslySelected.forEach((previous) => uniqueHash[previous] = previous);
    const newlySelectedArr: number[] = [];
    Derivatives.forEach((derivative) => {
        if (!uniqueHash.hasOwnProperty(derivative)) {
            newlySelectedArr.push(derivative);
        }
    });
    if (Derivatives && Derivatives.length > 0 && newlySelectedArr.length > 0) {
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (SO) {
            for (const newlySelected of newlySelectedArr) {
                const xref: DBAPI.SystemObjectXref = new DBAPI.SystemObjectXref({
                    idSystemObjectMaster: SO.idSystemObject,
                    idSystemObjectDerived: newlySelected,
                    idSystemObjectXref: 0
                });
                if (!await xref.create()) {
                    LOG.error(`updateDerivedObjects failed to create SystemObjectXref ${JSON.stringify(xref)}`, LOG.LS.eGQL);
                    continue;
                }
            }
        } else {
            LOG.error(`updateDerivedObjects failed to fetch system object ${idSystemObject}`, LOG.LS.eGQL);
            return { success: false };
        }
    }
    return { success: true };
}