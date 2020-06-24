/**
 * Type resolver for User
 */
import { User, UserPersonalizationSystemObject, UserPersonalizationUrl, LicenseAssignment } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { parseUserPersonalizationSystemObjects } from './UserPersonalizationSystemObject';
import { parseUserPersonalizationUrls } from './UserPersonalizationUrl';
import { fetchUser, fetchUserPersonalizationSystemObjectForUserID, fetchUserPersonalizationUrlForUserID } from '../../../../../db';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { resolveLicenseAssignmentByUserID } from '../../../license/resolvers/types/LicenseAssignment';

const User = {
    UserPersonalizationSystemObject: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationSystemObject[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveUserPersonalizationSystemObjectByUserID(prisma, Number.parseInt(id));
    },
    UserPersonalizationUrl: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationUrl[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveUserPersonalizationUrlByUserID(prisma, Number.parseInt(id));
    },
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveLicenseAssignmentByUserID(prisma, Number.parseInt(id));
    }
};

export async function resolveUserByID(prisma: PrismaClient, userId: number): Promise<User | null> {
    const foundUser = await fetchUser(prisma, userId);

    return parseUser(foundUser);
}

export async function resolveUserPersonalizationSystemObjectByUserID(prisma: PrismaClient, userId: number): Promise<UserPersonalizationSystemObject[] | null> {
    const foundUserPersonalizationSystemObjects = await fetchUserPersonalizationSystemObjectForUserID(prisma, userId);

    return parseUserPersonalizationSystemObjects(foundUserPersonalizationSystemObjects);
}

export async function resolveUserPersonalizationUrlByUserID(prisma: PrismaClient, userId: number): Promise<UserPersonalizationUrl[] | null> {
    const foundUserPersonalizationUrls = await fetchUserPersonalizationUrlForUserID(prisma, userId);

    return parseUserPersonalizationUrls(foundUserPersonalizationUrls);
}

export async function parseUser(foundUser: DB.User | null): Promise<User | null> {
    let user;
    if (foundUser) {
        const { idUser, Name, EmailAddress, SecurityID, Active, DateActivated, DateDisabled, WorkflowNotificationTime, EmailSettings } = foundUser;
        user = {
            idUser: String(idUser),
            Name,
            EmailAddress,
            SecurityID,
            Active: Boolean(Active),
            DateActivated,
            DateDisabled,
            WorkflowNotificationTime,
            EmailSettings
        };
    }

    return user;
}

export default User;
