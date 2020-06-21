/* eslint-disable camelcase */
import { PrismaClient, AccessAction, AccessContext, AccessContextObject, AccessPolicy, AccessRole, AccessRoleAccessActionXref } from '@prisma/client';
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