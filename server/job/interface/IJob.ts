/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
export interface IJob {
    name(): string;
    jobCallback(fireDate: Date): void;
    getConfiguration(): any;
    cancel(): void;
}
