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
import { Semaphore } from 'async-mutex';

const CookWebDAVSimultaneousTransfers: number = 7;

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

    async waitForCompletion(timeout: number): Promise<H.IOResults> {
        return this.waitForCompletionWorker(timeout, false);
    }

    private async waitForCompletionWorker(timeout: number, performPolling: boolean): Promise<H.IOResults> {
        const startTime: Date = new Date();
        let pollNumber: number = 0;
        while (true) {
            // poll for completion every 15 seconds:
            switch (this._dbJobRun.getStatus()) {
                case DBAPI.eJobRunStatus.eDone:
                case DBAPI.eJobRunStatus.eCancelled:
                case DBAPI.eJobRunStatus.eError:
                    return this._results;
            }

            // multiple callers may be waiting on completion ... but only one needs to poll Cook
            if (performPolling) {
                await this.pollingCallback(++pollNumber);
                switch (this._dbJobRun.getStatus()) {
                    case DBAPI.eJobRunStatus.eDone:
                    case DBAPI.eJobRunStatus.eCancelled:
                    case DBAPI.eJobRunStatus.eError:
                        return this._results;
                }
            }

            if ((timeout > 0) &&
                ((new Date().getTime() - startTime.getTime()) >= timeout))
                return { success: false, error: 'timeout expired' };
            await this.delay(5000);
        }
    }
    // #endregion

    async startJobWorker(fireDate: Date): Promise<H.IOResults> {
        fireDate;

        // Create job via POST to /job
        const jobCookPostBody: JobCookPostBody<T> = new JobCookPostBody<T>(this._configuration, this.getParameters(), eJobCookPriority.eNormal);
        let axiosResponse: AxiosResponse<any> | null = null;
        let requestUrl: string = Config.job.cookServerUrl + 'job';
        LOG.logger.info(`JobCook [${this.name()}] creating job: ${requestUrl}`);
        try {
            axiosResponse = await axios.post(requestUrl, jobCookPostBody);
            if (axiosResponse?.status !== 201)
                return { success: false, error: `JobCook [${this.name()}] post ${requestUrl} body ${JSON.stringify(jobCookPostBody)} failed: ${JSON.stringify(axiosResponse)}` };
        } catch (error) {
            const message: string | null = error.message;
            if (message && message.indexOf('getaddrinfo ENOTFOUND'))
                return { success: false, error: `JobCook [${this.name()}] post ${requestUrl} body ${JSON.stringify(jobCookPostBody)} cannot connect to Cook: ${JSON.stringify(error)}` };
            else
                return { success: false, error: `JobCook [${this.name()}] post ${requestUrl} body ${JSON.stringify(jobCookPostBody)}: ${JSON.stringify(error)}` };
        }

        // stage files
        const res: H.IOResults = await this.stageFiles();
        if (!res.success)
            return res;

        // Initiate job via PATCH to /clients/<CLIENTID>/jobs/<JOBID>/run
        requestUrl = Config.job.cookServerUrl + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/run`;
        LOG.logger.info(`JobCook [${this.name()}] running job: ${requestUrl}`);
        try {
            const axiosResponse = await axios.patch(requestUrl);
            if (axiosResponse.status !== 202)
                return { success: false, error: `JobCook [${this.name()}] patch ${requestUrl} failed: ${JSON.stringify(axiosResponse)}` };
        } catch (error) {
            return { success: false, error: `JobCook [${this.name()}] patch ${requestUrl} failed: ${JSON.stringify(error)}` };
        }
        LOG.logger.info(`JobCook [${this.name()}] running`);
        return this.waitForCompletionWorker(0, true);
    }

    async cancelJobWorker(): Promise<H.IOResults> {
        // Cancel job via PATCH to /clients/<CLIENTID>/jobs/<JOBID>/cancel
        const requestUrl: string = Config.job.cookServerUrl + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/cancel`;
        LOG.logger.info(`JobCook [${this.name()}] cancelling job: ${requestUrl}`);
        try {
            const axiosResponse = await axios.patch(requestUrl);
            if (axiosResponse.status !== 200)
                return { success: false, error: `JobCook [${this.name()}] patch ${requestUrl} failed: ${JSON.stringify(axiosResponse)}` };
        } catch (error) {
            return { success: false, error: `JobCook [${this.name()}] patch ${requestUrl}: ${JSON.stringify(error)}` };
        }

        LOG.logger.info(`JobCook [${this.name()}] cancelled`);
        return { success: true, error: '' };
    }

    private async pollingCallback(pollNumber: number): Promise<void> {
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
                return;
            }

            // look for completion in 'state' member, via value of 'done', 'error', or 'cancelled'; update eJobRunStatus and terminate polling job
            const cookJobReport = axiosResponse.data;
            LOG.logger.info(`JobCook [${this.name()}] polling [${pollNumber}], state: ${cookJobReport['state']}: ${requestUrl}`);
            switch (cookJobReport['state']) {
                case 'created':     await this.recordCreated();                                 break;
                case 'waiting':     await this.recordWaiting();                                 break;
                case 'running':     await this.recordStart();                                   break;
                case 'done':        await this.recordSuccess(JSON.stringify(cookJobReport));    break;
                case 'error':       await this.recordFailure(cookJobReport['error']);           break;
                case 'cancelled':   await this.recordCancel(cookJobReport['error']);            break;
            }
        } catch (error) {
            // only log errors after first attempt, as job creation may not be complete on Cook server
            if (pollNumber > 1)
                LOG.logger.error(`JobCook [${this.name()}] polling [${pollNumber}] get ${requestUrl} failed: ${JSON.stringify(error)}`);
        }
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
                            H.Helpers.sleep(3000); // sleep for 3 seconds before retrying
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

    async delay(ms: number): Promise<void> {
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }
}
