module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // collectCoverage: true,
    testMatch: [
        '**/tests/db/**/?(*.)+(test).ts',
        '**/tests/graphql/graphql.test.ts',
        '**/tests/auth/**',
        '**/tests/cache/cache.test.ts',
        '**/tests/utils/*.test.ts',
        '**/tests/collections/*.test.ts',
        '**/tests/storage/**/*.test.ts',
        '**/tests/parser/*.test.ts'
    ],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
    setupFiles: ['<rootDir>/tests/setEnvVars.ts']
};
