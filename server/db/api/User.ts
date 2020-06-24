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

export async function fetchUserPersonalizationSystemObjectForUserID(prisma: PrismaClient, idUser: number): Promise<UserPersonalizationSystemObject[] | null> {
    try {
        return await prisma.user.findOne({ where: { idUser } }).UserPersonalizationSystemObject();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUserPersonalizationSystemObjectForUserID', error);
        return null;
    }
}

export async function fetchUserPersonalizationUrlForUserID(prisma: PrismaClient, idUser: number): Promise<UserPersonalizationUrl[] | null> {
    try {
        return await prisma.user.findOne({ where: { idUser } }).UserPersonalizationUrl();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUserPersonalizationUrlForUserID', error);
        return null;
    }
}

export async function fetchLicenseAssignmentForUserID(prisma: PrismaClient, idUser: number): Promise<LicenseAssignment[] | null> {
    try {
        return await prisma.user.findOne({ where: { idUser } }).LicenseAssignment();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchLicenseAssignmentForUserID', error);
        return null;
    }
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
