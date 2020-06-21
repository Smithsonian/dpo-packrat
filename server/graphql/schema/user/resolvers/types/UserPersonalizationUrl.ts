/**
 * Type resolver for UserPersonalizationUrl
 */
import { User, UserPersonalizationUrl } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { fetchUserPersonalizationUrlsForUserID } from '../../../../../db';
import { PrismaClient } from '@prisma/client';
import { resolveUserByID } from './User';

const UserPersonalizationUrl = {
    user: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { user } = parent;
        const { prisma } = context;

        return resolveUserByID(prisma, Number.parseInt(user));
    }
};

export async function resolveUserPersonalizationUrlsByUserID(prisma: PrismaClient, userId: number): Promise<UserPersonalizationUrl[] | null> {
    const foundUserPersonalizationUrls = await fetchUserPersonalizationUrlsForUserID(prisma, userId);

    let userPersonalizationUrls;
    if (foundUserPersonalizationUrls) {
        userPersonalizationUrls = foundUserPersonalizationUrls.map(userPersonalizationUrl => {
            const { idUser, idUserPersonalizationUrl, URL, Personalization } = userPersonalizationUrl;
            return {
                id: idUserPersonalizationUrl,
                url: URL,
                personalization: Personalization,
                user: idUser
            };
        });
    }

    return userPersonalizationUrls;
}

export default UserPersonalizationUrl;
