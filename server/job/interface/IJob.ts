/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as DBAPI from '../../db';
import * as H from '../../utils/helpers';

export interface IJob {
    name(): string;
    configuration(): any;
    initialize(): any;

    executeJob(fireDate: Date): Promise<H.IOResults>;
    cancelJob(): Promise<H.IOResults>;

    waitForCompletion(timeout: number): Promise<H.IOResults>;
    dbJobRun(): Promise<DBAPI.JobRun | null>;
}
