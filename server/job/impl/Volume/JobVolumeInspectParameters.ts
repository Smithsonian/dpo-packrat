/**
 * Parameters for JobVolumeInspect.
 *
 * Used as the `instanceof` guard in `JobEngine.createJobWorker` to dispatch
 * a Volume Inspect job. Holds the staged ZIP's filename plus an optional
 * pre-opened read stream (passed by `WorkflowUpload` so we don't re-open
 * staging twice).
 */
import * as path from 'path';

export class JobVolumeInspectParameters {
    fileName: string;
    readStream?: NodeJS.ReadableStream | undefined;

    constructor(fileName: string, readStream?: NodeJS.ReadableStream | undefined) {
        this.fileName = path.basename(fileName);
        this.readStream = readStream;
    }
}
