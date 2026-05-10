/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import * as DBAPI from '../../../db';
import * as WF from '../../../workflow/interface';
import * as REP from '../../../report/interface';
import * as H from '../../../utils/helpers';
import * as NS from 'node-schedule';
import { RouteBuilder, eHrefMode } from '../../../http/routes/routeBuilder';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export type JobIOResults = H.IOResults & {
    allowRetry?: boolean | undefined,
};

type UpdateEnginesResult = {
    success: boolean;            // true only if ALL operations succeeded
    cleanupFailed: boolean;      // post-processing of Cook results failed (data integrity)
    workflowUpdateFailed: boolean; // WorkflowStep DB update failed (system state)
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
            RK.logDebug(RK.LogSection.eJOB,'execute job','start worker results',{ ...this._results },'Job.Packrat');

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

    private async updateEngines(updateWorkflowEngine: boolean, sendJobCompletion: boolean = false): Promise<UpdateEnginesResult> {
        const result: UpdateEnginesResult = { success: true, cleanupFailed: false, workflowUpdateFailed: false };

        // run cleanup BEFORE notifying the workflow so the DB status is finalized
        // before anyone reads it. cleanup only runs on the success path — on
        // failure/cancel the Cook results don't need post-processing.
        if (sendJobCompletion && this._dbJobRun.getStatus() === COMMON.eWorkflowJobRunStatus.eDone) {
            const cleanupRes: H.IOResults = await this.cleanupJob();
            if (!cleanupRes.success) {
                RK.logError(RK.LogSection.eJOB,'cleanup failed','post-processing failed, reverting success to error',{ idJobRun: this._dbJobRun.idJobRun, error: cleanupRes.error },'Job.Packrat');
                result.cleanupFailed = true;
                result.success = false;

                // revert job status so the workflow and all downstream consumers
                // see the correct final state on their first read
                this._results = { success: false, error: cleanupRes.error ?? 'Post-processing failed after Cook job success' };
                this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eError);
                this._dbJobRun.Error = cleanupRes.error ?? 'Post-processing failed after Cook job success';
                await this._dbJobRun.update();
                await this.appendToReportAndLog(`JobPackrat [${this.name()}] Success Reverted: ${cleanupRes.error}`, true);
            }
        }

        // notify the workflow engine of the (now finalized) job status.
        // this updates the WorkflowStep in the DB — it is system state, not a notification.
        if (updateWorkflowEngine) {
            const workflowEngine: WF.IWorkflowEngine | null = await WF.WorkflowFactory.getInstance();
            if (!workflowEngine) {
                RK.logError(RK.LogSection.eJOB,'update engines failed','no WorkflowFactory instance',{ idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
                result.workflowUpdateFailed = true;
                result.success = false;
            } else {
                const wfResult: boolean = await workflowEngine.jobUpdated(this._dbJobRun.idJobRun);
                if (!wfResult) {
                    RK.logError(RK.LogSection.eJOB,'update engines failed','workflow engine jobUpdated returned false',{ idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
                    result.workflowUpdateFailed = true;
                    result.success = false;
                }
            }
        }

        if (sendJobCompletion)
            await this._jobEngine.jobCompleted(this);

        return result;
    }

    // #region JobPackrat helper methods
    protected async appendToReportAndLog(content: string, error?: boolean | undefined): Promise<H.IOResults> {
        if (error)
            RK.logError(RK.LogSection.eJOB,'job error',content,{ idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
        else
            RK.logInfo(RK.LogSection.eJOB,'job notice',content,{ idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');

        if (!this._report) {
            RK.logWarning(RK.LogSection.eJOB,'append report error',`no active report: ${content}`,{ idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
            return { success: false, error: 'No Active WorkflowReport' };
        }
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

            // update the status/values of our job
            const result: boolean = await this._dbJobRun.update();
            if(!result) {
                RK.logError(RK.LogSection.eJOB,'job create failed','cannot update JobRun',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
                return false;
            }

            // update our workflow engine with new job status
            const engineResult = await this.updateEngines(true);
            if(!engineResult.success)
                RK.logError(RK.LogSection.eJOB,'job create failed','cannot update job engines',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
            else
                RK.logInfo(RK.LogSection.eJOB,'job created',undefined,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
        }
        return updated;
    }

    protected async recordWaiting(): Promise<boolean> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eWaiting);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Waiting`);
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eWaiting);

            // update the status/values of our job
            const result: boolean = await this._dbJobRun.update();
            if(!result) {
                RK.logError(RK.LogSection.eJOB,'job waiting failed','cannot update JobRun',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
                return false;
            }

            // update our workflow engine with new job status
            const engineResult = await this.updateEngines(true);
            if(!engineResult.success)
                RK.logError(RK.LogSection.eJOB,'job waiting failed','cannot update job engines',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
            else
                RK.logInfo(RK.LogSection.eJOB,'job waiting',undefined,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
        }
        return updated;
    }

    protected async recordStart(idJob: string): Promise<boolean> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eRunning);
        if (updated) {
            this.appendToReportAndLog(`JobPackrat [${this.name()}] Starting (CookJobId: ${idJob})`);
            this._dbJobRun.DateStart = new Date();
            this._dbJobRun.setStatus(COMMON.eWorkflowJobRunStatus.eRunning);

            // update the status/values of our job
            const result: boolean = await this._dbJobRun.update();
            if(!result) {
                RK.logError(RK.LogSection.eJOB,'job start failed','cannot update JobRun',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, idCookJob: idJob },'Job.Packrat');
                return false;
            }

            // update our workflow engine with new job status
            const engineResult = await this.updateEngines(true);
            if(!engineResult.success)
                RK.logError(RK.LogSection.eJOB,'job start failed','cannot update job engines',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, idCookJob: idJob },'Job.Packrat');
            else
                RK.logInfo(RK.LogSection.eJOB,'job start',undefined,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, idCookJob: idJob },'Job.Packrat');
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

            // update the status/values of our job
            const result: boolean = await this._dbJobRun.update();
            if(!result) {
                RK.logError(RK.LogSection.eJOB,'job record success failed','cannot update JobRun',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, config: this._dbJobRun.Configuration },'Job.Packrat');
                return false;
            }

            // add url for output to the report
            const pathDownload: string = RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
            const hrefDownload: string = H.Helpers.computeHref(pathDownload, 'Cook Job Output');
            if (this._report)
                await this._report.append(`${hrefDownload}<br/>\n`);
            else
                RK.logWarning(RK.LogSection.eJOB,'job record success','no report to append results',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, pathDownload, output: this._dbJobRun.Output },'Job.Packrat');

            // run cleanup, notify workflow, and complete the job.
            // if cleanup fails, updateEngines reverts the status to eError in the DB
            // before the workflow is notified, ensuring a single consistent state.
            const engineResult: UpdateEnginesResult = await this.updateEngines(true, true);
            if (engineResult.cleanupFailed) {
                RK.logError(RK.LogSection.eJOB,'job record success reverted','post-processing failed after Cook success',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
                return false;
            }
            if (engineResult.workflowUpdateFailed) {
                RK.logError(RK.LogSection.eJOB,'job record success','workflow step update failed, workflow state may be inaccurate',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
                await this.appendToReportAndLog(`JobPackrat [${this.name()}] Warning: workflow status update failed, workflow screen may not reflect completion`, true);
            }
            RK.logInfo(RK.LogSection.eJOB,'job record success',undefined,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, pathDownload },'Job.Packrat');
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

            // update the status/values of our job
            const result: boolean = await this._dbJobRun.update();
            if(!result) {
                RK.logError(RK.LogSection.eJOB,'job record failure failed','cannot update JobRun',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, config: this._dbJobRun.Configuration },'Job.Packrat');
                return false;
            }

            // add url for output to the report
            const pathDownload: string = RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
            const hrefDownload: string = H.Helpers.computeHref(pathDownload, 'Cook Job Output');

            if (this._report)
                await this._report.append(`${hrefDownload}<br/>\n`);
            else
                RK.logWarning(RK.LogSection.eJOB,'job record failure','no report to append results',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, pathDownload, output: this._dbJobRun.Output },'Job.Packrat');

            // notify workflow and complete the job.
            const engineResult: UpdateEnginesResult = await this.updateEngines(true, true);
            if (engineResult.workflowUpdateFailed) {
                RK.logError(RK.LogSection.eJOB,'job record failure','workflow step update failed, workflow state may be inaccurate',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
                await this.appendToReportAndLog(`JobPackrat [${this.name()}] Warning: workflow status update failed, workflow screen may not reflect failure`, true);
            }
            RK.logInfo(RK.LogSection.eJOB,'job record failure',this._dbJobRun.Error,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, pathDownload },'Job.Packrat');
        }

        return updated;
    }

    protected async recordCancel(output: string | null, errorMsg?: string): Promise<boolean> {
        const updated: boolean = (this._dbJobRun.getStatus() != COMMON.eWorkflowJobRunStatus.eCancelled);
        if (updated) {
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

            // update the status/values of our job
            const result: boolean = await this._dbJobRun.update();
            if(!result) {
                RK.logError(RK.LogSection.eJOB,'job record cancel failed','cannot update JobRun',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
                return false;
            }

            // add url for output to the report
            const pathDownload: string = RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
            const hrefDownload: string = H.Helpers.computeHref(pathDownload, 'Cook Job Output');

            if (this._report)
                await this._report.append(`${hrefDownload}<br/>\n`);
            else
                RK.logWarning(RK.LogSection.eJOB,'job record cancel','no report to append results',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, pathDownload, output: this._dbJobRun.Output },'Job.Packrat');

            // notify workflow and complete the job
            const engineResult: UpdateEnginesResult = await this.updateEngines(true, true);
            if (engineResult.workflowUpdateFailed) {
                RK.logError(RK.LogSection.eJOB,'job record cancel','workflow step update failed, workflow state may be inaccurate',{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun },'Job.Packrat');
                await this.appendToReportAndLog(`JobPackrat [${this.name()}] Warning: workflow status update failed, workflow screen may not reflect cancellation`, true);
            }
            RK.logInfo(RK.LogSection.eJOB,'job record cancel',errorMsg ?? undefined,{ jobName: this.name(), idJobRun: this._dbJobRun.idJobRun, pathDownload },'Job.Packrat');
        }

        return updated;
    }

    protected getReportDownloadPath(): string {
        return RouteBuilder.DownloadJobRun(this._dbJobRun.idJobRun , eHrefMode.ePrependServerURL);
    }
    protected getJobStartEndDates(): { start: Date, end: Date | null } {
        return { start: this._dbJobRun.DateStart ?? new Date(), end: this._dbJobRun.DateEnd };
    }
    // #endregion
}
