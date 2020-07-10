/**
 * Type resolver for AccessRole
 */
import { AccessAction } from '@prisma/client';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessRole = {
    AccessAction: async (parent: Parent): Promise<AccessAction[] | null> => {
        return await DBAPI.AccessAction.fetchFromXref(parent.idAccessRole);
    }
};

export default AccessRole;
