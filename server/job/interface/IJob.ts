/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
export enum eJobRunStatus {
    eNotStarted,
    eRunning,
    ePaused,
    eCompleted
}

export interface IJob {
    start(): Promise<boolean>;
    pause(): Promise<boolean>;
    resume(): Promise<boolean>;
    terminate(): Promise<boolean>;
    getStatus(): Promise<eJobRunStatus>;
    getConfiguration(): Promise<any>;
}
