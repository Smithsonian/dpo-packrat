/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import * as DBAPI from '../../../db';
import * as WF from '../../../workflow/interface';
import * as REP from '../../../report/interface';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import * as NS from 'node-schedule';
import { RouteBuilder, eHrefMode } from '../../../http/routes/routeBuilder';
import * as COMMON from '@dpo-packrat/common';

export type JobIOResults = H.IOResults & {
    allowRetry?: boolean | undefined,
};

const JOB_RETRY_COUNT = 2;

export abstract class JobPackrat implements JOB.IJob {
    protected _jobEngine: JOB.IJobEngine;
    protected _dbJobRun: DBAPI.JobRun;
    protected _nsJob: NS.Job | null = null;
    protected _report: REP.IReport | null = null;
    protected _results: JobIOResults = { success: false,  error: 'Not Started' };
    protected _initialized: boolean = false;

    constructor(jobEngine: JOB.IJobEngine, dbJobRun: DBAPI.JobRun, report: REP.IReport | null) {
        this._jobEngine = jobEngine;
        this._dbJobRun = dbJobRun;
        this._report = report;
    }

    // #region IJob interface
    name(): string          { throw new Error('JobPackrat.name() called but is only implemented in derived classes'); }
    configuration(): any    { throw new Error('JobPackrat.configuration() called but is only implemented in derived classes'); }
    waitForCompletion(timeout: number): Promise<H.IOResults> { timeout; throw new Error('JobPackrat.waitForCompletion() called but is only implemented in derived classes'); }
    async initialize(): Promise<H.IOResults> { throw new Error('JobPackrat.initialize() called but is only implemented in derived classes'); }

    async executeJob(fireDate: Date): Promise<H.IOResults> {

        // if we're not initialized, try to. On failure bail
        if(this._initialized===false) {
            const initResults: H.IOResults = await this.initialize();
            if(initResults.success===false) {
                await this.recordFailure(null, initResults.error);
                return initResults;
            }
        }

        // start our worker. on failure keep trying for JOB_RETRY_COUNT times.
        for (let attempt: number = 0; attempt < JOB_RETRY_COUNT; attempt++) {
            await this.recordCreated();
            this._results = await this.startJobWorker(fireDate);
            LOG.info(`JobPackrat.executeJob start job worker results (${H.Helpers.JSONStringify(this._results)})`,LOG.LS.eDEBUG);

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

    private async updateEngines(updateWorkflowEngine: boolean, sendJobCompletion: boolean = false): Promise<boolean> {
        let res: boolean = true;
        if (updateWorkflowEngine) {
            const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
            if (!workflowEngine) {
                LOG.error('JobPackrat.updateEngines failed, no WorkflowFactory instance', LOG.LS.eJOB);
                return false;
            }
            res = await workflowEngine.jobUpdated(this._dbJobRun.idJobRun) && res;
        }

        if (sendJobCompletion) {
            await this._jobEngine.jobCompleted(this);
            const cleanupRes: H.IOResults = await this.cleanupJob();
            if (!cleanupRes.success)
                LOG.error(`JobPackrat.updateEngines failed to cleanup job: ${cleanupRes.error}`, LOG.LS.eJOB);
        }

        return res;
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

    protected async updateJobOutput(output: string, updateEngines: boolean=false): Promise<void> {
        //this._dbJobRun.Result = true;
        this._dbJobRun.Output = output;
        await this._dbJobRun.update();
        if(updateEngines)
            await this.updateEngines(true); // was: don't block
    }

    protected async recordCreated(): Promise<boolean> {
        const updated: boolean = (this._dbJobRun.getStatus() == COMMON.eWorkflowJobRunStatus.eUnitialized);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Created`);
            this._dbJobRun.DateStart = new Date();
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eCreated);
            await this._dbJobRun.update();
            await this.updateEngines(true); // was: don't block
        }
        return updated;
    }

    protected async recordWaiting(): Promise<boolean> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eWaiting);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Waiting`);
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eWaiting);
            await this._dbJobRun.update();
            await this.updateEngines(true); // was: don't block
        }
        return updated;
    }

    protected async recordStart(idJob: string): Promise<boolean> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eRunning);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Starting (CookJobId: ${idJob})`);
            this._dbJobRun.DateStart = new Date();
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eRunning);
            await this._dbJobRun.update();
            await this.updateEngines(true); // was: don't block
        }
        return updated;
    }

    protected async recordSuccess(output: string): Promise<boolean> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eDone);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Success`);
            this._results = { success: true };   // do this before we await this._dbJobRun.update()
            this._dbJobRun.DateEnd = new Date();
            this._dbJobRun.Result = true;
            this._dbJobRun.Output = output ?? this._dbJobRun.Output; // if we don't have output, keep what we've got.
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eDone);
            await this._dbJobRun.update();

            if (this._report) {
                const pathDownload: string = RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
                const hrefDownload: string = H.Helpers.computeHref(pathDownload, 'Cook Job Output');
                await this._report.append(`${hrefDownload}<br/>\n`);
            }

            await this.updateEngines(true, true); // was: don't block
        }
        return updated;
    }

    protected async recordFailure(output: string | null, errorMsg?: string): Promise<boolean> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eError);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Failure: ${errorMsg}`, true);
            this._results = { success: false, error: errorMsg }; // do this before we await this._dbJobRun.update()
            this._dbJobRun.DateEnd = new Date();
            this._dbJobRun.Result = true;
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eError);
            this._dbJobRun.Output = output ?? this._dbJobRun.Output; // if we don't have output, keep what we've got.
            this._dbJobRun.Error = errorMsg ?? '';
            await this._dbJobRun.update();

            // make sure we attach our report if there is one
            if (this._report) {
                const pathDownload: string = RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
                const hrefDownload: string  = H.Helpers.computeHref(pathDownload, 'Cook Job Output');
                await this._report.append(`${hrefDownload}<br/>\n`);
            }

            await this.updateEngines(true, true); // was: don't block
        }

        return updated;
    }

    protected async recordCancel(output: string | null, errorMsg?: string): Promise<boolean> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eCancelled);
        if (!updated) {
            if (errorMsg) {
                this.appendToReportAndLog(`JobPackrat [${this.name()}] Cancel: ${errorMsg}`, true);
                this._dbJobRun.Error = errorMsg;
            } else
                this.appendToReportAndLog(`JobPackrat [${this.name()}] Cancel`, true);

            this._results = { success: false, error: 'Job Cancelled' + (errorMsg ? ` ${errorMsg}` : '') }; // do this before we await this._dbJobRun.update()
            this._dbJobRun.DateEnd = new Date();
            this._dbJobRun.Result = true;
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eCancelled);
            this._dbJobRun.Output = output ?? this._dbJobRun.Output; // if we don't have output, keep what we've got.
            await this._dbJobRun.update();

            // make sure we attach our report if there is one
            if (this._report) {
                const pathDownload: string = RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
                const hrefDownload: string = H.Helpers.computeHref(pathDownload, 'Cook Job Output');
                await this._report.append(`${hrefDownload}<br/>\n`);
            }

            await this.updateEngines(true, true); // was: don't block
        }

        return updated;
    }

    protected async logError(errorMessage: string, addToReport: boolean = true): Promise<H.IOResults> {
        // TODO: prepend with recipe type/info/jobId. overriden by each derived class
        const error = `[${this.name()}] ${errorMessage}`;
        if(addToReport == true)
            await this.appendToReportAndLog(error, true);
        return { success: false, error: errorMessage };
    }

    protected getReportDownloadPath(): string {
        return RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
    }
    protected getJobStartEndDates(): { start: Date, end: Date | null } {
        return { start: this._dbJobRun.DateStart ?? new Date(), end: this._dbJobRun.DateEnd };
    }
    // #endregion
}
