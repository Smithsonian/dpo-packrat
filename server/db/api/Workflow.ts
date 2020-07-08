/* eslint-disable camelcase */
import { PrismaClient, Workflow, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createWorkflow(prisma: PrismaClient, workflow: Workflow): Promise<Workflow | null> {
    let createSystemObject: Workflow;
    const { idWorkflowTemplate, idProject, idUserInitiator, DateInitiated, DateUpdated } = workflow;
    try {
        createSystemObject = await prisma.workflow.create({
            data: {
                WorkflowTemplate:   { connect: { idWorkflowTemplate }, },
                Project:            idProject ? { connect: { idProject }, } : undefined,
                User:               idUserInitiator ? { connect: { idUser: idUserInitiator }, } : undefined,
                DateInitiated,
                DateUpdated,
                SystemObject:       { create: { Retired: false }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createWorkflow', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchWorkflow(prisma: PrismaClient, idWorkflow: number): Promise<Workflow | null> {
    try {
        return await prisma.workflow.findOne({ where: { idWorkflow, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchWorkflow', error);
        return null;
    }
}

export async function fetchSystemObjectForWorkflow(prisma: PrismaClient, sysObj: Workflow): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflow: sysObj.idWorkflow, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForWorkflow', error);
        return null;
    }
}

export async function fetchSystemObjectForWorkflowID(prisma: PrismaClient, idWorkflow: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflow, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForWorkflowID', error);
        return null;
    }
}

export async function fetchSystemObjectAndWorkflow(prisma: PrismaClient, idWorkflow: number): Promise<SystemObject & { Workflow: Workflow | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflow, }, include: { Workflow: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndWorkflow', error);
        return null;
    }
}

export async function fetchWorkflowFromProject(prisma: PrismaClient, idProject: number): Promise<Workflow[] | null> {
    try {
        return await prisma.workflow.findMany({ where: { idProject } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchWorkflowFromProject', error);
        return null;
    }
}

export async function fetchWorkflowFromUser(prisma: PrismaClient, idUserInitiator: number): Promise<Workflow[] | null> {
    try {
        return await prisma.workflow.findMany({ where: { idUserInitiator } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchWorkflowFromUser', error);
        return null;
    }
}

export async function fetchWorkflowFromWorkflowTemplate(prisma: PrismaClient, idWorkflowTemplate: number): Promise<Workflow[] | null> {
    try {
        return await prisma.workflow.findMany({ where: { idWorkflowTemplate } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchWorkflowFromWorkflowTemplate', error);
        return null;
    }
}
