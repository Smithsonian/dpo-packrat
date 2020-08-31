module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
    setupFiles: ['<rootDir>/tests/setEnvVars.ts'],

    // collectCoverage: true,
    testMatch: ['**/tests/db/**/?(*.)+(test).ts', '**/tests/graphql/graphql.test.ts', '**/tests/auth/**', '**/tests/cache/cache.test.ts', '**/tests/utils/*.test.ts', '**/tests/collections/*.test.ts', '**/tests/storage/**/*.test.ts'],

    // testMatch: ['**/tests/storage/interface/AssetStorageAdapter.test.ts'],
    // testMatch: ['**/tests/cache/cache.test.ts'],
    // testMatch: ['**/tests/storage/**/*.test.ts'],
    // testMatch: ['**/tests/storage/impl/LocalStorage/*.test.ts'],
    // testMatch: ['**/tests/storage/impl/LocalStorage/OCFL.test.ts'],
    // testMatch: ['**/tests/utils/helpers.test.ts'],

    // testMatch: ['**/tests/db/**/?(*.)+(test).ts'],
    // testMatch: ['**/tests/graphql/graphql.test.ts'],
    // testMatch: ['**/tests/auth/**'],
    // testMatch: ['**/tests/cache/cache.test.ts'],
    // testMatch: ['**/tests/utils/*.test.ts'],
    // testMatch: ['**/tests/collections/*.test.ts'],
    // testMatch: ['**/tests/storage/**/*.test.ts'],
};
