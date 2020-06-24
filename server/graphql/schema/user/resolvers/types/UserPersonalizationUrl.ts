/**
 * Type resolver for UserPersonalizationUrl
 */
import { User, UserPersonalizationUrl } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { fetchUserForUserPersonalizationUrlID } from '../../../../../db';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { parseUser } from './User';

const UserPersonalizationUrl = {
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUserPersonalizationUrl } = parent;
        const { prisma } = context;

        return resolveUserForUserPersonalizationUrlID(prisma, Number.parseInt(idUserPersonalizationUrl));
    }
};

export async function resolveUserForUserPersonalizationUrlID(prisma: PrismaClient, idUserPersonalizationUrl: number): Promise<User | null> {
    const foundUser = await fetchUserForUserPersonalizationUrlID(prisma, idUserPersonalizationUrl);

    return parseUser(foundUser);
}

export function parseUserPersonalizationUrls(foundUserPersonalizationUrls: DB.UserPersonalizationUrl[] | null): UserPersonalizationUrl[] | null {
    let userPersonalizationUrls;
    if (foundUserPersonalizationUrls) {
        userPersonalizationUrls = foundUserPersonalizationUrls.map(userPersonalizationUrl => parseUserPersonalizationUrl(userPersonalizationUrl));
    }

    return userPersonalizationUrls;
}

export function parseUserPersonalizationUrl(foundUserPersonalizationUrl: DB.UserPersonalizationUrl | null): UserPersonalizationUrl | null {
    let userPersonalizationUrl;
    if (foundUserPersonalizationUrl) {
        const { idUserPersonalizationUrl, URL, Personalization } = foundUserPersonalizationUrl;
        return {
            idUserPersonalizationUrl: String(idUserPersonalizationUrl),
            URL,
            Personalization
        };
    }

    return userPersonalizationUrl;
}

export default UserPersonalizationUrl;
