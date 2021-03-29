/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorkflowParameters } from './IWorkflowEngine';

export interface IWorkflow {
    create(workflowParams: WorkflowParameters): Promise<IWorkflow | null>;
}
