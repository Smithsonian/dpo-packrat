/* eslint-disable camelcase */
import { PrismaClient,  UserPersonalizationUrl } from '@prisma/client';
import * as LOG from '../../utils/logger';

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

export async function fetchUserPersonalizationUrl(prisma: PrismaClient, idUserPersonalizationUrl: number): Promise<UserPersonalizationUrl | null> {
    try {
        return await prisma.userPersonalizationUrl.findOne({ where: { idUserPersonalizationUrl, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUserPersonalizationUrl', error);
        return null;
    }
}

export async function fetchUserPersonalizationUrlFromUser(prisma: PrismaClient, idUser: number): Promise<UserPersonalizationUrl[] | null> {
    try {
        return await prisma.userPersonalizationUrl.findMany({ where: { idUser } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUserPersonalizationUrlFromUser', error);
        return null;
    }
}