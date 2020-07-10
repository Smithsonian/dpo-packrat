/**
 * Type resolver for AccessAction
 */
import { AccessRole } from '@prisma/client';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessAction = {
    AccessRole: async (parent: Parent): Promise<AccessRole[] | null> => {
        return await DBAPI.AccessRole.fetchFromXref(parent.idAccessAction);
    }
};

export default AccessAction;
