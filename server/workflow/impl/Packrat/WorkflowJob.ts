/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */

import * as WF from '../../interface';
import * as JOB from '../../../job/interface';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

export class WorkflowJobParameters {
    eCookJob: CACHE.eVocabularyID;
    cookJobParameters: any;

    constructor(eCookJob: CACHE.eVocabularyID, cookJobParameters: any) {
        this.eCookJob = eCookJob;
        this.cookJobParameters = cookJobParameters;
    }
}

export class WorkflowJob implements WF.IWorkflow {
    private workflowData: DBAPI.WorkflowConstellation;
    private workflowJobParameters: WorkflowJobParameters | null = null;
    private idAssetVersions: number[] | null = null;

    constructor(workflowData: DBAPI.WorkflowConstellation) {
        this.workflowData = workflowData;
    }

    async start(workflowParams: WF.WorkflowParameters): Promise<H.IOResults> {
        if (!await this.validateParameters(workflowParams))
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
        workflowStep;
        jobRun;
        return { success: false, error: 'Not implemented' };
    }

    private async validateParameters(workflowParams: WF.WorkflowParameters): Promise<H.IOResults> {
        // confirm that workflowParams.parameters is valid
        if (!(workflowParams.parameters instanceof WorkflowJobParameters)) {
            const error: string = `WorkflowJob.start called with parameters not of type WorkflowJobParameters: ${JSON.stringify(workflowParams.parameters)}`;
            LOG.logger.error(error);
            return { success: false, error };
        }

        this.workflowJobParameters = workflowParams.parameters;

        // confirm job type is a really a Job type
        const eJobType: CACHE.eVocabularyID = workflowParams.parameters.eCookJob;
        if (!await CACHE.VocabularyCache.isVocabularyInSet(eJobType, CACHE.eVocabularySetID.eJobJobType)) {
            const error: string = `WorkflowJob.start called with parameters not of type WorkflowJobParameters: ${JSON.stringify(workflowParams.parameters)}`;
            LOG.logger.error(error);
            return { success: false, error };
        }

        // confirm that workflowParams.idSystemObject are asset versions; ultimately, we will want to allow a model and/or capture data, depending on the recipe
        if (!workflowParams.idSystemObject)
            return { success: true, error: '' }; // OK to call without objects to act on, at least at this point -- the job itself may complain once started

        this.idAssetVersions = [];
        for (const idSystemObject of workflowParams.idSystemObject) {
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