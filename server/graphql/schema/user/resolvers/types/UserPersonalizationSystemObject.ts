/**
 * Type resolver for UserPersonalizationSystemObject
 */
import { User, UserPersonalizationSystemObject } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { fetchUserPersonalizationSystemObjectsForUserID } from '../../../../../db';
import { PrismaClient } from '@prisma/client';
import { resolveUserByID } from './User';

const UserPersonalizationSystemObject = {
    user: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { user } = parent;
        const { prisma } = context;

        return resolveUserByID(prisma, Number.parseInt(user));
    }
};

export async function resolveUserPersonalizationSystemObjectsByUserID(prisma: PrismaClient, userId: number): Promise<UserPersonalizationSystemObject[] | null> {
    const foundUserPersonalizationSystemObjects = await fetchUserPersonalizationSystemObjectsForUserID(prisma, userId);

    let userPersonalizationSystemObjects;
    if (foundUserPersonalizationSystemObjects) {
        userPersonalizationSystemObjects = foundUserPersonalizationSystemObjects.map(personalizationSystemObject => {
            const { idUser, idUserPersonalizationSystemObject, Personalization } = personalizationSystemObject;

            return {
                id: idUserPersonalizationSystemObject,
                personalization: Personalization,
                user: idUser
            };
        });
    }

    return userPersonalizationSystemObjects;
}

export default UserPersonalizationSystemObject;
