/**
 * Type resolver for AccessRole
 */
import { AccessAction } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessRole = {
    AccessAction: async (parent: Parent, _: Args, context: Context): Promise<AccessAction[] | null> => {
        const { idAccessRole } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAccessActionFromXref(prisma, idAccessRole);
    }
};

export default AccessRole;
