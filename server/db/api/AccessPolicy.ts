/* eslint-disable camelcase */
import { PrismaClient, AccessPolicy } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createAccessPolicy(prisma: PrismaClient, accessPolicy: AccessPolicy): Promise<AccessPolicy | null> {
    let createSystemObject: AccessPolicy;
    const { idUser, idAccessRole, idAccessContext } = accessPolicy;
    try {
        createSystemObject = await prisma.accessPolicy.create({
            data: {
                User:           { connect: { idUser }, },
                AccessRole:     { connect: { idAccessRole }, },
                AccessContext:  { connect: { idAccessContext }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createAccessPolicy', error);
        return null;
    }

    return createSystemObject;
}

export async function fetchAccessPolicy(prisma: PrismaClient, idAccessPolicy: number): Promise<AccessPolicy | null> {
    try {
        return await prisma.accessPolicy.findOne({ where: { idAccessPolicy, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessPolicy', error);
        return null;
    }
}

export async function fetchAccessPolicyFromAccessContext(prisma: PrismaClient, idAccessContext: number): Promise<AccessPolicy[] | null> {
    try {
        return await prisma.accessPolicy.findMany({ where: { idAccessContext } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessPolicyFromAccessContext', error);
        return null;
    }
}

export async function fetchAccessPolicyFromUser(prisma: PrismaClient, idUser: number): Promise<AccessPolicy[] | null> {
    try {
        return await prisma.accessPolicy.findMany({ where: { idUser } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessPolicyFromUser', error);
        return null;
    }
}