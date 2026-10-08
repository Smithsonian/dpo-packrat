import { assertTestSandbox } from './guardrail';
import { sandboxRoot, sandboxPaths } from './sandboxPaths';

process.env.NODE_ENV = 'test';
process.env.PACKRAT_CLIENT_ENDPOINT = 'http://localhost:3000';
process.env.PACKRAT_SESSION_SECRET = 'test-secret';
if (!process.env.PACKRAT_EDAN_AUTH_KEY)
    process.env.PACKRAT_EDAN_AUTH_KEY = 'testing1234';
if (!process.env.PACKRAT_EDAN_SERVER)
    process.env.PACKRAT_EDAN_SERVER = 'https://edan.si.edu/';
if (!process.env.PACKRAT_EDAN_3D_API)
    process.env.PACKRAT_EDAN_3D_API = 'http://console.si.edu/apis/3d-api-dev/';
if (!process.env.PACKRAT_EDAN_APPID)
    process.env.PACKRAT_EDAN_APPID = 'OCIO3D';
if (!process.env.PACKRAT_EDAN_UPSERT_RESOURCE_ROOT)
    process.env.PACKRAT_EDAN_UPSERT_RESOURCE_ROOT = 'nfs:///si-3ddigi-staging/upload/';
if (!process.env.PACKRAT_COOK_SERVER_URL)
    process.env.PACKRAT_COOK_SERVER_URL = 'http://si-3ddigip01.si.edu:8011/';
if (!process.env.PACKRAT_SMTP_HOST)
    process.env.PACKRAT_SMTP_HOST = 'smtp.si.edu';
if (!process.env.PACKRAT_NAVIGATION_TYPE)
    process.env.PACKRAT_NAVIGATION_TYPE = 'db';

// Storage and EDAN staging are pinned to the disposable sandbox (default
// <server>/var/test; see sandboxPaths.ts) — never the repository's ./var/Storage
// roots. These assignments are unconditional so an externally-set (dev/prod) value
// cannot leak through. Export the root so anything else in the worker resolves the
// same location. teardown.ts removes the storage subdirs after the run.
const ROOT: string = sandboxRoot();
process.env.PACKRAT_TEST_SANDBOX_ROOT = ROOT;
const SB = sandboxPaths(ROOT);
process.env.PACKRAT_OCFL_STORAGE_ROOT = SB.repository;
process.env.PACKRAT_OCFL_STAGING_ROOT = SB.staging;
process.env.PACKRAT_EDAN_STAGING_ROOT = SB.edanStaging;
process.env.PACKRAT_EDAN_RESOURCES_HOTFOLDER = SB.edanStaging;

// Logs live in a subdirectory that teardown does NOT delete, so a run's log output
// survives for inspection (CI uploads it on failure). Path is stable across runs
// (winston segments by date).
process.env.PACKRAT_LOG_ROOT = SB.logs;

// The database is pinned to an isolated "Packrat_test" schema, derived from the
// configured connection so it reuses the same host/credentials but never the
// production or dev database. With no configured URL the value is left unset so
// the guardrail aborts rather than guessing a target.
const derivedDatabaseURL: string | undefined = deriveTestDatabaseURL(process.env.PACKRAT_DATABASE_URL);
if (derivedDatabaseURL)
    process.env.PACKRAT_DATABASE_URL = derivedDatabaseURL;

// Refuse to run unless the database and storage targets are isolated sandboxes.
assertTestSandbox();

function deriveTestDatabaseURL(baseURL?: string): string | undefined {
    if (!baseURL)
        return baseURL;
    try {
        const parsed: URL = new URL(baseURL);
        parsed.pathname = '/Packrat_test';
        return parsed.toString();
    } catch {
        return baseURL;
    }
}
