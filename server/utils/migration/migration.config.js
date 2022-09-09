module.exports = {
    rootDir: '../../',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testTimeout: 14400000,
    // collectCoverage: true,
    testMatch: [
        '**/utils/migration/SceneMigration.test.ts',
    ],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
    setupFiles: ['<rootDir>/tests/setEnvVars.ts']
};
