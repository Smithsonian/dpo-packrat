import * as WF from '../../interface';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
// import * as COL from '../../../collections/interface/';
import * as LOG from '../../../utils/logger';
// import * as V from '../../../utils/verifiers';
// import * as V from '../../../utils/verifiers/VerifierBase';
import * as REP from '../../../report/interface';
import { ASL, LocalStore } from '../../../utils/localStore';

// This Workflow represents an attempt to verify some aspect of the system
// It is triggered by a user action or the system via the verifier class/object
// and the 'init' routine, which creates/starts it.
// This class has no knowledge of the Verifier process itself as its managed elsewhere.
export class WorkflowVerifier implements WF.IWorkflow {
    private workflowParams: WF.WorkflowParameters;
    private workflowData: DBAPI.WorkflowConstellation;
    private idReport: number | undefined;

    // public config: V.VerifierConfig | null = null; // can't pass in due to WorkflowEngine calls not accepting extra params
    // public result: V.VerifierResult | null = null;

    static async constructWorkflow(workflowParams: WF.WorkflowParameters, WFC: DBAPI.WorkflowConstellation): Promise<WorkflowVerifier | null> {
        return new WorkflowVerifier(workflowParams, WFC);
    }

    constructor(workflowParams: WF.WorkflowParameters, workflowData: DBAPI.WorkflowConstellation) {
        this.workflowParams = workflowParams;
        this.workflowData = workflowData;
        this.workflowParams; this.workflowData;
    }

    async start(): Promise<H.IOResults> {
        // if(this.config==null) {
        //     LOG.error('WorkflowVerifier cannot start. configuration object not set.', LOG.LS.eWF);
        //     return { success: false };
        // }

        LOG.info('starting verifier workflow...',LOG.LS.eWF);

        // TODO: check for valid verifier parameter
        // const verifier: V.VerifierBase = this.workflowParams.parameters.verifier;
        // const result: V.VerifierResult = await verifier.start();
        //const result: V.VerifierResult = await verifier.verify();

        // const status: COMMON.eWorkflowJobRunStatus = verifier.getStatus();
        // LOG.info('Done Status: '+H.Helpers.JSONStringify(status),LOG.LS.eWF);

        /*
        // FUTURE: create a new workflow step specific to verifier
        // once started should be able to get active ID
        // use ID with 'downloads' to get URL for report
        // focus on 'downloads' for getting report
        const verifierConfig: V.VerifierConfig = {
            collection: COL.CollectionFactory.getInstance(),
            subjectLimit: this.config.subjectLimit,
            detailedLogs: this.config.detailedLogs,
            systemObjectId: this.config.systemObjectId,
            // writeToFile: '../../EDAN-Verifier_Output.csv'
        };
        const verifier: V.VerifierBase = new V.VerifierBase(verifierConfig);
        this.result = await verifier.verify(); // TODO: how to avoid waiting for this and check at higher level
*/

        // check/create any needed workflow steps and change the state
        const workflowStep: DBAPI.WorkflowStep | null = (!this.workflowData.workflowStep || this.workflowData.workflowStep.length <= 0)
            ? null : this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1];
        if (workflowStep) {
            workflowStep.setState(COMMON.eWorkflowJobRunStatus.eRunning);
            await workflowStep.update();
        }

        // grab our report from the factory
        const iReport: REP.IReport | null = await REP.ReportFactory.getReport();
        if(!iReport) {
            const error: string = `${this.constructor.name} failed to get workflow report.`;
            return { success: false, error };
        }

        // get ouyr local stor
        const LS: LocalStore | undefined = ASL.getStore();


        // get our report ID
        this.idReport = LS?.getWorkflowReportID();
        if (!this.idReport) {
            const error: string = `${this.constructor.name} could not get workflow report ID`;
            return { success: false, error };
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

    getWorkflowID(): number | undefined {
        // should be in base class for all workflows
        return (this.workflowData.workflowStep && this.workflowData.workflowStep.length>0)?
            this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1].fetchID():undefined;
    }

    getReportID(): number | undefined {
        return this.idReport;
    }

    async getReport(): Promise<DBAPI.WorkflowReport | null> {
        const report: DBAPI.WorkflowReport | null = await DBAPI.WorkflowReport.fetch(this.idReport??-1);
        if (!report) {
            LOG.error(`WorkflowVerifier is unable to fetch report. (id: ${this.idReport}`,LOG.LS.eWF);
            return null;
        }
        return report;
    }

    getStatus(): COMMON.eWorkflowJobRunStatus {
        // return the current status of the workflow, which is used by other functions
        // to determine if 'done' and communicate that out. (ex. Verrifiers)
        const workflowStep: DBAPI.WorkflowStep | null = (!this.workflowData.workflowStep || this.workflowData.workflowStep.length <= 0)
            ? null : this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1];

        if (!workflowStep) {
            LOG.error(`${this.constructor.name} cannot get status. no workflow step.`,LOG.LS.eWF);
            return COMMON.eWorkflowJobRunStatus.eError;
        }

        return workflowStep.getState();
    }
}
