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
