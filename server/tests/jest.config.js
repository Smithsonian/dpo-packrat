module.exports = {
    rootDir: '../',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testTimeout: 60000,
    // collectCoverage: true,
    testMatch: [
        // The complete test suite, on one line, to aid in quick commenting out
        // '**/tests/auth/**', '**/tests/cache/cache.test.ts', '**/tests/collections/*.test.ts', '**/tests/db/**/*.test.ts', '**/tests/graphql/graphql.test.ts', '**/tests/metadata/*.test.ts', '**/tests/job/**/*.test.ts', '**/tests/navigation/**/*.test.ts', '**/tests/storage/**/*.test.ts', '**/tests/utils/**/*.test.ts',
        // '**/tests/db/dbcreation.test.ts',

        // Larger test collections, left here to aid in quick, focused testing; these are the elements on the line above:
        // '**/tests/auth/**',
        // '**/tests/cache/cache.test.ts',
        // '**/tests/collections/*.test.ts',
        // '**/tests/db/**/*.test.ts',
        // '**/tests/graphql/graphql.test.ts',
        // '**/tests/metadata/*.test.ts'
        // '**/tests/navigation/**/*.test.ts',
        // '**/tests/storage/**/*.test.ts',
        // '**/tests/utils/**/*.test.ts',

        // Needs test cases written:
        // '**/tests/utils/parser/bulkIngestReader.test.ts',

        // Individual tests, left here to aid in quick, focused testing:
        // '**/tests/auth/local/login.test.ts',
        // '**/tests/auth/local/logout.test.ts',
        '**/tests/collections/EdanCollection.test.ts',
        // '**/tests/db/dbcreation.test.ts',
        // '**/tests/db/composite/IngestionSubjectProjectAlgo.test.ts',
        // '**/tests/db/composite/LicenseResolver.test.ts',
        // '**/tests/db/composite/ObjectGraph.test.ts',
        // '**/tests/db/composite/SubjectUnitIdentifier.test.ts',
        // '**/tests/job/impl/JobNS.test.ts',
        // '**/tests/metadata/MetadataExtractor.test.ts',
        // '**/tests/navigation/impl/NavigationDB.test.ts',
        // '**/tests/storage/interface/AssetStorageAdapter.test.ts',
        // '**/tests/storage/impl/LocalStorage/OCFL.test.ts',
        // '**/tests/storage/impl/LocalStorage/LocalStorage.test.ts',
        // '**/tests/utils/email.test.ts',
        // '**/tests/utils/helpers.test.ts',
        // '**/tests/utils/parser/bagitReader.test.ts',
        // '**/tests/utils/parser/bulkIngestReader.test.ts',
        // '**/tests/utils/parser/csvParser.test.ts',
        // '**/tests/utils/parser/svxReader.test.ts',
        // '**/tests/utils/zipFile.test.ts',
        // '**/tests/utils/zipStream.test.ts',
    ],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
    setupFiles: ['<rootDir>/tests/setEnvVars.ts'],
    moduleNameMapper: { '^axios$': require.resolve('axios'), },
    globalTeardown: '<rootDir>/tests/teardown.ts'
};
