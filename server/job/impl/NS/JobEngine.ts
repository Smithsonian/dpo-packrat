/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import { JobPackrat } from './JobPackrat';
import * as COOK from '../Cook';
import * as H from '../../../utils/helpers';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import * as REP from '../../../report/interface';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

import * as NS from 'node-schedule';

class JobData {
    job: JobPackrat;
    dbJob: DBAPI.Job;
    dbJobRun: DBAPI.JobRun;

    constructor(job: JobPackrat, dbJob: DBAPI.Job, dbJobRun: DBAPI.JobRun) {
        this.job = job;
        this.dbJob = dbJob;
        this.dbJobRun = dbJobRun;
    }
}

export class JobEngine implements JOB.IJobEngine {
    private jobMap: Map<number, JobData> = new Map<number, JobData>();  // map from JobRun.idJobRun to JobData

    // #region IJobEngine interface
    async create(jobParams: JOB.JobCreationParameters): Promise<JOB.IJob | null> {
        const idJob: number | null = jobParams.idJob;
        let eJobType: COMMON.eVocabularyID | null = jobParams.eJobType;
        let dbJob: DBAPI.Job | null = null;
        const idAssetVersions: number[] | null = jobParams.idAssetVersions;
        const report: REP.IReport | null = jobParams.report;
        const parameters: any = jobParams.parameters;
        const frequency: string | null = jobParams.frequency;

        if (idJob) {
            // look up job type
            dbJob = await DBAPI.Job.fetch(idJob);
            if (!dbJob) {
                RK.logError(RK.LogSection.eJOB,'create job failed','unable to fetch Job with ID',{ idJob },'Job.Engine');
                return null;
            }
            const eJobType2: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(dbJob.idVJobType);
            if (!eJobType2) {
                RK.logError(RK.LogSection.eJOB,'create job failed','unable to fetch Job type',{ idJob, dbJob },'Job.Engine');
                return null;
            }

            if (eJobType === null)
                eJobType = eJobType2;
            else if (eJobType != eJobType2) {
                RK.logError(RK.LogSection.eJOB,'create job failed','called with contradictory idJob',{ idJob, jobType: COMMON.eVocabularyID[eJobType2] ?? 'undefined' },'Job.Engine');
                return null;
            }
        } else {
            if (!eJobType) {
                RK.logError(RK.LogSection.eJOB,'create job failed','called with null values for idJob and eJobType',{ ...jobParams },'Job.Engine');
                return null;
            }

            dbJob = await this.createJobDBRecord(eJobType, frequency);
            if (!dbJob) {
                RK.logError(RK.LogSection.eJOB,'create job failed','cannot create job db record',{ idJob, jobType: COMMON.eVocabularyID[eJobType] ?? 'undefined', frequency },'Job.Engine');
                return null;
            }
        }

        const dbJobRun: DBAPI.JobRun | null = await this.createJobRunDBRecord(dbJob, null, parameters);
        if (!dbJobRun) {
            RK.logError(RK.LogSection.eJOB,'create job failed','unable to create JobRun',{ idJob, dbJob, parameters },'Job.Engine');
            return null;
        }

        const job: JobPackrat | null = await this.createJob(eJobType, idAssetVersions, report, parameters, frequency, dbJobRun);
        if (!job) {
            RK.logError(RK.LogSection.eJOB,'create job failed','unable to create Job',{ idJob, jobType: COMMON.eVocabularyID[eJobType] ?? 'undefined', idAssetVersions },'Job.Engine');
            return null;
        }

        const configuration: string = JSON.stringify(job.configuration());
        if (configuration) {
            dbJobRun.Configuration = configuration;
            const result: boolean = await dbJobRun.update();
            if(!result) {
                RK.logError(RK.LogSection.eJOB,'create job failed','cannot update JobRun',{ idJob, jobType: COMMON.eVocabularyID[eJobType] ?? 'undefined' },'Job.Engine');
                return null;
            }
        }

        this.jobMap.set(dbJobRun.idJobRun, new JobData(job, dbJob, dbJobRun));
        RK.logInfo(RK.LogSection.eJOB,'create job success',undefined,{ idJob, jobType: COMMON.eVocabularyID[eJobType] ?? 'undefined', name: job.name() },'Job.Engine');
        return job;
    }

    async jobCompleted(job: JOB.IJob): Promise<void> {
        const dbJobRun: DBAPI.JobRun | null = await job.dbJobRun();
        if (dbJobRun) {
            this.jobMap.delete(dbJobRun.idJobRun);
            RK.logInfo(RK.LogSection.eJOB,'job completed',undefined,{ name: job.name(), idJobRun: dbJobRun.idJobRun },'Job.Engine');
        }
    }
    // #endregion

    // #region DB Record Maintenance
    private async createJobDBRecord(eJobType: COMMON.eVocabularyID, frequency: string | null): Promise<DBAPI.Job | null> {
        const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eJobType);
        if (!idVJobType) {
            RK.logError(RK.LogSection.eJOB,'create Job record failed','unable to fetch Job type',{ jobType: COMMON.eVocabularyID[eJobType] ?? 'undefined' },'Job.Engine');
            return null;
        }

        // search existing jobs for a frequency match; use this if found
        const dbJobs: DBAPI.Job[] | null = await DBAPI.Job.fetchByType(idVJobType);
        let dbJob: DBAPI.Job | null = null;
        let Name: string = '';
        if (dbJobs && dbJobs.length > 0) {
            for (const dbJobWalker of dbJobs) {
                if (dbJobWalker.Frequency === frequency) {
                    dbJob = dbJobWalker;
                    break;
                }
                Name = dbJobWalker.Name;
            }
        }

        if (!dbJob) {
            dbJob = new DBAPI.Job({ idJob: 0, idVJobType, Name, Status: DBAPI.eJobStatus.eActive, Frequency: frequency || '' });
            if (!await dbJob.create()) {
                RK.logError(RK.LogSection.eJOB,'create Job record failed','unknown db error creating dbJob',{ name: Name, jobType: COMMON.eVocabularyID[eJobType] ?? 'undefined' },'Job.Engine');
                return null;
            }
        }

        return dbJob;
    }

    private async createJobRunDBRecord(dbJob: DBAPI.Job, configuration: any, parameters: any): Promise<DBAPI.JobRun | null> {
        const dbJobRun: DBAPI.JobRun = new DBAPI.JobRun({
            idJobRun: 0, idJob: dbJob.idJob, Status: COMMON.eWorkflowJobRunStatus.eUnitialized,
            Result: null, DateStart: null, DateEnd: null, Configuration: JSON.stringify(configuration),
            Parameters: JSON.stringify(parameters, H.Helpers.saferStringify),
            Output: null, Error: null
        });

        if (!await dbJobRun.create()) {
            RK.logError(RK.LogSection.eJOB,'create JobRun record failed','unknown db error creating dbJobRun',{ name: dbJob.Name, jobType: COMMON.eVocabularyID[dbJob.idVJobType] ?? 'undefined' },'Job.Engine');
            return null;
        }
        return dbJobRun;
    }
    // #endregion

    // #region Job Creation Factory
    private async createJob(eJobType: COMMON.eVocabularyID, idAssetVersions: number[] | null, report: REP.IReport | null,
        parameters: any, frequency: string | null, dbJobRun: DBAPI.JobRun): Promise<JobPackrat | null> {
        // create job
        const job: JobPackrat | null = await this.createJobWorker(eJobType, idAssetVersions, report, parameters, dbJobRun);
        if (!job)
            return null;

        // schedule/launch job
        if (frequency === null) // no frequency means just create the job
            return job;

        if (frequency === '') { // empty frequency means run it once, now
            RK.logInfo(RK.LogSection.eJOB,'create job','immediate job start',{ idJobRun: dbJobRun.idJobRun, jobType: COMMON.eVocabularyID[eJobType] ?? 'undefined', parameters },'Job.Engine');
            if (report)
                await report.append(`JobEngine running ${job.name()}`);
            job.executeJob(new Date()); // do not use await here, so that we remain unblocked while the job starts
        } else {                 // non-empty frequency means run job on schedule
            const nsJob: NS.Job = NS.scheduleJob(job.name(), frequency, job.executeJob);
            if (report)
                await report.append(`JobEngine scheduling ${job.name()}`);
            job.setNSJob(nsJob);
        }
        return job;
    }

    private async createJobWorker(eJobType: COMMON.eVocabularyID, idAssetVersions: number[] | null, report: REP.IReport | null,
        parameters: any, dbJobRun: DBAPI.JobRun): Promise<JobPackrat | null> {
        let job: JobPackrat | null = null;
        let expectedJob: string = '';
        const context: string = `: ${JSON.stringify(parameters, H.Helpers.saferStringify)}`;
        switch (eJobType) {
            case COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect:
                expectedJob = 'Cook si-packrat-inspect';
                if (parameters instanceof COOK.JobCookSIPackratInspectParameters) // confirm that parameters is of type JobCookSIPackratInspectParameters
                    job = new COOK.JobCookSIPackratInspect(this, idAssetVersions, report, parameters, dbJobRun);
                break;
            case COMMON.eVocabularyID.eJobJobTypeCookSIVoyagerScene:
                expectedJob = 'Cook si-voyager-scene';
                if (parameters instanceof COOK.JobCookSIVoyagerSceneParameters) // confirm that parameters is of type JobCookSIVoyagerSceneParameters
                    job = new COOK.JobCookSIVoyagerScene(this, idAssetVersions, report, parameters, dbJobRun);
                break;
            case COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads:
                expectedJob = 'Cook si-generate-downloads';
                if (parameters instanceof COOK.JobCookSIGenerateDownloadsParameters) // confirm that parameters is of type JobCookSIGenerateDownloadsParameters
                    job = new COOK.JobCookSIGenerateDownloads(this, idAssetVersions, report, parameters, dbJobRun);
                break;
            default:
                RK.logError(RK.LogSection.eJOB,'create job worker failed','unknow job type',{ idJobRun: dbJobRun.idJobRun, jobType: COMMON.eVocabularyID[eJobType] ?? 'undefined', parameters },'Job.Engine');
                return null;
        }

        if (!job)
            RK.logError(RK.LogSection.eJOB,'create job worker failed','called with parameters not consistent with job type',{ idJobRun: dbJobRun.idJobRun, expectedJob, parameters },'Job.Engine');
        else if (report)
            await report.append(`JobEngine creating ${expectedJob}${context}`);

        return job;
    }
    // #endregion
}