/* eslint-disable camelcase */
import { PrismaClient, Unit, SystemObject, Subject, Actor } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createUnit(prisma: PrismaClient, unit: Unit): Promise<Unit | null> {
    let createSystemObject: Unit;
    const { Name, Abbreviation, ARKPrefix } = unit;
    try {
        createSystemObject = await prisma.unit.create({
            data: {
                Name,
                Abbreviation,
                ARKPrefix,
                SystemObject:   { create: { Retired: false }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createUnit', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchUnit(prisma: PrismaClient, idUnit: number): Promise<Unit | null> {
    try {
        return await prisma.unit.findOne({ where: { idUnit, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchUnit', error);
        return null;
    }
}

export async function fetchSubjectForUnitID(prisma: PrismaClient, idUnit: number): Promise<Subject[] | null> {
    try {
        return await prisma.unit.findOne({ where: { idUnit } }).Subject();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSubjectForUnitID', error);
        return null;
    }
}

export async function fetchActorForUnitID(prisma: PrismaClient, idUnit: number): Promise<Actor[] | null> {
    try {
        return await prisma.unit.findOne({ where: { idUnit } }).Actor();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchActorForUnitID', error);
        return null;
    }
}

export async function fetchSystemObjectForUnit(prisma: PrismaClient, sysObj: Unit): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idUnit: sysObj.idUnit, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForUnit', error);
        return null;
    }
}

export async function fetchSystemObjectForUnitID(prisma: PrismaClient, idUnit: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idUnit, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForUnitID', error);
        return null;
    }
}

export async function fetchSystemObjectAndUnit(prisma: PrismaClient, idUnit: number): Promise<SystemObject & { Unit: Unit | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idUnit, }, include: { Unit: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndUnit', error);
        return null;
    }
}
