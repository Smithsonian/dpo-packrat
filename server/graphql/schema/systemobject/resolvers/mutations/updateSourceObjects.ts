import { UpdateSourceObjectsResult, MutationUpdateSourceObjectsArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function updateSourceObjects(_: Parent, args: MutationUpdateSourceObjectsArgs): Promise<UpdateSourceObjectsResult> {
    const { input } = args;
    const { idSystemObject, Sources } = input;
    if (Sources && Sources.length > 0) {
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (SO) {
            for (const source of Sources) {
                const xref: DBAPI.SystemObjectXref = new DBAPI.SystemObjectXref({
                    idSystemObjectMaster: source,
                    idSystemObjectDerived: SO.idSystemObject,
                    idSystemObjectXref: 0
                });
                if (!await xref.create()) {
                    LOG.error(`updateSourceObjects failed to create SystemObjectXref ${JSON.stringify(xref)}`, LOG.LS.eGQL);
                    continue;
                }
            }
        } else {
            LOG.error(`updateSourceObjects failed to fetch system object ${idSystemObject}`, LOG.LS.eGQL);
            return { success: false };
        }
    }
    return { success: true };
}