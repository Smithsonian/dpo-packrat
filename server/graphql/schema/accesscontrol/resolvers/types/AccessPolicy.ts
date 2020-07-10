/**
 * Type resolver for AccessPolicy
 */
import { User } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AccessPolicy = {
    AccessContext: async (parent: Parent): Promise<DBAPI.AccessContext | null> => {
        return await DBAPI.AccessContext.fetch(parent.idAccessContext);
    },
    AccessRole: async (parent: Parent): Promise<DBAPI.AccessRole | null> => {
        return await DBAPI.AccessRole.fetch(parent.idAccessRole);
    },
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUser);
    }
};

export default AccessPolicy;
