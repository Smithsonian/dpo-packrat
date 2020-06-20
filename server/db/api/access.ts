/* eslint-disable camelcase */
import { PrismaClient, AccessAction, AccessContext, AccessContextObject, AccessPolicy, AccessRole, AccessRoleAccessActionXref } from '@prisma/client';

export async function createAccessAction(prisma: PrismaClient, accessAction: AccessAction): Promise<AccessAction> {
    const { Name, SortOrder } = accessAction;
    const createSystemObject: AccessAction = await prisma.accessAction.create({
        data: {
            Name,
            SortOrder,
        },
    });

    return createSystemObject;
}

export async function createAccessContext(prisma: PrismaClient, accessContext: AccessContext): Promise<AccessContext> {
    const { Global, Authoritative, CaptureData, Model, Scene, IntermediaryFile } = accessContext;
    const createSystemObject: AccessContext = await prisma.accessContext.create({
        data: {
            Global,
            Authoritative,
            CaptureData,
            Model,
            Scene,
            IntermediaryFile
        },
    });

    return createSystemObject;
}

export async function createAccessContextObject(prisma: PrismaClient, accessContextObject: AccessContextObject): Promise<AccessContextObject> {
    const { idAccessContext, idSystemObject } = accessContextObject;
    const createSystemObject: AccessContextObject = await prisma.accessContextObject.create({
        data: {
            AccessContext: { connect: { idAccessContext }, },
            SystemObject:  { connect: { idSystemObject }, },
        },
    });

    return createSystemObject;
}

export async function createAccessPolicy(prisma: PrismaClient, accessPolicy: AccessPolicy): Promise<AccessPolicy> {
    const { idUser, idAccessRole, idAccessContext } = accessPolicy;
    const createSystemObject: AccessPolicy = await prisma.accessPolicy.create({
        data: {
            User:           { connect: { idUser }, },
            AccessRole:     { connect: { idAccessRole }, },
            AccessContext:  { connect: { idAccessContext }, },
        },
    });

    return createSystemObject;
}

export async function createAccessRole(prisma: PrismaClient, accessRole: AccessRole): Promise<AccessRole> {
    const { Name } = accessRole;
    const createSystemObject: AccessRole = await prisma.accessRole.create({
        data: {
            Name
        },
    });

    return createSystemObject;
}

export async function createAccessRoleAccessActionXref(prisma: PrismaClient, accessRoleAccessActionXref: AccessRoleAccessActionXref): Promise<AccessRoleAccessActionXref> {
    const { idAccessRole, idAccessAction } = accessRoleAccessActionXref;
    const createSystemObject: AccessRoleAccessActionXref = await prisma.accessRoleAccessActionXref.create({
        data: {
            AccessRole:     { connect: { idAccessRole }, },
            AccessAction:   { connect: { idAccessAction }, },
        },
    });

    return createSystemObject;
}