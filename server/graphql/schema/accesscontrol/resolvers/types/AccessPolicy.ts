/**
 * Type resolver for AccessPolicy
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessPolicy = {
    AccessContext: async (parent: Parent): Promise<DBAPI.AccessContext | null> => {
        return await DBAPI.AccessContext.fetch(parent.idAccessContext);
    },
    AccessRole: async (parent: Parent): Promise<DBAPI.AccessRole | null> => {
        return await DBAPI.AccessRole.fetch(parent.idAccessRole);
    },
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUser);
    }
};

export default AccessPolicy;
