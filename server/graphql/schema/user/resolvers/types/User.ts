/**
 * Type resolver for User
 */
import { User, UserPersonalizationSystemObject, UserPersonalizationUrl, LicenseAssignment } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { resolveUserPersonalizationSystemObjectsByUserID } from './UserPersonalizationSystemObject';
import { resolveUserPersonalizationUrlsByUserID } from './UserPersonalizationUrl';
import { fetchUser } from '../../../../../db';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { resolveLicenseAssignmentsByUserID } from '../../../license/resolvers/types/LicenseAssignment';

const User = {
    userPersonalizationSystemObjects: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationSystemObject[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveUserPersonalizationSystemObjectsByUserID(prisma, Number.parseInt(id));
    },
    userPersonalizationUrls: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationUrl[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveUserPersonalizationUrlsByUserID(prisma, Number.parseInt(id));
    },
    licenseAssignments: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveLicenseAssignmentsByUserID(prisma, Number.parseInt(id));
    }
};

export async function resolveUserByID(prisma: PrismaClient, userId: number): Promise<User | null> {
    const foundUser = await fetchUser(prisma, userId);

    return parseUser(foundUser);
}

export async function parseUser(foundUser: DB.User | null): Promise<User | null> {
    let user;
    if (foundUser) {
        const { idUser, Name, EmailAddress, SecurityID, Active, DateActivated, DateDisabled, WorkflowNotificationTime, EmailSettings } = foundUser;
        user = {
            id: String(idUser),
            name: Name,
            emailAddress: EmailAddress,
            securityId: SecurityID,
            active: Boolean(Active),
            dateActivated: DateActivated,
            dateDisabled: DateDisabled,
            workflowNotificationTime: WorkflowNotificationTime,
            emailSettings: EmailSettings
        };
    }

    return user;
}

export default User;
