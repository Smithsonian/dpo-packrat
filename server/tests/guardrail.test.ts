import { assertTestSandbox } from './guardrail';
import * as os from 'os';
import * as path from 'path';

describe('test isolation guardrail', () => {
    const keys: string[] = [
        'PACKRAT_DATABASE_URL',
        'PACKRAT_OCFL_STORAGE_ROOT',
        'PACKRAT_OCFL_STAGING_ROOT',
        'PACKRAT_EDAN_STAGING_ROOT',
        'PACKRAT_EDAN_RESOURCES_HOTFOLDER',
        'PACKRAT_LOG_ROOT',
    ];
    const saved: Record<string, string | undefined> = {};
    const sandbox: string = path.join(os.tmpdir(), 'packrat-test');

    const setSandboxPaths = (): void => {
        process.env.PACKRAT_OCFL_STORAGE_ROOT = path.join(sandbox, 'Repository');
        process.env.PACKRAT_OCFL_STAGING_ROOT = path.join(sandbox, 'Staging');
        process.env.PACKRAT_EDAN_STAGING_ROOT = path.join(sandbox, 'StagingEdan');
        process.env.PACKRAT_EDAN_RESOURCES_HOTFOLDER = path.join(sandbox, 'StagingEdan');
        process.env.PACKRAT_LOG_ROOT = path.join(sandbox, 'logs');
    };

    beforeAll(() => { for (const k of keys) saved[k] = process.env[k]; });
    afterAll(() => {
        for (const k of keys) {
            if (saved[k] === undefined) delete process.env[k];
            else process.env[k] = saved[k];
        }
    });

    test('accepts an isolated *_test schema with sandbox storage', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@host.docker.internal:3306/Packrat_test';
        setSandboxPaths();
        expect(() => assertTestSandbox()).not.toThrow();
    });

    test('rejects the production database name', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@host.docker.internal:3306/PackratProduction';
        setSandboxPaths();
        expect(() => assertTestSandbox()).toThrow(/refusing to run/);
    });

    test('rejects a non-test schema name', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@host.docker.internal:3306/Packrat';
        setSandboxPaths();
        expect(() => assertTestSandbox()).toThrow(/refusing to run/);
    });

    test('rejects a non-local (production) database host', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@si-3dpr01.si.edu:3306/Packrat_test';
        setSandboxPaths();
        expect(() => assertTestSandbox()).toThrow(/local test host/);
    });

    test('rejects a missing database name', () => {
        process.env.PACKRAT_DATABASE_URL = '';
        setSandboxPaths();
        expect(() => assertTestSandbox()).toThrow(/no database name/);
    });

    test('rejects a storage root outside the temp sandbox', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@host.docker.internal:3306/Packrat_test';
        setSandboxPaths();
        process.env.PACKRAT_OCFL_STORAGE_ROOT = './var/Storage/Repository';
        expect(() => assertTestSandbox()).toThrow(/temp sandbox/);
    });
});
