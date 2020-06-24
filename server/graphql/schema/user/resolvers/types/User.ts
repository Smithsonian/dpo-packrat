/**
 * Type resolver for User
 */
import { User, UserPersonalizationSystemObject, UserPersonalizationUrl, LicenseAssignment } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { parseUserPersonalizationSystemObjects } from './UserPersonalizationSystemObject';
import { parseUserPersonalizationUrls } from './UserPersonalizationUrl';
import { fetchUser, fetchUserPersonalizationSystemObjectForUserID, fetchUserPersonalizationUrlForUserID, fetchLicenseAssignmentForUserID } from '../../../../../db';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { parseLicenseAssignments } from '../../../license/resolvers/types/LicenseAssignment';

const User = {
    UserPersonalizationSystemObject: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationSystemObject[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return resolveUserPersonalizationSystemObjectByUserID(prisma, Number.parseInt(idUser));
    },
    UserPersonalizationUrl: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationUrl[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return resolveUserPersonalizationUrlByUserID(prisma, Number.parseInt(idUser));
    },
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return resolveLicenseAssignmentByUserID(prisma, Number.parseInt(idUser));
    }
};

export async function resolveUserByID(prisma: PrismaClient, idUser: number): Promise<User | null> {
    const foundUser = await fetchUser(prisma, idUser);

    return parseUser(foundUser);
}

export async function resolveUserPersonalizationSystemObjectByUserID(prisma: PrismaClient, idUser: number): Promise<UserPersonalizationSystemObject[] | null> {
    const foundUserPersonalizationSystemObjects = await fetchUserPersonalizationSystemObjectForUserID(prisma, idUser);

    return parseUserPersonalizationSystemObjects(foundUserPersonalizationSystemObjects);
}

export async function resolveUserPersonalizationUrlByUserID(prisma: PrismaClient, idUser: number): Promise<UserPersonalizationUrl[] | null> {
    const foundUserPersonalizationUrls = await fetchUserPersonalizationUrlForUserID(prisma, idUser);

    return parseUserPersonalizationUrls(foundUserPersonalizationUrls);
}

export async function resolveLicenseAssignmentByUserID(prisma: PrismaClient, idUser: number): Promise<LicenseAssignment[] | null> {
    const foundLicenseAssignments = await fetchLicenseAssignmentForUserID(prisma, idUser);

    return parseLicenseAssignments(foundLicenseAssignments);
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
