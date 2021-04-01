/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../db';
import * as H from '../../utils/helpers';

export interface IWorkflow {
    start(): Promise<H.IOResults>;                                                          // intended to be called by the IWorkflowEngine
    update(workflowStep: DBAPI.WorkflowStep, jobRun: DBAPI.JobRun): Promise<H.IOResults>;   // intended to be called by the IWorkflowEngine
    waitForCompletion(timeout: number): Promise<H.IOResults>;
}
