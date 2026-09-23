import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../records/logger/log';

// Test log honesty gate.
//
// Every log path in the server funnels through the Logger backend's error() and
// critical() entry points — RecordKeeper (RK) delegates to them, and the notify
// subsystem calls them directly. Wrapping these two static methods therefore
// captures all error/critical emissions from any caller, regardless of which
// logging API produced them.
//
// A run "absorbs" errors when code catches an exception, logs it, and continues:
// the test stays green while an error was emitted. This gate records those
// emissions and, in the default (assert) mode, fails a test file when an
// error/critical is emitted whose caller is not in a checked-in ratchet
// baseline. The baseline lists currently-known emitters so the suite stays green
// today; it shrinks toward empty as each category is cleaned.

export interface CapturedLog {
    level: 'error' | 'crit';
    section: string;
    caller: string;
    message: string;
}

interface Baseline {
    note?: string;
    // Enforcement switch. Ships false so the gate is inert until the baseline has
    // been seeded (`yarn test:logbaseline`) and committed. Flip to true — in the
    // same commit as the seeded allowlist — to make the gate fail on unexpected
    // error/critical logs. This prevents a surprise-red run before seeding.
    enabled?: boolean;
    allowedCallers: string[];
}

const BASELINE_PATH: string = path.join(__dirname, 'logBaseline.json');
const captured: CapturedLog[] = [];
let installed: boolean = false;

// Enabled only when seeding/re-seeding the ratchet baseline.
export const BASELINE_WRITE_MODE: boolean = process.env.PACKRAT_TEST_LOG_BASELINE_WRITE === '1';

// Key an emission by its caller: callers are stable across runs, whereas
// messages carry dynamic content (ids, paths) that would churn the baseline.
// Emissions without a caller fall back to a section-qualified placeholder.
function keyOf(entry: CapturedLog): string {
    return entry.caller.length > 0 ? entry.caller : `<no-caller>:${entry.section}`;
}

function record(level: 'error' | 'crit', args: unknown[]): void {
    try {
        const section: string = String(args[0]);
        const message: string = typeof args[1] === 'string' ? args[1] : '';
        const caller: string = typeof args[4] === 'string' ? args[4] : '';
        captured.push({ level, section, caller, message });
    } catch {
        // capture must never interfere with logging
    }
}

// Wrap Logger.error / Logger.critical so every emission is recorded before it is
// forwarded to the real implementation. Idempotent within a test file.
export function installLogGate(): void {
    if (installed)
        return;
    installed = true;

    const origError = Logger.error.bind(Logger);
    const origCritical = Logger.critical.bind(Logger);

    (Logger as unknown as { error: (...a: unknown[]) => unknown }).error = (...args: unknown[]) => {
        record('error', args);
        return (origError as (...a: unknown[]) => unknown)(...args);
    };
    (Logger as unknown as { critical: (...a: unknown[]) => unknown }).critical = (...args: unknown[]) => {
        record('crit', args);
        return (origCritical as (...a: unknown[]) => unknown)(...args);
    };
}

export function getCaptured(): CapturedLog[] {
    return captured.slice();
}

function loadBaseline(): Baseline {
    try {
        const parsed: Baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
        return Array.isArray(parsed.allowedCallers) ? parsed : { allowedCallers: [] };
    } catch {
        return { allowedCallers: [] };
    }
}

// Ratchet seeding: merge this file's emission keys into the checked-in allowlist.
// Runs serially (--runInBand) so read-modify-write of the shared file is safe.
export function mergeCapturedIntoBaseline(): void {
    const baseline: Baseline = loadBaseline();
    const set: Set<string> = new Set(baseline.allowedCallers);
    for (const entry of captured)
        set.add(keyOf(entry));
    const next: Baseline = {
        note: baseline.note ?? 'Ratchet allowlist for the test log honesty gate. Each entry is a known error/critical emitter (by caller) that does not fail the run. Shrink toward empty as each test category is cleaned (see PLAN_TESTING_RELIABILITY.md TR-0.2). Do not add entries without justification; re-seed with `yarn test:logbaseline`.',
        enabled: baseline.enabled ?? false,
        allowedCallers: Array.from(set).sort()
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 4) + '\n', 'utf8');
}

// Honesty gate: throw (failing the test file) when an error/critical was emitted
// whose caller is not in the ratchet baseline.
export function assertNoUnexpectedLogs(testFile: string): void {
    const baseline: Baseline = loadBaseline();
    if (baseline.enabled !== true)
        return; // gate inert until the baseline is seeded and explicitly enabled

    const allowed: Set<string> = new Set(baseline.allowedCallers);
    const unexpected: CapturedLog[] = captured.filter(e => !allowed.has(keyOf(e)));
    if (unexpected.length === 0)
        return;

    const detail: string = unexpected.map(e => `  [${e.level}] ${keyOf(e)} :: ${e.message}`).join('\n');
    const distinct: string = Array.from(new Set(unexpected.map(e => keyOf(e)))).sort().join(', ');
    throw new Error(
        `[log-honesty-gate] ${unexpected.length} unexpected error/critical log(s) emitted in ${testFile}:\n${detail}\n\n` +
        'If a log is expected (e.g. a negative-path test), assert on it in the test itself; ' +
        'if it is a known emitter, re-seed the ratchet baseline with `yarn test:logbaseline`.\n' +
        `Unexpected caller keys: ${distinct}`
    );
}
