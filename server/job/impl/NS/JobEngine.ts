/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import { JobPackrat } from './JobPackrat';
import * as COOK from '../Cook';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import * as REP from '../../../report/interface';

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
        let eJobType: CACHE.eVocabularyID | null = jobParams.eJobType;
        let dbJob: DBAPI.Job | null = null;
        const idAssetVersions: number[] | null = jobParams.idAssetVersions;
        const report: REP.IReport | null = jobParams.report;
        const parameters: any = jobParams.parameters;
        const frequency: string | null = jobParams.frequency;

        if (idJob) {
            // look up job type
            dbJob = await DBAPI.Job.fetch(idJob);
            if (!dbJob) {
                LOG.error(`JobEngine.create unable to fetch Job with ID ${idJob}`, LOG.LS.eJOB);
                return null;
            }
            const eJobType2: CACHE.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(dbJob.idVJobType);
            if (!eJobType2) {
                LOG.error(`JobEngine.createByID unable to fetch Job type from ${JSON.stringify(dbJob)}`, LOG.LS.eJOB);
                return null;
            }

            if (eJobType === null)
                eJobType = eJobType2;
            else if (eJobType != eJobType2) {
                LOG.error(`JobEngine.create called with contradictory idJob (job type ${CACHE.eVocabularyID[eJobType2]}) vs. job type ${CACHE.eVocabularyID[eJobType]}`, LOG.LS.eJOB);
                return null;
            }
        } else {
            if (!eJobType) {
                LOG.error('JobEngine.create called with null values for idJob and eJobType', LOG.LS.eJOB);
                return null;
            }

            dbJob = await this.createJobDBRecord(eJobType, frequency);
            if (!dbJob)
                return null;
        }

        const dbJobRun: DBAPI.JobRun | null = await this.createJobRunDBRecord(dbJob, null, parameters);
        if (!dbJobRun) {
            LOG.error('JobEngine.createWorker unable to create JobRun', LOG.LS.eJOB);
            return null;
        }

        const job: JobPackrat | null = await this.createJob(eJobType, idAssetVersions, report, parameters, frequency, dbJobRun);
        if (!job) {
            LOG.error('JobEngine.createWorker unable to create Job', LOG.LS.eJOB);
            return null;
        }

        const configuration: string = JSON.stringify(job.configuration());
        if (configuration) {
            dbJobRun.Configuration = configuration;
            await dbJobRun.update();
        }

        this.jobMap.set(dbJobRun.idJobRun, new JobData(job, dbJob, dbJobRun));
        LOG.info(`JobEngine.create [${this.jobMap.size}]: job ${dbJobRun.idJobRun}: ${job.name()}`, LOG.LS.eJOB);
        return job;
    }

    async jobCompleted(job: JOB.IJob): Promise<void> {
        const dbJobRun: DBAPI.JobRun | null = await job.dbJobRun();
        if (dbJobRun) {
            this.jobMap.delete(dbJobRun.idJobRun);
            LOG.info(`JobEngine.jobCompleted [${this.jobMap.size}]: job ${dbJobRun.idJobRun}: ${job.name()}`, LOG.LS.eJOB);
        }
    }
    // #endregion

    // #region DB Record Maintenance
    private async createJobDBRecord(eJobType: CACHE.eVocabularyID, frequency: string | null): Promise<DBAPI.Job | null> {
        const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eJobType);
        if (!idVJobType) {
            LOG.error(`JobEngine.createDBJob unable to fetch Job type from ${CACHE.eVocabularyID[eJobType]}`, LOG.LS.eJOB);
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
                LOG.error('JobEngine.createJobDBRecord failed', LOG.LS.eJOB);
                return null;
            }
        }

        return dbJob;
    }

    private async createJobRunDBRecord(dbJob: DBAPI.Job, configuration: any, parameters: any): Promise<DBAPI.JobRun | null> {
        const dbJobRun: DBAPI.JobRun = new DBAPI.JobRun({
            idJobRun: 0, idJob: dbJob.idJob, Status: DBAPI.eJobRunStatus.eUnitialized,
            Result: null, DateStart: null, DateEnd: null, Configuration: JSON.stringify(configuration),
            Parameters: JSON.stringify(parameters),
            Output: null, Error: null
        });

        if (!await dbJobRun.create()) {
            LOG.error('JobEngine.createJobRunDBRecord failed', LOG.LS.eJOB);
            return null;
        }
        return dbJobRun;
    }
    // #endregion

    // #region Job Creation Factory
    private async createJob(eJobType: CACHE.eVocabularyID, idAssetVersions: number[] | null, report: REP.IReport | null,
        parameters: any, frequency: string | null, dbJobRun: DBAPI.JobRun): Promise<JobPackrat | null> {
        // create job
        const job: JobPackrat | null = await this.createJobWorker(eJobType, idAssetVersions, report, parameters, dbJobRun);
        if (!job)
            return null;

        // schedule/launch job
        if (frequency === null) // no frequency means just create the job
            return job;

        if (frequency === '') { // empty frequency means run it once, now
            LOG.info(`JobEngine.createJob running now ${job.name()}`, LOG.LS.eJOB);
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

    private async createJobWorker(eJobType: CACHE.eVocabularyID, idAssetVersions: number[] | null, report: REP.IReport | null,
        parameters: any, dbJobRun: DBAPI.JobRun): Promise<JobPackrat | null> {
        let job: JobPackrat | null = null;
        let expectedJob: string = '';
        switch (eJobType) {
            case CACHE.eVocabularyID.eJobJobTypeCookSIPackratInspect:
                expectedJob = 'Cook si-packrat-inspect';
                if (parameters instanceof COOK.JobCookSIPackratInspectParameters) // confirm that parameters is of type JobCookSIPackratInspectParameters
                    job = new COOK.JobCookSIPackratInspect(this, idAssetVersions, report, parameters, dbJobRun);
                break;
            case CACHE.eVocabularyID.eJobJobTypeCookSIVoyagerScene:
                expectedJob = 'Cook si-voyager-scene';
                if (parameters instanceof COOK.JobCookSIVoyagerSceneParameters) // confirm that parameters is of type JobCookSIVoyagerSceneParameters
                    job = new COOK.JobCookSIVoyagerScene(this, idAssetVersions, report, parameters, dbJobRun);
                break;
            case CACHE.eVocabularyID.eJobJobTypeCookSIGenerateDownloads:
                expectedJob = 'Cook si-generate-downloads';
                if (parameters instanceof COOK.JobCookSIGenerateDownloadsParameters) // confirm that parameters is of type JobCookSIGenerateDownloadsParameters
                    job = new COOK.JobCookSIGenerateDownloads(this, idAssetVersions, report, parameters, dbJobRun);
                break;
            default:
                LOG.error(`JobEngine.createJobWorker unknown job type ${CACHE.eVocabularyID[eJobType]}`, LOG.LS.eJOB);
                return null;
        }

        if (!job)
            LOG.error(`JobEngine.createJobWorker called with parameters not of type ${expectedJob}: ${JSON.stringify(parameters)}`, LOG.LS.eJOB);
        else if (report)
            await report.append(`JobEngine creating ${expectedJob}`);

        return job;
    }
    // #endregion
}