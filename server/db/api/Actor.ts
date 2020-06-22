/* eslint-disable camelcase */
import { PrismaClient, Actor, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createActor(prisma: PrismaClient, actor: Actor): Promise<Actor | null> {
    let createSystemObject: Actor;
    const { IndividualName, OrganizationName, idUnit } = actor;
    try {
        createSystemObject = await prisma.actor.create({
            data: {
                IndividualName,
                OrganizationName,
                Unit:               idUnit ? { connect: { idUnit }, } : undefined,
                SystemObject:       { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createActor', error);
        return null;
    }

    return createSystemObject;
}

export async function fetchActor(prisma: PrismaClient, idActor: number): Promise<Actor | null> {
    try {
        return await prisma.actor.findOne({ where: { idActor, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchActor', error);
        return null;
    }
}

export async function fetchSystemObjectForActor(prisma: PrismaClient, sysObj: Actor): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idActor: sysObj.idActor, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForActor', error);
        return null;
    }
}

export async function fetchSystemObjectForActorID(prisma: PrismaClient, idActor: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idActor, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForActorID', error);
        return null;
    }
}

export async function fetchSystemObjectAndActor(prisma: PrismaClient, idActor: number): Promise<SystemObject & { Actor: Actor | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idActor, }, include: { Actor: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndActor', error);
        return null;
    }
}
