/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */
import { JobPackrat } from  '../NS/JobPackrat';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as STORE from '../../../storage/interface';
import { Config } from '../../../config';
// import * as CACHE from '../../cache';
import * as H from '../../../utils/helpers';

import { v4 as uuidv4 } from 'uuid';
import { AuthType, createClient, WebDAVClient, CreateWriteStreamOptions } from 'webdav';
import { Writable } from 'stream';
import axios, { AxiosResponse } from 'axios';
import { Semaphore, Mutex, MutexInterface, withTimeout, E_TIMEOUT, E_CANCELED } from 'async-mutex';

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
    private _idAssetVersions: number[] | null;
    private completionMutexes: MutexInterface[] = [];
    private complete: boolean = false;

    private static _stagingSempaphore = new Semaphore(CookWebDAVSimultaneousTransfers);

    protected abstract getParameters(): T;

    // null jobId means create a new one
    constructor(clientId: string, jobName: string, recipeId: string, jobId: string | null,
        idAssetVersions: number[] | null, dbJobRun: DBAPI.JobRun) {
        super(dbJobRun);
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

    signalCompletion() {
        this.complete = true;
        for (const mutex of this.completionMutexes)
            mutex.cancel();
    }

    async waitForCompletion(timeout: number): Promise<H.IOResults> {
        if (this.complete)
            return { success: true, error: '' };
        const waitMutex: MutexInterface = withTimeout(new Mutex(), timeout);
        this.completionMutexes.push(waitMutex);

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
            LOG.logger.error('JobCook.pollingLoop', error);
            return this._results;
        } finally {
            this.signalCompletion();
        }
        return this._results;
    }
    // #endregion

    async startJobWorker(fireDate: Date): Promise<H.IOResults> {
        fireDate;

        // Create job via POST to /job
        const jobCookPostBody: JobCookPostBody<T> = new JobCookPostBody<T>(this._configuration, this.getParameters(), eJobCookPriority.eNormal);
        let axiosResponse: AxiosResponse<any> | null = null;
        let requestCount: number = 0;
        let res: H.IOResults = { success: false, error: '' };

        let requestUrl: string = Config.job.cookServerUrl + 'job';
        LOG.logger.info(`JobCook [${this.name()}] creating job: ${requestUrl}`);
        while (requestCount++ < CookRequestRetryCount) {
            try {
                axiosResponse = await axios.post(requestUrl, jobCookPostBody);
                if (axiosResponse?.status === 201)
                    break; // success, continue
                res = { success: false, error: `JobCook [${this.name()}] post ${requestUrl} body ${JSON.stringify(jobCookPostBody)} failed: ${JSON.stringify(axiosResponse)}` };
            } catch (error) {
                const message: string | null = error.message;
                res = (message && message.indexOf('getaddrinfo ENOTFOUND'))
                    ? { success: false, error: `JobCook [${this.name()}] post ${requestUrl} body ${JSON.stringify(jobCookPostBody)} cannot connect to Cook: ${JSON.stringify(error)}` }
                    : { success: false, error: `JobCook [${this.name()}] post ${requestUrl} body ${JSON.stringify(jobCookPostBody)}: ${JSON.stringify(error)}` };
            }
            if (requestCount === CookRequestRetryCount) {
                LOG.logger.error(`${res.error} Retries Failed`);
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
        LOG.logger.info(`JobCook [${this.name()}] running job: ${requestUrl}`);
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
                LOG.logger.error(`${res.error} Retries Failed`);
                return res;
            } else
                await H.Helpers.sleep(CookRetryDelay);
        }
        LOG.logger.info(`JobCook [${this.name()}] running`);
        return this.pollingLoop(CookTimeout);
    }

    async cancelJobWorker(): Promise<H.IOResults> {
        // Cancel job via PATCH to /clients/<CLIENTID>/jobs/<JOBID>/cancel
        let requestCount: number = 0;
        let res: H.IOResults = { success: false, error: '' };
        const requestUrl: string = Config.job.cookServerUrl + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/cancel`;
        LOG.logger.info(`JobCook [${this.name()}] cancelling job: ${requestUrl}`);
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
                    LOG.logger.error(`${res.error} Retries Failed`);
                    return res;
                } else
                    await H.Helpers.sleep(CookRetryDelay);
            }
        }

        LOG.logger.info(`JobCook [${this.name()}] cancelled`);
        return { success: true, error: '' };
    }

    // returns true if polling indicates we're done; false if polling should continue
    private async pollingCallback(pollNumber: number): Promise<boolean> {
        // LOG.logger.info(`JobCook [${this.name()}] polling [${pollNumber}]`);
        // poll server for status update
        // Get job report via GET to /clients/<CLIENTID>/jobs/<JOBID>/report
        const requestUrl: string = Config.job.cookServerUrl + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/report`;
        try {
            const axiosResponse = await axios.get(requestUrl);
            if (axiosResponse.status !== 200) {
                // only log errors after first attempt, as job creation may not be complete on Cook server
                if (pollNumber > 1)
                    LOG.logger.error(`JobCook [${this.name()}] polling [${pollNumber}] get ${requestUrl} failed: ${JSON.stringify(axiosResponse)}`);
                return false;
            }

            // look for completion in 'state' member, via value of 'done', 'error', or 'cancelled'; update eJobRunStatus and terminate polling job
            const cookJobReport = axiosResponse.data;
            LOG.logger.info(`JobCook [${this.name()}] polling [${pollNumber}], state: ${cookJobReport['state']}: ${requestUrl}`);
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
                LOG.logger.error(`JobCook [${this.name()}] polling [${pollNumber}] get ${requestUrl} failed: ${JSON.stringify(error)}`);
        }
        return false;
    }

    protected async stageFiles(): Promise<H.IOResults> {
        if (!this._idAssetVersions)
            return { success: true, error: '' };

        let resOuter: H.IOResults = { success: true, error: '' };
        for (const idAssetVersion of this._idAssetVersions) {
            const resInner: H.IOResults = await JobCook._stagingSempaphore.runExclusive(async (value) => {
                try {
                    const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersionByID(idAssetVersion);
                    if (!RSR.success || !RSR.readStream || !RSR.fileName)
                        return { success: false, error: `JobCook.stageFiles unable to read asset version ${idAssetVersion}: ${RSR.error}` };

                    // transmit file to Cook work folder via WebDAV
                    const destination: string = `/${this._configuration.jobId}/${RSR.fileName}`;
                    LOG.logger.info(`JobCook.stageFiles staging via WebDAV at ${Config.job.cookServerUrl}${destination.substring(1)}; semaphore count ${value}`);

                    const webdavClient: WebDAVClient = createClient(Config.job.cookServerUrl, {
                        authType: AuthType.None,
                        maxBodyLength: 1024 * 1024 * 1024,
                        withCredentials: false
                    });
                    const webdavWSOpts: CreateWriteStreamOptions = {
                        headers: { 'Content-Type': 'application/octet-stream' }
                    };
                    const WS: Writable = webdavClient.createWriteStream(destination, webdavWSOpts);
                    const res: H.IOResults = await H.Helpers.writeStreamToStream(RSR.readStream, WS, true);

                    if (!res.success) {
                        const error = `JobCook.stageFiles unable to transmit file ${RSR.fileName} for asset version ${idAssetVersion}: ${res.error}`;
                        LOG.logger.error(error);
                        return { success: false, error };
                    }

                    LOG.logger.info(`JobCook.stageFiles staging via WebDAV at ${Config.job.cookServerUrl}${destination.substring(1)}: completed`);

                    for (let statCount: number = 0; statCount < 3; statCount++) {
                        try {
                            const stat: any = await webdavClient.stat(destination);
                            const baseName: string | undefined = (stat.data) ? stat.data.basename : stat.basename;
                            return { success: baseName === RSR.fileName, error: '' };
                        } catch (error) {
                            LOG.logger.error('JobCook.stageFiles stat', error);
                            await H.Helpers.sleep(CookRetryDelay); // sleep for CookRetryDelay ms before retrying
                        }
                    }
                    return { success: false, error: `Unable to verify existence of staged file ${RSR.fileName}` };
                } catch (error) {
                    LOG.logger.error('JobCook.stageFiles', error);
                    return { success: false, error: JSON.stringify(error) };
                }
            });
            if (!resInner.success)
                resOuter = resInner;
        }
        return resOuter;
    }
}
