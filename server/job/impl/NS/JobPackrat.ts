/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import * as DBAPI from '../../../db';
import * as REP from '../../../report/interface';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import * as NS from 'node-schedule';
import { RouteBuilder, eHrefMode } from '../../../http/routes/routeBuilder';
import * as COMMON from '@dpo-packrat/common';
import { eEventKey } from '../../../event/interface';
import { JobEngineBase } from './JobEngineBase';

export type JobIOResults = H.IOResults & {
    allowRetry?: boolean | undefined,
};

const JOB_RETRY_COUNT = 2;

export abstract class JobPackrat implements JOB.IJob {
    protected _jobEngine: JobEngineBase;
    protected _dbJobRun: DBAPI.JobRun;
    protected _nsJob: NS.Job | null = null;
    protected _report: REP.IReport | null = null;
    protected _results: JobIOResults = { success: false,  error: 'Not Started' };

    constructor(jobEngine: JobEngineBase, dbJobRun: DBAPI.JobRun, report: REP.IReport | null) {
        this._jobEngine = jobEngine;
        this._dbJobRun = dbJobRun;
        this._report = report;
    }

    // #region IJob interface
    name(): string          { throw new Error('JobPackrat.name() called but is only implemented in derived classes'); }
    configuration(): any    { throw new Error('JobPackrat.configuration() called but is only implemented in derived classes'); }
    waitForCompletion(timeout: number): Promise<H.IOResults> { timeout; throw new Error('JobPackrat.waitForCompletion() called but is only implemented in derived classes'); }

    async executeJob(fireDate: Date): Promise<H.IOResults> {
        for (let attempt: number = 0; attempt < JOB_RETRY_COUNT; attempt++) {
            await this.recordCreated();
            this._results = await this.startJobWorker(fireDate);
            if (!this._results.success)
                await this.recordFailure(null, this._results.error);

            if (this._results.success || !this._results.allowRetry)
                break;
        }
        return this._results;
    }

    async cancelJob(): Promise<H.IOResults> {
        if (this._nsJob)
            this._nsJob.cancel();
        this._results = await this.cancelJobWorker();
        await this.recordCancel(null, this._results.error);
        return this._results;
    }

    async dbJobRun(): Promise<DBAPI.JobRun | null> {
        return this._dbJobRun;
    }
    // #endregion

    // #region JobPackrat interface
    // To be implemented by derived classes
    protected abstract startJobWorker(fireDate: Date): Promise<JobIOResults>;
    protected abstract cancelJobWorker(): Promise<H.IOResults>;
    protected abstract cleanupJob(): Promise<H.IOResults>;
    // #endregion

    // #region node-scheduler interface
    setNSJob(nsJob: NS.Job): void {
        this._nsJob = nsJob;
    }
    // #endregion

    private async sendEvent(eStatus?: COMMON.eWorkflowJobRunStatus): Promise<void> {
        // translate status to proper event key
        let eEvent: eEventKey = eEventKey.eJobUpdated;
        let jobCompleted: boolean = false;
        switch (eStatus) {
            case COMMON.eWorkflowJobRunStatus.eUnitialized: return;
            case COMMON.eWorkflowJobRunStatus.eCreated:     eEvent = eEventKey.eJobCreated; break;
            case COMMON.eWorkflowJobRunStatus.eRunning:     eEvent = eEventKey.eJobRunning; break;
            case COMMON.eWorkflowJobRunStatus.eWaiting:     eEvent = eEventKey.eJobWaiting; break;
            case COMMON.eWorkflowJobRunStatus.eDone:        eEvent = eEventKey.eJobDone;        jobCompleted = true; break;
            case COMMON.eWorkflowJobRunStatus.eError:       eEvent = eEventKey.eJobError;       jobCompleted = true; break;
            case COMMON.eWorkflowJobRunStatus.eCancelled:   eEvent = eEventKey.eJobCancelled;   jobCompleted = true; break;
            case undefined:                                 eEvent = eEventKey.eJobUpdated; break;
            default:
                LOG.error(`JobPackrat.sendEvent called with unknown status ${COMMON.eWorkflowJobRunStatus[eStatus]}`, LOG.LS.eJOB);
                return;
        }

        // send an event for this job status change; include this._dbJobRun.idJobRun as our data
        this._jobEngine.sendJobEvent(this._dbJobRun.idJobRun, null, eEvent);

        if (jobCompleted) {
            const cleanupRes: H.IOResults = await this.cleanupJob();
            if (!cleanupRes.success)
                LOG.error(`JobPackrat.sendEvent failed to cleanup job: ${cleanupRes.error}`, LOG.LS.eJOB);
        }
    }

    // #region JobPackrat helper methods
    protected async appendToReportAndLog(content: string, error?: boolean | undefined): Promise<H.IOResults> {
        if (error)
            LOG.error(content, LOG.LS.eJOB);
        else
            LOG.info(content, LOG.LS.eJOB);

        if (!this._report)
            return { success: false, error: 'No Active WorkflowReport' };
        return await this._report.append(content);
    }

    protected async recordCreated(): Promise<void> {
        const updated: boolean = (this._dbJobRun.getStatus() == COMMON.eWorkflowJobRunStatus.eUnitialized);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Created`);
            this._dbJobRun.DateStart = new Date();
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eCreated);
            await this._dbJobRun.update();
            this.sendEvent(COMMON.eWorkflowJobRunStatus.eCreated); // don't block
        }
    }

    protected async recordWaiting(): Promise<void> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eWaiting);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Waiting`);
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eWaiting);
            await this._dbJobRun.update();
            this.sendEvent(COMMON.eWorkflowJobRunStatus.eWaiting); // don't block
        }
    }

    protected async recordUpdated(): Promise<void> {
        this.appendToReportAndLog(`JobPackrat [${this.name()}] Updated step to ${this._dbJobRun.Step}`);
        this.sendEvent(); // don't block
    }

    protected async recordStart(): Promise<void> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eRunning);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Starting`);
            this._dbJobRun.DateStart = new Date();
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eRunning);
            await this._dbJobRun.update();
            this.sendEvent(COMMON.eWorkflowJobRunStatus.eRunning); // don't block
        }
    }

    protected async recordSuccess(output: string): Promise<void> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eDone);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Success`);
            this._results = { success: true };   // do this before we await this._dbJobRun.update()
            this._dbJobRun.DateEnd = new Date();
            this._dbJobRun.Result = true;
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eDone);
            this._dbJobRun.Output = output;
            await this._dbJobRun.update();

            if (this._report) {
                const pathDownload: string = RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
                const hrefDownload: string = H.Helpers.computeHref(pathDownload, 'Cook Job Output');
                await this._report.append(`${hrefDownload}<br/>\n`);
            }

            this.sendEvent(COMMON.eWorkflowJobRunStatus.eDone); // don't block
        }
    }

    protected async recordFailure(output: string | null, errorMsg?: string): Promise<void> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eError);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Failure: ${errorMsg}`, true);
            this._results = { success: false, error: errorMsg }; // do this before we await this._dbJobRun.update()
            this._dbJobRun.DateEnd = new Date();
            this._dbJobRun.Result = false;
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eError);
            this._dbJobRun.Output = output;
            this._dbJobRun.Error = errorMsg ?? '';
            await this._dbJobRun.update();
            this.sendEvent(COMMON.eWorkflowJobRunStatus.eError); // don't block
        }
    }

    protected async recordCancel(output: string | null, errorMsg?: string): Promise<void> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eCancelled);
        if (!updated) {
            if (errorMsg) {
                this.appendToReportAndLog(`JobPackrat [${this.name()}] Cancel: ${errorMsg}`, true);
                this._dbJobRun.Error = errorMsg;
            } else
                this.appendToReportAndLog(`JobPackrat [${this.name()}] Cancel`, true);

            this._results = { success: false, error: 'Job Cancelled' + (errorMsg ? ` ${errorMsg}` : '') }; // do this before we await this._dbJobRun.update()
            this._dbJobRun.DateEnd = new Date();
            this._dbJobRun.Result = false;
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eCancelled);
            this._dbJobRun.Output = output;
            await this._dbJobRun.update();
            this.sendEvent(COMMON.eWorkflowJobRunStatus.eCancelled); // don't block
        }
    }
    // #endregion
}
