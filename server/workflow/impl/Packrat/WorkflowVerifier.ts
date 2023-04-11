import * as WF from '../../interface';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import * as COL from '../../../collections/interface/';
import * as LOG from '../../../utils/logger';
import * as V from '../../../utils/verifiers/EdanVerifier';


// This Workflow represents an ingestion action, typically initiated by a user.
// The workflow itself performs no work (ingestion is performed in the graphQl ingestData routine)
// Instead, this workflow provide a means for gathering ingestion report output
export class WorkflowVerifier implements WF.IWorkflow {
    private workflowParams: WF.WorkflowParameters;
    private workflowData: DBAPI.WorkflowConstellation;
    public config: V.EdanVerifierConfig | null = null; // can't pass in due to WorkflowEngine calls not accepting extra params
    public result: V.EdanVerifierResult | null = null;

    static async constructWorkflow(workflowParams: WF.WorkflowParameters, WFC: DBAPI.WorkflowConstellation): Promise<WorkflowVerifier | null> {
        return new WorkflowVerifier(workflowParams, WFC);
    }

    constructor(workflowParams: WF.WorkflowParameters, workflowData: DBAPI.WorkflowConstellation) {
        this.workflowParams = workflowParams;
        this.workflowData = workflowData;
        this.workflowParams; this.workflowData;
        // this.result = null;
    }

    async start(): Promise<H.IOResults> {

        if(this.config==null) {
            LOG.error('WorkflowVerifier cannot start. configuration object not set.', LOG.LS.eWF);
            return { success: false };
        }

        // FUTURE: create a new workflow step specific to verifier
        // once started should be able to get active ID
        // use ID with 'downloads' to get URL for report
        // focus on 'downloads' for getting report
        const verifierConfig: V.EdanVerifierConfig = {
            collection: COL.CollectionFactory.getInstance(),
            subjectLimit: this.config.subjectLimit,
            detailedLogs: this.config.detailedLogs,
            systemObjectId: this.config.systemObjectId,
            // writeToFile: '../../EDAN-Verifier_Output.csv'
        };
        const verifier: V.EdanVerifier = new V.EdanVerifier(verifierConfig);
        this.result = await verifier.verify(); // TODO: how to avoid waiting for this and check at higher level

        // check/create any needed workflow steps and change the state
        const workflowStep: DBAPI.WorkflowStep | null = (!this.workflowData.workflowStep || this.workflowData.workflowStep.length <= 0)
            ? null : this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1];
        if (workflowStep) {
            workflowStep.setState(COMMON.eWorkflowJobRunStatus.eRunning);
            await workflowStep.update();
        }

        return { success: true };
    }

    async update(_workflowStep: DBAPI.WorkflowStep, _jobRun: DBAPI.JobRun): Promise<WF.WorkflowUpdateResults> {
        return { success: true, workflowComplete: true };
    }

    async updateStatus(eStatus: COMMON.eWorkflowJobRunStatus): Promise<WF.WorkflowUpdateResults> {
        const workflowComplete: boolean = (eStatus === COMMON.eWorkflowJobRunStatus.eDone
            || eStatus === COMMON.eWorkflowJobRunStatus.eError
            || eStatus === COMMON.eWorkflowJobRunStatus.eCancelled);

        const workflowStep: DBAPI.WorkflowStep | null = (!this.workflowData.workflowStep || this.workflowData.workflowStep.length <= 0)
            ? null : this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1];

        if (!workflowStep)
            return { success: false, workflowComplete, error: 'Missing WorkflowStep' };
        workflowStep.setState(eStatus);
        const success: boolean = await workflowStep.update();
        return { success, workflowComplete, error: success ? '' : 'Database Error' };
    }

    async waitForCompletion(_timeout: number): Promise<H.IOResults> {
        return { success: true };
    }

    async workflowConstellation(): Promise<DBAPI.WorkflowConstellation | null> {
        return this.workflowData;
    }
}
