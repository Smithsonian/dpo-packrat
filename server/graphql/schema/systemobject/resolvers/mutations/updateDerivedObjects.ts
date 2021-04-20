import { UpdateDerivedObjectsResult, MutationUpdateDerivedObjectsArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function updateDerivedObjects(_: Parent, args: MutationUpdateDerivedObjectsArgs): Promise<UpdateDerivedObjectsResult> {
    const { input } = args;
    const { idSystemObject, Derivatives } = input;
    if (Derivatives && Derivatives.length > 0) {
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (SO) {
            for (const derivative of Derivatives) {
                const xref: DBAPI.SystemObjectXref = new DBAPI.SystemObjectXref({
                    idSystemObjectMaster: SO.idSystemObject,
                    idSystemObjectDerived: derivative,
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