/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */
import * as WF from '../../interface';
import { WorkflowUtil, WorkflowUtilExtractAssetVersions } from './WorkflowUtil';
import * as JOB from '../../../job/interface';
import * as REP from '../../../report/interface';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import { Config } from '../../../config';
import * as H from '../../../utils/helpers';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { Mutex, MutexInterface, withTimeout, E_TIMEOUT, E_CANCELED } from 'async-mutex';

export class WorkflowJobParameters {
    eCookJob: COMMON.eVocabularyID;
    cookJobParameters: any;

    constructor(eCookJob: COMMON.eVocabularyID, cookJobParameters: any) {
        this.eCookJob = eCookJob;
        this.cookJobParameters = cookJobParameters;
    }
}

// This Workflow executes a Job, such as a Cook recipe
// It has a single step, "start", which launches the specified Job
// update() will likely terminate the workflow in response to the underlying job having finished
export class WorkflowJob implements WF.IWorkflow {
    private workflowParams: WF.WorkflowParameters;
    private workflowData: DBAPI.WorkflowConstellation;
    private workflowJobParameters: WorkflowJobParameters | null = null;
    private workflowReport: REP.IReport | null = null;
    private idAssetVersions: number[] | null = null;
    private completionMutexes: MutexInterface[] = [];
    private complete: boolean = false;
    private results: H.IOResults = { success: false, error: 'Workflow Job Not Initialized' };

    static async constructWorkflow(workflowParams: WF.WorkflowParameters, WFC: DBAPI.WorkflowConstellation): Promise<WorkflowJob | null> {
        const workflowJob: WorkflowJob = new WorkflowJob(workflowParams, WFC);
        const res: H.IOResults = await workflowJob.extractParameters();
        if (!res.success)
            return null;
        return workflowJob;
    }

    constructor(workflowParams: WF.WorkflowParameters, workflowData: DBAPI.WorkflowConstellation) {
        this.workflowParams = workflowParams;
        this.workflowData = workflowData;
    }

    protected getWorkflowContext(): { idWorkflow: number | undefined } {
        return { idWorkflow: this.workflowData.workflow?.idWorkflow };
    }

    async start(): Promise<H.IOResults> {
        if (!await this.extractParameters() || !this.workflowJobParameters) {
            RK.logError(RK.LogSection.eWF,'workflow job start failed','invalid job parameters', { ...this.getWorkflowContext() },'Workflow.Job');
            return { success: false, error: 'Invalid Job Parameters' };
        }

        // fetch workflow report
        if (!this.workflowReport) {
            this.workflowReport = await REP.ReportFactory.getReport();
            if (!this.workflowReport) {
                const error: string = 'unable to create/fetch workflow report';
                RK.logError(RK.LogSection.eWF,'workflow job start failed',error, { ...this.getWorkflowContext() },'Workflow.Job');
                // return { success: false, error };
            }
        }

        // fetch IJobEngine; use IJobEngine to create IJob; use IJob to start job
        // expect job to update WorkflowStep
        const jobEngine: JOB.IJobEngine | null = await JOB.JobFactory.getInstance();
        if (!jobEngine) {
            const error: string = 'unable to fetch JobEngine';
            RK.logError(RK.LogSection.eWF,'workflow job start failed',error, { ...this.getWorkflowContext() },'Workflow.Job');
            return { success: false, error };
        }

        const jobCreationParameters: JOB.JobCreationParameters = {
            idJob: null,
            eJobType: this.workflowJobParameters.eCookJob,
            idAssetVersions: this.idAssetVersions,
            report: this.workflowReport,
            parameters: this.workflowJobParameters.cookJobParameters,
            frequency: null               // null means create but don't run
        };
        RK.logDebug(RK.LogSection.eWF,'workflow job start','job creation parameters', {
            ...this.getWorkflowContext(),
            jobType: jobCreationParameters.eJobType,
            frequency: jobCreationParameters.frequency,
            idAssetVersions: jobCreationParameters.idAssetVersions,
            idJob: jobCreationParameters.idJob
        },'Workflow.Job');

        // create our job, but don't start it so we can hook it up to the WorkflowStep first
        // this is done to ensure the Job can reference the associated WorkflowStep.
        const job: JOB.IJob | null = await jobEngine.create(jobCreationParameters);
        if (!job) {
            const error: string = `unable to start job ${jobCreationParameters.eJobType
                ? COMMON.eVocabularyID[jobCreationParameters.eJobType] : 'unknown error'}`;
            RK.logError(RK.LogSection.eWF,'workflow job start failed',`create job: ${error}`, { ...this.getWorkflowContext() },'Workflow.Job');
            return { success: false, error };
        }

        // link WorkflowStep to JobRun
        const jobRunDB: DBAPI.JobRun | null = await job.dbJobRun();
        if (!jobRunDB) {
            const error: string = `unable to fetch JobRun DB ${jobCreationParameters.eJobType
                ? COMMON.eVocabularyID[jobCreationParameters.eJobType] : 'unknown error'}`;
            RK.logError(RK.LogSection.eWF,'workflow job start failed',`get job run: ${error}`, { ...this.getWorkflowContext() },'Workflow.Job');
            return { success: false, error };
        }

        if (this.workflowData.workflowStep) {
            for (const workflowStep of this.workflowData.workflowStep) {
                if (workflowStep) {
                    workflowStep.idJobRun = jobRunDB.idJobRun;
                    await workflowStep.update();
                }
            }
        }

        // start job asynchronously, by not using await, so that we remain unblocked:
        job.executeJob(new Date());
        return { success: true };
    }

    async update(workflowStep: DBAPI.WorkflowStep, jobRun: DBAPI.JobRun): Promise<WF.WorkflowUpdateResults> {

        const context = { ...this.getWorkflowContext(), idWorkflowStep: workflowStep.idWorkflowStep, idJobRun: jobRun.idJobRun, jobRunStatus: jobRun.getStatus() };

        RK.logInfo(RK.LogSection.eWF,'workflow update start',undefined, { ...context },'Workflow.Job');

        // update workflowStep based on job run data
        const eWorkflowStepStateOrig: COMMON.eWorkflowJobRunStatus = workflowStep.getState();
        switch (eWorkflowStepStateOrig) {
            case COMMON.eWorkflowJobRunStatus.eDone:
            case COMMON.eWorkflowJobRunStatus.eError:
            case COMMON.eWorkflowJobRunStatus.eCancelled: {
                // messaging in case states are not consistent. could mean workflow is done before job
                if(eWorkflowStepStateOrig===COMMON.eWorkflowJobRunStatus.eDone && jobRun.getStatus()!==COMMON.eWorkflowJobRunStatus.eDone)
                    RK.logError(RK.LogSection.eWF,'workflow update failed','Workflow state does not match JobRun', { ...context, originalState: eWorkflowStepStateOrig },'Workflow.Job');
                else
                    RK.logDebug(RK.LogSection.eWF,'workflow update','already completed', { ...context },'Workflow.Job');

                return { success: true, workflowComplete: true }; // job is already done
            }
        }

        let dateCompleted: Date | null = null;
        let updateWFSNeeded: boolean = false;
        let workflowComplete: boolean = false;

        // see if the Job stopped and handle any errors
        const eWorkflowStepState: COMMON.eWorkflowJobRunStatus = jobRun.getStatus();
        switch (eWorkflowStepState) {
            case COMMON.eWorkflowJobRunStatus.eDone:
                dateCompleted = new Date();
                this.results = { success: true };
                break;
            case COMMON.eWorkflowJobRunStatus.eError:
            case COMMON.eWorkflowJobRunStatus.eCancelled:
                dateCompleted = new Date();
                this.results = { success: false, error: jobRun.Error || '' };
                break;
        }

        // if our state is different then we update the WorkflowStep, which holds the job
        if (eWorkflowStepState != eWorkflowStepStateOrig) {
            workflowStep.setState(eWorkflowStepState);
            updateWFSNeeded = true;
        }

        // update when we finished this job (if applicable)
        if (dateCompleted) {
            workflowStep.DateCompleted = dateCompleted;
            updateWFSNeeded = true;

            if (this.workflowData.workflow) {
                this.workflowData.workflow.DateUpdated = dateCompleted;
                workflowComplete = true;
            }
        }

        let dbUpdateResult: boolean = true;

        // if we need to update our WorkflowStep (DB) due to change in state, do so
        if (updateWFSNeeded)
            dbUpdateResult = await workflowStep.update() && dbUpdateResult;
        if (workflowComplete && this.workflowData.workflow)
            dbUpdateResult = await this.workflowData.workflow.update() && dbUpdateResult;

        // if the workflow finished then we tell it to cleanup any mutex's created
        if (workflowComplete) {
            RK.logInfo(RK.LogSection.eWF,'workflow update done','releasing waiter(s)', { ...context, ...this.workflowJobParameters },'Workflow.Job');
            this.signalCompletion();
        } else
            RK.logInfo(RK.LogSection.eWF,'workflow update',undefined, { ...context, eWorkflowStepState },'Workflow.Job');

        if(!dbUpdateResult)
            RK.logError(RK.LogSection.eWF,'workflow update failed','Database error', { ...context },'Workflow.Job');
        return (dbUpdateResult) ? { success: true, workflowComplete } : { success: false, workflowComplete, error: 'Database Error' };
    }

    async updateStatus(eStatus: COMMON.eWorkflowJobRunStatus): Promise<WF.WorkflowUpdateResults> {
        const workflowComplete: boolean = (eStatus === COMMON.eWorkflowJobRunStatus.eDone
            || eStatus === COMMON.eWorkflowJobRunStatus.eError
            || eStatus === COMMON.eWorkflowJobRunStatus.eCancelled);

        const workflowStep: DBAPI.WorkflowStep | null = (!this.workflowData.workflowStep || this.workflowData.workflowStep.length <= 0)
            ? null : this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1];

        if (!workflowStep) {
            RK.logError(RK.LogSection.eWF,'workflow update status failed','missing WorkflowStep', { ...this.getWorkflowContext() },'Workflow.Job');
            return { success: false, workflowComplete, error: 'Missing WorkflowStep' };
        }

        const updated: boolean = (eStatus!==workflowStep?.getState());
        workflowStep.setState(eStatus);
        const success: boolean = await workflowStep.update();

        RK.logDebug(RK.LogSection.eWF,'workflow update status',undefined,
            { workflowComplete, updated, eStatus, ...this.getWorkflowContext() },
            'WorkflowUpload'
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
            RK.logError(RK.LogSection.eWF,'workflow update status failed','No workflows found from set', { ...this.getWorkflowContext(), idWorkflowSet: this.workflowData.workflow?.idWorkflowSet },'Workflow.Job');
            return { success, workflowComplete, error: success ? '' : 'Database Error' };
        }

        RK.logDebug(RK.LogSection.eWF,'workflow update',undefined,
            { workflowSet, workflows },
            'WorkflowUpload'
        );

        // Get all steps from the workflows
        const workflowSteps: DBAPI.WorkflowStep[] | null = await DBAPI.WorkflowStep.fetchFromWorkflowSet(workflowSet);
        if(!workflowSteps || workflowSteps.length===0)
            return { success, workflowComplete, error: success ? '' : 'Database Error' };

        RK.logDebug(RK.LogSection.eWF,'workflow steps update',undefined,
            { workflowSteps },
            'WorkflowUpload'
        );

        // see if any are still going, if so return
        const stillRunning: boolean = workflowSteps.some( step => ![4,5,6].includes(step.State));
        if(stillRunning===true) {
            RK.logDebug(RK.LogSection.eWF,'workflow update status','still running', { ...this.getWorkflowContext() },'Workflow.Job');
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

        // extract the workflow type
        const workflowTypeV: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(workflows[0].idVWorkflowType);
        const workflowType: string = workflowTypeV?.Term ?? 'Unknown Job';

        switch(eStatus) {
            case COMMON.eWorkflowJobRunStatus.eDone: {
                const url: string = Config.http.clientUrl +'/workflow';
                await RK.sendEmail(
                    RK.NotifyType.JOB_PASSED,
                    RK.NotifyGroup.EMAIL_USER,
                    `${workflowType} Finished`,
                    detailsMessage,
                    startDate,
                    endDate,
                    (url.length>0) ? { url, label: 'Uploads' } : undefined
                );
            } break;

            case COMMON.eWorkflowJobRunStatus.eError: {
                const url: string = Config.http.clientUrl +'/workflow';
                await RK.sendEmail(
                    RK.NotifyType.JOB_FAILED,
                    RK.NotifyGroup.EMAIL_USER,
                    `${workflowType} Failed`,
                    detailsMessage,
                    startDate,
                    endDate,
                    (url.length>0) ? { url, label: 'Reports' } : undefined
                );
            } break;
        }

        return { success, workflowComplete, error: success ? '' : 'Database Error' };
    }

    signalCompletion() {
        // set our flag for completion and cycle through all pending mutex to cancel them
        // BUG: in rare situations this is not called on fast/successful Cook jobs and thus goes
        //      until the full timeout (10hr).
        this.complete = true;
        for (const mutex of this.completionMutexes)
            mutex.cancel();
    }

    async waitForCompletion(timeout: number): Promise<H.IOResults> {

        if (this.complete)
            return this.results;

        // create a new mutex with the provided timeout value.
        // 'acquire()' returns a promise that resolves when the mutex is 'released'.
        // this mutex is stored in the array of mutext (i.e. actions) needed for job completion
        // a mutex will lock until it's timeout is satisfied or receives E_CANCEL, which is triggered
        // when the Job finishes and calls signalCompletion().
        const waitMutex: MutexInterface = withTimeout(new Mutex(), timeout);
        this.completionMutexes.push(waitMutex);

        const releaseOuter = await waitMutex.acquire();     // first acquire should succeed
        try {
            const releaseInner = await waitMutex.acquire(); // second acquire should wait
            releaseInner(); // releases the lock
        } catch (error) {
            if (error === E_CANCELED)                       // we're done -- cancel comes from signalCompletion()
                return this.results;
            else if (error === E_TIMEOUT)                   // we timed out
                return { success: false, error: `timed out after ${timeout}ms` };
            else
                return { success: false, error: `failure: ${JSON.stringify(error)}` };
        } finally {
            releaseOuter(); // releases the lock
        }
        return this.results;
    }

    async workflowConstellation(): Promise<DBAPI.WorkflowConstellation | null> {
        return this.workflowData;
    }

    async extractParameters(): Promise<H.IOResults> {
        // confirm that this.workflowParams.parameters is valid
        if (!(this.workflowParams.parameters instanceof WorkflowJobParameters)) {
            const error: string = `called with parameters not of type WorkflowJobParameters: ${JSON.stringify(this.workflowParams.parameters)}`;
            RK.logError(RK.LogSection.eWF,'extract parameters failed','called with parameters not of type WorkflowJobParameters', { ...this.getWorkflowContext(), parameters: this.workflowParams.parameters },'Workflow.Job');
            return { success: false, error };
        }

        this.workflowJobParameters = this.workflowParams.parameters;

        // confirm job type is a really a Job type
        const eJobType: COMMON.eVocabularyID = this.workflowJobParameters.eCookJob;
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eJobType, COMMON.eVocabularySetID.eJobJobType)) {
            const error: string = `invalid vocabulary in set: ${JSON.stringify(this.workflowJobParameters)}`;
            RK.logError(RK.LogSection.eWF,'extract parameters failed','invalid vocabulary in set', { ...this.getWorkflowContext(), eJobType, parameters: this.workflowJobParameters },'Workflow.Job');
            return { success: false, error };
        }

        // confirm that this.workflowParams.idSystemObject are asset versions; ultimately, we will want to allow a model and/or capture data, depending on the recipe
        if (!this.workflowParams.idSystemObject) {
            RK.logWarning(RK.LogSection.eWF,'extract parameters','no objects to act on', { ...this.getWorkflowContext() },'Workflow.Job');
            return { success: true }; // OK to call without objects to act on, at least at this point -- the job itself may complain once started
        }

        const WFUVersion: WorkflowUtilExtractAssetVersions = await WorkflowUtil.extractAssetVersions(this.workflowParams.idSystemObject);
        if (!WFUVersion.success) {
            RK.logError(RK.LogSection.eWF,'extract parameters failed',`asset versions error: ${WFUVersion.error}`, { ...this.getWorkflowContext(), idSystemObject: this.workflowParams.idSystemObject },'Workflow.Job');
            return { success: false, error: WFUVersion.error };
        }

        this.idAssetVersions = WFUVersion.idAssetVersions;
        return { success: true };
    }

    async getWorkflowObject(): Promise<DBAPI.Workflow | null> {

        // get our constellation
        const wfConstellation: DBAPI.WorkflowConstellation | null = await this.workflowConstellation();
        if(!wfConstellation) {
            RK.logError(RK.LogSection.eWF,'get workflow failed','No constellation found. not initialized?', { ...this.getWorkflowContext() },'Workflow.Job');
            return null;
        }

        return wfConstellation.workflow;
    }
}