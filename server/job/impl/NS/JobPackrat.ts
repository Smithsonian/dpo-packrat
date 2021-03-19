/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import * as DBAPI from '../../../db';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import * as NS from 'node-schedule';

export abstract class JobPackrat implements JOB.IJob {
    protected _nsJob: NS.Job | null = null;
    protected _dbJobRun: DBAPI.JobRun;

    constructor(dbJobRun: DBAPI.JobRun) {
        this._dbJobRun = dbJobRun;
    }

    // #region IJob interface
    async startJob(fireDate: Date): Promise<H.IOResults> {
        await this.recordCreated();
        const res: H.IOResults = await this.startJobWorker(fireDate);
        if (!res.success)
            await this.recordFailure(res.error);
        return res;
    }

    async cancelJob(): Promise<H.IOResults> {
        const res: H.IOResults = await this.cancelJobWorker();
        await this.recordCancel(res.error);
        return res;
    }

    name(): string {
        throw new Error('JobPackrat.name() called but is only implemented in derived classes');
    }
    configuration(): any {
        throw new Error('JobPackrat.configuration() called but is only implemented in derived classes');
    }
    // #endregion

    // #region JobPackrat interface
    // To be implemented by derived classes
    protected abstract startJobWorker(fireDate: Date): Promise<H.IOResults>;
    protected abstract cancelJobWorker(): Promise<H.IOResults>;
    // #endregion

    // #region node-scheduler interface
    async nsJobCallback(fireDate: Date): Promise<void> {
        await this.startJob(fireDate);
    }

    setNSJob(nsJob: NS.Job): void {
        this._nsJob = nsJob;
    }
    // #endregion

    // #region JobRun helper methods
    async recordCreated(): Promise<void> {
        this._dbJobRun.DateStart = new Date();
        this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eCreated);
        await this._dbJobRun.update();
    }

    async recordWaiting(): Promise<void> {
        this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eWaiting);
        await this._dbJobRun.update();
    }

    async recordStart(): Promise<void> {
        if (this._dbJobRun.getStatus() != DBAPI.eJobRunStatus.eRunning) {
            this._dbJobRun.DateStart = new Date();
            this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eRunning);
            await this._dbJobRun.update();
        }
    }

    async recordSuccess(output: string): Promise<void> {
        this._dbJobRun.DateEnd = new Date();
        this._dbJobRun.Result = true;
        this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eDone);
        this._dbJobRun.Output = output;
        await this._dbJobRun.update();
    }

    async recordFailure(errorMsg: string): Promise<void> {
        this._dbJobRun.DateEnd = new Date();
        this._dbJobRun.Result = false;
        this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eError);
        this._dbJobRun.Error = errorMsg;
        await this._dbJobRun.update();
        LOG.logger.error(errorMsg);
    }

    async recordCancel(errorMsg: string): Promise<void> {
        this._dbJobRun.DateEnd = new Date();
        this._dbJobRun.Result = false;
        this._dbJobRun.setStatus(DBAPI.eJobRunStatus.eCancelled);
        if (errorMsg) {
            LOG.logger.error(errorMsg);
            this._dbJobRun.Error = errorMsg;
        }
        await this._dbJobRun.update();
    }
    // #endregion
}
