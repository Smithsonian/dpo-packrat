import * as os from 'os';
import * as path from 'path';

// The test suite is destructive (it creates/updates/deletes rows and writes
// files), so it may only ever target an isolated, disposable test schema whose
// name carries the test suffix, and disposable storage under the OS temp dir.
const TEST_DB_SUFFIX: string = '_test';
const PROTECTED_DB_NAMES: string[] = ['PackratProduction', 'PackratStaging', 'Packrat'];

// The database must live on a local/disposable host — never a shared or
// production server. This blocks the suite from reaching a real server even if
// a *_test schema happened to exist there.
const LOCAL_DB_HOSTS: string[] = ['localhost', '127.0.0.1', '::1', 'host.docker.internal', 'packrat-db'];

// Every storage/log root must resolve to a disposable test location: under the OS
// temp dir, or inside a directory named "test" (the default <server>/var/test
// sandbox). Never the real repository storage tree (var/Storage).
const SANDBOX_PATH_VARS: string[] = [
    'PACKRAT_OCFL_STORAGE_ROOT',
    'PACKRAT_OCFL_STAGING_ROOT',
    'PACKRAT_EDAN_STAGING_ROOT',
    'PACKRAT_EDAN_RESOURCES_HOTFOLDER',
    'PACKRAT_LOG_ROOT',
];

// True if the resolved path sits under the real repository storage tree
// (…/var/Storage/…) — the one location the destructive suite must never touch.
function isRealStoragePath(resolved: string): boolean {
    const segs: string[] = resolved.split(path.sep);
    for (let i = 0; i + 1 < segs.length; i++)
        if (segs[i] === 'var' && segs[i + 1] === 'Storage')
            return true;
    return false;
}

// True if the resolved path is a disposable test location: under the OS temp dir,
// or inside a directory named "test" (case-insensitive). A real server storage
// root (an absolute path with neither property) is therefore rejected.
function isDisposableTestPath(resolved: string): boolean {
    if (resolved.startsWith(path.resolve(os.tmpdir())))
        return true;
    return resolved.split(path.sep).some(s => s.toLowerCase() === 'test');
}

function databaseName(databaseURL: string): string | null {
    try {
        const parsed: URL = new URL(databaseURL);
        const name: string = parsed.pathname.replace(/^\//, '').trim();
        return name.length > 0 ? name : null;
    } catch {
        return null;
    }
}

function databaseHost(databaseURL: string): string | null {
    try {
        const host: string = new URL(databaseURL).hostname.toLowerCase().trim();
        return host.length > 0 ? host : null;
    } catch {
        return null;
    }
}

// Aborts before any DB connection or disk write unless both the database and
// the storage roots point at isolated test sandboxes. A misconfigured run
// (e.g. a prod/dev connection string in the environment) fails here instead of
// touching real data.
export function assertTestSandbox(): void {
    const databaseURL: string = process.env.PACKRAT_DATABASE_URL ?? '';
    const dbName: string | null = databaseName(databaseURL);

    if (!dbName)
        throw new Error('[test-guardrail] PACKRAT_DATABASE_URL has no database name; refusing to run tests.');
    if (PROTECTED_DB_NAMES.includes(dbName) || !dbName.endsWith(TEST_DB_SUFFIX))
        throw new Error(`[test-guardrail] database "${dbName}" is not an isolated *${TEST_DB_SUFFIX} schema; refusing to run tests.`);

    const dbHost: string | null = databaseHost(databaseURL);
    if (!dbHost || !LOCAL_DB_HOSTS.includes(dbHost))
        throw new Error(`[test-guardrail] database host "${dbHost}" is not a local test host (${LOCAL_DB_HOSTS.join(', ')}); refusing to run tests. Point tests at a LOCAL database, never a shared/prod server.`);

    for (const key of SANDBOX_PATH_VARS) {
        const value: string = process.env[key] ?? '';
        if (value.length === 0)
            throw new Error(`[test-guardrail] ${key} is empty; refusing to run tests.`);
        const resolved: string = path.resolve(value);
        if (isRealStoragePath(resolved))
            throw new Error(`[test-guardrail] ${key}="${value}" points at the real repository storage (var/Storage); refusing to run tests.`);
        if (!isDisposableTestPath(resolved))
            throw new Error(`[test-guardrail] ${key}="${value}" is not a disposable test sandbox (must be under the OS temp dir or inside a "test" directory); refusing to run tests.`);
    }
}
