/**
 * Type resolver for AccessRole
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessRole = {
    AccessAction: async (parent: Parent): Promise<DBAPI.AccessAction[] | null> => {
        return await DBAPI.AccessAction.fetchFromXref(parent.idAccessRole);
    }
};

export default AccessRole;
