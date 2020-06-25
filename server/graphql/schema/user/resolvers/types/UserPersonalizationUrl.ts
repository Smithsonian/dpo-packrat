/**
 * Type resolver for UserPersonalizationUrl
 */
import { User } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const UserPersonalizationUrl = {
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUserPersonalizationUrl } = parent;
        const { prisma } = context;

        return prisma.userPersonalizationUrl.findOne({ where: { idUserPersonalizationUrl: Number.parseInt(idUserPersonalizationUrl) } }).User();
    }
};

export default UserPersonalizationUrl;
