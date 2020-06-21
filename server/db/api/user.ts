/* eslint-disable camelcase */
import { PrismaClient, User, UserPersonalizationSystemObject, UserPersonalizationUrl } from '@prisma/client';
import * as LOG from '../../utils/logger';

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
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createUser', error);
        return null;
    }
    return createSystemObject;
}

export async function createUserPersonalizationSystemObject(prisma: PrismaClient, userPersonalizationSystemObject: UserPersonalizationSystemObject): Promise<UserPersonalizationSystemObject | null> {
    let createSystemObject: UserPersonalizationSystemObject;
    const { idUser, idSystemObject, Personalization } = userPersonalizationSystemObject;
    try {
        createSystemObject = await prisma.userPersonalizationSystemObject.create({
            data: {
                User:           { connect: { idUser }, },
                SystemObject:   { connect: { idSystemObject }, },
                Personalization,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createUserPersonalizationSystemObject', error);
        return null;
    }
    return createSystemObject;
}

export async function createUserPersonalizationUrl(prisma: PrismaClient, userPersonalizationUrl: UserPersonalizationUrl): Promise<UserPersonalizationUrl | null> {
    let createSystemObject: UserPersonalizationUrl;
    const { idUser, URL, Personalization } = userPersonalizationUrl;
    try {
        createSystemObject = await prisma.userPersonalizationUrl.create({
            data: {
                User:   { connect: { idUser }, },
                URL,
                Personalization,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createUserPersonalizationUrl', error);
        return null;
    }
    return createSystemObject;
}
