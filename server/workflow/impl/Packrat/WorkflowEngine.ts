/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as WF from '../../interface';
// import { JobPackrat } from './JobPackrat';
// import * as COOK from '../Cook';
// import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
// import * as DBAPI from '../../../db';

/*
export interface WorkflowParameters {
    eWorkflowType: eVocabularyID;           // Workflow type Vocabulary enum for workflow to run
    idSystemObject: number[] | null;        // array of system objects as input to this workflow; null for jobs not acting on system objects
    idProject: number | null;               // Project.idProject of project, if any
    idUserInitiator: number | null;         // User.idUser of initiator, if any
    parameters: any;                        // Additional workflow parameters; each workflow template should define their own parameter interface
}
*/

export class WorkflowEngine implements WF.IWorkflowEngine {
    async create(workflowParams: WF.WorkflowParameters): Promise<WF.IWorkflow | null> {
        // create database objects to support workflow:
        // - Workflow
        // - WorkflowStep for initiation
        // - WorkflowStepSystemObjectXref for linked system objects
        //
        // Create IWorkflow implementor
        // IWorkflow.start()
        switch (workflowParams.eWorkflowType) {
            case CACHE.eVocabularyID.eWorkflowTypeCookJob: {
                break;
            } break;
        }
        return null;
    }

    /*
    private async createDBObjects(workflowParams: WF.WorkflowParameters): Promise<{ workflow: DBAPI.Workflow, workflowStep: DBAPI.WorkflowStep }> {
        const workflow: DBAPI.Workflow = new DBAPI.Workflow({
            idWorkflow: 0,
            idVWorkflowType!: number;
            idProject!: number | null;
            idUserInitiator!: number | null;
            DateInitiated!: Date;
            DateUpdated!: Date;
            Parameters!: string | null;
        });
    }
    */
}
