/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */
import * as JOB from '../../interface';
import { JobPackrat, JobIOResults } from  '../NS/JobPackrat';
import * as DBAPI from '../../../db';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import { Config } from '../../../config';
import * as H from '../../../utils/helpers';
import * as COOKRES from '../../../job/impl/Cook/CookResource';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

import { v4 as uuidv4 } from 'uuid';
import { AuthType, createClient, WebDAVClient, CreateWriteStreamOptions, CreateReadStreamOptions } from 'webdav';
import { Writable, Readable } from 'stream';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { Semaphore, Mutex, MutexInterface, withTimeout, E_TIMEOUT, E_CANCELED } from 'async-mutex';
import * as path from 'path';

const CookWebDAVSimultaneousTransfers: number = 10;
const CookSimultaneousJobs: number = 25;
const CookRequestRetryCount: number = 5;
const CookWebDAVTransmitRetryCount: number = 5;
const CookWebDAVStatRetryCount: number = 10; //100; TODO: Revert
const CookRetryDelay: number = 5000;
const CookTimeout: number = 10 * 60 * 60 * 1000; // ten hours
const CookFailureNotificationTime: number = 60 * 60 * 1000; // 1 hour

type CookIOResults = H.IOResults & {
    allowRetry?: boolean | undefined,
    connectFailure?: boolean | undefined,
    otherCookError?: boolean | undefined
};

class JobCookConfiguration {
    clientId: string;
    jobName: string;
    recipeId: string;
    jobId: string;
    cookServerURLs: string[];
    cookServerURLIndex: number;

    constructor(clientId: string, jobName: string, recipeId: string, jobId: string | null, dbJobRun: DBAPI.JobRun, serverURL: string[] | null) {
        this.clientId = clientId;
        this.jobName = `${jobName}: ${dbJobRun.idJobRun}`;
        this.recipeId = recipeId;
        this.jobId = jobId || uuidv4(); // create a new JobID if we haven't provided one
        this.cookServerURLs = serverURL || Config.job.cookServerUrls; // assign our environment defined URL as default
        this.cookServerURLIndex = 0;
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
        switch (ePriority) {
            case eJobCookPriority.eLow:     this.priority = 'low'; break;
            default:
            case eJobCookPriority.eNormal:  this.priority = 'normal'; break;
            case eJobCookPriority.eHigh:    this.priority = 'high'; break;
        }
        this.submission = new Date().toISOString();
    }
}

export abstract class JobCook<T> extends JobPackrat {

    // TODO: additional error reporting out to generated report

    private _configuration: JobCookConfiguration;
    protected _idAssetVersions: number[] | null;
    private _completionMutexes: MutexInterface[] = [];
    private _complete: boolean = false;
    protected _streamOverrideMap: Map<number, STORE.ReadStreamResult[]> = new Map<number, STORE.ReadStreamResult[]>();

    private static _stagingSempaphoreWrite = new Semaphore(CookWebDAVSimultaneousTransfers);
    private static _stagingSempaphoreRead = new Semaphore(CookWebDAVSimultaneousTransfers);
    private static _cookJobSempaphore = new Semaphore(CookSimultaneousJobs);
    private static _cookServerFailureNotificationDate: Date | null = null;
    private static _cookServerFailureNotificationList: Set<string> = new Set<string>();
    private static _cookConnectFailures: number = 0;

    protected abstract getParameters(): Promise<T>;

    // null jobId means create a new one
    constructor(jobEngine: JOB.IJobEngine, clientId: string, jobName: string,
        recipeId: string, jobId: string | null, idAssetVersions: number[] | null,
        report: REP.IReport | null, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, dbJobRun, report);
        this._configuration = new JobCookConfiguration(clientId, jobName, recipeId, jobId, dbJobRun, null);
        this._idAssetVersions = idAssetVersions;

        // NOTE: any JobCook implementations MUST call initialize() before createWorker.
    }

    async initialize(): Promise<H.IOResults> {
        if(this._initialized===true)
            return { success: true };

        // convert recipe to job type
        const job: string | undefined = COOKRES.getJobTypeFromCookJobName(this._configuration.jobName);
        if(!job) {
            const error = `getCookResource cannot determine Cook job type. (${this._configuration.jobName})`;
            RK.logError(RK.LogSection.eJOB,'job initialize failed','cannot determine Cook job type', { jobType: this._configuration.jobName, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
            this.appendToReportAndLog(error);
            return { success: false, error };
        }

        // cycle filter list of resources based on supported features
        const cookResources: COOKRES.CookResourceResult = await COOKRES.CookResource.getCookResource(job,this._configuration.jobId,true);

        // if we're empty, bail
        if(cookResources.success===false || cookResources.resources.length<=0) {
            const error = `getCookResource cannot find the best fit resource. (${cookResources.error})`;
            RK.logError(RK.LogSection.eJOB,'job initialize failed',cookResources.error, { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
            this.appendToReportAndLog(error);
            return { success: false, error };
        }

        // rebuild list of Cook resources
        this._configuration.cookServerURLs = [];
        for(let i=0; i<cookResources.resources.length; i++) {
            const endpoint = `${cookResources.resources[i].address}:${cookResources.resources[i].port}/`;
            this._configuration.cookServerURLs.push(endpoint);
            // LOG.info(COOKRES.getResourceInfoString(cookResources.resources[i],job),LOG.LS.eJOB);
        }
        this._configuration.cookServerURLIndex = 0;

        // add to our report so we know what resource was chosen
        // TODO: debug mode outputting all considered resources and the one chosen
        const bestFit: COOKRES.CookResourceInfo = cookResources.resources[this._configuration.cookServerURLIndex];
        const reportMsg: string = `Matched ${cookResources.resources.length} Cook resources. The best fit is ${COOKRES.getResourceInfoString(bestFit,job)}`;
        this.appendToReportAndLog(reportMsg);

        // return success
        this._initialized = true;
        return { success: true };
    }

    CookServerURL(): string {
        // if we don't have a server yet, throw error
        if(this._initialized === false) {
            RK.logError(RK.LogSection.eJOB,'get Cook URL failed','not initialized. providing default Cook server endpoint', { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, endpoint: this._configuration.cookServerURLs[0] },'Job.Cook');
            return this._configuration.cookServerURLs[0];
        }

        // return whatever resource we're currently on
        // LOG.info(`JobCook.CookServerURL returning ${this._configuration.cookServerURLs[this._configuration.cookServerURLIndex]} as best fit out of ${this._configuration.cookServerURLs.length} available resources.`,LOG.LS.eJOB);
        return this._configuration.cookServerURLs[this._configuration.cookServerURLIndex];
    }

    // #region IJob interface
    name(): string {
        return this._configuration.jobName;
    }

    configuration(): any {
        return this._configuration;
    }

    async signalCompletion(): Promise<void> {
        // when the Cook job has compeleted and returned
        this._complete = true;
        for (const mutex of this._completionMutexes)
            mutex.cancel();
        await this.cleanupJob();
    }

    async waitForCompletion(timeout: number): Promise<H.IOResults> {
        if (this._complete)
            return { success: true };
        const waitMutex: MutexInterface = withTimeout(new Mutex(), timeout);
        this._completionMutexes.push(waitMutex);

        const releaseOuter = await waitMutex.acquire();     // first acquire should succeed
        try {
            const releaseInner = await waitMutex.acquire(); // second acquire should wait
            releaseInner();
        } catch (error) {
            if (error === E_CANCELED)                   // we're done
                return { success: true };
            else if (error === E_TIMEOUT)               // we timed out
                return { success: false, error: `JobCook [${this.name()}] JobCook.waitForCompletion timed out after ${timeout}ms` };
            else
                return { success: false, error: `JobCook [${this.name()}] JobCook.waitForCompletion failure: ${JSON.stringify(error)}` };
        } finally {
            releaseOuter();
        }
        return { success: true };
    }

    private async pollingLoop(timeout: number): Promise<JobIOResults> {
        try {
            const startTime: Date = new Date();
            let pollNumber: number = 0;
            let errorCount: number = 0;
            let polling: boolean = true;
            while (polling) {
                // poll for completion every CookRetryDelay milleseconds:
                const res: CookIOResults = await this.pollingCallback(++pollNumber);
                polling = (res.allowRetry !== undefined) ? res.allowRetry : true;
                if (!polling)
                    return this._results;

                let error: string = '';
                if (res.connectFailure) {
                    ++errorCount;
                    error = 'Cook connection failure';
                }
                if (res.otherCookError) {
                    ++errorCount;
                    error = 'Cook error';
                }
                if (errorCount > CookRequestRetryCount) {               // if we've had too many errors,
                    this._results = { success: false, error };          // exit the pollingLoop with a failure
                    return res;
                }

                if ((timeout > 0) &&
                    ((new Date().getTime() - startTime.getTime()) >= timeout))
                    return this._results = { success: false, error: 'Cook timeout expired' };
                // LOG.info(`JobCook [${this.name()}] JobCook.pollingLoop sleeping [${pollNumber}]`, LOG.LS.eJOB);
                await H.Helpers.sleep(CookRetryDelay);
            }
        } catch (error) {
            RK.logError(RK.LogSection.eJOB,'polling job failed',H.Helpers.getErrorString(error),{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
            return this._results;
        } finally {
            await this.signalCompletion();
        }
        return this._results;
    }
    // #endregion

    // #region JobPackrat interface
    async startJobWorker(fireDate: Date): Promise<JobIOResults> {

        // make sure our properties are valid
        const verifyResult: CookIOResults = await this.verifyRequest();
        if(verifyResult.success===false) {
            RK.logError(RK.LogSection.eJOB,'start job worker',`failed verification: ${verifyResult.error}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
            this.recordFailure(`failed verification: ${verifyResult.error}`,verifyResult.error);
            return { success: false, error: verifyResult.error, allowRetry: false };
        }

        const res: H.IOResults = await JobCook._cookJobSempaphore.runExclusive(async (value) => {
            RK.logInfo(RK.LogSection.eJOB,'start job worker','starting job',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, semaphoreCount: value },'Job.Cook');
            return this.startJobWorkerInternal(fireDate);
        });
        return res;
    }

    private async startJobWorkerInternal(_fireDate: Date): Promise<JobIOResults> {
        let requestCount: number = 0;
        let res: CookIOResults = { success: false, allowRetry: true, connectFailure: false, otherCookError: false };

        try {
            // get our parameters
            const sceneParams = await this.getParameters();

            // Create job via POST to /job
            let requestUrl: string = this.CookServerURL() + 'job';
            const jobCookPostBody: JobCookPostBody<T> = new JobCookPostBody<T>(this._configuration, sceneParams, eJobCookPriority.eNormal);

            // submit the Cook job via an axios request, and retry for 'CookRequestRetryCount' times.
            // todo: there's a condition here leading to Cook timeout and repeated attempts even on failure
            while (true) {
                try {
                    RK.logDebug(RK.LogSection.eJOB,'start job worker','creating job',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl, jobCookPostBody },'Job.Cook');
                    const axiosResponse: AxiosResponse<any> | null = await axios.post(encodeURI(requestUrl), jobCookPostBody);
                    // LOG.info(`JobCook.startJobWorkerInternal: create job axios response (${H.Helpers.JSONStringify(axiosResponse)})`,LOG.LS.eDEBUG);

                    if (axiosResponse?.status === 201) {
                        RK.logDebug(RK.LogSection.eJOB,'start job worker','creating job successful post response',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl, axios: { status: axiosResponse.status, data: axiosResponse.data } },'Job.Cook');
                        break; // success, continue
                    } else {
                        res.error = `JobCook [${this.name()}] creating job: ${requestUrl} unexpected response (${axiosResponse?.status}:${axiosResponse?.statusText})`;
                        RK.logError(RK.LogSection.eJOB,'start job worker failed','creating job unexpeceted response',
                            { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, },'Job.Cook');
                    }
                } catch (err) {
                    res = this.handleRequestException(err, requestUrl, 'post', jobCookPostBody);

                    // log error at point
                    res.error = `JobCook [${this.name()}] creating job: ${requestUrl} failed (${err})`;
                    RK.logError(RK.LogSection.eJOB,'start job worker failed',`creating job failed: ${H.Helpers.getErrorString(err)}`,
                        { jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl },'Job.Cook');

                    // if we can't retry, return
                    if (res.allowRetry === false)
                        return res;
                }

                if (++requestCount >= CookRequestRetryCount) {
                    RK.logError(RK.LogSection.eJOB,'start job worker failed',`failed after max retries: ${res.error}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, CookRequestRetryCount },'Job.Cook');
                    res.allowRetry = true; // allow outer level to retry job creation
                    return res;
                }
                await H.Helpers.sleep(CookRetryDelay);
            }

            // wait for all files to be staged
            res = await this.stageFiles();
            if (!res.success) {
                RK.logError(RK.LogSection.eJOB,'start job worker failed',`failed to stage files: ${res.error}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
                return res;
            }

            // Initiate job via PATCH to /clients/<CLIENTID>/jobs/<JOBID>/run
            requestCount = 0;
            res = { success: false, allowRetry: true };
            requestUrl = this.CookServerURL() + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/run`;
            while (true) {
                try {
                    RK.logInfo(RK.LogSection.eJOB,'start job worker','starting job',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl },'Job.Cook');
                    const axiosResponse = await axios.patch(encodeURI(requestUrl));
                    // LOG.info(`JobCook.startJobWorkerInternal: start job axios response (${H.Helpers.JSONStringify(axiosResponse)})`,LOG.LS.eDEBUG);

                    if (axiosResponse.status >= 200 && axiosResponse.status <= 299) {
                        RK.logInfo(RK.LogSection.eJOB,'start job worker','successful response',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl, axios: { status: axiosResponse.status, text: axiosResponse.statusText } },'Job.Cook');
                        break; // success, continue
                    }

                    // if we failed, report out
                    res = { success: false, error: `JobCook [${this.name()}] starting job: ${requestUrl} failed (${axiosResponse.status}:${axiosResponse.statusText})` };
                    RK.logError(RK.LogSection.eJOB,'start job worker failed','starting job failed',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl, axios: { status: axiosResponse?.status, text: axiosResponse?.statusText } },'Job.Cook');
                } catch (err) {
                    res = this.handleRequestException(err, requestUrl, 'patch', jobCookPostBody);
                    RK.logError(RK.LogSection.eJOB,'start job worker failed',`handle request exception: ${H.Helpers.getErrorString(err)}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl, jobCookPostBody },'Job.Cook');
                    if (res.allowRetry === false)
                        return res;
                }

                if (++requestCount >= CookRequestRetryCount) {
                    RK.logError(RK.LogSection.eJOB,'start job worker failed','failed to start after max retries',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl },'Job.Cook');
                    res.allowRetry = true; // allow outer level to retry job initiation
                    return res;
                }

                // wait for our next attempt
                await H.Helpers.sleep(CookRetryDelay);
            }

            res = { success: true };
        } finally {
            if (!res.success)
                await this.signalCompletion();
        }

        RK.logInfo(RK.LogSection.eJOB,'start job worker','running',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
        return this.pollingLoop(CookTimeout);
    }

    async cancelJobWorker(): Promise<H.IOResults> {
        // Cancel job via PATCH to /clients/<CLIENTID>/jobs/<JOBID>/cancel
        // todo: use 'delete' to prevent lingering jobs on Cook server. investigate we have reports copied. (DPO3DPKRT-762)
        let requestCount: number = 0;
        let res: H.IOResults = { success: false };
        const requestUrl: string = this.CookServerURL() + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/cancel`;
        RK.logDebug(RK.LogSection.eJOB,'cancel job worker','cancelling job',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl },'Job.Cook');

        while (true) {
            try {
                const axiosResponse = await axios.patch(encodeURI(requestUrl));
                if (axiosResponse.status < 200 || axiosResponse.status > 299)
                    res = { success: false, error: `JobCook [${this.name()}] patch ${requestUrl} failed: ${axiosResponse.status}:${axiosResponse.statusText}` };
            } catch (error) {
                res = { success: false, error: `JobCook [${this.name()}] patch ${requestUrl}: ${H.Helpers.JSONStringify(error)}` };
            }
            if (res.success)
                break;
            else if (++requestCount >= CookRequestRetryCount) {
                RK.logError(RK.LogSection.eJOB,'cancel job worker failed',`failed to cancel after max retries: ${res.error}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, numRetries: CookRequestRetryCount },'Job.Cook');
                return res;
            } else
                await H.Helpers.sleep(CookRetryDelay);
        }

        RK.logInfo(RK.LogSection.eJOB,'cancel job worker','cancelled job',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
        this.appendToReportAndLog(`JobCook [${this.name()}] cancelled`);
        return { success: true };
    }
    // #endregion

    // returns success: true to indicate we're done polling; false if polling should continue
    private async pollingCallback(pollNumber: number): Promise<CookIOResults> {
        // LOG.info(`JobCook [${this.name()}] polling [${pollNumber}]`, LOG.LS.eJOB);
        // poll server for status update
        // Get job report via GET to /clients/<CLIENTID>/jobs/<JOBID>/report
        const requestUrl: string = this.CookServerURL() + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/report`;
        try {
            const axiosResponse = await axios.get(encodeURI(requestUrl));
            // LOG.info(`JobCook.pollingCallback: polling job axios response (${H.Helpers.JSONStringify(axiosResponse)})`,LOG.LS.eDEBUG);

            if (axiosResponse.status < 200 || axiosResponse.status > 299) {
                // only log errors after first attempt, as job creation may not be complete on Cook server
                const error: string = JSON.stringify(axiosResponse);
                if (pollNumber > 1)
                    RK.logError(RK.LogSection.eJOB,'polling failed',`polling ${requestUrl} failed: ${error}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl, pollNumber },'Job.Cook');
                return { success: false, allowRetry: true, connectFailure: false, otherCookError: false, error };
            }

            // Cook may return a string vs. JSON in the event that there is invalid values (e.g. large numbers)
            // or anything that would make JSON.parse fail. To catch the large numbers we preprocess the JSON
            // and then convert the numerical values so they pass JSON.parse.
            const cookJobReport = H.Helpers.safeJSONParse(axiosResponse.data);
            if(!cookJobReport) {
                RK.logError(RK.LogSection.eJOB,'polling failed',`polling ${requestUrl} failed: Invalid response data`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl, pollNumber },'Job.Cook');
                return { success: false, allowRetry: false, connectFailure: false, otherCookError: false };
            }

            // look for completion in 'state' member, via value of 'done', 'error', or 'cancelled'; update eJobRunStatus and terminate polling job
            // write to the log for the first 10 polling cycles, then every 5th one after that
            if (pollNumber <= 10 || ((pollNumber % 5) == 0))
                RK.logDebug(RK.LogSection.eJOB,'polling job',undefined,{ state: cookJobReport['state'], pollNumber, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl },'Job.Cook');

            // if we finished (i.e. not running or waiting) then we push out an additional log statement
            // to ensure it's caught
            if(cookJobReport['state']!=='waiting' && cookJobReport['state']!=='running')
                RK.logDebug(RK.LogSection.eJOB,'polling job','exited',{ state: cookJobReport['state'], jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl },'Job.Cook');

            // extract our Cook JobID
            const cookJobID: string = cookJobReport['id'];

            // depending on our state we handle our state changes
            switch (cookJobReport['state']) {
                case 'created':     await this.recordCreated();                                                         break;
                case 'waiting':     await this.recordWaiting();                                                         break;
                case 'running':     await this.recordStart(cookJobID);                                                  break;
                case 'cancelled': {
                    await this.recordCancel(JSON.stringify(cookJobReport), cookJobReport['error']);
                    return { success: false, allowRetry: false, connectFailure: false, otherCookError: false, error: cookJobReport['error'] };
                }
                case 'done': {
                    const verifyResult: JobIOResults = await this.verifyResponse(cookJobReport);
                    if(verifyResult.success===true) {
                        await this.recordSuccess(JSON.stringify(cookJobReport));
                        return { ...verifyResult, connectFailure: false, otherCookError: false };
                    } else {
                        await this.recordFailure(JSON.stringify(cookJobReport),verifyResult.error);
                        return { ...verifyResult, connectFailure: false, otherCookError: false };
                    }
                }
                case 'error': {
                    const verifyResult: JobIOResults = await this.verifyResponse(cookJobReport);
                    await this.recordFailure(JSON.stringify(cookJobReport),verifyResult.error);
                    return { ...verifyResult, connectFailure: false, otherCookError: false };
                }
                default: {
                    RK.logWarning(RK.LogSection.eJOB,'polling job','unsupported state',{ state: cookJobReport['state'], pollNumber, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl },'Job.Cook');
                    RK.logDebug(RK.LogSection.eJOB,'polling job','axios response',{ pollNumber, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl, axiosResponse },'Job.Cook');
                }
            }
            // LOG.info(`JobCook.pollingCallback: job ${cookJobReport['state']} report\n${H.Helpers.JSONStringify(cookJobReport)}`,LOG.LS.eDEBUG);

            // we always update our output so it represents the latest from Cook
            // TODO: measure performance and wrap into staggered updates if needed
            await this.updateJobOutput(JSON.stringify(cookJobReport));

        } catch (err) {
            return this.handleRequestException(err, requestUrl, 'get', undefined);
        }
        return { success: false, allowRetry: true, connectFailure: false, otherCookError: false };
    }

    protected async verifyRequest(): Promise<CookIOResults> {
        // make sure our request is valid before sending to Cook
        return { success: true, allowRetry: false, connectFailure: false, otherCookError: false };
    }

    protected async verifyResponse(cookJobReport: any): Promise<JobIOResults> {
        // verify the response received from Cook, checking the report and job details
        if(cookJobReport['state']==='error') {
            return { success: false, allowRetry: false, error: cookJobReport['error'] };
        }

        // we made it here so the job appears successful
        return { success: true, allowRetry: false };
    }

    private async removeCookJob(): Promise<JobIOResults> {
        // remove Cook job freeing up resources on Cook servers
        RK.logDebug(RK.LogSection.eJOB,'Cook cleanup job',`start: ${this._configuration.jobId}`, { ...this._configuration },'Job.Cook');

        const requestUrl: string = this.CookServerURL() + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}`;
        try {
            const axiosResponse = await axios.delete(encodeURI(requestUrl));

            if (axiosResponse.status < 200 || axiosResponse.status > 299) {
                // only log errors after first attempt, as job creation may not be complete on Cook server
                const error: string = JSON.stringify(axiosResponse);
                RK.logError(RK.LogSection.eJOB,'Cook cleanup job',`failed: ${error}`,{ ...this._configuration, idJobRun: this._dbJobRun.idJobRun, requestUrl },'Job.Cook');
                return { success: false, allowRetry: false, error };
            }

            // Cook may return a string vs. JSON in the event that there is invalid values (e.g. large numbers)
            // or anything that would make JSON.parse fail. To catch the large numbers we preprocess the JSON
            // and then convert the numerical values so they pass JSON.parse.
            const responseData = H.Helpers.safeJSONParse(axiosResponse.data);
            RK.logInfo(RK.LogSection.eJOB,'Cook cleanup job',`success: ${this._configuration.jobId}`, { ...this._configuration, responseData },'Job.Cook');
            return { success: true };
        } catch(err) {
            const error: string =  H.Helpers.getErrorString(err);
            RK.logError(RK.LogSection.eJOB,'Cook cleanup job',`failed. error thrown: ${error}`,{ ...this._configuration, idJobRun: this._dbJobRun.idJobRun, requestUrl },'Job.Cook');
            return { success: false, error };
        }
    }

    protected async fetchFile(fileName: string): Promise<STORE.ReadStreamResult> {
        const res: STORE.ReadStreamResult = await JobCook._stagingSempaphoreRead.runExclusive(async (value) => {
            try {
                // grab our endpoint
                const cookEndpoint: string = this.CookServerURL();

                // transmit file to Cook work folder via WebDAV
                const destination: string = `/${this._configuration.jobId}/${fileName}`;
                RK.logInfo(RK.LogSection.eJOB,'fetch file','fetch file via WebDAV',{ cookEndpoint, destination, semaphoreCount: value, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');

                const webdavClient: WebDAVClient = createClient(cookEndpoint, {
                    authType: AuthType.None,
                    maxBodyLength: 100 * 1024 * 1024 * 1024, // 100Gb
                    withCredentials: false
                });

                // DEBUG: make sure we have a file to get and its size
                // TODO: more robust support with alt type
                // const stat = await webdavClient.stat(destination);
                // const fileSize = (stat as FileStat).size;
                // LOG.info(`fetchFile file size: ${fileSize} | ${destination}`,LOG.LS.eDEBUG);
                // if(fileSize <= 0)
                //     throw new Error(`destination file doesn't exist or is empty. (${fileSize} bytes | ${destination})`);

                const webdavWSOpts: CreateReadStreamOptions = {
                    headers: { 'Content-Type': 'application/octet-stream' }
                };
                const RS: Readable = webdavClient.createReadStream(destination, webdavWSOpts);
                RS.on('error', error => {
                    RK.logError(RK.LogSection.eJOB,'fetch file failed',`stream error: ${H.Helpers.getErrorString(error)}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, destination },'Job.Cook');
                });
                return { readStream: RS, fileName, storageHash: null, success: true };
            } catch (error) {
                RK.logError(RK.LogSection.eJOB,'fetch file failed',H.Helpers.getErrorString(error),{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
                return { readStream: null, fileName, storageHash: null, success: false, error: JSON.stringify(error) };
            }
        });
        return res;
    }

    protected async stageFiles(): Promise<H.IOResults> {
        // this runs on job creation when internal work starts
        RK.logInfo(RK.LogSection.eJOB,'stage files','staging asset versions',{ idAssetVersions: this._idAssetVersions, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');

        // early out if we don't have anything staged
        if (!this._idAssetVersions)
            return { success: true };

        // otherwise cycle through each, getting the read stream and executing
        let resOuter: H.IOResults = { success: true };
        for (const idAssetVersion of this._idAssetVersions) {
            const resInner: H.IOResults = await JobCook._stagingSempaphoreWrite.runExclusive(async (value) => {
                try {
                    // look for read streams in override map, which may be supplied when we're ingesting a zip file containing a model and associated UV Maps
                    // in this case, the override stream is for the model geometry file
                    let RSRs: STORE.ReadStreamResult[] | undefined = this._streamOverrideMap.get(idAssetVersion);
                    if (!RSRs) {
                        RK.logDebug(RK.LogSection.eJOB,'stage files','found no stream override for idAssetVersion among overrides',{ idAssetVersion, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
                        RSRs = [];
                        RSRs.push(await STORE.AssetStorageAdapter.readAssetVersionByID(idAssetVersion));
                    }

                    let success: boolean = true;
                    let error: string = '';
                    for (const RSR of RSRs) {
                        if (!RSR.success || !RSR.readStream || !RSR.fileName)
                            return { success: false, error: `JobCook [${this.name()}] JobCook.stageFiles unable to read asset version ${idAssetVersion}: ${RSR.error}` };

                        // handle the fact that our asset may be stuffed into a subfolder (due to it being zipped)
                        const fileName: string = path.basename(RSR.fileName);

                        // transmit file to Cook work folder via WebDAV
                        const destination: string = `/${this._configuration.jobId}/${fileName}`;
                        RK.logDebug(RK.LogSection.eJOB,'stage files','staging via WebDAV',{ cookServerUrl: this.CookServerURL(), destination, semaphoreCount: value, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');

                        const webdavClient: WebDAVClient = createClient(this.CookServerURL(), {
                            authType: AuthType.None,
                            maxBodyLength: 100 * 1024 * 1024 * 1024, // 100Gb
                            withCredentials: false
                        });
                        const webdavWSOpts: CreateWriteStreamOptions = {
                            headers: { 'Content-Type': 'application/octet-stream' }
                        };

                        // create a write stream for transmitting our data to staging via WebDAV
                        let res: H.IOResultsSized = { success: false, error: 'Not Executed', size: -1 };
                        for (let transmitCount: number = 0; transmitCount < CookWebDAVTransmitRetryCount; transmitCount++) {
                            let WS: Writable | null = null;
                            try {
                                WS = webdavClient.createWriteStream(destination, webdavWSOpts);
                                WS.on('error', error => {
                                    RK.logError(RK.LogSection.eJOB,'stage files failed',`staging via WebDAV stream error: ${error}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, destination },'Job.Cook');
                                });

                                res = await H.Helpers.writeStreamToStreamComputeSize(RSR.readStream, WS, true);
                                if (res.success)
                                    break;
                            } finally {
                                if (WS)
                                    WS.end();
                            }
                            await H.Helpers.sleep(CookRetryDelay);
                        }

                        if (!res.success) {
                            const error = `JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV unable to transmit file ${fileName} ${idAssetVersion}: ${res.error}`;
                            RK.logError(RK.LogSection.eJOB,'stage files failed','staging via WebDAV unable to transmit file for asset version',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, fileName, idAssetVersion },'Job.Cook');
                            return { success: false, error };
                        }

                        RK.logDebug(RK.LogSection.eJOB,'stage files','via WebDav transmitted bytes',{ cookServerUrl: this.CookServerURL(), destination, transmittedBytes: res.size, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');

                        // use WebDAV client's stat to detect when file is fully staged and available on the server
                        // poll for filesize of remote file.  Continue polling:
                        // - until we match or exceed our streamed size
                        // - as long as the remote size is less than our streamed size, up to 100 times
                        // - pause CookRetryDelay ms between stat polls
                        let stagingSuccess: boolean = false;
                        for (let statCount: number = 0; statCount < CookWebDAVStatRetryCount; statCount++) {
                            const pollingLocation: string = `${this.CookServerURL()}${destination.substring(1)} [${statCount + 1}/${CookWebDAVStatRetryCount}]`;
                            try {
                                const stat: any = await webdavClient.stat(destination);
                                const baseName: string | undefined = (stat.data) ? stat.data.basename : stat.basename;
                                const size: number = ((stat.data) ? stat.data.size : stat.size) || 0;
                                RK.logDebug(RK.LogSection.eJOB,'stage files','verifying transmission via WebDAV',{ pollingLocation, receivedBytes: size, transmittedBytes: res.size, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
                                if (size >= res.size) {
                                    stagingSuccess = (baseName === fileName);
                                    break;
                                }
                            } catch (err) {
                                const error: any = err;
                                const status: number | undefined = (error && typeof(error['status']) === 'number') ? error['status'] : undefined;
                                if (status === 404)
                                    RK.logWarning(RK.LogSection.eJOB,'stage files','stat received error: 404 file not found',{ pollingLocation, status, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
                                else
                                    RK.logError(RK.LogSection.eJOB,'stage files failed',`stat error: ${error}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, pollingLocation },'Job.Cook');
                            }
                            await H.Helpers.sleep(CookRetryDelay); // sleep for an additional CookRetryDelay ms before exiting, to allow for file writing to complete
                        }
                        if (stagingSuccess) {
                            RK.logInfo(RK.LogSection.eJOB,'stage files success','via WebDAV',{ cookServerUrl: this.CookServerURL(), destination, jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
                        } else {
                            error = `Unable to verify existence of staged file ${fileName}`;
                            RK.logError(RK.LogSection.eJOB,'stage files failed',`staging via WebDAV error: ${error}`,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, destination, serverURL: this.CookServerURL() },'Job.Cook');
                            success = false;
                            break;
                        }
                    }
                    return { success, error };
                } catch (error) {
                    RK.logError(RK.LogSection.eJOB,'stage files failed',H.Helpers.getErrorString(error),{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
                    return { success: false, error: JSON.stringify(error) };
                }
            });
            if (!resInner.success)
                resOuter = resInner;
        }
        return resOuter;
    }

    private async handleCookConnectionFailure(): Promise<void> {
        // inform IT-OPS email alias and attempt to switch to "next" Cook server, if any
        const cookServerURL: string = this._configuration.cookServerURLs[this._configuration.cookServerURLIndex];
        if (++this._configuration.cookServerURLIndex >= this._configuration.cookServerURLs.length)
            this._configuration.cookServerURLIndex = 0;

        // additional logging in case notification isn't sent
        const error = `JobCook.handleCookConnectionFailure: Packrat was unable to connect to ${cookServerURL}`;
        RK.logError(RK.LogSection.eJOB,'Cook connection failed','unable to connect to Cook server',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, cookServerURL },'Job.Cook');
        RK.logWarning(RK.LogSection.eJOB,'Cook connection','switching to new server',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, expected: cookServerURL, updated: this._configuration.cookServerURLs[this._configuration.cookServerURLIndex] },'Job.Cook');

        // only notify once about a specific server
        if (JobCook._cookServerFailureNotificationList.has(cookServerURL))
            return;
        JobCook._cookServerFailureNotificationList.add(cookServerURL);

        // see if we should send a notification based on how long since previous notification
        let sendNotification: boolean = true;
        let timeSinceLastNotification: number = CookFailureNotificationTime + 1;
        const now: Date = new Date();
        if (JobCook._cookServerFailureNotificationDate) {
            timeSinceLastNotification = (now.getTime() - JobCook._cookServerFailureNotificationDate.getTime());
            if (timeSinceLastNotification < CookFailureNotificationTime) // only send notifications once per hour
                sendNotification = false;
            else
                JobCook._cookServerFailureNotificationDate = now;
        }

        if (sendNotification) {
            await RK.sendMessage(
                RK.NotifyType.JOB_PASSED,
                RK.NotifyGroup.USER,
                'Cook Connection Failure',
                error,
                new Date(),
            );
        }
    }

    private handleRequestException(err: unknown, requestUrl: string, method: string,
        jobCookPostBody?: JobCookPostBody<T> | undefined, pollNumber?: number | undefined): CookIOResults {

        const message: string | null = (err instanceof Error) ? err.message : null;
        // if we cannot connect to Cook, try again:
        const connectFailure: boolean = (message !== null) &&
                                        (message.indexOf('getaddrinfo ENOTFOUND') > -1 ||
                                         message.indexOf('connect EHOSTUNREACH') > -1 ||
                                         message.indexOf('connect ETIMEDOUT') > -1);
        if (connectFailure) {
            const error: string = `Cannot connect to Cook on ${requestUrl}: ${message}`;
            RK.logError(RK.LogSection.eJOB,'request exception','cannot connect to Cook server',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, requestUrl, method },'Job.Cook');

            if ((++JobCook._cookConnectFailures % CookRequestRetryCount) === 0) // if we are experiencing too many connection errors,
                this.handleCookConnectionFailure();                             // inform IT-OPS email alias and attempt to switch to "next" Cook server, if any

            return { allowRetry: true, connectFailure: true, otherCookError: false, success: false, error };
        }

        const axiosResponse: AxiosResponse<any> | undefined = (err as AxiosError)?.response;
        const status: number | undefined = axiosResponse?.status;
        let emitLog: boolean = true;
        let error: string;
        if (!pollNumber)
            error = `JobCook [${this.name()}] ${method} ${requestUrl} body ${H.Helpers.JSONStringify(jobCookPostBody)} failed with error ${message}`;
        else {
            emitLog = (pollNumber >= 1);
            error = `JobCook [${this.name()}] polling [${pollNumber}] ${method} ${requestUrl} failed with error ${message}`;
        }

        const res: CookIOResults = { success: false, allowRetry: true, connectFailure: false, otherCookError: false, error };

        // if we have a status code with 4xx/5xx
        if(status) {
            switch (true) {
                // catch all 5xx codes and treat as errors
                case (status>=500 && status<=599): {
                    RK.logError(RK.LogSection.eJOB,'request exception',error,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, status },'Job.Cook');
                    res.allowRetry = false;
                    return res;
                }
                // request timed out (408) or too many requests (429)
                case (status===408 || status===429): {
                    res.otherCookError = true;
                } break;
                // catch remaining 4xx codes which should be failure
                case (status>=400 && status<=499): {
                    RK.logError(RK.LogSection.eJOB,'request exception',error,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, status },'Job.Cook');
                    res.allowRetry = false;
                    return res;
                }
            }
        } else {
            RK.logError(RK.LogSection.eJOB,'request exception failed','no status response received',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
            return res;
        }

        if (emitLog)
            RK.logInfo(RK.LogSection.eJOB,'request exception',error,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
        return res;
    }

    protected async verifyIncomingCookData(_sceneSource: DBAPI.Scene, _fileMap: Map<string,string>): Promise<H.IOResults> {
        return { success: true };
    }

    protected extractBaseName(filenames: string[]): string | null {
        // extract the base name from the list of incoming filenames and make sure they all share
        // the same values. input (currently) requires an SVX file in the list
        // TODO: broader support for other 'groups' of filenames that may not have an SVX
        const svxFilename: string | undefined = filenames.find(filename => filename.includes('.svx.json'));
        if(!svxFilename || svxFilename.length == 0) {
            RK.logError(RK.LogSection.eJOB,'extract base name failed','cannot extract basename. SVX file not found',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Cook');
            return null;
        }

        // get the baseName from the SVX file
        const baseName: string = svxFilename.replace(/\.svx\.json$/, '');

        // compare with others in the list to make sure they match
        const errorNames: string[] = filenames.filter(filename => !filename.startsWith(baseName));
        if(errorNames.length>0) {
            RK.logError(RK.LogSection.eJOB,'extract base name failed','filenames do not share base name',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, baseName, errorNames },'Job.Cook');
            return null;
        }

        // return success
        return baseName;
    }

    protected async recordSuccess(output: string): Promise<boolean> {

        // make sure underlying job has updated
        const updated: boolean = await super.recordSuccess(output);

        // if it did update that means we had success and finished job specific cleanup
        // so it should be safe to remove the cook resources used
        if(updated)
            await this.removeCookJob();

        return updated;
    }
}
