import * as DBAPI from '../../../db';
import { WorkflowSet as WorkflowSetBase } from '@prisma/client';

export async function createWorkflowSetTest(base: WorkflowSetBase): Promise<DBAPI.WorkflowSet> {
    const workflowSet: DBAPI.WorkflowSet = new DBAPI.WorkflowSet(base);
    const created: boolean = await workflowSet.create();
    expect(created).toBeTruthy();
    expect(workflowSet.idWorkflowSet).toBeGreaterThan(0);
    return workflowSet;
}