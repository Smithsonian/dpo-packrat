/* eslint-disable camelcase */
import { PrismaClient, AccessRoleAccessActionXref } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createAccessRoleAccessActionXref(prisma: PrismaClient, accessRoleAccessActionXref: AccessRoleAccessActionXref): Promise<AccessRoleAccessActionXref | null> {
    let createSystemObject: AccessRoleAccessActionXref;
    const { idAccessRole, idAccessAction } = accessRoleAccessActionXref;
    try {
        createSystemObject = await prisma.accessRoleAccessActionXref.create({
            data: {
                AccessRole:     { connect: { idAccessRole }, },
                AccessAction:   { connect: { idAccessAction }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createAccessRoleAccessActionXref', error);
        return null;
    }

    return createSystemObject;
}

export async function fetchAccessRoleAccessActionXref(prisma: PrismaClient, idAccessRoleAccessActionXref: number): Promise<AccessRoleAccessActionXref | null> {
    try {
        return await prisma.accessRoleAccessActionXref.findOne({ where: { idAccessRoleAccessActionXref, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAccessRoleAccessActionXref', error);
        return null;
    }
}