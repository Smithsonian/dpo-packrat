/* eslint-disable @typescript-eslint/no-explicit-any */
import { IWorkflow } from './IWorkflow';
import * as COMMON from '@dpo-packrat/common';

export interface WorkflowParameters {
    eWorkflowType?: COMMON.eVocabularyID | undefined; // Workflow type Vocabulary enum for workflow to run
    idSystemObject?: number[] | undefined;            // array of system objects as input to this workflow; null for jobs not acting on system objects
    idProject?: number | undefined;                   // Project.idProject of project, if any
    idUserInitiator?: number | undefined;             // User.idUser of initiator, if any
    parameters?: any | undefined;                     // Additional workflow parameters; each workflow template should define their own parameter interface
}

export interface IWorkflowEngine {
    create(workflowParams: WorkflowParameters): Promise<IWorkflow | null>;
}
