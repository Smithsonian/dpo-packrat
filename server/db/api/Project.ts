/* eslint-disable camelcase */
import { PrismaClient, Project, SystemObject, ProjectDocumentation } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createProject(prisma: PrismaClient, project: Project): Promise<Project | null> {
    let createSystemObject: Project;
    const { Name, Description } = project;
    try {
        createSystemObject = await prisma.project.create({
            data: {
                Name,
                Description,
                SystemObject:   { create: { Retired: false }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createProject', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchProject(prisma: PrismaClient, idProject: number): Promise<Project | null> {
    try {
        return await prisma.project.findOne({ where: { idProject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchProject', error);
        return null;
    }
}

export async function fetchProjectDocumentationForProjectID(prisma: PrismaClient, idProject: number): Promise<ProjectDocumentation[] | null> {
    try {
        return await prisma.project.findOne({ where: { idProject } }).ProjectDocumentation();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchProjectDocumentationForProjectID', error);
        return null;
    }
}

export async function fetchSystemObjectForProject(prisma: PrismaClient, sysObj: Project): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProject: sysObj.idProject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForProject', error);
        return null;
    }
}

export async function fetchSystemObjectForProjectID(prisma: PrismaClient, idProject: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForProjectID', error);
        return null;
    }
}

export async function fetchSystemObjectAndProject(prisma: PrismaClient, idProject: number): Promise<SystemObject & { Project: Project | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProject, }, include: { Project: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndProject', error);
        return null;
    }
}
