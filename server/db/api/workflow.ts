/* eslint-disable camelcase */
import { PrismaClient, Workflow, WorkflowStep, WorkflowStepSystemObjectXref, WorkflowTemplate } from '@prisma/client';

export async function createWorkflow(prisma: PrismaClient, workflow: Workflow): Promise<Workflow> {
    const { idWorkflowTemplate, idProject, idUserInitiator, DateInitiated, DateUpdated } = workflow;
    const createSystemObject: Workflow = await prisma.workflow.create({
        data: {
            WorkflowTemplate:   { connect: { idWorkflowTemplate }, },
            Project:            idProject ? { connect: { idProject }, } : undefined,
            User:               idUserInitiator ? { connect: { idUser: idUserInitiator }, } : undefined,
            DateInitiated,
            DateUpdated,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createWorkflowStep(prisma: PrismaClient, workflowStep: WorkflowStep): Promise<WorkflowStep> {
    const { idWorkflow, idUserOwner, idVWorkflowStepType, State, DateCreated, DateCompleted } = workflowStep;
    const createSystemObject: WorkflowStep = await prisma.workflowStep.create({
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

    return createSystemObject;
}

export async function createWorkflowStepSystemObjectXref(prisma: PrismaClient, workflowStepSystemObjectXref: WorkflowStepSystemObjectXref): Promise<WorkflowStepSystemObjectXref> {
    const { idWorkflowStep, idSystemObject, Input } = workflowStepSystemObjectXref;
    const createSystemObject: WorkflowStepSystemObjectXref = await prisma.workflowStepSystemObjectXref.create({
        data: {
            WorkflowStep: { connect: { idWorkflowStep }, },
            SystemObject: { connect: { idSystemObject }, },
            Input
        },
    });

    return createSystemObject;
}

export async function createWorkflowTemplate(prisma: PrismaClient, workflowTemplate: WorkflowTemplate): Promise<WorkflowTemplate> {
    const { Name } = workflowTemplate;
    const createSystemObject: WorkflowTemplate = await prisma.workflowTemplate.create({
        data: {
            Name
        },
    });

    return createSystemObject;
}
