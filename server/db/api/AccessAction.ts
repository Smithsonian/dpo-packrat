/* eslint-disable camelcase */
import { PrismaClient, AccessAction, AccessRole } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createAccessAction(prisma: PrismaClient, accessAction: AccessAction): Promise<AccessAction | null> {
    let createSystemObject: AccessAction;
    const { Name, SortOrder } = accessAction;
    try {
        createSystemObject = await prisma.accessAction.create({
            data: {
                Name,
                SortOrder,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createAccessAction', error);
        return null;
    }

    return createSystemObject;
}

export async function fetchAccessAction(prisma: PrismaClient, idAccessAction: number): Promise<AccessAction | null> {
    try {
        return await prisma.accessAction.findOne({ where: { idAccessAction, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessAction', error);
        return null;
    }
}

export async function fetchAccessRoleFromXref(prisma: PrismaClient, idAccessAction: number): Promise<AccessRole[] | null> {
    try {
        return await prisma.accessRole.findMany({
            where: {
                AccessRoleAccessActionXref: {
                    some: { idAccessAction },
                },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessRoleFromXref', error);
        return null;
    }
}