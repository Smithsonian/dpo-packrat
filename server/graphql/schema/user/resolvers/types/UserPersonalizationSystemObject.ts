/**
 * Type resolver for UserPersonalizationSystemObject
 */
import { User, UserPersonalizationSystemObject } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { fetchUserForUserPersonalizationSystemObjectID } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { parseUser } from './User';

const UserPersonalizationSystemObject = {
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveUserForUserPersonalizationSystemObjectID(prisma, Number.parseInt(id));
    }
};

export async function resolveUserForUserPersonalizationSystemObjectID(prisma: PrismaClient, userPersonalizationSystemObjectId: number): Promise<User | null> {
    const foundUser = await fetchUserForUserPersonalizationSystemObjectID(prisma, userPersonalizationSystemObjectId);

    return parseUser(foundUser);
}


export function parseUserPersonalizationSystemObjects(foundUserPersonalizationSystemObjects: DB.UserPersonalizationSystemObject[] | null): UserPersonalizationSystemObject[] | null {
    let userPersonalizationSystemObjects;
    if (foundUserPersonalizationSystemObjects) {
        userPersonalizationSystemObjects = foundUserPersonalizationSystemObjects.map(personalizationSystemObject =>
            parseUserPersonalizationSystemObject(personalizationSystemObject)
        );
    }

    return userPersonalizationSystemObjects;
}

export function parseUserPersonalizationSystemObject(foundUserPersonalizationSystemObject: DB.UserPersonalizationSystemObject | null): UserPersonalizationSystemObject | null {
    let userPersonalizationSystemObject;
    if (foundUserPersonalizationSystemObject) {
        const { idUserPersonalizationSystemObject, Personalization } = foundUserPersonalizationSystemObject;
        userPersonalizationSystemObject = {
            idUserPersonalizationSystemObject: String(idUserPersonalizationSystemObject),
            Personalization,
        };
    }

    return userPersonalizationSystemObject;
}

export default UserPersonalizationSystemObject;
