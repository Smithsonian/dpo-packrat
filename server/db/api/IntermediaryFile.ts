/* eslint-disable camelcase */
import { PrismaClient, IntermediaryFile, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createIntermediaryFile(prisma: PrismaClient, intermediaryFile: IntermediaryFile): Promise<IntermediaryFile | null> {
    let createSystemObject: IntermediaryFile;
    const { idAsset, DateCreated } = intermediaryFile;
    try {
        createSystemObject = await prisma.intermediaryFile.create({
            data: {
                Asset:          { connect: { idAsset }, },
                DateCreated,
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createIntermediaryFile', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchIntermediaryFile(prisma: PrismaClient, idIntermediaryFile: number): Promise<IntermediaryFile | null> {
    try {
        return await prisma.intermediaryFile.findOne({ where: { idIntermediaryFile, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchIntermediaryFile', error);
        return null;
    }
}

export async function fetchSystemObjectForIntermediaryFile(prisma: PrismaClient, sysObj: IntermediaryFile): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idIntermediaryFile: sysObj.idIntermediaryFile, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForIntermediaryFile', error);
        return null;
    }
}

export async function fetchSystemObjectForIntermediaryFileID(prisma: PrismaClient, idIntermediaryFile: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idIntermediaryFile, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForIntermediaryFileID', error);
        return null;
    }
}

export async function fetchSystemObjectAndIntermediaryFile(prisma: PrismaClient, idIntermediaryFile: number): Promise<SystemObject & { IntermediaryFile: IntermediaryFile | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idIntermediaryFile, }, include: { IntermediaryFile: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndIntermediaryFile', error);
        return null;
    }
}

