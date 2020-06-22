/* eslint-disable camelcase */
import { PrismaClient, User, UserPersonalizationSystemObject, UserPersonalizationUrl, LicenseAssignment } from '@prisma/client';

export async function fetchUser(prisma: PrismaClient, idUser: number): Promise<User | null> {
    return prisma.user.findOne({ where: { idUser } });
}

export async function fetchUserPersonalizationSystemObjectsForUserID(prisma: PrismaClient, idUser: number): Promise<UserPersonalizationSystemObject[] | null> {
    return prisma.user.findOne({ where: { idUser } }).UserPersonalizationSystemObject();
}

export async function fetchUserPersonalizationUrlsForUserID(prisma: PrismaClient, idUser: number): Promise<UserPersonalizationUrl[] | null> {
    return prisma.user.findOne({ where: { idUser } }).UserPersonalizationUrl();
}

export async function fetchUserForUserPersonalizationSystemObjectID(prisma: PrismaClient, idUserPersonalizationSystemObject: number): Promise<User | null> {
    return prisma.userPersonalizationSystemObject.findOne({ where: { idUserPersonalizationSystemObject } }).User();
}

export async function fetchUserForUserPersonalizationUrlID(prisma: PrismaClient, idUserPersonalizationUrl: number): Promise<User | null> {
    return prisma.userPersonalizationUrl.findOne({ where: { idUserPersonalizationUrl } }).User();
}

export async function fetchLicenseAssignmentsForUserID(prisma: PrismaClient, idUser: number): Promise<LicenseAssignment[] | null> {
    return prisma.user.findOne({ where: { idUser } }).LicenseAssignment();
}

export async function createUser(prisma: PrismaClient, user: User): Promise<User> {
    const { Name, EmailAddress, SecurityID, Active, DateActivated, DateDisabled, WorkflowNotificationTime, EmailSettings } = user;
    const createSystemObject: User = await prisma.user.create({
        data: {
            Name,
            EmailAddress,
            SecurityID,
            Active,
            DateActivated,
            DateDisabled,
            WorkflowNotificationTime,
            EmailSettings
        },
    });

    return createSystemObject;
}

export async function createUserPersonalizationSystemObject(prisma: PrismaClient, userPersonalizationSystemObject: UserPersonalizationSystemObject): Promise<UserPersonalizationSystemObject> {
    const { idUser, idSystemObject, Personalization } = userPersonalizationSystemObject;
    const createSystemObject: UserPersonalizationSystemObject = await prisma.userPersonalizationSystemObject.create({
        data: {
            User:           { connect: { idUser }, },
            SystemObject:   { connect: { idSystemObject }, },
            Personalization,
        },
    });

    return createSystemObject;
}

export async function createUserPersonalizationUrl(prisma: PrismaClient, userPersonalizationUrl: UserPersonalizationUrl): Promise<UserPersonalizationUrl> {
    const { idUser, URL, Personalization } = userPersonalizationUrl;
    const createSystemObject: UserPersonalizationUrl = await prisma.userPersonalizationUrl.create({
        data: {
            User:   { connect: { idUser }, },
            URL,
            Personalization,
        },
    });

    return createSystemObject;
}
