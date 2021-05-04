/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */
import * as JOB from '../../interface';
import { JobPackrat } from  '../NS/JobPackrat';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as STORE from '../../../storage/interface';
import { Config } from '../../../config';
// import * as CACHE from '../../cache';
import * as H from '../../../utils/helpers';

import { v4 as uuidv4 } from 'uuid';
import { AuthType, createClient, WebDAVClient, CreateWriteStreamOptions, CreateReadStreamOptions } from 'webdav';
import { Writable, Readable } from 'stream';
import axios, { AxiosResponse } from 'axios';
import { Semaphore, Mutex, MutexInterface, withTimeout, E_TIMEOUT, E_CANCELED } from 'async-mutex';
import * as path from 'path';

const CookWebDAVSimultaneousTransfers: number = 2;
const CookRequestRetryCount: number = 3;
const CookRetryDelay: number = 5000;
const CookTimeout: number = 36000000; // ten hours

class JobCookConfiguration {
    clientId: string;
    jobName: string;
    recipeId: string;
    jobId: string;

    constructor(clientId: string, jobName: string, recipeId: string, jobId: string | null, dbJobRun: DBAPI.JobRun) {
        this.clientId = clientId;
        this.jobName = `${jobName}: ${dbJobRun.idJobRun}`;
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
    private _configuration: JobCookConfiguration;
    protected _idAssetVersions: number[] | null;
    private _completionMutexes: MutexInterface[] = [];
    private _complete: boolean = false;
    protected _streamOverrideMap: Map<number, STORE.ReadStreamResult> = new Map<number, STORE.ReadStreamResult>();

    private static _stagingSempaphoreWrite = new Semaphore(CookWebDAVSimultaneousTransfers);
    private static _stagingSempaphoreRead = new Semaphore(CookWebDAVSimultaneousTransfers);

    protected abstract getParameters(): Promise<T>;

    // null jobId means create a new one
    constructor(jobEngine: JOB.IJobEngine, clientId: string, jobName: string,
        recipeId: string, jobId: string | null,
        idAssetVersions: number[] | null, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, dbJobRun);
        this._configuration = new JobCookConfiguration(clientId, jobName, recipeId, jobId, dbJobRun);
        this._idAssetVersions = idAssetVersions;
    }

    // #region IJob interface
    name(): string {
        return this._configuration.jobName;
    }

    configuration(): any {
        return this._configuration;
    }

    async signalCompletion(): Promise<void> {
        this._complete = true;
        for (const mutex of this._completionMutexes)
            mutex.cancel();
        await this.cleanupJob();
    }

    async waitForCompletion(timeout: number): Promise<H.IOResults> {
        if (this._complete)
            return { success: true, error: '' };
        const waitMutex: MutexInterface = withTimeout(new Mutex(), timeout);
        this._completionMutexes.push(waitMutex);

        const releaseOuter = await waitMutex.acquire();     // first acquire should succeed
        try {
            const releaseInner = await waitMutex.acquire(); // second acquire should wait
            releaseInner();
        } catch (error) {
            if (error === E_CANCELED)                   // we're done
                return { success: true, error: '' };
            else if (error === E_TIMEOUT)               // we timed out
                return { success: false, error: `JobCook.waitForCompletion timed out after ${timeout}ms` };
            else
                return { success: false, error: `JobCook.waitForCompletion failure: ${JSON.stringify(error)}` };
        } finally {
            releaseOuter();
        }
        return { success: true, error: '' };
    }

    private async pollingLoop(timeout: number): Promise<H.IOResults> {
        try {
            const startTime: Date = new Date();
            let pollNumber: number = 0;
            let polling: boolean = true;
            while (polling) {
                // poll for completion every CookRetryDelay milleseconds:
                polling = !await this.pollingCallback(++pollNumber);
                if (!polling)
                    return this._results;

                if ((timeout > 0) &&
                    ((new Date().getTime() - startTime.getTime()) >= timeout))
                    return { success: false, error: 'timeout expired' };
                await H.Helpers.sleep(CookRetryDelay);
            }
        } catch (error) {
            LOG.error('JobCook.pollingLoop', LOG.LS.eJOB, error);
            return this._results;
        } finally {
            await this.signalCompletion();
        }
        return this._results;
    }
    // #endregion

    // #region JobPackrat interface
    async startJobWorker(fireDate: Date): Promise<H.IOResults> {
        fireDate;

        let requestCount: number = 0;
        let res: H.IOResults = { success: false, error: '' };

        try {
            // Create job via POST to /job
            let requestUrl: string = Config.job.cookServerUrl + 'job';
            let axiosResponse: AxiosResponse<any> | null = null;
            const jobCookPostBody: JobCookPostBody<T> = new JobCookPostBody<T>(this._configuration, await this.getParameters(), eJobCookPriority.eNormal);

            LOG.info(`JobCook [${this.name()}] creating job: ${requestUrl}`, LOG.LS.eJOB);
            while (requestCount < CookRequestRetryCount) {
                try {
                    axiosResponse = await axios.post(requestUrl, jobCookPostBody);
                    if (axiosResponse?.status === 201)
                        break; // success, continue
                    res = { success: false, error: `JobCook [${this.name()}] post ${requestUrl} body ${JSON.stringify(jobCookPostBody)} failed: ${JSON.stringify(axiosResponse)}` };
                    requestCount++;
                } catch (error) {
                    const message: string | null = error.message;
                    res = (message && message.indexOf('getaddrinfo ENOTFOUND'))
                        ? { success: false, error: `JobCook [${this.name()}] post ${requestUrl} body ${JSON.stringify(jobCookPostBody)} cannot connect to Cook: ${JSON.stringify(error)}` }
                        : { success: false, error: `JobCook [${this.name()}] post ${requestUrl} body ${JSON.stringify(jobCookPostBody)}: ${JSON.stringify(error)}` };
                }
                if (requestCount >= CookRequestRetryCount) {
                    LOG.error(`JobCook [${this.name()}] failed after ${CookRequestRetryCount} retries: ${res.error}`, LOG.LS.eJOB);
                    return res;
                } else
                    await H.Helpers.sleep(CookRetryDelay);
            }

            // stage files
            res = await this.stageFiles();
            if (!res.success)
                return res;

            // Initiate job via PATCH to /clients/<CLIENTID>/jobs/<JOBID>/run
            requestCount = 0;
            res = { success: false, error: '' };
            requestUrl = Config.job.cookServerUrl + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/run`;
            LOG.info(`JobCook [${this.name()}] running job: ${requestUrl}`, LOG.LS.eJOB);
            while (requestCount++ < CookRequestRetryCount) {
                try {
                    const axiosResponse = await axios.patch(requestUrl);
                    if (axiosResponse.status === 202)
                        break; // success, continue
                    res = { success: false, error: `JobCook [${this.name()}] patch ${requestUrl} failed: ${JSON.stringify(axiosResponse)}` };
                } catch (error) {
                    res = { success: false, error: `JobCook [${this.name()}] patch ${requestUrl} failed: ${JSON.stringify(error)}` };
                }
                if (requestCount === CookRequestRetryCount) {
                    LOG.error(`${res.error} Retries Failed`, LOG.LS.eJOB);
                    return res;
                } else
                    await H.Helpers.sleep(CookRetryDelay);
            }

            res = { success: true, error: '' };
        } finally {
            if (!res.success)
                await this.signalCompletion();
        }

        LOG.info(`JobCook [${this.name()}] running`, LOG.LS.eJOB);
        return this.pollingLoop(CookTimeout);
    }

    async cancelJobWorker(): Promise<H.IOResults> {
        // Cancel job via PATCH to /clients/<CLIENTID>/jobs/<JOBID>/cancel
        let requestCount: number = 0;
        let res: H.IOResults = { success: false, error: '' };
        const requestUrl: string = Config.job.cookServerUrl + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/cancel`;
        LOG.info(`JobCook [${this.name()}] cancelling job: ${requestUrl}`, LOG.LS.eJOB);
        while (requestCount++ < CookRequestRetryCount) {
            try {
                const axiosResponse = await axios.patch(requestUrl);
                if (axiosResponse.status !== 200)
                    res = { success: false, error: `JobCook [${this.name()}] patch ${requestUrl} failed: ${JSON.stringify(axiosResponse)}` };
            } catch (error) {
                res = { success: false, error: `JobCook [${this.name()}] patch ${requestUrl}: ${JSON.stringify(error)}` };
            }
            if (res.success)
                break;
            else {
                if (requestCount === CookRequestRetryCount) {
                    LOG.error(`${res.error} Retries Failed`, LOG.LS.eJOB);
                    return res;
                } else
                    await H.Helpers.sleep(CookRetryDelay);
            }
        }

        LOG.info(`JobCook [${this.name()}] cancelled`, LOG.LS.eJOB);
        return { success: true, error: '' };
    }
    // #endregion

    // returns true if polling indicates we're done; false if polling should continue
    private async pollingCallback(pollNumber: number): Promise<boolean> {
        // LOG.info(`JobCook [${this.name()}] polling [${pollNumber}]`, LOG.LS.eJOB);
        // poll server for status update
        // Get job report via GET to /clients/<CLIENTID>/jobs/<JOBID>/report
        const requestUrl: string = Config.job.cookServerUrl + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/report`;
        try {
            const axiosResponse = await axios.get(requestUrl);
            if (axiosResponse.status !== 200) {
                // only log errors after first attempt, as job creation may not be complete on Cook server
                if (pollNumber > 1)
                    LOG.error(`JobCook [${this.name()}] polling [${pollNumber}] get ${requestUrl} failed: ${JSON.stringify(axiosResponse)}`, LOG.LS.eJOB);
                return false;
            }

            // look for completion in 'state' member, via value of 'done', 'error', or 'cancelled'; update eJobRunStatus and terminate polling job
            const cookJobReport = axiosResponse.data;
            if (pollNumber <= 10 || ((pollNumber % 10) == 0))
                LOG.info(`JobCook [${this.name()}] polling [${pollNumber}], state: ${cookJobReport['state']}: ${requestUrl}`, LOG.LS.eJOB);
            switch (cookJobReport['state']) {
                case 'created':     await this.recordCreated();                                 break;
                case 'waiting':     await this.recordWaiting();                                 break;
                case 'running':     await this.recordStart();                                   break;
                case 'done':        await this.recordSuccess(JSON.stringify(cookJobReport));    return true;
                case 'error':       await this.recordFailure(cookJobReport['error']);           return true;
                case 'cancelled':   await this.recordCancel(cookJobReport['error']);            return true;
            }
        } catch (error) {
            // only log errors after first attempt, as job creation may not be complete on Cook server
            if (pollNumber > 1)
                LOG.error(`JobCook [${this.name()}] polling [${pollNumber}] get ${requestUrl} failed: ${JSON.stringify(error)}`, LOG.LS.eJOB);
        }
        return false;
    }

    protected async fetchFile(fileName: string): Promise<STORE.ReadStreamResult> {
        const res: STORE.ReadStreamResult = await JobCook._stagingSempaphoreRead.runExclusive(async (value) => {
            try {
                // transmit file to Cook work folder via WebDAV
                const destination: string = `/${this._configuration.jobId}/${fileName}`;
                LOG.info(`JobCook.fetchFile via WebDAV from ${Config.job.cookServerUrl}${destination.substring(1)}; semaphore count ${value}`, LOG.LS.eJOB);

                const webdavClient: WebDAVClient = createClient(Config.job.cookServerUrl, {
                    authType: AuthType.None,
                    maxBodyLength: 10 * 1024 * 1024 * 1024,
                    withCredentials: false
                });
                const webdavWSOpts: CreateReadStreamOptions = {
                    headers: { 'Content-Type': 'application/octet-stream' }
                };
                const RS: Readable = webdavClient.createReadStream(destination, webdavWSOpts);
                return { readStream: RS, fileName, storageHash: null, success: true, error: '' };
            } catch (error) {
                LOG.error('JobCook.fetchFile', LOG.LS.eJOB, error);
                return { readStream: null, fileName, storageHash: null, success: false, error: JSON.stringify(error) };
            }
        });
        return res;
    }

    protected async stageFiles(): Promise<H.IOResults> {
        if (!this._idAssetVersions)
            return { success: true, error: '' };

        let resOuter: H.IOResults = { success: true, error: '' };
        for (const idAssetVersion of this._idAssetVersions) {
            const resInner: H.IOResults = await JobCook._stagingSempaphoreWrite.runExclusive(async (value) => {
                try {
                    // look for read stream in override map, which may be supplied when we're ingesting a zip file containing a model and associated UV Maps
                    // in this case, the override stream is for the model geometry file
                    let RSR: STORE.ReadStreamResult | undefined = this._streamOverrideMap.get(idAssetVersion);
                    if (!RSR)
                        RSR = await STORE.AssetStorageAdapter.readAssetVersionByID(idAssetVersion);
                    if (!RSR.success || !RSR.readStream || !RSR.fileName)
                        return { success: false, error: `JobCook.stageFiles unable to read asset version ${idAssetVersion}: ${RSR.error}` };

                    // handle the fact that our asset may be stuffed into a subfolder (due to it being zipped)
                    const fileName: string = path.basename(RSR.fileName);

                    // transmit file to Cook work folder via WebDAV
                    const destination: string = `/${this._configuration.jobId}/${fileName}`;
                    LOG.info(`JobCook.stageFiles staging via WebDAV at ${Config.job.cookServerUrl}${destination.substring(1)}; semaphore count ${value}`, LOG.LS.eJOB);

                    const webdavClient: WebDAVClient = createClient(Config.job.cookServerUrl, {
                        authType: AuthType.None,
                        maxBodyLength: 10 * 1024 * 1024 * 1024,
                        withCredentials: false
                    });
                    const webdavWSOpts: CreateWriteStreamOptions = {
                        headers: { 'Content-Type': 'application/octet-stream' }
                    };
                    const WS: Writable = webdavClient.createWriteStream(destination, webdavWSOpts);
                    const res: H.IOResultsSized = await H.Helpers.writeStreamToStreamComputeSize(RSR.readStream, WS, true);

                    if (!res.success) {
                        const error = `JobCook.stageFiles unable to transmit file ${fileName} for asset version ${idAssetVersion}: ${res.error}`;
                        LOG.error(error, LOG.LS.eJOB);
                        return { success: false, error };
                    }

                    LOG.info(`JobCook.stageFiles staging via WebDAV at ${Config.job.cookServerUrl}${destination.substring(1)}: completed`, LOG.LS.eJOB);

                    // use WebDAV client's stat to detect when file is fully staged and available on the server
                    // poll for filesize of remote file.  Continue polling:
                    // - until we match or exceed our streamed size
                    // - as long as the remote size is less than our streamed size, up to 100 times
                    // - as long as the remote size is growing, and not "stuck" at the same size more than 5 times
                    // - pause CookRetryDelay ms between stat polls
                    let sizeLast: number = 0;
                    let stuckCount: number = 0;
                    for (let statCount: number = 0; statCount < 100; statCount++) {
                        try {
                            const stat: any = await webdavClient.stat(destination);
                            const baseName: string | undefined = (stat.data) ? stat.data.basename : stat.basename;
                            const size: number = ((stat.data) ? stat.data.size : stat.size) || 0;
                            LOG.info(`JobCook.stageFiles staging polling ${Config.job.cookServerUrl}${destination.substring(1)}: ${size} received vs ${res.size} transmitted`, LOG.LS.eJOB);
                            if (size >= res.size)
                                return { success: baseName === fileName, error: '' };
                            if (size === sizeLast) {
                                if (++stuckCount >= 5)
                                    return { success: false, error: `Unable to verify existence of staged file ${fileName}` };
                            }
                            sizeLast = size;
                            await H.Helpers.sleep(CookRetryDelay); // sleep for an additional CookRetryDelay ms before exiting, to allow for file writing to complete
                        } catch (error) {
                            LOG.error('JobCook.stageFiles stat', LOG.LS.eJOB, error);
                            await H.Helpers.sleep(CookRetryDelay); // sleep for CookRetryDelay ms before retrying
                        }
                    }
                    return { success: false, error: `Unable to verify existence of staged file ${fileName}` };
                } catch (error) {
                    LOG.error('JobCook.stageFiles', LOG.LS.eJOB, error);
                    return { success: false, error: JSON.stringify(error) };
                }
            });
            if (!resInner.success)
                resOuter = resInner;
        }
        return resOuter;
    }
}
