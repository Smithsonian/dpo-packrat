/**
 * Type resolver for UserPersonalizationSystemObject
 */
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { User, SystemObject } from '@prisma/client';
import * as DBAPI from '../../../../../db';

const UserPersonalizationSystemObject = {
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUser);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObject(prisma, idSystemObject);
    }
};

export default UserPersonalizationSystemObject;
