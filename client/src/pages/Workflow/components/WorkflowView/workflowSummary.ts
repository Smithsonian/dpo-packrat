import { IWorkflowReportSummary } from '@dpo-packrat/common';

/**
 * Parse the compact per-row JSON summary (WorkflowReport.Name, surfaced as WorkflowListResult.Summary).
 * Returns null for legacy rows (non-JSON MimeType), absent summaries, or invalid JSON so the table
 * renders a blank cell rather than throwing.
 */
export function parseWorkflowSummary(row: { Summary?: string | null; ReportMimeType?: string | null } | null | undefined): IWorkflowReportSummary | null {
    if (!row || row.ReportMimeType !== 'application/json' || !row.Summary)
        return null;
    try {
        const parsed = JSON.parse(row.Summary);
        return (parsed && typeof parsed === 'object') ? parsed as IWorkflowReportSummary : null;
    } catch {
        return null;
    }
}
