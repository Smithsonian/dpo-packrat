import * as path from 'path';

// Single source of truth for the disposable test sandbox location.
//
// Default: <server>/var/test — co-located with the app's var/ tree (which has
// ample space; some environments have little room under the OS temp dir). Override
// with PACKRAT_TEST_SANDBOX_ROOT for a machine that wants it elsewhere.
//
// globalSetup/globalTeardown run in a SEPARATE process from setupFiles, so each
// derives the root the same way here rather than relying on an env var that only
// setEnvVars.ts sets inside the worker. server/var is already gitignored.
export function sandboxRoot(): string {
    const override: string | undefined = process.env.PACKRAT_TEST_SANDBOX_ROOT;
    if (override && override.trim().length > 0)
        return path.resolve(override);
    return path.resolve(__dirname, '..', 'var', 'test');
}

export interface SandboxPaths {
    root: string;
    repository: string;
    staging: string;
    edanStaging: string;
    logs: string;
}

export function sandboxPaths(root: string = sandboxRoot()): SandboxPaths {
    return {
        root,
        repository: path.join(root, 'Repository'),
        staging: path.join(root, 'Staging'),
        edanStaging: path.join(root, 'StagingEdan'),
        logs: path.join(root, 'logs'),
    };
}
