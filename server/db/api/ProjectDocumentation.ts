/* eslint-disable camelcase */
import { PrismaClient, ProjectDocumentation, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createProjectDocumentation(prisma: PrismaClient, projectDocumentation: ProjectDocumentation): Promise<ProjectDocumentation | null> {
    let createSystemObject: ProjectDocumentation;
    const { idProject, Name, Description } = projectDocumentation;
    try {
        createSystemObject = await prisma.projectDocumentation.create({
            data: {
                Project:        { connect: { idProject }, },
                Name,
                Description,
                SystemObject:   { create: { Retired: false }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createProjectDocumentation', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchProjectDocumentation(prisma: PrismaClient, idProjectDocumentation: number): Promise<ProjectDocumentation | null> {
    try {
        return await prisma.projectDocumentation.findOne({ where: { idProjectDocumentation, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchProjectDocumentation', error);
        return null;
    }
}

export async function fetchSystemObjectForProjectDocumentation(prisma: PrismaClient, sysObj: ProjectDocumentation): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProjectDocumentation: sysObj.idProjectDocumentation, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForProjectDocumentation', error);
        return null;
    }
}

export async function fetchSystemObjectForProjectDocumentationID(prisma: PrismaClient, idProjectDocumentation: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProjectDocumentation, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForProjectDocumentationID', error);
        return null;
    }
}

export async function fetchSystemObjectAndProjectDocumentation(prisma: PrismaClient, idProjectDocumentation: number): Promise<SystemObject & { ProjectDocumentation: ProjectDocumentation | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProjectDocumentation, }, include: { ProjectDocumentation: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndProjectDocumentation', error);
        return null;
    }
}

