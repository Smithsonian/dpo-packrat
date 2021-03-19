/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import * as H from '../../utils/helpers';

export interface IJob {
    name(): string;
    configuration(): any;

    startJob(fireDate: Date): Promise<H.IOResults>;
    cancelJob(): Promise<H.IOResults>;
}
