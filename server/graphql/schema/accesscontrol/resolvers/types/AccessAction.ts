/**
 * Type resolver for AccessAction
 */
import { AccessRole } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessAction = {
    AccessRole: async (parent: Parent, _: Args, context: Context): Promise<AccessRole[] | null> => {
        const { idAccessAction } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAccessRoleFromXref(prisma, idAccessAction);
    }
};

export default AccessAction;
