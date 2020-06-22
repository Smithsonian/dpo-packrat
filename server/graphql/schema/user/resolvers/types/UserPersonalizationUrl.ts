/**
 * Type resolver for UserPersonalizationUrl
 */
import { User, UserPersonalizationUrl } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { fetchUserPersonalizationUrlsForUserID, fetchUserForUserPersonalizationUrlID } from '../../../../../db';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { parseUser } from './User';

const UserPersonalizationUrl = {
    user: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveUserForUserPersonalizationUrlID(prisma, Number.parseInt(id));
    }
};

export async function resolveUserForUserPersonalizationUrlID(prisma: PrismaClient, userPersonalizationUrlId: number): Promise<User | null> {
    const foundUser = await fetchUserForUserPersonalizationUrlID(prisma, userPersonalizationUrlId);

    return parseUser(foundUser);
}

export async function resolveUserPersonalizationUrlsByUserID(prisma: PrismaClient, userId: number): Promise<UserPersonalizationUrl[] | null> {
    const foundUserPersonalizationUrls = await fetchUserPersonalizationUrlsForUserID(prisma, userId);

    return parseUserPersonalizationUrls(foundUserPersonalizationUrls);
}

export async function parseUserPersonalizationUrls(foundUserPersonalizationUrls: DB.UserPersonalizationUrl[] | null): Promise<UserPersonalizationUrl[] | null> {
    let userPersonalizationUrls;
    if (foundUserPersonalizationUrls) {
        userPersonalizationUrls = foundUserPersonalizationUrls.map(userPersonalizationUrl => {
            const { idUserPersonalizationUrl, URL, Personalization } = userPersonalizationUrl;
            return {
                id: idUserPersonalizationUrl,
                url: URL,
                personalization: Personalization
            };
        });
    }

    return userPersonalizationUrls;
}

export default UserPersonalizationUrl;
