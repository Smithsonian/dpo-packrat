/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as JOB from '../../interface';
import * as NS from 'node-schedule';

export abstract class JobPackrat implements JOB.IJob {
    protected nsJob: NS.Job | null = null;

    setNSJob(nsJob: NS.Job): void {
        this.nsJob = nsJob;
    }

    name(): string {
        throw new Error('JobPackrat.name() called but is only implemented in derived classes');
    }
    jobCallback(fireDate: Date): void {
        fireDate;
        throw new Error('JobPackrat.jobCallback() called but is only implemented in derived classes');
    }
    getConfiguration(): any {
        throw new Error('JobPackrat.getConfiguration() called but is only implemented in derived classes');
    }
}
