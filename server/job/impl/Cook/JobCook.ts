/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */
import * as JOB from '../../interface';
import { JobPackrat, JobIOResults } from  '../NS/JobPackrat';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import { Config } from '../../../config';
import * as H from '../../../utils/helpers';
import { Email } from '../../../utils/email';
import * as COOKRES from '../../../job/impl/Cook/CookResource';

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
            this.appendToReportAndLog(error, true);
            return { success: false, error };
        }

        // cycle filter list of resources based on supported features
        const cookResources: COOKRES.CookResourceResult = await COOKRES.CookResource.getCookResource(job,this._configuration.jobId,true);

        // if we're empty, bail
        if(cookResources.success===false || cookResources.resources.length<=0) {
            const error = `getCookResource cannot find the best fit resource. (${cookResources.error})`;
            this.appendToReportAndLog(error,true);
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
        this.appendToReportAndLog(reportMsg,false);

        // return success
        this._initialized = true;
        return { success: true };
    }

    CookServerURL(): string {
        // if we don't have a server yet, throw error
        if(this._initialized === false) {
            LOG.error(`JobCook:${this.name} is not initialized. providing default Cook server endpoint (${this._configuration.cookServerURLs[0]}).`,LOG.LS.eJOB);
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
            LOG.error(`JobCook [${this.name()}] JobCook.pollingLoop`, LOG.LS.eJOB, error);
            return this._results;
        } finally {
            await this.signalCompletion();
        }
        return this._results;
    }
    // #endregion

    // #region JobPackrat interface
    async startJobWorker(fireDate: Date): Promise<JobIOResults> {
        const res: H.IOResults = await JobCook._cookJobSempaphore.runExclusive(async (value) => {
            LOG.info(`JobCook [${this.name()}] starting job; semaphore count ${value}`, LOG.LS.eJOB);
            return this.startJobWorkerInternal(fireDate);
        });
        return res;
    }

    private async startJobWorkerInternal(_fireDate: Date): Promise<JobIOResults> {
        let requestCount: number = 0;
        let res: CookIOResults = { success: false, allowRetry: true, connectFailure: false, otherCookError: false };

        try {
            // Create job via POST to /job
            let requestUrl: string = this.CookServerURL() + 'job';
            const jobCookPostBody: JobCookPostBody<T> = new JobCookPostBody<T>(this._configuration, await this.getParameters(), eJobCookPriority.eNormal);

            // submit the Cook job via an axios request, and retry for 'CookRequestRetryCount' times.
            // todo: there's a condition here leading to Cook timeout and repeated attempts even on failure
            while (true) {
                try {
                    LOG.info(`JobCook [${this.name()}] creating job: ${requestUrl} body ${JSON.stringify(jobCookPostBody, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
                    const axiosResponse: AxiosResponse<any> | null = await axios.post(encodeURI(requestUrl), jobCookPostBody);
                    
                    console.log(`>>>> Inspect: JobCook: create job axios response (${H.Helpers.JSONStringify(axiosResponse)})`);

                    if (axiosResponse?.status === 201) {
                        LOG.info(`JobCook [${this.name()}] creating job: ${requestUrl} successful post response (${axiosResponse.status}:${axiosResponse.statusText} - ${axiosResponse.data}`,LOG.LS.eJOB);
                        break; // success, continue
                    } else {
                        res.error = `JobCook [${this.name()}] creating job: ${requestUrl} unexpected response (${axiosResponse?.status}:${axiosResponse?.statusText})`;
                        LOG.error(res.error, LOG.LS.eJOB);
                    }
                } catch (err) {
                    res = this.handleRequestException(err, requestUrl, 'post', jobCookPostBody);

                    // log error at point
                    res.error = `JobCook [${this.name()}] creating job: ${requestUrl} failed (${err})`;
                    LOG.error(res.error, LOG.LS.eJOB);

                    // if we can't retry, return
                    if (res.allowRetry === false)
                        return res;
                }

                if (++requestCount >= CookRequestRetryCount) {
                    LOG.error(`${res.error} failed after ${CookRequestRetryCount} retries`, LOG.LS.eJOB);
                    res.allowRetry = true; // allow outer level to retry job creation
                    return res;
                }
                await H.Helpers.sleep(CookRetryDelay);
            }

            // wait for all files to be staged
            res = await this.stageFiles();
            if (!res.success) {
                LOG.error(`JobCook [${this.name()}] failed to stage files (${res.error})`,LOG.LS.eJOB);
                return res;
            }

            // Initiate job via PATCH to /clients/<CLIENTID>/jobs/<JOBID>/run
            requestCount = 0;
            res = { success: false, allowRetry: true };
            requestUrl = this.CookServerURL() + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/run`;
            while (true) {
                try {
                    LOG.info(`JobCook [${this.name()}] starting job: ${requestUrl}`, LOG.LS.eJOB);
                    const axiosResponse = await axios.patch(encodeURI(requestUrl));
                    
                    console.log(`>>>> Inspect: JobCook: start job axios response (${H.Helpers.JSONStringify(axiosResponse)})`);

                    if (axiosResponse.status >= 200 && axiosResponse.status <= 299) {
                        LOG.info(`JobCook [${this.name()}] starting job: ${requestUrl} successful response (${axiosResponse.status}:${axiosResponse.statusText})`,LOG.LS.eJOB);
                        break; // success, continue
                    }

                    // if we failed, report out
                    res = { success: false, error: `JobCook [${this.name()}] starting job: ${requestUrl} failed (${axiosResponse.status}:${axiosResponse.statusText})` };
                    LOG.error(res.error, LOG.LS.eJOB);
                } catch (err) {
                    res = this.handleRequestException(err, requestUrl, 'patch', jobCookPostBody);
                    LOG.error(res.error, LOG.LS.eJOB);
                    if (res.allowRetry === false)
                        return res;
                }

                if (++requestCount >= CookRequestRetryCount) {
                    LOG.error(`${res.error} failed to start after ${CookRequestRetryCount} retries`, LOG.LS.eJOB);
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

        LOG.info(`JobCook [${this.name()}] running`, LOG.LS.eJOB);
        return this.pollingLoop(CookTimeout);
    }

    async cancelJobWorker(): Promise<H.IOResults> {
        // Cancel job via PATCH to /clients/<CLIENTID>/jobs/<JOBID>/cancel
        // todo: use 'delete' to prevent lingering jobs on Cook server. investigate we have reports copied. (DPO3DPKRT-762)
        let requestCount: number = 0;
        let res: H.IOResults = { success: false };
        const requestUrl: string = this.CookServerURL() + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/cancel`;
        LOG.info(`JobCook [${this.name()}] cancelling job: ${requestUrl}`, LOG.LS.eJOB);
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
                LOG.error(`${res.error} failed to cancel after ${CookRequestRetryCount} retries`, LOG.LS.eJOB);
                return res;
            } else
                await H.Helpers.sleep(CookRetryDelay);
        }

        this.appendToReportAndLog(`JobCook [${this.name()}] cancelled`,false);
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
            
            console.log(`>>>> Inspect: JobCook: polling job axios response (${H.Helpers.JSONStringify(axiosResponse)})`);

            if (axiosResponse.status < 200 || axiosResponse.status > 299) {
                // only log errors after first attempt, as job creation may not be complete on Cook server
                const error: string = JSON.stringify(axiosResponse);
                if (pollNumber > 1)
                    LOG.error(`JobCook [${this.name()}] polling [${pollNumber}] get ${requestUrl} failed: ${error}`, LOG.LS.eJOB);
                return { success: false, allowRetry: true, connectFailure: false, otherCookError: false, error };
            }           

            // look for completion in 'state' member, via value of 'done', 'error', or 'cancelled'; update eJobRunStatus and terminate polling job
            // write to the log for the first 10 polling cycles, then every 5th one after that
            const cookJobReport = axiosResponse.data;
            if (pollNumber <= 10 || ((pollNumber % 5) == 0))
                LOG.info(`JobCook [${this.name()}] polling [${pollNumber}], state: ${cookJobReport['state']}: ${requestUrl}`, LOG.LS.eJOB);

            // if we finished (i.e. not running or waiting) then we push out an additional log statement
            // to ensure it's caught
            if(cookJobReport['state']!=='waiting' && cookJobReport['state']!=='running')
                LOG.info(`JobCook [${this.name()}] polling [exited], state: ${cookJobReport['state']}: ${requestUrl}`, LOG.LS.eJOB);

            // extract our Cook JobID
            const cookJobID: string = cookJobReport['id'];

            // depending on our state we handle our state changes
            switch (cookJobReport['state']) {
                case 'created':     await this.recordCreated();                                                         break;
                case 'waiting':     await this.recordWaiting();                                                         break;
                case 'running':     await this.recordStart(cookJobID);                                                  break;
                case 'done':        await this.recordSuccess(JSON.stringify(cookJobReport));                            return { success: true, allowRetry: false, connectFailure: false, otherCookError: false };
                case 'error':       await this.recordFailure(JSON.stringify(cookJobReport), cookJobReport['error']);    return { success: false, allowRetry: false, connectFailure: false, otherCookError: false, error: cookJobReport['error'] };
                case 'cancelled':   await this.recordCancel(JSON.stringify(cookJobReport), cookJobReport['error']);     return { success: false, allowRetry: false, connectFailure: false, otherCookError: false, error: cookJobReport['error'] };
            }

            LOG.info(`>>>> Inspect: JobCook: job ${cookJobReport['state']} report\n${H.Helpers.JSONStringify(cookJobReport)}`,LOG.LS.eJOB);

            // we always update our output so it represents the latest from Cook
            // TODO: measure performance and wrap into staggered updates if needed
            await this.updateJobOutput(JSON.stringify(cookJobReport));

        } catch (err) {
            return this.handleRequestException(err, requestUrl, 'get', undefined);
        }
        return { success: false, allowRetry: true, connectFailure: false, otherCookError: false };
    }

    protected async fetchFile(fileName: string): Promise<STORE.ReadStreamResult> {
        const res: STORE.ReadStreamResult = await JobCook._stagingSempaphoreRead.runExclusive(async (value) => {
            try {
                // grab our endpoint
                const cookEndpoint: string = this.CookServerURL();

                // transmit file to Cook work folder via WebDAV
                const destination: string = `/${this._configuration.jobId}/${fileName}`;
                LOG.info(`JobCook [${this.name()}] JobCook.fetchFile via WebDAV from ${cookEndpoint}${destination.substring(1)}; semaphore count ${value}`, LOG.LS.eJOB);

                const webdavClient: WebDAVClient = createClient(cookEndpoint, {
                    authType: AuthType.None,
                    maxBodyLength: 100 * 1024 * 1024 * 1024, // 100Gb
                    withCredentials: false
                });

                // DEBUG: make sure we have a file to get and its size
                // TODO: more robust support with alt type
                // const stat = await webdavClient.stat(destination);
                // const fileSize = (stat as FileStat).size;
                // LOG.info(`>>>> fetchFile file size: ${fileSize} | ${destination}`,LOG.LS.eDEBUG);
                // if(fileSize <= 0)
                //     throw new Error(`destination file doesn't exist or is empty. (${fileSize} bytes | ${destination})`);

                const webdavWSOpts: CreateReadStreamOptions = {
                    headers: { 'Content-Type': 'application/octet-stream' }
                };
                const RS: Readable = webdavClient.createReadStream(destination, webdavWSOpts);
                RS.on('error', error => { LOG.error(`JobCook [${this.name()}] JobCook.fetchFile stream error`, LOG.LS.eJOB, error); });
                return { readStream: RS, fileName, storageHash: null, success: true };
            } catch (error) {
                LOG.error(`JobCook [${this.name()}] JobCook.fetchFile`, LOG.LS.eJOB, error);
                return { readStream: null, fileName, storageHash: null, success: false, error: JSON.stringify(error) };
            }
        });
        return res;
    }

    protected async stageFiles(): Promise<H.IOResults> {
        // this runs on job creation when internal work starts
        LOG.info(`JobCook.stageFiles is staging ${this._idAssetVersions?.length} asset versions. (${H.Helpers.JSONStringify(this._idAssetVersions)})`,LOG.LS.eJOB);

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
                        LOG.info(`JobCook [${this.name()}] JobCook.stageFiles found no stream override for idAssetVersion ${idAssetVersion} among ${this._streamOverrideMap.size} overrides`, LOG.LS.eJOB);
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
                        LOG.info(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV at ${this.CookServerURL()}${destination.substring(1)}; semaphore count ${value}`, LOG.LS.eJOB);

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
                                WS.on('error', error => { LOG.error(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV stream error`, LOG.LS.eJOB, error); });

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
                            const error = `JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV unable to transmit file ${fileName} for asset version ${idAssetVersion}: ${res.error}`;
                            LOG.error(error, LOG.LS.eJOB);
                            return { success: false, error };
                        }

                        LOG.info(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV at ${this.CookServerURL()}${destination.substring(1)}: transmitted ${res.size} bytes`, LOG.LS.eJOB);

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
                                LOG.info(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV polling ${pollingLocation}: ${size} received vs ${res.size} transmitted`, LOG.LS.eJOB);
                                if (size >= res.size) {
                                    stagingSuccess = (baseName === fileName);
                                    break;
                                }
                            } catch (err) {
                                const error: any = err;
                                const status: number | undefined = (error && typeof(error['status']) === 'number') ? error['status'] : undefined;
                                if (status === 404)
                                    LOG.info(`JobCook [${this.name()}] JobCook.stageFiles stat ${pollingLocation} received 404 Not Found`, LOG.LS.eJOB);
                                else
                                    LOG.error(`JobCook [${this.name()}] JobCook.stageFiles stat ${pollingLocation}`, LOG.LS.eJOB, error);
                            }
                            await H.Helpers.sleep(CookRetryDelay); // sleep for an additional CookRetryDelay ms before exiting, to allow for file writing to complete
                        }
                        if (stagingSuccess) {
                            LOG.info(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV at ${this.CookServerURL()}${destination.substring(1)}: success`, LOG.LS.eJOB);
                        } else {
                            error = `Unable to verify existence of staged file ${fileName}`;
                            LOG.error(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV at ${this.CookServerURL()}${destination.substring(1)}: ${error}`, LOG.LS.eJOB);
                            success = false;
                            break;
                        }
                    }
                    return { success, error };
                } catch (error) {
                    LOG.error(`JobCook [${this.name()}] JobCook.stageFiles`, LOG.LS.eJOB, error);
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
        LOG.error(error,LOG.LS.eJOB);
        LOG.info(`JobCook.handleCookConnectionFailure switching from ${cookServerURL} to ${this._configuration.cookServerURLs[this._configuration.cookServerURLIndex]}`, LOG.LS.eJOB);

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
            // const res: H.IOResults = await Email.Send(undefined, undefined, 'Cook Connection Failure', `Packrat was unable to connect to ${cookServerURL}`, undefined);
            const res: H.IOResults = await Email.Send(undefined, undefined, 'Cook Connection Failure', error, undefined);
            if (!res.success)
                LOG.error(`JobCook.handleCookConnectionFailure unable to send email notification: ${res.error}`, LOG.LS.eJOB);
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
            LOG.error(`JobCook [${this.name()}] ${method} ${error}`, LOG.LS.eJOB);

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
                    LOG.error(error, LOG.LS.eJOB);
                    res.allowRetry = false;
                    return res;
                }
                // request timed out (408) or too many requests (429)
                case (status===408 || status===429): {
                    res.otherCookError = true;
                } break;
                // catch remaining 4xx codes which should be failure
                case (status>=400 && status<=499): {
                    LOG.error(error, LOG.LS.eJOB);
                    res.allowRetry = false;
                    return res;
                }
            }
        } else {
            LOG.error('JobCook.handleRequestException - no status response received.',LOG.LS.eJOB);
            return res;
        }

        if (emitLog)
            LOG.info(error, LOG.LS.eJOB);
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
            this.logError('JobCookSIGenerateDownloads cannot extract basename. SVX file not found');
            return null;
        }

        // get the baseName from the SVX file
        const baseName: string = svxFilename.replace(/\.svx\.json$/, '');

        // compare with others in the list to make sure they match
        const errorNames: string[] = filenames.filter(filename => !filename.startsWith(baseName));
        if(errorNames.length>0) {
            this.logError(`JobCookSIGenerateDownloads filenames don't share base name. (${baseName} -> ${errorNames.join(' | ')})`);
            return null;
        }

        // return success
        return baseName;
    }
}
