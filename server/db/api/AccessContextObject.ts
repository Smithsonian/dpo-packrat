/* eslint-disable camelcase */
import { PrismaClient, AccessContextObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createAccessContextObject(prisma: PrismaClient, accessContextObject: AccessContextObject): Promise<AccessContextObject | null> {
    let createSystemObject: AccessContextObject;
    const { idAccessContext, idSystemObject } = accessContextObject;
    try {
        createSystemObject = await prisma.accessContextObject.create({
            data: {
                AccessContext: { connect: { idAccessContext }, },
                SystemObject:  { connect: { idSystemObject }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createAccessContextObject', error);
        return null;
    }

    return createSystemObject;
}

export async function fetchAccessContextObject(prisma: PrismaClient, idAccessContextObject: number): Promise<AccessContextObject | null> {
    try {
        return await prisma.accessContextObject.findOne({ where: { idAccessContextObject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessContextObject', error);
        return null;
    }
}

export async function fetchAccessContextObjectFromAccessContext(prisma: PrismaClient, idAccessContext: number): Promise<AccessContextObject[] | null> {
    try {
        return await prisma.accessContextObject.findMany({ where: { idAccessContext } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessContextObjectFromAccessContext', error);
        return null;
    }
}

export async function fetchAccessContextObjectFromSystemObject(prisma: PrismaClient, idSystemObject: number): Promise<AccessContextObject[] | null> {
    try {
        return await prisma.accessContextObject.findMany({ where: { idSystemObject } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessContextObjectFromAccessContext', error);
        return null;
    }
}