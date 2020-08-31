import * as DBAPI from '../../../db';
import { Workflow as WorkflowBase } from '@prisma/client';

export async function createWorkflowTest(base: WorkflowBase): Promise<DBAPI.Workflow> {
    const workflow: DBAPI.Workflow = new DBAPI.Workflow(base);
    const created: boolean = await workflow.create();
    expect(created).toBeTruthy();
    expect(workflow.idWorkflow).toBeGreaterThan(0);
    return workflow;
}