/* eslint-disable camelcase */
import { PrismaClient, GeoLocation, Item, Project, ProjectDocumentation, Stakeholder, Subject, Unit } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createGeoLocation(prisma: PrismaClient, geoLocation: GeoLocation): Promise<GeoLocation | null> {
    let createSystemObject: GeoLocation;
    const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = geoLocation;
    try {
        createSystemObject = await prisma.geoLocation.create({
            data: {
                Latitude,
                Longitude,
                Altitude,
                TS0,
                TS1,
                TS2,
                R0,
                R1,
                R2,
                R3
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createGeoLocation', error);
        return null;
    }
    return createSystemObject;
}

export async function createItem(prisma: PrismaClient, item: Item): Promise<Item | null> {
    let createSystemObject: Item;
    const { idSubject, idAssetThumbnail, idGeoLocation, Name, EntireSubject } = item;
    try {
        createSystemObject = await prisma.item.create({
            data: {
                Subject:        { connect: { idSubject }, },
                Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                Name,
                EntireSubject,
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createItem', error);
        return null;
    }
    return createSystemObject;
}

export async function createProject(prisma: PrismaClient, project: Project): Promise<Project | null> {
    let createSystemObject: Project;
    const { Name, Description } = project;
    try {
        createSystemObject = await prisma.project.create({
            data: {
                Name,
                Description,
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createProject', error);
        return null;
    }
    return createSystemObject;
}

export async function createProjectDocumentation(prisma: PrismaClient, projectDocumentation: ProjectDocumentation): Promise<ProjectDocumentation | null> {
    let createSystemObject: ProjectDocumentation;
    const { idProject, Name, Description } = projectDocumentation;
    try {
        createSystemObject = await prisma.projectDocumentation.create({
            data: {
                Project:        { connect: { idProject }, },
                Name,
                Description,
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createProjectDocumentation', error);
        return null;
    }
    return createSystemObject;
}

export async function createStakeholder(prisma: PrismaClient, stakeholder: Stakeholder): Promise<Stakeholder | null> {
    let createSystemObject: Stakeholder;
    const { IndividualName, OrganizationName, EmailAddress, PhoneNumberMobile, PhoneNumberOffice, MailingAddress } = stakeholder;
    try {
        createSystemObject = await prisma.stakeholder.create({
            data: {
                IndividualName,
                OrganizationName,
                EmailAddress,
                PhoneNumberMobile,
                PhoneNumberOffice,
                MailingAddress,
                SystemObject:       { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createStakeholder', error);
        return null;
    }
    return createSystemObject;
}

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
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createSubject', error);
        return null;
    }
    return createSystemObject;
}

export async function createUnit(prisma: PrismaClient, unit: Unit): Promise<Unit | null> {
    let createSystemObject: Unit;
    const { Name, Abbreviation, ARKPrefix } = unit;
    try {
        createSystemObject = await prisma.unit.create({
            data: {
                Name,
                Abbreviation,
                ARKPrefix,
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createUnit', error);
        return null;
    }
    return createSystemObject;
}

