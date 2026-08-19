import * as COMMON from '@dpo-packrat/common';

/**
 * Pure (de)serialization helpers for the structured report format. Kept separate from the write
 * queue so they can be unit-tested in isolation and reused.
 */
export class ReportFormat {
    /** Parse a report body into events. Empty ⇒ []; a non-empty, non-array body is preserved as a
     * single legacy.text event rather than throwing, so a malformed body never blocks new events. */
    static parseEvents(data: string): COMMON.IWorkflowReportEvent[] {
        if (!data)
            return [];
        try {
            const parsed: unknown = JSON.parse(data);
            if (Array.isArray(parsed))
                return parsed as COMMON.IWorkflowReportEvent[];
        } catch { /* fall through and preserve as legacy text */ }
        return [{ ts: new Date().toISOString(), phase: 'system', code: COMMON.WorkflowReportCode.LegacyText, msg: data }];
    }

    /** Merge one or more JSON report bodies into a single JSON string for /download. A single report
     * emits its own body; a set emits an array of bodies. An unparseable body is preserved verbatim
     * rather than failing the whole set. */
    static mergeJSONReports(bodies: string[]): string {
        const merged: unknown[] = [];
        for (const data of bodies) {
            try {
                merged.push(JSON.parse(data || '[]'));
            } catch {
                merged.push(data);
            }
        }
        return JSON.stringify(merged.length === 1 ? merged[0] : merged);
    }

    /** Serialize the summary to <= WorkflowReportSummaryMaxLength by shortening name VALUES first
     * (numeric ids retained), never by slicing the serialized JSON (which would break it). */
    static serializeSummary(summary: COMMON.IWorkflowReportSummary): string {
        const max: number = COMMON.WorkflowReportSummaryMaxLength;
        let serialized: string = JSON.stringify(summary);
        if (serialized.length <= max)
            return serialized;

        const clone: { [key: string]: unknown } = { ...summary };
        const stringKeys: string[] = Object.keys(clone)
            .filter((k) => typeof clone[k] === 'string')
            .sort((a, b) => String(clone[b]).length - String(clone[a]).length);

        for (const key of stringKeys) {
            while (JSON.stringify(clone).length > max && String(clone[key]).length > 1)
                clone[key] = String(clone[key]).slice(0, Math.max(1, Math.floor(String(clone[key]).length / 2)));
            if (JSON.stringify(clone).length <= max)
                break;
        }

        serialized = JSON.stringify(clone);
        if (serialized.length <= max)
            return serialized;

        // last resort: keep only numeric ids (well under the cap), dropping all names
        const idsOnly: { [key: string]: unknown } = {};
        for (const key of Object.keys(clone))
            if (typeof clone[key] === 'number')
                idsOnly[key] = clone[key];
        return JSON.stringify(idsOnly);
    }
}
