/**
 * Type resolver for UserPersonalizationSystemObject
 */
import { User, UserPersonalizationSystemObject } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { fetchUserPersonalizationSystemObjectsForUserID, fetchUserForUserPersonalizationSystemObjectID } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { parseUser } from './User';

const UserPersonalizationSystemObject = {
    user: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveUserForUserPersonalizationSystemObjectID(prisma, Number.parseInt(id));
    }
};

export async function resolveUserForUserPersonalizationSystemObjectID(prisma: PrismaClient, userPersonalizationSystemObjectId: number): Promise<User | null> {
    const foundUser = await fetchUserForUserPersonalizationSystemObjectID(prisma, userPersonalizationSystemObjectId);

    return parseUser(foundUser);
}

export async function resolveUserPersonalizationSystemObjectsByUserID(prisma: PrismaClient, userId: number): Promise<UserPersonalizationSystemObject[] | null> {
    const foundUserPersonalizationSystemObjects = await fetchUserPersonalizationSystemObjectsForUserID(prisma, userId);

    return parseUserPersonalizationSystemObjects(foundUserPersonalizationSystemObjects);
}

export async function parseUserPersonalizationSystemObjects(foundUserPersonalizationSystemObjects: DB.UserPersonalizationSystemObject[] | null): Promise<UserPersonalizationSystemObject[] | null> {
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
