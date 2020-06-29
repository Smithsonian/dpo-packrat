/* eslint-disable camelcase */
import { PrismaClient, AccessAction, AccessRole } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createAccessRole(prisma: PrismaClient, accessRole: AccessRole): Promise<AccessRole | null> {
    let createSystemObject: AccessRole;
    const { Name } = accessRole;
    try {
        createSystemObject = await prisma.accessRole.create({
            data: {
                Name
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createAccessRole', error);
        return null;
    }

    return createSystemObject;
}

export async function fetchAccessRole(prisma: PrismaClient, idAccessRole: number): Promise<AccessRole | null> {
    try {
        return await prisma.accessRole.findOne({ where: { idAccessRole, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessRole', error);
        return null;
    }
}

export async function fetchAccessActionFromXref(prisma: PrismaClient, idAccessRole: number): Promise<AccessAction[] | null> {
    try {
        return await prisma.accessAction.findMany({
            where: {
                AccessRoleAccessActionXref: {
                    some: { idAccessRole },
                },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessActionFromXref', error);
        return null;
    }
}