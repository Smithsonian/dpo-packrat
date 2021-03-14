/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../interface';
import * as COOK from './Cook';
import * as LOG from '../../utils/logger';
import * as CACHE from '../../cache';
import * as DBAPI from '../../db';

export class JobEngine implements JOB.IJobEngine {
    // #region IJobEngine interface
    async createByID(idJob: number, parameters: any, frequency: string | null): Promise<JOB.IJob | null> {
        const dbJob: DBAPI.Job | null = await DBAPI.Job.fetch(idJob);
        if (!dbJob) {
            LOG.logger.error(`JobEngine.createByID unable to fetch Job with ID ${idJob}`);
            return null;
        }

        const eJobType: CACHE.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(dbJob.idVJobType);
        if (!eJobType) {
            LOG.logger.error(`JobEngine.createByID unable to fetch Job type from ${JSON.stringify(dbJob)}`);
            return null;
        }

        const job: JOB.IJob | null = this.createJob(eJobType, parameters, frequency);
        if (job)
            await this.createJobRunDBRecord(dbJob, parameters);
        return job;
    }

    async createByType(eJobType: CACHE.eVocabularyID, parameters: any, frequency: string | null): Promise<JOB.IJob | null> {
        const job: JOB.IJob | null = this.createJob(eJobType, parameters, frequency);
        if (job) {
            const dbJob: DBAPI.Job | null = await this.createJobDBRecord(eJobType, frequency);
            if (dbJob)
                await this.createJobRunDBRecord(dbJob, parameters);
        }
        return job;
    }
    // #endregion

    // #region DB Record Maintenance
    private async createJobDBRecord(eJobType: CACHE.eVocabularyID, frequency: string | null): Promise<DBAPI.Job | null> {
        const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eJobType);
        if (!idVJobType) {
            LOG.logger.error(`JobEngine.createDBJob unable to fetch Job type from ${CACHE.eVocabularyID[eJobType]}`);
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
                LOG.logger.error('JobEngine.createJobDBRecord failed');
                return null;
            }
        }

        return dbJob;
    }

    private async createJobRunDBRecord(dbJob: DBAPI.Job, parameters: any): Promise<DBAPI.JobRun | null> {
        const dbJobRun: DBAPI.JobRun = new DBAPI.JobRun({
            idJobRun: 0, idJob: dbJob.idJob, Status: DBAPI.eJobRunStatus.eNotStarted,
            Result: null, DateStart: null, DateEnd: null, Configuration: null,
            Parameters: JSON.stringify(parameters),
            Output: null, Error: null
        });

        if (!await dbJobRun.create()) {
            LOG.logger.error('JobEngine.createJobRunDBRecord failed');
            return null;
        }
        return dbJobRun;
    }
    // #endregion

    // #region Job Creation Factory
    private createJob(eJobType: CACHE.eVocabularyID, parameters: any, frequency: string | null): JOB.IJob | null {
        // create job
        const job: JOB.IJob | null = this.createJobWorker(eJobType, parameters);
        if (!job)
            return null;

        // schedule/launch job
        if (frequency === null)
            return job;
        if (frequency === '') {
            // run job once
            return job;
        }
        // run job on schedule
        return job;
    }

    private createJobWorker(eJobType: CACHE.eVocabularyID, parameters: any): JOB.IJob | null {
        switch (eJobType) {
            case CACHE.eVocabularyID.eJobJobTypeCookInspectMesh: return new COOK.JobCookSIPackratInspect(parameters);
            default:
                LOG.logger.error(`JobEngine.createByType unknown job type ${CACHE.eVocabularyID[eJobType]}`);
                return null;
        }
    }
    // #endregion
}