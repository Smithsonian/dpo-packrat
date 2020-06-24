/* eslint-disable camelcase */
import { PrismaClient, WorkflowStep, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createWorkflowStep(prisma: PrismaClient, workflowStep: WorkflowStep): Promise<WorkflowStep | null> {
    let createSystemObject: WorkflowStep;
    const { idWorkflow, idUserOwner, idVWorkflowStepType, State, DateCreated, DateCompleted } = workflowStep;
    try {
        createSystemObject = await prisma.workflowStep.create({
            data: {
                Workflow:           { connect: { idWorkflow }, },
                User:               { connect: { idUser: idUserOwner }, },
                Vocabulary:         { connect: { idVocabulary: idVWorkflowStepType }, },
                State,
                DateCreated,
                DateCompleted,
                SystemObject:       { create: { Retired: false }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createWorkflowStep', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchWorkflowStep(prisma: PrismaClient, idWorkflowStep: number): Promise<WorkflowStep | null> {
    try {
        return await prisma.workflowStep.findOne({ where: { idWorkflowStep, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchWorkflowStep', error);
        return null;
    }
}

export async function fetchSystemObjectForWorkflowStep(prisma: PrismaClient, sysObj: WorkflowStep): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflowStep: sysObj.idWorkflowStep, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForWorkflowStep', error);
        return null;
    }
}

export async function fetchSystemObjectForWorkflowStepID(prisma: PrismaClient, idWorkflowStep: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflowStep, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForWorkflowStepID', error);
        return null;
    }
}

export async function fetchSystemObjectAndWorkflowStep(prisma: PrismaClient, idWorkflowStep: number): Promise<SystemObject & { WorkflowStep: WorkflowStep | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflowStep, }, include: { WorkflowStep: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndWorkflowStep', error);
        return null;
    }
}
