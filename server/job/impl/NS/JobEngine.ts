/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import { JobEngineBase } from './JobEngineBase';
import { JobPackrat } from './JobPackrat';
import * as COOK from '../Cook';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import * as REP from '../../../report/interface';
import * as EVENT from '../../../event/interface';
import * as COMMON from '@dpo-packrat/common';

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

interface JobEventData {
    idJobRun: number,
    obj: any
}

export class JobEngine extends JobEngineBase implements JOB.IJobEngine, EVENT.IEventConsumer {
    static setEventEngine(eventEngine: EVENT.IEventEngine): void {
        LOG.info('JobEngine.setEventEngine called', LOG.LS.eJOB);
        JobEngine.eventEngine = eventEngine;
    }

    private static eventEngine: EVENT.IEventEngine | null = null;       // don't import EventFactory to avoid circular dependencies
    private static registeredEventConsumer: boolean = false;

    private eventProducer: EVENT.IEventProducer | null = null;
    private jobMap: Map<number, JobData> = new Map<number, JobData>();  // map from JobRun.idJobRun to JobData

    // #region IJobEngine interface
    async create(jobParams: JOB.JobCreationParameters): Promise<JOB.IJob | null> {
        if (!JobEngine.registeredEventConsumer && JobEngine.eventEngine)
            JobEngine.registeredEventConsumer = await JobEngine.eventEngine.registerConsumer(EVENT.eEventTopic.eJob, this);

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
                LOG.error(`JobEngine.create unable to fetch Job with ID ${idJob}`, LOG.LS.eJOB);
                return null;
            }
            const eJobType2: COMMON.eVocabularyID | undefined = await CACHE.VocabularyCache.vocabularyIdToEnum(dbJob.idVJobType);
            if (!eJobType2) {
                LOG.error(`JobEngine.createByID unable to fetch Job type from ${JSON.stringify(dbJob)}`, LOG.LS.eJOB);
                return null;
            }

            if (eJobType === null)
                eJobType = eJobType2;
            else if (eJobType != eJobType2) {
                LOG.error(`JobEngine.create called with contradictory idJob (job type ${COMMON.eVocabularyID[eJobType2]}) vs. job type ${COMMON.eVocabularyID[eJobType]}`, LOG.LS.eJOB);
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
    // #endregion

    // #region DB Record Maintenance
    private async createJobDBRecord(eJobType: COMMON.eVocabularyID, frequency: string | null): Promise<DBAPI.Job | null> {
        const idVJobType: number | undefined = await CACHE.VocabularyCache.vocabularyEnumToId(eJobType);
        if (!idVJobType) {
            LOG.error(`JobEngine.createDBJob unable to fetch Job type from ${COMMON.eVocabularyID[eJobType]}`, LOG.LS.eJOB);
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
            idJobRun: 0, idJob: dbJob.idJob, Status: COMMON.eWorkflowJobRunStatus.eUnitialized,
            Result: null, DateStart: null, DateEnd: null, Configuration: JSON.stringify(configuration),
            Parameters: JSON.stringify(parameters, H.Helpers.saferStringify),
            Output: null, Error: null, Step: null
        });

        if (!await dbJobRun.create()) {
            LOG.error('JobEngine.createJobRunDBRecord failed', LOG.LS.eJOB);
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
                LOG.error(`JobEngine.createJobWorker unknown job type ${COMMON.eVocabularyID[eJobType]}`, LOG.LS.eJOB);
                return null;
        }

        if (!job)
            LOG.error(`JobEngine.createJobWorker called with parameters not consistent with job type ${expectedJob}${context}`, LOG.LS.eJOB);
        else if (report)
            await report.append(`JobEngine creating ${expectedJob}${context}`);

        return job;
    }
    // #endregion

    // #region IEventConsumer interface
    async event<Value>(eTopic: EVENT.eEventTopic, data: EVENT.IEventData<Value>[]): Promise<void> {
        if (eTopic !== EVENT.eEventTopic.eJob) {
            LOG.error(`JobEngine.event skipping unexpected event with topic ${EVENT.eEventTopic[eTopic]} and data ${H.Helpers.JSONStringify(data)}`, LOG.LS.eWF);
            return;
        }

        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`JobEngine.event skipping event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eJOB);
                continue;
            }

            const idJobRun: number | null = this.extractJobRunID(dataItem);
            if (idJobRun === null) {
                LOG.error(`JobEngine.event skipping job event missing idJobRun in value ${JSON.stringify(dataItem)}`, LOG.LS.eJOB);
                continue;
            }

            LOG.info(`JobEngine.event ${EVENT.eEventKey[dataItem.key]} ${JSON.stringify(dataItem)}`, LOG.LS.eJOB);
            switch (dataItem.key) {
                case EVENT.eEventKey.eJobCreated:
                case EVENT.eEventKey.eJobRunning:
                case EVENT.eEventKey.eJobUpdated:
                case EVENT.eEventKey.eJobWaiting:
                    break;

                case EVENT.eEventKey.eJobDone:
                case EVENT.eEventKey.eJobError:
                case EVENT.eEventKey.eJobCancelled: {
                    const jobData: JobData | undefined = this.jobMap.get(idJobRun);
                    const job: JOB.IJob | undefined = jobData?.job;
                    const dbJobRun: DBAPI.JobRun | null = job ? await job.dbJobRun() : null;
                    if (job && dbJobRun) {
                        this.jobMap.delete(dbJobRun.idJobRun);
                        LOG.info(`JobEngine.jobEvent [${this.jobMap.size}]: job ${dbJobRun.idJobRun} ${EVENT.eEventKey[dataItem.key]}: ${job.name()}`, LOG.LS.eJOB);
                    } else
                        LOG.error(`JobEngine.jobEvent [${this.jobMap.size}]: unable to compute JobRun with id ${idJobRun}`, LOG.LS.eJOB);
                } break;

                default:
                    LOG.error(`JobEngine.event skipping event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eJOB);
                    break;
            }
        }
    }

    private extractJobRunID<Value>(dataItem: EVENT.IEventData<Value>): number | null {
        return H.Helpers.safeNumber(dataItem.value['idJobRun']);
    }
    // #endregion

    // #region Job Events
    async sendJobEvent(idJobRun: number, obj: any, key: EVENT.eEventKey): Promise<boolean> {
        if (!this.eventProducer && JobEngine.eventEngine)
            this.eventProducer = await JobEngine.eventEngine.createProducer();
        if (!this.eventProducer) {
            LOG.error('JobEngine.sendJobEvent unable to fetch event producer', LOG.LS.eJOB);
            return false;
        }

        const eventDate: Date = new Date();
        switch (key) {
            case EVENT.eEventKey.eJobCreated:
            case EVENT.eEventKey.eJobRunning:
            case EVENT.eEventKey.eJobUpdated:
            case EVENT.eEventKey.eJobWaiting:
            case EVENT.eEventKey.eJobDone:
            case EVENT.eEventKey.eJobError:
            case EVENT.eEventKey.eJobCancelled:
                break;
            default:
                LOG.error(`JobEngine.sendJobEvent asked to send a non-job event ${EVENT.eEventKey[key]}`, LOG.LS.eJOB);
                return false;
        }

        const value: JobEventData = {
            idJobRun,
            obj
        };

        const data: EVENT.IEventData<JobEventData> = {
            eventDate,
            key,
            value,
        };
        this.eventProducer.send(EVENT.eEventTopic.eJob, [data]);
        return true;
    }

    // #endregion
}