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
    const tmpSandbox: string = path.join(os.tmpdir(), 'packrat-test');
    const varTestSandbox: string = path.resolve('var', 'test'); // the default <server>/var/test

    const setSandboxPaths = (root: string): void => {
        process.env.PACKRAT_OCFL_STORAGE_ROOT = path.join(root, 'Repository');
        process.env.PACKRAT_OCFL_STAGING_ROOT = path.join(root, 'Staging');
        process.env.PACKRAT_EDAN_STAGING_ROOT = path.join(root, 'StagingEdan');
        process.env.PACKRAT_EDAN_RESOURCES_HOTFOLDER = path.join(root, 'StagingEdan');
        process.env.PACKRAT_LOG_ROOT = path.join(root, 'logs');
    };

    beforeAll(() => { for (const k of keys) saved[k] = process.env[k]; });
    afterAll(() => {
        for (const k of keys) {
            if (saved[k] === undefined) delete process.env[k];
            else process.env[k] = saved[k];
        }
    });

    test('accepts an isolated *_test schema with temp-dir sandbox storage', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@host.docker.internal:3306/Packrat_test';
        setSandboxPaths(tmpSandbox);
        expect(() => assertTestSandbox()).not.toThrow();
    });

    test('accepts the default var/test sandbox storage', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@localhost:3306/Packrat_test';
        setSandboxPaths(varTestSandbox);
        expect(() => assertTestSandbox()).not.toThrow();
    });

    test('rejects the production database name', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@host.docker.internal:3306/PackratProduction';
        setSandboxPaths(tmpSandbox);
        expect(() => assertTestSandbox()).toThrow(/refusing to run/);
    });

    test('rejects a non-test schema name', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@host.docker.internal:3306/Packrat';
        setSandboxPaths(tmpSandbox);
        expect(() => assertTestSandbox()).toThrow(/refusing to run/);
    });

    test('rejects a non-local (production) database host', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@si-3dpr01.si.edu:3306/Packrat_test';
        setSandboxPaths(tmpSandbox);
        expect(() => assertTestSandbox()).toThrow(/local test host/);
    });

    test('rejects a missing database name', () => {
        process.env.PACKRAT_DATABASE_URL = '';
        setSandboxPaths(tmpSandbox);
        expect(() => assertTestSandbox()).toThrow(/no database name/);
    });

    test('rejects the real var/Storage repository root', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@host.docker.internal:3306/Packrat_test';
        setSandboxPaths(tmpSandbox);
        process.env.PACKRAT_OCFL_STORAGE_ROOT = path.resolve('var', 'Storage', 'Repository');
        expect(() => assertTestSandbox()).toThrow(/repository storage/);
    });

    test('rejects a non-disposable absolute storage root', () => {
        process.env.PACKRAT_DATABASE_URL = 'mysql://u:p@host.docker.internal:3306/Packrat_test';
        setSandboxPaths(tmpSandbox);
        process.env.PACKRAT_OCFL_STORAGE_ROOT = path.join(path.sep, 'mnt', 'prod', 'Repository');
        expect(() => assertTestSandbox()).toThrow(/disposable test sandbox/);
    });
});
