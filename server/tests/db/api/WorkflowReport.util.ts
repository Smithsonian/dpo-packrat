import * as DBAPI from '../../../db';
import { WorkflowReport as WorkflowReportBase } from '@prisma/client';

export async function createWorkflowReportTest(base: WorkflowReportBase): Promise<DBAPI.WorkflowReport> {
    const workflowReport: DBAPI.WorkflowReport = new DBAPI.WorkflowReport(base);
    const created: boolean = await workflowReport.create();
    expect(created).toBeTruthy();
    expect(workflowReport.idWorkflowReport).toBeGreaterThan(0);
    return workflowReport;
}