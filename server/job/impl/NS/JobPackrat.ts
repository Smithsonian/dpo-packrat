/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import * as DBAPI from '../../../db';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import * as NS from 'node-schedule';

export abstract class JobPackrat implements JOB.IJob {
    protected nsJob: NS.Job | null = null;
    protected dbJobRun: DBAPI.JobRun;

    constructor(dbJobRun: DBAPI.JobRun) {
        this.dbJobRun = dbJobRun;
    }

    protected abstract startJob(fireDate: Date): Promise<H.IOResults>;
    protected abstract cancelJob(): Promise<H.IOResults>;

    async jobCallback(fireDate: Date): Promise<void> {
        await this.recordStart();
        const res: H.IOResults = await this.startJob(fireDate);
        if (!res.success)
            await this.recordFailure(res.error);
    }

    async cancel(): Promise<void> {
        const res: H.IOResults = await this.cancelJob();
        await this.recordCancel(res.error);
    }

    setNSJob(nsJob: NS.Job): void {
        this.nsJob = nsJob;
    }

    name(): string {
        throw new Error('JobPackrat.name() called but is only implemented in derived classes');
    }
    getConfiguration(): any {
        throw new Error('JobPackrat.getConfiguration() called but is only implemented in derived classes');
    }

    async recordStart(): Promise<void> {
        this.dbJobRun.DateStart = new Date();
        this.dbJobRun.setStatus(DBAPI.eJobRunStatus.eRunning);
        await this.dbJobRun.update();
    }

    async recordSuccess(output: string): Promise<void> {
        this.dbJobRun.DateEnd = new Date();
        this.dbJobRun.Result = true;
        this.dbJobRun.setStatus(DBAPI.eJobRunStatus.eCompleted);
        this.dbJobRun.Output = output;
        await this.dbJobRun.update();
    }

    async recordFailure(errorMsg: string): Promise<void> {
        this.dbJobRun.DateEnd = new Date();
        this.dbJobRun.Result = false;
        this.dbJobRun.setStatus(DBAPI.eJobRunStatus.eCompleted);
        this.dbJobRun.Error = errorMsg;
        await this.dbJobRun.update();
        LOG.logger.error(errorMsg);
    }

    async recordCancel(errorMsg: string): Promise<void> {
        this.dbJobRun.DateEnd = new Date();
        this.dbJobRun.Result = false;
        this.dbJobRun.setStatus(DBAPI.eJobRunStatus.eCancelled);
        if (errorMsg) {
            LOG.logger.error(errorMsg);
            this.dbJobRun.Error = errorMsg;
        }
        await this.dbJobRun.update();
    }
}
