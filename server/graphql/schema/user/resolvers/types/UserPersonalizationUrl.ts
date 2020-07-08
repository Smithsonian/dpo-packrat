/**
 * Type resolver for UserPersonalizationUrl
 */
import { User } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const UserPersonalizationUrl = {
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUser);
    }
};

export default UserPersonalizationUrl;
