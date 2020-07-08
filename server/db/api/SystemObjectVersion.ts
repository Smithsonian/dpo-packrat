/* eslint-disable camelcase */
import { PrismaClient, SystemObjectVersion } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createSystemObjectVersion(prisma: PrismaClient, systemObjectVersion: SystemObjectVersion): Promise<SystemObjectVersion | null> {
    let createSystemObject: SystemObjectVersion;
    const { idSystemObject, PublishedState } = systemObjectVersion;
    try {
        createSystemObject = await prisma.systemObjectVersion.create({
            data: {
                SystemObject: { connect: { idSystemObject }, },
                PublishedState,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createSystemObjectVersion', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchSystemObjectVersion(prisma: PrismaClient, idSystemObjectVersion: number): Promise<SystemObjectVersion | null> {
    try {
        return await prisma.systemObjectVersion.findOne({ where: { idSystemObjectVersion, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectVersion', error);
        return null;
    }
}

export async function fetchSystemObjectVersionFromSystemObject(prisma: PrismaClient, idSystemObject: number): Promise<SystemObjectVersion[] | null> {
    try {
        return await prisma.systemObjectVersion.findMany({ where: { idSystemObject } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectVersionFromSystemObject', error);
        return null;
    }
}