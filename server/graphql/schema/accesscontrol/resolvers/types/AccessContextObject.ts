/**
 * Type resolver for AccessContextObject
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessContextObject = {
    AccessContext: async (parent: Parent): Promise<DBAPI.AccessContext | null> => {
        return await DBAPI.AccessContext.fetch(parent.idAccessContext);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSystemObject);
    }
};

export default AccessContextObject;
