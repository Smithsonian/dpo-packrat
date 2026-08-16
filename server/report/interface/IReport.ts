import * as H from '../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';

export interface IReport {
    /** Legacy shim: wraps arbitrary text as a single 'legacy.text' event. Prefer appendEvent. */
    append(content: string): Promise<H.IOResults>;
    /** Append a structured event to the report body (JSON array). */
    appendEvent(event: COMMON.IWorkflowReportEvent): Promise<H.IOResults>;
    /** Write the compact table-driving summary into WorkflowReport.Name. */
    setSummary(summary: COMMON.IWorkflowReportSummary): Promise<H.IOResults>;
}
