/* eslint-disable camelcase */
import { PrismaClient, AccessContext } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createAccessContext(prisma: PrismaClient, accessContext: AccessContext): Promise<AccessContext | null> {
    let createSystemObject: AccessContext;
    const { Global, Authoritative, CaptureData, Model, Scene, IntermediaryFile } = accessContext;
    try {
        createSystemObject = await prisma.accessContext.create({
            data: {
                Global,
                Authoritative,
                CaptureData,
                Model,
                Scene,
                IntermediaryFile
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createAccessContext', error);
        return null;
    }

    return createSystemObject;
}

export async function fetchAccessContext(prisma: PrismaClient, idAccessContext: number): Promise<AccessContext | null> {
    try {
        return await prisma.accessContext.findOne({ where: { idAccessContext, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessContext', error);
        return null;
    }
}

export async function fetchManyAccessContext(prisma: PrismaClient, idAccessContext: number): Promise<AccessContext[] | null> {
    try {
        // TODO: how to fetch from idAccessContextObject?
        return await prisma.accessContext.findMany({ where: { idAccessContext } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessContext', error);
        return null;
    }
}
