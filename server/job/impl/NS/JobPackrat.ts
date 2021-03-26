/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import * as DBAPI from '../../../db';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import * as NS from 'node-schedule';

export abstract class JobPackrat implements JOB.IJob {
    protected _nsJob: NS.Job | null = null;
    protected _dbJobRun: DBAPI.JobRun;
    protected _results: H.IOResults = { success: false,  error: 'Not Started' };

    constructor(dbJobRun: DBAPI.JobRun) {
        this._dbJobRun = dbJobRun;
    }

    // #region IJob interface
    name(): string          { throw new Error('JobPackrat.name() called but is only implemented in derived classes'); }
    configuration(): any    { throw new Error('JobPackrat.configuration() called but is only implemented in derived classes'); }
    waitForCompletion(timeout: number): Promise<H.IOResults> { timeout; throw new Error('JobPackrat.waitForCompletion() called but is only implemented in derived classes'); }

    async executeJob(fireDate: Date): Promise<H.IOResults> {
        await this.recordCreated();
        this._results = await this.startJobWorker(fireDate);
        if (!this._results.success)
            await this.recordFailure(this._results.error);
        return this._results;
    }

    async cancelJob(): Promise<H.IOResults> {
        if (this._nsJob)
            this._nsJob.cancel();
        this._results = await this.cancelJobWorker();
        await this.recordCancel(this._results.error);
        return this._results;
    }

    async dbJobRun(): Promise<DBAPI.JobRun | null> {
        return this._dbJobRun;
    }
    // #endregion

    // #region JobPackrat interface
    // To be implemented by derived classes
    protected abstract startJobWorker(fireDate: Date): Promise<H.IOResults>;
    protected abstract cancelJobWorker(): Promise<H.IOResults>;
    // #endregion

    // #region node-scheduler interface
    setNSJob(nsJob: NS.Job): void {
        this._nsJob = nsJob;
    }
    // #endregion

    // #region JobRun helper methods
    async recordCreated(): Promise<void> {
        if (this._dbJobRun.getStatus() == DBAPI.eJobRunStatus.eUnitialized) {
            this._dbJobRun.DateStart = new Date();
            this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eCreated);
            await this._dbJobRun.update();
            LOG.logger.info(`JobPackrat [${this.name()}] Created`);
        }
    }

    async recordWaiting(): Promise<void> {
        this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eWaiting);
        await this._dbJobRun.update();
        LOG.logger.info(`JobPackrat [${this.name()}] Waiting`);
    }

    async recordStart(): Promise<void> {
        if (this._dbJobRun.getStatus() != DBAPI.eJobRunStatus.eRunning) {
            this._dbJobRun.DateStart = new Date();
            this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eRunning);
            await this._dbJobRun.update();
            LOG.logger.info(`JobPackrat [${this.name()}] Starting`);
        }
    }

    async recordSuccess(output: string): Promise<void> {
        this._results = { success: true, error: '' };   // do this before we await this._dbJobRun.update()
        this._dbJobRun.DateEnd = new Date();
        this._dbJobRun.Result = true;
        this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eDone);
        this._dbJobRun.Output = output;
        LOG.logger.info(`JobPackrat [${this.name()}] Success`);
        await this._dbJobRun.update();
    }

    async recordFailure(errorMsg: string): Promise<void> {
        this._results = { success: false, error: errorMsg }; // do this before we await this._dbJobRun.update()
        this._dbJobRun.DateEnd = new Date();
        this._dbJobRun.Result = false;
        this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eError);
        this._dbJobRun.Error = errorMsg;
        await this._dbJobRun.update();
        LOG.logger.error(`JobPackrat [${this.name()}] Failure: ${errorMsg}`);
    }

    async recordCancel(errorMsg: string): Promise<void> {
        this._results = { success: false, error: 'Job Cancelled' }; // do this before we await this._dbJobRun.update()
        this._dbJobRun.DateEnd = new Date();
        this._dbJobRun.Result = false;
        this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eCancelled);
        if (errorMsg) {
            LOG.logger.error(`JobPackrat [${this.name()}] Cancel: ${errorMsg}`);
            this._dbJobRun.Error = errorMsg;
        } else
            LOG.logger.error(`JobPackrat [${this.name()}] Cancel`);
        await this._dbJobRun.update();
    }
    // #endregion
}
