/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import { Config } from '../../../config';
import * as LOG from '../../../utils/logger';
// import * as CACHE from '../../cache';
import * as DBAPI from '../../../db';
// import * as H from '../../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

class JobCookConfiguration {
    clientId: string;
    jobName: string;
    recipeId: string;
    jobId: string;

    constructor(clientId: string, jobName: string, recipeId: string, jobId: string | null) {
        this.clientId = clientId;
        this.jobName = jobName;
        this.recipeId = recipeId;
        this.jobId = jobId || uuidv4(); // create a new JobID if we haven't provided one
    }
}

enum eJobCookPriority {
    eLow = 'low',
    eNormal = 'normal',
    eHigh = 'high'
}

class JobCookPostBody<T> {
    id: string;
    name: string;
    clientId: string;
    recipeId: string;
    parameters: T; // object with job parameters
    priority: string; // low, normal, high
    submission: string; // Date in ISO format

    constructor(configuration: JobCookConfiguration, parameters: T, ePriority: eJobCookPriority) {
        this.id = configuration.jobId;
        this.name = configuration.jobName;
        this.clientId = configuration.clientId;
        this.recipeId = configuration.recipeId;
        this.parameters = parameters;
        this.priority = eJobCookPriority[ePriority];
        this.submission = new Date().toISOString();
    }
}

export abstract class JobCook<T> implements JOB.IJob {
    private configuration: JobCookConfiguration;
    private eJobRunStatus: DBAPI.eJobRunStatus = DBAPI.eJobRunStatus.eNotStarted;

    protected abstract getParameters(): T;

    // null jobId means create a new one
    constructor(clientId: string, jobName: string, recipeId: string, jobId: string | null = null) {
        this.configuration = new JobCookConfiguration(clientId, jobName, recipeId, jobId);
    }

    name(): string {
        return this.configuration.jobName;
    }

    jobCallback(fireDate: Date): void {
        LOG.logger.info(`JobCook ${this.name()} starting; scheduled at ${fireDate.toISOString()}`);

        // POST to /job JobCookInitiation
        const jobCookPostBody: JobCookPostBody<T> = new JobCookPostBody<T>(this.configuration, this.getParameters(), eJobCookPriority.eNormal);
        const requestUrl: string = Config.job.cookServerUrl + 'job';
        requestUrl;
        JSON.stringify(jobCookPostBody);

        // schedule getStatus() polling

        LOG.logger.info(`JobCook ${this.name()} completed`);
    }

    async getStatus(): Promise<DBAPI.eJobRunStatus> {
        // poll server for status update
        // update eJobRunStatus
        // on completion, handle completion steps
        // update DB ... or pass back info needed by JobEngine to update DB
        return this.eJobRunStatus;
    }

    getConfiguration(): any { return this.configuration; }
}
