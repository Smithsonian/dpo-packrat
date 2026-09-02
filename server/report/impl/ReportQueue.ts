import * as DBAPI from '../../db';
import * as H from '../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { ReportFormat } from './ReportFormat';

/**
 * Serializes all writes to a given WorkflowReport (keyed by idWorkflowReport) so concurrent
 * appendEvent/setSummary calls cannot interleave, lose an event, corrupt the JSON body, or
 * clobber each other's column. Writes to different reports still run concurrently. Owned here in
 * the report module; RecordKeeper exposes it as a first-class subsystem (drain-on-shutdown).
 *
 * Single-writer-per-report assumption (matches existing behavior): the WorkflowReport instance
 * passed in is treated as authoritative for the duration of its serialized slot.
 */
export class ReportQueue {
    private static chains: Map<number, Promise<H.IOResults>> = new Map();

    static async appendEvent(workflowReport: DBAPI.WorkflowReport, event: COMMON.IWorkflowReportEvent): Promise<H.IOResults> {
        return ReportQueue.run(workflowReport, (wr) => {
            const events: COMMON.IWorkflowReportEvent[] = ReportFormat.parseEvents(wr.Data);
            events.push(event);
            wr.Data = JSON.stringify(events);
            if (wr.MimeType !== 'application/json')
                wr.MimeType = 'application/json';

            // Maintain a running warn/error tally in the summary so the workflow list can show a
            // warning indicator without fetching and parsing the whole event body per row.
            if (event.level === 'warn' || event.level === 'error') {
                const summary: COMMON.IWorkflowReportSummary = ReportFormat.parseSummary(wr.Name);
                if (event.level === 'warn')
                    summary.warnings = (summary.warnings ?? 0) + 1;
                else
                    summary.errors = (summary.errors ?? 0) + 1;
                wr.Name = ReportFormat.serializeSummary(summary);
            }
        });
    }

    static async setSummary(workflowReport: DBAPI.WorkflowReport, summary: COMMON.IWorkflowReportSummary): Promise<H.IOResults> {
        return ReportQueue.run(workflowReport, (wr) => {
            // Preserve the running warn/error tally that appendEvent maintains. Callers (e.g. the Cook
            // progressive summary) rebuild the summary from scratch and would otherwise clobber the
            // counts on a terminal write that lands after the warning events. An explicit count in the
            // incoming summary still wins.
            const existing: COMMON.IWorkflowReportSummary = ReportFormat.parseSummary(wr.Name);
            const merged: COMMON.IWorkflowReportSummary = { ...summary };
            if (merged.warnings === undefined && existing.warnings !== undefined)
                merged.warnings = existing.warnings;
            if (merged.errors === undefined && existing.errors !== undefined)
                merged.errors = existing.errors;
            wr.Name = ReportFormat.serializeSummary(merged);
        });
    }

    /** Await all in-flight report writes (used on shutdown, mirrors the log/notify queues). */
    static async waitForQueueToDrain(timeout: number = 10000): Promise<H.IOResults> {
        const chains: Promise<H.IOResults>[] = Array.from(ReportQueue.chains.values());
        if (chains.length === 0)
            return { success: true };

        let timer: NodeJS.Timeout | undefined = undefined;
        const timedOut: Promise<boolean> = new Promise<boolean>((resolve) => { timer = setTimeout(() => resolve(false), timeout); });
        const drained: Promise<boolean> = Promise.allSettled(chains).then(() => true);
        const ok: boolean = await Promise.race([drained, timedOut]);
        if (timer)
            clearTimeout(timer);
        return ok ? { success: true } : { success: false, error: 'report queue drain timeout' };
    }

    private static run(workflowReport: DBAPI.WorkflowReport, mutate: (wr: DBAPI.WorkflowReport) => void): Promise<H.IOResults> {
        const id: number = workflowReport.idWorkflowReport;
        const prior: Promise<unknown> = ReportQueue.chains.get(id) ?? Promise.resolve();
        const next: Promise<H.IOResults> = prior.catch(() => undefined).then(async () => {
            try {
                mutate(workflowReport);
                if (await workflowReport.update())
                    return { success: true };
                return { success: false, error: 'Database error persisting WorkflowReport' };
            } catch (error) {
                return { success: false, error: `WorkflowReport write failed: ${H.Helpers.getErrorString(error)}` };
            }
        });
        ReportQueue.chains.set(id, next);
        next.finally(() => { if (ReportQueue.chains.get(id) === next) ReportQueue.chains.delete(id); });
        return next;
    }
}
