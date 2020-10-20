module.exports = {
    rootDir: '.',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/*.test.ts'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/']
};
