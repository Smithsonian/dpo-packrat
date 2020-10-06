import * as DBAPI from '../../../db';
import { WorkflowStep as WorkflowStepBase } from '@prisma/client';

export async function createWorkflowStepTest(base: WorkflowStepBase): Promise<DBAPI.WorkflowStep> {
    const workflowStep: DBAPI.WorkflowStep = new DBAPI.WorkflowStep(base);
    const created: boolean = await workflowStep.create();
    expect(created).toBeTruthy();
    expect(workflowStep.idWorkflowStep).toBeGreaterThan(0);
    return workflowStep;
}