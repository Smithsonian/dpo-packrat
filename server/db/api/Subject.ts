/* eslint-disable camelcase */
import { PrismaClient, Subject, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createSubject(prisma: PrismaClient, subject: Subject): Promise<Subject | null> {
    let createSystemObject: Subject;
    const { idUnit, idAssetThumbnail, idGeoLocation, Name } = subject;
    try {
        createSystemObject = await prisma.subject.create({
            data: {
                Unit:           { connect: { idUnit }, },
                Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                Name,
                SystemObject:   { create: { Retired: false }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createSubject', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchSubject(prisma: PrismaClient, idSubject: number): Promise<Subject | null> {
    try {
        return await prisma.subject.findOne({ where: { idSubject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSubject', error);
        return null;
    }
}

export async function fetchSystemObjectForSubject(prisma: PrismaClient, sysObj: Subject): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idSubject: sysObj.idSubject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForSubject', error);
        return null;
    }
}

export async function fetchSystemObjectForSubjectID(prisma: PrismaClient, idSubject: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idSubject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForSubjectID', error);
        return null;
    }
}

export async function fetchSystemObjectAndSubject(prisma: PrismaClient, idSubject: number): Promise<SystemObject & { Subject: Subject | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idSubject, }, include: { Subject: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndSubject', error);
        return null;
    }
}

export async function fetchSubjectFromUnit(prisma: PrismaClient, idUnit: number): Promise<Subject[] | null> {
    try {
        return await prisma.subject.findMany({ where: { idUnit } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSubjectFromUnit', error);
        return null;
    }
}
