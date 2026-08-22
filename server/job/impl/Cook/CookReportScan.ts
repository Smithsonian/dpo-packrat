import * as COMMON from '@dpo-packrat/common';

// Turns a raw Cook job report into ranked, structured findings so a failure reason is surfaced as
// coded report events for every recipe, instead of being left buried in the raw report body that a
// user must read by eye. Every rule keys off signals Cook itself returns — the per-step logs and
// error strings — so nothing here parses the source model, which may be very large or, like GLB,
// opaque. Recipe-specific structured checks (e.g. the inspection-result material/geometry checks)
// stay in their own job classes; this module handles the log/error signals common to all recipes.

export interface CookScanFinding {
    code: COMMON.WorkflowReportCodeType;
    level: COMMON.WorkflowReportLevel;
    message: string;
}

export interface CookScanResult {
    errors: CookScanFinding[];
    warnings: CookScanFinding[];
}

interface CookReportLike {
    state?: string;
    error?: string;
    steps?: { [step: string]: { error?: string; log?: Array<{ message?: string }> } };
}

// Collect every log message across all steps, plus per-step and top-level error strings, into one
// flat list the rules can scan for corroborating markers.
function collectMessages(report: CookReportLike): string[] {
    const messages: string[] = [];
    if (typeof report.error === 'string' && report.error.length > 0)
        messages.push(report.error);

    const steps = report.steps;
    if (steps && typeof steps === 'object') {
        for (const key of Object.keys(steps)) {
            const step = steps[key];
            if (!step || typeof step !== 'object')
                continue;
            if (typeof step.error === 'string' && step.error.length > 0)
                messages.push(step.error);
            if (Array.isArray(step.log)) {
                for (const entry of step.log)
                    if (entry && typeof entry.message === 'string' && entry.message.length > 0)
                        messages.push(entry.message);
            }
        }
    }
    return messages;
}

const contains = (messages: string[], needle: string): boolean =>
    messages.some(m => m.includes(needle));

// Translate a Cook tool-termination error into a friendly, actionable message using corroborating
// log lines. Known tools get a specific reason; any other terminated tool gets a named generic so
// the offending step is identified even when the exact cause is only in the raw report.
function friendlyToolError(primary: string, messages: string[]): string {
    if (primary.includes('Tool Blender: terminated with code'))
        return contains(messages, 'Error: Unsupported file type: .zip')
            ? 'Zip package is invalid or corrupt.'
            : 'Blender step failed. See the Cook report.';

    if (primary.includes('Tool MeshSmith: terminated with code'))
        return contains(messages, 'Invalid vertex index')
            ? 'Invalid mesh. Missing vertices or faces.'
            : 'MeshSmith step failed. See the Cook report.';

    const toolMatch: RegExpMatchArray | null = primary.match(/Tool ([A-Za-z0-9_]+): terminated with code/);
    if (toolMatch)
        return `Cook step "${toolMatch[1]}" failed. See the Cook report.`;

    return primary;
}

// Produce ranked, coded findings from a Cook report. Errors are only emitted when Cook itself
// reports the job as errored; the warning tier (non-blocking issues surfaced from an otherwise
// successful run) is populated by recipe-specific callers and is intentionally empty here.
export function scanCookReport(cookJobReport: unknown): CookScanResult {
    const errors: CookScanFinding[] = [];
    const warnings: CookScanFinding[] = [];
    if (!cookJobReport || typeof cookJobReport !== 'object')
        return { errors, warnings };

    const report: CookReportLike = cookJobReport as CookReportLike;

    if (report.state === 'error') {
        const messages: string[] = collectMessages(report);
        const primary: string = (typeof report.error === 'string' && report.error.length > 0)
            ? report.error
            : (messages.find(m => /terminated with code|not found|failed|invalid/i.test(m)) ?? 'Cook reported an error.');

        const message: string = friendlyToolError(primary, messages);
        errors.push({ code: COMMON.WorkflowReportCode.CookError, level: 'error', message });
    }

    return { errors, warnings };
}
