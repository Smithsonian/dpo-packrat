import * as DBAPI from '../../../db';
import { WorkflowTemplate as WorkflowTemplateBase } from '@prisma/client';

export async function createWorkflowTemplateTest(base: WorkflowTemplateBase): Promise<DBAPI.WorkflowTemplate> {
    const workflowTemplate: DBAPI.WorkflowTemplate = new DBAPI.WorkflowTemplate(base);
    const created: boolean = await workflowTemplate.create();
    expect(created).toBeTruthy();
    expect(workflowTemplate.idWorkflowTemplate).toBeGreaterThan(0);
    return workflowTemplate;
}