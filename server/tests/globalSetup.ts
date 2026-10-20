import * as fs from 'fs';
import * as path from 'path';
import { sandboxPaths } from './sandboxPaths';

// Runs once before the whole suite (jest globalSetup). Clears the assertion-gate
// inventory that logGate.reportAssertionCoverage appends to per file, so each run
// starts fresh. Derives the log dir via sandboxPaths (the same source setEnvVars.ts
// uses) rather than reading PACKRAT_LOG_ROOT: globalSetup runs in a separate process
// where an externally-exported value could point at a different file than the tests
// write to, letting records accumulate across runs.
export default async function globalSetup(): Promise<void> {
    const { logs } = sandboxPaths();
    try {
        fs.rmSync(path.join(logs, 'assertion-gate.jsonl'), { force: true });
    } catch {
        // best-effort: a stale inventory is harmless (records are keyed by file)
    }
}
