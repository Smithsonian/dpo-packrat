/* eslint-disable camelcase */
import { PrismaClient, WorkflowStepSystemObjectXref } from '@prisma/client';
import * as LOG from '../../utils/logger';

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

export async function fetchWorkflowStepSystemObjectXref(prisma: PrismaClient, idWorkflowStepSystemObjectXref: number): Promise<WorkflowStepSystemObjectXref | null> {
    try {
        return await prisma.workflowStepSystemObjectXref.findOne({ where: { idWorkflowStepSystemObjectXref, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchWorkflowStepSystemObjectXref', error);
        return null;
    }
}