/**
 * Type resolver for AccessContext
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessContext = {
    AccessContextObject: async (parent: Parent): Promise<DBAPI.AccessContextObject[] | null> => {
        return await DBAPI.AccessContextObject.fetchFromAccessContext(parent.idAccessContext);
    },
    AccessPolicy: async (parent: Parent): Promise<DBAPI.AccessPolicy[] | null> => {
        return await DBAPI.AccessPolicy.fetchFromAccessContext(parent.idAccessContext);
    }
};

export default AccessContext;
