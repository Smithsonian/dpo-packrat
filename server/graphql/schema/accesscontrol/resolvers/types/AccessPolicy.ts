/**
 * Type resolver for AccessPolicy
 */
import { AccessContext, AccessRole, User } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessPolicy = {
    AccessContext: async (parent: Parent, _: Args, context: Context): Promise<AccessContext | null> => {
        const { idAccessContext } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAccessContext(prisma, idAccessContext);
    },
    AccessRole: async (parent: Parent, _: Args, context: Context): Promise<AccessRole | null> => {
        const { idAccessRole } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAccessRole(prisma, idAccessRole);
    },
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUser);
    }
};

export default AccessPolicy;
