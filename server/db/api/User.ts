/* eslint-disable camelcase */
import { PrismaClient, User, UserPersonalizationSystemObject, UserPersonalizationUrl, LicenseAssignment } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function fetchUser(prisma: PrismaClient, idUser: number): Promise<User | null> {
    try {
        return await prisma.user.findOne({ where: { idUser } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUser', error);
        return null;
    }
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

export async function createUser(prisma: PrismaClient, user: User): Promise<User | null> {
    let createSystemObject: User;
    const { Name, EmailAddress, SecurityID, Active, DateActivated, DateDisabled, WorkflowNotificationTime, EmailSettings } = user;
    try {
        createSystemObject = await prisma.user.create({
            data: {
                Name,
                EmailAddress,
                SecurityID,
                Active,
                DateActivated,
                DateDisabled,
                WorkflowNotificationTime,
                EmailSettings
            }
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createUser', error);
        return null;
    }
    return createSystemObject;
}
