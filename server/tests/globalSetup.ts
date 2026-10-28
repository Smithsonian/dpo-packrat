import * as fs from 'fs';
import * as net from 'net';
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
    await noticeIfDatabaseUnreachable();
}

// Best-effort reachability signpost. Most "the suite won't start" confusion is a
// database that isn't running or isn't where PACKRAT_DATABASE_URL points. A quick
// TCP probe turns the cryptic downstream connection error into a clear next step.
// Never throws and never fails the run: unit-only files that don't touch the DB
// still run, and the probe itself cannot break anything.
async function noticeIfDatabaseUnreachable(): Promise<void> {
    const url: string | undefined = process.env.PACKRAT_DATABASE_URL;
    if (!url)
        return;
    let host: string;
    let port: number;
    try {
        const parsed: URL = new URL(url);
        host = parsed.hostname;
        port = parsed.port ? parseInt(parsed.port, 10) : 3306;
    } catch {
        return;
    }
    const reachable: boolean = await new Promise<boolean>((resolve) => {
        const socket: net.Socket = net.connect({ host, port });
        const finish = (ok: boolean): void => { socket.destroy(); resolve(ok); };
        socket.setTimeout(3000);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
    });
    if (!reachable)
        // eslint-disable-next-line no-console
        console.error(
            `\n[test-preflight] No database reachable at ${host}:${port}.\n` +
            'The suite needs a seeded Packrat_test. Either:\n' +
            '  - self-contained:  cd server && yarn test:container   (or yarn test:sandbox)\n' +
            '  - prepared local:  yarn dev, then cd server && yarn initdbtestdock\n');
}
