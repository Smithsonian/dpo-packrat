// Parity lane (TR-15a): golden-record baselines for migration cutover validation.
// Reuses the standard test harness (sandbox env, log/assertion gates, teardown)
// but only runs tests/parity/**. Invoked via `yarn test:parity` (assert) and
// `yarn test:parity:bless` (PACKRAT_PARITY_BLESS=1, write baselines).
module.exports = {
    rootDir: '../',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testTimeout: 60000,
    silent: process.env.PACKRAT_TEST_VERBOSE !== '1',
    testMatch: ['**/tests/parity/**/*.parity.test.ts'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
    setupFiles: ['<rootDir>/tests/setEnvVars.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
    moduleNameMapper: { '^axios$': require.resolve('axios'), },
    globalSetup: '<rootDir>/tests/globalSetup.ts',
    globalTeardown: '<rootDir>/tests/teardown.ts'
};
