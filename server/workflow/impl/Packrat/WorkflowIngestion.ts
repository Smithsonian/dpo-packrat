import * as WF from '../../interface';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';

// This Workflow represents an ingestion action, typically initiated by a user.
// The workflow itself performs no work (ingestion is performed in the graphQl ingestData routine)
// Instead, this workflow provide a means for gathering ingestion report output
export class WorkflowIngestion implements WF.IWorkflow {
    private workflowParams: WF.WorkflowParameters;
    private workflowData: DBAPI.WorkflowConstellation;

    static async constructWorkflow(workflowParams: WF.WorkflowParameters, WFC: DBAPI.WorkflowConstellation): Promise<WorkflowIngestion | null> {
        return new WorkflowIngestion(workflowParams, WFC);
    }

    constructor(workflowParams: WF.WorkflowParameters, workflowData: DBAPI.WorkflowConstellation) {
        this.workflowParams = workflowParams;
        this.workflowData = workflowData;
        this.workflowParams; this.workflowData;
    }

    async start(): Promise<H.IOResults> {
        return { success: false, error: 'Not Implemented' };
    }

    async update(_workflowStep: DBAPI.WorkflowStep, _jobRun: DBAPI.JobRun): Promise<WF.WorkflowUpdateResults> {
        return { success: false, workflowComplete: true, error: 'Not Implemented' };
    }

    async waitForCompletion(_timeout: number): Promise<H.IOResults> {
        return { success: false, error: 'Not Implemented' };
    }

    async workflowConstellation(): Promise<DBAPI.WorkflowConstellation | null> {
        return null;
    }

}
