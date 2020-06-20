/* eslint-disable camelcase */
import { PrismaClient, GeoLocation, Item, Project, ProjectDocumentation, Stakeholder, Subject, Unit } from '@prisma/client';

export async function createGeoLocation(prisma: PrismaClient, geoLocation: GeoLocation): Promise<GeoLocation> {
    const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = geoLocation;
    const createSystemObject: GeoLocation = await prisma.geoLocation.create({
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

    return createSystemObject;
}

export async function createItem(prisma: PrismaClient, item: Item): Promise<Item> {
    const { idSubject, idAssetThumbnail, idGeoLocation, Name, EntireSubject } = item;
    const createSystemObject: Item = await prisma.item.create({
        data: {
            Subject:        { connect: { idSubject }, },
            Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
            GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
            Name,
            EntireSubject,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createProject(prisma: PrismaClient, project: Project): Promise<Project> {
    const { Name, Description } = project;
    const createSystemObject: Project = await prisma.project.create({
        data: {
            Name,
            Description,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createProjectDocumentation(prisma: PrismaClient, projectDocumentation: ProjectDocumentation): Promise<ProjectDocumentation> {
    const { idProject, Name, Description } = projectDocumentation;
    const createSystemObject: ProjectDocumentation = await prisma.projectDocumentation.create({
        data: {
            Project:        { connect: { idProject }, },
            Name,
            Description,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createStakeholder(prisma: PrismaClient, stakeholder: Stakeholder): Promise<Stakeholder> {
    const { IndividualName, OrganizationName, EmailAddress, PhoneNumberMobile, PhoneNumberOffice, MailingAddress } = stakeholder;
    const createSystemObject: Stakeholder = await prisma.stakeholder.create({
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

    return createSystemObject;
}

export async function createSubject(prisma: PrismaClient, subject: Subject): Promise<Subject> {
    const { idUnit, idAssetThumbnail, idGeoLocation, Name } = subject;
    const createSystemObject: Subject = await prisma.subject.create({
        data: {
            Unit:           { connect: { idUnit }, },
            Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
            GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
            Name,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createUnit(prisma: PrismaClient, unit: Unit): Promise<Unit> {
    const { Name, Abbreviation, ARKPrefix } = unit;
    const createSystemObject: Unit = await prisma.unit.create({
        data: {
            Name,
            Abbreviation,
            ARKPrefix,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

