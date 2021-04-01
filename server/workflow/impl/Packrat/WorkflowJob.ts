/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */

import * as WF from '../../interface';
import * as JOB from '../../../job/interface';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

const WorkflowJobRetryDelay: number = 5000;

export class WorkflowJobParameters {
    eCookJob: CACHE.eVocabularyID;
    cookJobParameters: any;

    constructor(eCookJob: CACHE.eVocabularyID, cookJobParameters: any) {
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
    private idAssetVersions: number[] | null = null;

    static async constructWorkflowJob(workflowParams: WF.WorkflowParameters, WFC: DBAPI.WorkflowConstellation): Promise<WorkflowJob | null> {
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

    async start(): Promise<H.IOResults> {
        if (!await this.extractParameters())
            return { success: false, error: 'Invalid Job Parameters' };

        if (!this.workflowJobParameters)
            return { success: false, error: 'Invalid Job Parameters' };

        // fetch IJobEngine; use IJobEngine to create IJob; use IJob to start job
        // expect job to update WorkflowStep
        const jobEngine: JOB.IJobEngine | null = await JOB.JobFactory.getInstance();
        if (!jobEngine) {
            const error: string = 'WorkflowJob.start unable to fetch JobEngine';
            LOG.logger.error(error);
            return { success: false, error };
        }

        const jobCreationParameters: JOB.JobCreationParameters = {
            idJob: null,
            eJobType: this.workflowJobParameters.eCookJob,
            idAssetVersions: this.idAssetVersions,
            parameters: this.workflowJobParameters.cookJobParameters,
            frequency: null               // null means create but don't run
        };

        const job: JOB.IJob | null = await jobEngine.create(jobCreationParameters);
        if (!job) {
            const error: string = `WorkflowJob.start unable to start job ${jobCreationParameters.eJobType
                ? CACHE.eVocabularyID[jobCreationParameters.eJobType] : 'undefined'}`;
            LOG.logger.error(error);
            return { success: false, error };
        }

        // link WorkflowStep to JobRun
        const jobRunDB: DBAPI.JobRun | null = await job.dbJobRun();
        if (!jobRunDB) {
            const error: string = `WorkflowJob.start unable to fetch JobRun DB ${jobCreationParameters.eJobType
                ? CACHE.eVocabularyID[jobCreationParameters.eJobType] : 'undefined'}`;
            LOG.logger.error(error);
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

        // start job asynchronously, by not using await, so that remain unblocked:
        job.executeJob(new Date());
        return { success: true, error: '' };
    }

    async update(workflowStep: DBAPI.WorkflowStep, jobRun: DBAPI.JobRun): Promise<H.IOResults> {
        // update workflowStep based on job run data
        const eWorkflowStepStateOrig: DBAPI.eWorkflowStepState = workflowStep.getState();
        if (eWorkflowStepStateOrig == DBAPI.eWorkflowStepState.eFinished) {
            LOG.logger.info(`WorkflowJob.update ${JSON.stringify(this.workflowJobParameters)}: ${jobRun.idJobRun} Already Completed`);
            return { success: true, error: '' }; // job is already done
        }

        let eWorkflowStepState: DBAPI.eWorkflowStepState = eWorkflowStepStateOrig;
        const dateCompletedOrig: Date | null = workflowStep.DateCompleted;
        let dateCompleted: Date | null = dateCompletedOrig;
        let updateWFSNeeded: boolean = false;
        let updateWFNeeded: boolean = false;

        switch (jobRun.getStatus()) {
            case DBAPI.eJobRunStatus.eUnitialized:
            case DBAPI.eJobRunStatus.eCreated:
                eWorkflowStepState = DBAPI.eWorkflowStepState.eCreated;
                break;
            case DBAPI.eJobRunStatus.eRunning:
            case DBAPI.eJobRunStatus.eWaiting:
                eWorkflowStepState = DBAPI.eWorkflowStepState.eStarted;
                break;
            case DBAPI.eJobRunStatus.eDone:
            case DBAPI.eJobRunStatus.eError:
            case DBAPI.eJobRunStatus.eCancelled:
                eWorkflowStepState = DBAPI.eWorkflowStepState.eFinished;
                dateCompleted = new Date();
                break;
        }
        LOG.logger.info(`WorkflowJob.update ${JSON.stringify(this.workflowJobParameters)}: ${jobRun.idJobRun} ${DBAPI.eJobRunStatus[jobRun.getStatus()]} -> ${DBAPI.eWorkflowStepState[eWorkflowStepState]}`);
        // LOG.logger.error(`WorkflowJob.update ${JSON.stringify(this.workflowJobParameters)}: ${JSON.stringify(jobRun)} - ${JSON.stringify(workflowStep)}`, new Error());

        if (eWorkflowStepState != eWorkflowStepStateOrig) {
            workflowStep.setState(eWorkflowStepState);
            updateWFSNeeded = true;
        }

        if (dateCompleted != dateCompletedOrig) {
            workflowStep.DateCompleted = dateCompleted;
            updateWFSNeeded = true;

            if (this.workflowData.workflow && dateCompleted) {
                this.workflowData.workflow.DateUpdated = dateCompleted;
                updateWFNeeded = true;
            }
        }

        let result: boolean = true;

        if (updateWFSNeeded)
            result = await workflowStep.update() && result;
        if (updateWFNeeded && this.workflowData.workflow)
            result = await this.workflowData.workflow.update() && result;

        return (result) ? { success: true, error: '' } : { success: false, error: 'Database Error' };
    }

    private async computeWorkflowStatus(): Promise<DBAPI.eWorkflowStepState> {
        if (!this.workflowData || !this.workflowData.workflowStep || this.workflowData.workflowStep.length == 0)
            return DBAPI.eWorkflowStepState.eFinished;

        const idWorkflowStep: number = this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1].idWorkflowStep;
        const workflowStep: DBAPI.WorkflowStep | null = await DBAPI.WorkflowStep.fetch(idWorkflowStep);
        if (!workflowStep) {
            LOG.logger.error(`WorkflowJob.computeWorklowStatus unable to fetch workflow step for ${idWorkflowStep}`);
            return DBAPI.eWorkflowStepState.eFinished;
        }
        this.workflowData.workflowStep[this.workflowData.workflowStep.length - 1] = workflowStep;

        const eWorkflowStepState: DBAPI.eWorkflowStepState = workflowStep.getState();
        return eWorkflowStepState;
    }

    async waitForCompletion(timeout: number): Promise<H.IOResults> {
        const startTime: Date = new Date();
        let pollNumber: number = 0;
        while (true) {
            // poll for completion every WorkflowJobRetryDelay milleseconds:
            ++pollNumber;
            const eWorkflowStepState: DBAPI.eWorkflowStepState = await this.computeWorkflowStatus();
            LOG.logger.info(`WorkflowJob.waitForCompletion polling [${pollNumber}] for ${JSON.stringify(this.workflowJobParameters)}: ${DBAPI.eWorkflowStepState[eWorkflowStepState]}`);
            switch (eWorkflowStepState) {
                case DBAPI.eWorkflowStepState.eFinished:
                    return { success: true, error: '' };
            }

            if ((timeout > 0) &&
                ((new Date().getTime() - startTime.getTime()) >= timeout))
                return { success: false, error: 'timeout expired' };
            await H.Helpers.sleep(WorkflowJobRetryDelay);
        }
    }

    async extractParameters(): Promise<H.IOResults> {
        // confirm that this.workflowParams.parameters is valid
        if (!(this.workflowParams.parameters instanceof WorkflowJobParameters)) {
            const error: string = `WorkflowJob.start called with parameters not of type WorkflowJobParameters: ${JSON.stringify(this.workflowParams.parameters)}`;
            LOG.logger.error(error);
            return { success: false, error };
        }

        this.workflowJobParameters = this.workflowParams.parameters;

        // confirm job type is a really a Job type
        const eJobType: CACHE.eVocabularyID = this.workflowJobParameters.eCookJob;
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eJobType, CACHE.eVocabularySetID.eJobJobType)) {
            const error: string = `WorkflowJob.start called with parameters not of type WorkflowJobParameters: ${JSON.stringify(this.workflowJobParameters)}`;
            LOG.logger.error(error);
            return { success: false, error };
        }

        // confirm that this.workflowParams.idSystemObject are asset versions; ultimately, we will want to allow a model and/or capture data, depending on the recipe
        if (!this.workflowParams.idSystemObject)
            return { success: true, error: '' }; // OK to call without objects to act on, at least at this point -- the job itself may complain once started

        this.idAssetVersions = [];
        for (const idSystemObject of this.workflowParams.idSystemObject) {
            const OID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
            if (!OID) {
                const error: string = `WorkflowJob.start unable to compute system object type for ${idSystemObject}`;
                LOG.logger.error(error);
                return { success: false, error };
            } else if (OID.eObjectType != DBAPI.eSystemObjectType.eAssetVersion) {
                const error: string = `WorkflowJob.start called with invalid system object type ${JSON.stringify(OID)} for ${idSystemObject}; expected eAssetVersion`;
                LOG.logger.error(error);
                return { success: false, error };
            }
            this.idAssetVersions.push(OID.idObject);
        }
        return { success: true, error: '' };
    }
}