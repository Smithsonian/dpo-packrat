/* eslint-disable camelcase */
import { PrismaClient, User } from '@prisma/client';
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

export async function fetchUser(prisma: PrismaClient, idUser: number): Promise<User | null> {
    try {
        return await prisma.user.findOne({ where: { idUser, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUser', error);
        return null;
    }
}
