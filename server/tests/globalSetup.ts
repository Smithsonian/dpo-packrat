import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Runs once before the whole suite (jest globalSetup). Clears the
// assertion-gate inventory that logGate.reportAssertionCoverage appends to per
// file, so each run starts fresh. The path is pinned to os.tmpdir()/packrat-test-logs
// to match setEnvVars.ts, which sets PACKRAT_LOG_ROOT there UNCONDITIONALLY: reading
// a (possibly externally-exported) PACKRAT_LOG_ROOT here would truncate a different
// file than the tests write to, letting records accumulate across runs.
export default async function globalSetup(): Promise<void> {
    const root: string = path.join(os.tmpdir(), 'packrat-test-logs');
    try {
        fs.rmSync(path.join(root, 'assertion-gate.jsonl'), { force: true });
    } catch {
        // best-effort: a stale inventory is harmless (records are keyed by file)
    }
}
