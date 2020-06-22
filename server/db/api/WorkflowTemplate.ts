/* eslint-disable camelcase */
import { PrismaClient, WorkflowTemplate } from '@prisma/client';
import * as LOG from '../../utils/logger';

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

export async function fetchWorkflowTemplate(prisma: PrismaClient, idWorkflowTemplate: number): Promise<WorkflowTemplate | null> {
    try {
        return await prisma.workflowTemplate.findOne({ where: { idWorkflowTemplate, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchWorkflowTemplate', error);
        return null;
    }
}