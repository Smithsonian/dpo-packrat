/* eslint-disable camelcase */
import { PrismaClient, SystemObjectXref } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createSystemObjectXref(prisma: PrismaClient, systemObjectXref: SystemObjectXref): Promise<SystemObjectXref | null> {
    let createSystemObject: SystemObjectXref;
    const { idSystemObjectMaster, idSystemObjectDerived } = systemObjectXref;
    try {
        createSystemObject = await prisma.systemObjectXref.create({
            data: {
                SystemObject_SystemObjectToSystemObjectXref_idSystemObjectMaster:  { connect: { idSystemObject: idSystemObjectMaster }, },
                SystemObject_SystemObjectToSystemObjectXref_idSystemObjectDerived: { connect: { idSystemObject: idSystemObjectDerived }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createSystemObjectXref', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchSystemObjectXref(prisma: PrismaClient, idSystemObjectXref: number): Promise<SystemObjectXref | null> {
    try {
        return await prisma.systemObjectXref.findOne({ where: { idSystemObjectXref, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectXref', error);
        return null;
    }
}

