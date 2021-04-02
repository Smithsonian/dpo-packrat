/* eslint-disable @typescript-eslint/no-explicit-any */
import { IWorkflow } from './IWorkflow';
import { eVocabularyID } from '../../cache/VocabularyCache';

export interface WorkflowParameters {
    eWorkflowType: eVocabularyID;           // Workflow type Vocabulary enum for workflow to run
    idSystemObject: number[] | null;        // array of system objects as input to this workflow; null for jobs not acting on system objects
    idProject: number | null;               // Project.idProject of project, if any
    idUserInitiator: number | null;         // User.idUser of initiator, if any
    parameters: any;                        // Additional workflow parameters; each workflow template should define their own parameter interface
}

export interface IWorkflowEngine {
    create(workflowParams: WorkflowParameters): Promise<IWorkflow | null>;
    jobUpdated(idJobRun: number): Promise<boolean>;
}
