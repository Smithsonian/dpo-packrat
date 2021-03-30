/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorkflowParameters } from './IWorkflowEngine';

export interface IWorkflow {
    start(workflowParams: WorkflowParameters): Promise<boolean>;
}
