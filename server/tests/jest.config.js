module.exports = {
    rootDir: '../',
    preset: 'ts-jest',
    testEnvironment: 'node',
    // collectCoverage: true,
    testMatch: [
        // The complete test suite, on one line, to aid in quick commenting out
        '**/tests/db/**/?(*.)+(test).ts', '**/tests/graphql/graphql.test.ts', '**/tests/auth/**', '**/tests/cache/cache.test.ts', '**/tests/utils/**/*.test.ts', '**/tests/collections/*.test.ts', '**/tests/storage/**/*.test.ts', '**/tests/parser/*.test.ts',

        // Larger test collections, left here to aid in quick, focused testing; these are the elements on the line above:
        // '**/tests/db/**/?(*.)+(test).ts',
        // '**/tests/graphql/graphql.test.ts',
        // '**/tests/auth/**',
        // '**/tests/cache/cache.test.ts',
        // '**/tests/utils/**/*.test.ts',
        // '**/tests/collections/*.test.ts',
        // '**/tests/storage/**/*.test.ts',
        // '**/tests/parser/*.test.ts',

        // Individual tests, left here to aid in quick, focused testing:
        // '**/tests/utils/zipFile.test.ts',
        // '**/tests/utils/zipStream.test.ts',
        // '**/tests/utils/parser/bagitReader.test.ts',
        // '**/tests/utils/helpers.test.ts',
        // '**/tests/storage/interface/AssetStorageAdapter.test.ts',
        // '**/tests/storage/impl/LocalStorage/OCFL.test.ts',
        // '**/tests/storage/impl/LocalStorage/LocalStorage.test.ts',
        // '**/tests/collections/EdanCollection.test.ts',
        // '**/tests/db/dbcreation.test.ts',
    ],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
    setupFiles: ['<rootDir>/tests/setEnvVars.ts']
};
