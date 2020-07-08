/* eslint-disable camelcase */
import { PrismaClient, UserPersonalizationSystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

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

export async function fetchUserPersonalizationSystemObject(prisma: PrismaClient, idUserPersonalizationSystemObject: number): Promise<UserPersonalizationSystemObject | null> {
    try {
        return await prisma.userPersonalizationSystemObject.findOne({ where: { idUserPersonalizationSystemObject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUserPersonalizationSystemObject', error);
        return null;
    }
}

export async function fetchUserPersonalizationSystemObjectFromUser(prisma: PrismaClient, idUser: number): Promise<UserPersonalizationSystemObject[] | null> {
    try {
        return await prisma.userPersonalizationSystemObject.findMany({ where: { idUser } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUserPersonalizationSystemObjectFromUser', error);
        return null;
    }
}

export async function fetchUserPersonalizationSystemObjectFromSystemObject(prisma: PrismaClient, idSystemObject: number): Promise<UserPersonalizationSystemObject[] | null> {
    try {
        return await prisma.userPersonalizationSystemObject.findMany({ where: { idSystemObject } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUserPersonalizationSystemObjectFromSystemObject', error);
        return null;
    }
}