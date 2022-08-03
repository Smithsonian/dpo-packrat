/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */
import * as JOB from '../../interface';
import { JobPackrat } from  '../NS/JobPackrat';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as STORE from '../../../storage/interface';
import * as REP from '../../../report/interface';
import { Config } from '../../../config';
import * as H from '../../../utils/helpers';
import { Email } from '../../../utils/email';

import { v4 as uuidv4 } from 'uuid';
import { AuthType, createClient, WebDAVClient, CreateWriteStreamOptions, CreateReadStreamOptions } from 'webdav';
import { Writable, Readable } from 'stream';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { Semaphore, Mutex, MutexInterface, withTimeout, E_TIMEOUT, E_CANCELED } from 'async-mutex';
import * as path from 'path';

const CookWebDAVSimultaneousTransfers: number = 10;
const CookRequestRetryCount: number = 5;
const CookWebDAVTransmitRetryCount: number = 5;
const CookWebDAVStatRetryCount: number = 100;
const CookRetryDelay: number = 5000;
const CookTimeout: number = 10 * 60 * 60 * 1000; // ten hours
const CookFailureNotificationTime: number = 60 * 60 * 1000; // 1 hour

type CookIOResults = H.IOResults & { allowRetry?: boolean | undefined, connectFailure?: boolean | undefined };

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
    protected _streamOverrideMap: Map<number, STORE.ReadStreamResult[]> = new Map<number, STORE.ReadStreamResult[]>();

    private static _stagingSempaphoreWrite = new Semaphore(CookWebDAVSimultaneousTransfers);
    private static _stagingSempaphoreRead = new Semaphore(CookWebDAVSimultaneousTransfers);
    private static _cookServerURLs: string[] = [];
    private static _cookServerURLIndex: number = 0;
    private static _cookServerFailureNotificationDate: Date | null = null;
    private static _cookConnectFailures: number = 0;

    protected abstract getParameters(): Promise<T>;

    // null jobId means create a new one
    constructor(jobEngine: JOB.IJobEngine, clientId: string, jobName: string,
        recipeId: string, jobId: string | null, idAssetVersions: number[] | null,
        report: REP.IReport | null, dbJobRun: DBAPI.JobRun) {
        super(jobEngine, dbJobRun, report);
        JobCook.initialize();
        this._configuration = new JobCookConfiguration(clientId, jobName, recipeId, jobId, dbJobRun);
        this._idAssetVersions = idAssetVersions;
    }

    static initialize() {
        if (JobCook._cookServerURLs.length === 0) {
            JobCook._cookServerURLs = Config.job.cookServerUrls;
            JobCook._cookServerURLIndex = 0;
        }
    }

    static CookServerURL(): string {
        return JobCook._cookServerURLs[JobCook._cookServerURLIndex];
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

    private async pollingLoop(timeout: number): Promise<H.IOResults> {
        try {
            const startTime: Date = new Date();
            let pollNumber: number = 0;
            let connectRetryCount: number = 0;
            let polling: boolean = true;
            while (polling) {
                // poll for completion every CookRetryDelay milleseconds:
                const res: CookIOResults = await this.pollingCallback(++pollNumber);
                polling = (res.allowRetry !== undefined) ? res.allowRetry : true;
                if (!polling)
                    return this._results;

                if (res.connectFailure) {
                    if (++connectRetryCount > CookRequestRetryCount)                                    // if we've had too many connection errors,
                        return this._results = { success: false, error: 'Cook connection failure' };    // exit the pollingLoop with a failure
                }
                if ((timeout > 0) &&
                    ((new Date().getTime() - startTime.getTime()) >= timeout))
                    return this._results = { success: false, error: 'Cook timeout expired' };
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
    async startJobWorker(_fireDate: Date): Promise<H.IOResults> {
        let requestCount: number = 0;
        let res: CookIOResults = { success: false, allowRetry: true, connectFailure: false };

        try {
            // Create job via POST to /job
            let requestUrl: string = JobCook.CookServerURL() + 'job';
            const jobCookPostBody: JobCookPostBody<T> = new JobCookPostBody<T>(this._configuration, await this.getParameters(), eJobCookPriority.eNormal);

            while (true) {
                try {
                    LOG.info(`JobCook [${this.name()}] creating job: ${requestUrl} body ${JSON.stringify(jobCookPostBody, H.Helpers.saferStringify)}`, LOG.LS.eJOB);
                    const axiosResponse: AxiosResponse<any> | null = await axios.post(requestUrl, jobCookPostBody);

                    if (axiosResponse?.status === 201)
                        break; // success, continue
                    else {
                        res.error = `JobCook [${this.name()}] creating job: ${requestUrl} unexpected response ${axiosResponse?.status}`;
                        LOG.info(res.error, LOG.LS.eJOB);
                    }
                } catch (err) {
                    res = this.handleRequestException(err, requestUrl, 'post', jobCookPostBody);
                    if (res.allowRetry === false)
                        return res;
                }

                if (++requestCount >= CookRequestRetryCount) {
                    LOG.error(`${res.error} failed after ${CookRequestRetryCount} retries`, LOG.LS.eJOB);
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
            res = { success: false, allowRetry: true };
            requestUrl = JobCook.CookServerURL() + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/run`;
            LOG.info(`JobCook [${this.name()}] running job: ${requestUrl}`, LOG.LS.eJOB);
            while (true) {
                try {
                    const axiosResponse = await axios.patch(requestUrl);
                    if (axiosResponse.status === 202)
                        break; // success, continue
                    res = { success: false, error: `JobCook [${this.name()}] patch ${requestUrl} failed: ${JSON.stringify(axiosResponse)}` };
                } catch (err) {
                    res = this.handleRequestException(err, requestUrl, 'patch', jobCookPostBody);
                    if (res.allowRetry === false)
                        return res;
                }

                if (++requestCount >= CookRequestRetryCount) {
                    LOG.error(`${res.error} failed to start after ${CookRequestRetryCount} retries`, LOG.LS.eJOB);
                    return res;
                } else
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
        let requestCount: number = 0;
        let res: H.IOResults = { success: false };
        const requestUrl: string = JobCook.CookServerURL() + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/cancel`;
        LOG.info(`JobCook [${this.name()}] cancelling job: ${requestUrl}`, LOG.LS.eJOB);
        while (true) {
            try {
                const axiosResponse = await axios.patch(requestUrl);
                if (axiosResponse.status !== 200)
                    res = { success: false, error: `JobCook [${this.name()}] patch ${requestUrl} failed: ${JSON.stringify(axiosResponse)}` };
            } catch (error) {
                res = { success: false, error: `JobCook [${this.name()}] patch ${requestUrl}: ${JSON.stringify(error)}` };
            }
            if (res.success)
                break;
            else if (++requestCount >= CookRequestRetryCount) {
                LOG.error(`${res.error} failed to cancel after ${CookRequestRetryCount} retries`, LOG.LS.eJOB);
                return res;
            } else
                await H.Helpers.sleep(CookRetryDelay);
        }

        LOG.info(`JobCook [${this.name()}] cancelled`, LOG.LS.eJOB);
        return { success: true };
    }
    // #endregion

    // returns true if polling indicates we're done; false if polling should continue
    private async pollingCallback(pollNumber: number): Promise<CookIOResults> {
        // LOG.info(`JobCook [${this.name()}] polling [${pollNumber}]`, LOG.LS.eJOB);
        // poll server for status update
        // Get job report via GET to /clients/<CLIENTID>/jobs/<JOBID>/report
        const requestUrl: string = JobCook.CookServerURL() + `clients/${this._configuration.clientId}/jobs/${this._configuration.jobId}/report`;
        try {
            const axiosResponse = await axios.get(requestUrl);
            if (axiosResponse.status !== 200) {
                // only log errors after first attempt, as job creation may not be complete on Cook server
                const error: string = JSON.stringify(axiosResponse);
                if (pollNumber > 1)
                    LOG.error(`JobCook [${this.name()}] polling [${pollNumber}] get ${requestUrl} failed: ${error}`, LOG.LS.eJOB);
                return { success: false, allowRetry: true, connectFailure: false, error };
            }

            // look for completion in 'state' member, via value of 'done', 'error', or 'cancelled'; update eJobRunStatus and terminate polling job
            const cookJobReport = axiosResponse.data;
            if (pollNumber <= 10 || ((pollNumber % 5) == 0))
                LOG.info(`JobCook [${this.name()}] polling [${pollNumber}], state: ${cookJobReport['state']}: ${requestUrl}`, LOG.LS.eJOB);
            switch (cookJobReport['state']) {
                case 'created':     await this.recordCreated();                                                         break;
                case 'waiting':     await this.recordWaiting();                                                         break;
                case 'running':     await this.recordStart();                                                           break;
                case 'done':        await this.recordSuccess(JSON.stringify(cookJobReport));                            return { success: true, allowRetry: false, connectFailure: false };
                case 'error':       await this.recordFailure(JSON.stringify(cookJobReport), cookJobReport['error']);    return { success: false, allowRetry: false, connectFailure: false, error: cookJobReport['error'] };
                case 'cancelled':   await this.recordCancel(JSON.stringify(cookJobReport), cookJobReport['error']);     return { success: false, allowRetry: false, connectFailure: false, error: cookJobReport['error'] };
            }
        } catch (err) {
            return this.handleRequestException(err, requestUrl, 'get', undefined);
        }
        return { success: false, allowRetry: true, connectFailure: false };
    }

    protected async fetchFile(fileName: string): Promise<STORE.ReadStreamResult> {
        const res: STORE.ReadStreamResult = await JobCook._stagingSempaphoreRead.runExclusive(async (value) => {
            try {
                // transmit file to Cook work folder via WebDAV
                const destination: string = `/${this._configuration.jobId}/${fileName}`;
                LOG.info(`JobCook [${this.name()}] JobCook.fetchFile via WebDAV from ${JobCook.CookServerURL()}${destination.substring(1)}; semaphore count ${value}`, LOG.LS.eJOB);

                const webdavClient: WebDAVClient = createClient(JobCook.CookServerURL(), {
                    authType: AuthType.None,
                    maxBodyLength: 10 * 1024 * 1024 * 1024,
                    withCredentials: false
                });
                const webdavWSOpts: CreateReadStreamOptions = {
                    headers: { 'Content-Type': 'application/octet-stream' }
                };
                const RS: Readable = webdavClient.createReadStream(destination, webdavWSOpts);
                RS.on('error', error => { LOG.error(`JobCook [${this.name()}] JobCook.fetchFile stream error`, LOG.LS.eJOB, error); });
                return { readStream: RS, fileName, storageHash: null, success: true };
            } catch (error) {
                LOG.error('JobCook [${this.name()}] JobCook.fetchFile', LOG.LS.eJOB, error);
                return { readStream: null, fileName, storageHash: null, success: false, error: JSON.stringify(error) };
            }
        });
        return res;
    }

    protected async stageFiles(): Promise<H.IOResults> {
        if (!this._idAssetVersions)
            return { success: true };

        let resOuter: H.IOResults = { success: true };
        for (const idAssetVersion of this._idAssetVersions) {
            const resInner: H.IOResults = await JobCook._stagingSempaphoreWrite.runExclusive(async (value) => {
                try {
                    // look for read streams in override map, which may be supplied when we're ingesting a zip file containing a model and associated UV Maps
                    // in this case, the override stream is for the model geometry file
                    let RSRs: STORE.ReadStreamResult[] | undefined = this._streamOverrideMap.get(idAssetVersion);
                    if (!RSRs) {
                        // LOG.info(`JobCook [${this.name()}] JobCook.stageFiles found no stream override for idAssetVersion ${idAssetVersion} among ${this._streamOverrideMap.size} overrides`, LOG.LS.eJOB);
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
                        LOG.info(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV at ${JobCook.CookServerURL()}${destination.substring(1)}; semaphore count ${value}`, LOG.LS.eJOB);

                        const webdavClient: WebDAVClient = createClient(JobCook.CookServerURL(), {
                            authType: AuthType.None,
                            maxBodyLength: 100 * 1024 * 1024 * 1024,
                            withCredentials: false
                        });
                        const webdavWSOpts: CreateWriteStreamOptions = {
                            headers: { 'Content-Type': 'application/octet-stream' }
                        };

                        let res: H.IOResultsSized = { success: false, error: 'Not Executed', size: -1 };
                        for (let transmitCount: number = 0; transmitCount < CookWebDAVTransmitRetryCount; transmitCount++) {
                            const WS: Writable = webdavClient.createWriteStream(destination, webdavWSOpts);
                            WS.on('error', error => { LOG.error(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV stream error`, LOG.LS.eJOB, error); });

                            res = await H.Helpers.writeStreamToStreamComputeSize(RSR.readStream, WS, true);
                            if (res.success)
                                break;
                            await H.Helpers.sleep(CookRetryDelay);
                        }

                        if (!res.success) {
                            const error = `JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV unable to transmit file ${fileName} for asset version ${idAssetVersion}: ${res.error}`;
                            LOG.error(error, LOG.LS.eJOB);
                            return { success: false, error };
                        }

                        LOG.info(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV at ${JobCook.CookServerURL()}${destination.substring(1)}: transmitted ${res.size} bytes`, LOG.LS.eJOB);

                        // use WebDAV client's stat to detect when file is fully staged and available on the server
                        // poll for filesize of remote file.  Continue polling:
                        // - until we match or exceed our streamed size
                        // - as long as the remote size is less than our streamed size, up to 100 times
                        // - pause CookRetryDelay ms between stat polls
                        let stagingSuccess: boolean = false;
                        for (let statCount: number = 0; statCount < CookWebDAVStatRetryCount; statCount++) {
                            const pollingLocation: string = `${JobCook.CookServerURL()}${destination.substring(1)} [${statCount + 1}/${CookWebDAVStatRetryCount}]`;
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
                            LOG.info(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV at ${JobCook.CookServerURL()}${destination.substring(1)}: success`, LOG.LS.eJOB);
                        } else {
                            error = `Unable to verify existence of staged file ${fileName}`;
                            LOG.error(`JobCook [${this.name()}] JobCook.stageFiles staging via WebDAV at ${JobCook.CookServerURL()}${destination.substring(1)}: ${error}`, LOG.LS.eJOB);
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
        const cookServerURL: string = JobCook._cookServerURLs[JobCook._cookServerURLIndex];
        if (++JobCook._cookServerURLIndex >= JobCook._cookServerURLs.length)
            JobCook._cookServerURLIndex = 0;
        LOG.info(`JobCook.handleCookConnectionFailure switching from ${cookServerURL} to ${JobCook._cookServerURLs[JobCook._cookServerURLIndex]}`, LOG.LS.eJOB);

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
            const res: H.IOResults = await Email.Send(undefined, undefined, 'Cook Connection Failure', `Packrat was unable to connect to ${cookServerURL}`, undefined);
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
                                         message.indexOf('connect EHOSTUNREACH') > -1);
        if (connectFailure) {
            const error: string = `Cannot connect to Cook on ${requestUrl}: ${message}`;
            LOG.error(`JobCook [${this.name()}] ${method} ${error}`, LOG.LS.eJOB);

            if ((++JobCook._cookConnectFailures % CookRequestRetryCount) === 0) // if we are experiencing too many connection errors,
                this.handleCookConnectionFailure();                             // inform IT-OPS email alias and attempt to switch to "next" Cook server, if any

            return { allowRetry: true, connectFailure: true, success: false, error };
        }

        const axiosResponse: AxiosResponse<any> | undefined = (err as AxiosError)?.response;
        const status: number | undefined = axiosResponse?.status;
        let emitLog: boolean = true;
        let error: string;
        if (!pollNumber)
            error = `JobCook [${this.name()}] ${method} ${requestUrl} body ${JSON.stringify(jobCookPostBody)} failed with error ${message}: ${JSON.stringify(axiosResponse?.data)}`;
        else {
            emitLog = (pollNumber >= 1);
            error = `JobCook [${this.name()}] polling [${pollNumber}] ${method} ${requestUrl} failed with error ${message}`;
        }

        const res: CookIOResults = { success: false, allowRetry: true, connectFailure: false, error };

        // if we receive a 500 status, log this as an error and avoid retrying
        if (status === 500) {
            LOG.error(error, LOG.LS.eJOB);
            res.allowRetry = false;
            return res;
        }
        if (emitLog)
            LOG.info(error, LOG.LS.eJOB);
        return res;
    }
}
