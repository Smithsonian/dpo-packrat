/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../db';
import * as H from '../../utils/helpers';
import * as COMMON from '../../../client/src/types/server';

export interface WorkflowUpdateResults {
    success: boolean;
    workflowComplete: boolean;
    error?: string;
}

export interface IWorkflow {
    start(): Promise<H.IOResults>;                                                                      // intended to be called by the IWorkflowEngine
    update(workflowStep: DBAPI.WorkflowStep, jobRun: DBAPI.JobRun): Promise<WorkflowUpdateResults>;     // intended to be called by the IWorkflowEngine
    updateStatus(eStatus: COMMON.eWorkflowJobRunStatus): Promise<WorkflowUpdateResults>;
    waitForCompletion(timeout: number): Promise<H.IOResults>;
    workflowConstellation(): Promise<DBAPI.WorkflowConstellation | null>;
}
