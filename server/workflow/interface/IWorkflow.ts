/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorkflowParameters } from './IWorkflowEngine';
import * as DBAPI from '../../db';
import * as H from '../../utils/helpers';

export interface IWorkflow {
    start(workflowParams: WorkflowParameters): Promise<H.IOResults>;
    update(workflowStep: DBAPI.WorkflowStep, jobRun: DBAPI.JobRun): Promise<H.IOResults>;
}
