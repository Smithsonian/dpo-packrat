/* eslint-disable camelcase */
import { PrismaClient, Workflow, WorkflowStep, WorkflowStepSystemObjectXref, WorkflowTemplate } from '@prisma/client';
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
                SystemObject:       { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createWorkflow', error);
        return null;
    }
    return createSystemObject;
}

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
                SystemObject:       { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createWorkflowStep', error);
        return null;
    }
    return createSystemObject;
}

export async function createWorkflowStepSystemObjectXref(prisma: PrismaClient, workflowStepSystemObjectXref: WorkflowStepSystemObjectXref): Promise<WorkflowStepSystemObjectXref | null> {
    let createSystemObject: WorkflowStepSystemObjectXref;
    const { idWorkflowStep, idSystemObject, Input } = workflowStepSystemObjectXref;
    try {
        createSystemObject = await prisma.workflowStepSystemObjectXref.create({
            data: {
                WorkflowStep: { connect: { idWorkflowStep }, },
                SystemObject: { connect: { idSystemObject }, },
                Input
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createWorkflowStepSystemObjectXref', error);
        return null;
    }
    return createSystemObject;
}

export async function createWorkflowTemplate(prisma: PrismaClient, workflowTemplate: WorkflowTemplate): Promise<WorkflowTemplate | null> {
    let createSystemObject: WorkflowTemplate;
    const { Name } = workflowTemplate;
    try {
        createSystemObject = await prisma.workflowTemplate.create({
            data: {
                Name
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createWorkflowTemplate', error);
        return null;
    }
    return createSystemObject;
}
