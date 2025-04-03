import * as WF from '../../interface';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import * as LOG  from '../../../utils/logger';
import { Config } from '../../../config';
import { RecordKeeper } from '../../../records/recordKeeper';
// import { LogSection } from '../../../records/logger/log';

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

        const updated: boolean = (eStatus!==workflowStep?.getState());
        workflowStep.setState(eStatus);
        const success: boolean = await workflowStep.update();

        RecordKeeper.logInfo(RecordKeeper.LogSection.eWF,'update status',
            { workflowComplete, updated, eStatus, workflow: this.workflowData.workflow, step: this.workflowData.workflowSet },
            'WorkflowUpload.updateStatus'
        );

        // if we're not updated or not finished then just return
        if(updated!==true || workflowComplete!==true)
            return { success, workflowComplete, error: success ? '' : 'Database Error' };

        // get all workflows connected to same workflow set
        // NOTE: may not get all workflows since the Set doesn't know the total
        // steps until everything finishes. Going to pause a moment to give DB a chance
        await H.Helpers.sleep(3000);
        const workflowSet: number = this.workflowData.workflow?.idWorkflowSet ?? -1;
        const workflows: DBAPI.Workflow[] | null = await DBAPI.Workflow.fetchFromWorkflowSet(workflowSet);
        if(!workflows || workflows.length===0) {
            LOG.info(`No workflows found from set (${this.workflowData.workflow?.idWorkflowSet})`,LOG.LS.eWF);
            return { success, workflowComplete, error: success ? '' : 'Database Error' };
        }

        RecordKeeper.logInfo(RecordKeeper.LogSection.eWF,'update status worfklows',
            { workflowSet, workflows },
            'WorkflowUpload.updateStatus'
        );

        // Get all steps from the workflows
        const workflowSteps: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromWorkflowSet(workflowSet);
        if(!workflowSteps || workflowSteps.length===0)
            return { success, workflowComplete, error: success ? '' : 'Database Error' };

        RecordKeeper.logInfo(RecordKeeper.LogSection.eWF,'update status steps',
            { workflowSteps },
            'WorkflowUpload.updateStatus'
        );

        // see if any are still going, if so return
        const stillRunning: boolean = workflowSteps.some( step => ![4,5,6].includes(step.State));
        RecordKeeper.logInfo(RecordKeeper.LogSection.eWF,'update status still running',
            { stillRunning },
            'WorkflowUpload.updateStatus'
        );
        if(stillRunning===true) {
            LOG.info(`Workflow set still running (${this.workflowData.workflow?.idWorkflow} | ${workflowSet})`,LOG.LS.eWF);
            return { success, workflowComplete, error: success ? '' : 'Database Error' };
        }


        // extract the start/end dates for the set
        const { startDate, endDate } = workflowSteps.reduce((acc, { DateCreated, DateCompleted }) => ({
            startDate: acc.startDate < DateCreated ? acc.startDate : DateCreated,
            endDate: (!DateCompleted || acc.endDate > DateCompleted) ? acc.endDate : DateCompleted,
        }), { startDate: workflowSteps[0].DateCreated, endDate: workflowSteps[0].DateCompleted || workflowSteps[0].DateCreated });

        // get our report to inject in the message
        // use first workflow since it will hold everything for the set
        let detailsMessage: string = '';
        const workflowReport: DBAPI.WorkflowReport[] | null = await DBAPI.WorkflowReport.fetchFromWorkflowSet(workflowSet);
        if(workflowReport && workflowReport.length>0) {
            detailsMessage = workflowReport[0].Data;
        }

        switch(eStatus) {
            case COMMON.eWorkflowJobRunStatus.eDone: {
                const url: string = Config.http.clientUrl +'/ingestion/uploads';
                await RecordKeeper.sendEmail(
                    RecordKeeper.NotifyType.JOB_PASSED,
                    RecordKeeper.NotifyGroup.EMAIL_USER,
                    'Ingestion Finished',
                    detailsMessage,
                    startDate,
                    endDate,
                    (url.length>0) ? { url, label: 'Uploads' } : undefined
                );
            } break;

            case COMMON.eWorkflowJobRunStatus.eError: {
                const url: string = Config.http.clientUrl +'/workflow';
                await RecordKeeper.sendEmail(
                    RecordKeeper.NotifyType.JOB_FAILED,
                    RecordKeeper.NotifyGroup.EMAIL_USER,
                    'Ingestion Failed',
                    detailsMessage,
                    startDate,
                    endDate,
                    (url.length>0) ? { url, label: 'Reports' } : undefined
                );
            } break;
        }

        return { success, workflowComplete, error: success ? '' : 'Database Error' };
    }

    async waitForCompletion(_timeout: number): Promise<H.IOResults> {
        return { success: true };
    }

    async workflowConstellation(): Promise<DBAPI.WorkflowConstellation | null> {
        return this.workflowData;
    }

    async getWorkflowObject(): Promise<DBAPI.Workflow | null> {

        // get our constellation
        const wfConstellation: DBAPI.WorkflowConstellation | null = await this.workflowConstellation();
        if(!wfConstellation) {
            LOG.error('WorkflowIngestion.getWorkflowObject failed. No constellation found. unitialized?',LOG.LS.eWF);
            return null;
        }

        return wfConstellation.workflow;
    }
}
