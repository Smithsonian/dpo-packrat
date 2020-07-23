module.exports = {
    preset: 'ts-jest',
    collectCoverage: true,
    testEnvironment: 'node',
    testMatch: ['**/tests/db/**/?(*.)+(test).ts', '**/tests/graphql/graphql.test.ts', '**/tests/auth/**'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
    setupFiles: ['<rootDir>/tests/setEnvVars.ts']
};
