/**
 * Shared, engine-agnostic format for workflow reports.
 *
 * A report body (WorkflowReport.Data) is a JSON array of IWorkflowReportEvent; a compact
 * IWorkflowReportSummary is stored in WorkflowReport.Name to drive the workflow table cheaply.
 * These types are the stable contract between whatever produces reports and whatever renders
 * them, so they live here with no external dependencies.
 */

export type WorkflowReportPhase = 'engine' | 'cook' | 'ingest' | 'storage' | 'system';
export type WorkflowReportLevel = 'info' | 'warn' | 'error';

/** A reference to a Packrat object embedded in an event's data, carrying id(s) so a viewer can
 * build a safe link instead of parsing one out of free text. */
export interface IWorkflowReportRef {
    name: string;
    idSystemObject?: number;
    idAsset?: number;
    idAssetVersion?: number;
    idModel?: number;
    idScene?: number;
    idSubject?: number;
}

/** One entry in the report body (WorkflowReport.Data JSON array). */
export interface IWorkflowReportEvent {
    ts: string;                             // ISO-8601 timestamp
    phase: WorkflowReportPhase;
    code: string;                           // a WorkflowReportCode value
    level?: WorkflowReportLevel;            // defaults to 'info'
    msg: string;
    data?: { [key: string]: unknown };      // small, code-specific payload (may hold IWorkflowReportRef)
}

/** Compact summary stored in WorkflowReport.Name (VARCHAR 512). All fields optional and populated
 * as they become known; the table renders a blank cell for anything absent. */
export interface IWorkflowReportSummary {
    subject?: string;
    idSubject?: number;
    scene?: string;
    idScene?: number;
    idModel?: number;
    idSystemObject?: number;
    mediaGroup?: string;
    cookServer?: string;
    cookJobId?: string;
    input?: string;
    recipe?: string;
    warnings?: number;                      // running count of warn-level events, for a list indicator
    errors?: number;                        // running count of error-level events
}

/** Stable string codes for events. New codes append here; renderers key off these. */
export const WorkflowReportCode = {
    JobCreate: 'job.create',
    JobRun: 'job.run',
    JobSchedule: 'job.schedule',
    JobCreated: 'job.created',
    JobWaiting: 'job.waiting',
    JobStart: 'job.start',
    JobSuccess: 'job.success',
    JobFailure: 'job.failure',
    JobCancel: 'job.cancel',
    JobWarning: 'job.warning',
    JobLog: 'job.log',
    CookMatched: 'cook.matched',
    CookLog: 'cook.log',
    CookError: 'cook.error',
    CookWarning: 'cook.warning',
    InspectNote: 'inspect.note',
    InspectInvalid: 'inspect.invalid',
    SceneNote: 'scene.note',
    SceneIngested: 'scene.ingested',
    ModelNote: 'model.note',
    ModelIngested: 'model.ingested',
    DownloadNote: 'download.note',
    DownloadIngested: 'download.ingested',
    IngestNote: 'ingest.note',
    LegacyText: 'legacy.text',
} as const;

export type WorkflowReportCodeType = typeof WorkflowReportCode[keyof typeof WorkflowReportCode];

/** Max serialized length of the summary (WorkflowReport.Name is VARCHAR 512). */
export const WorkflowReportSummaryMaxLength: number = 512;
