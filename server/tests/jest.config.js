module.exports = {
    rootDir: '../',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testTimeout: 60000,
    // Default runs are quiet; `yarn test:diag` sets PACKRAT_TEST_VERBOSE=1 to
    // surface console/log output while investigating a category.
    silent: process.env.PACKRAT_TEST_VERBOSE !== '1',
    // collectCoverage: true,
    testMatch: [
        // The complete test suite, on one line, to aid in quick commenting out
        '**/tests/*.test.ts', '**/tests/audit/**/*.test.ts', '**/tests/auth/**', '**/tests/cache/cache.test.ts', '**/tests/collections/*.test.ts', '**/tests/db/**/*.test.ts', '**/tests/graphql/graphql.test.ts', '**/tests/http/**/*.test.ts', '**/tests/integration/**/*.test.ts', '**/tests/metadata/*.test.ts', '**/tests/job/**/*.test.ts', '**/tests/navigation/**/*.test.ts', '**/tests/objectAction/**/*.test.ts', '**/tests/report/**/*.test.ts', '**/tests/storage/**/*.test.ts', '**/tests/utils/**/*.test.ts',
        // dbcreation.test.ts is matched by the tests/db/** glob above and DOES run.

        // Larger test collections, left here to aid in quick, focused testing; these are the elements on the line above:
        // '**/tests/auth/**',
        // '**/tests/cache/cache.test.ts',
        // '**/tests/collections/*.test.ts',
        // '**/tests/db/**/*.test.ts',
        // '**/tests/graphql/graphql.test.ts',
        // '**/tests/metadata/*.test.ts',
        // '**/tests/navigation/**/*.test.ts',
        // '**/tests/storage/**/*.test.ts',
        // '**/tests/utils/**/*.test.ts',
        // '**/tests/http/**/*.test.ts'

        // The "tests/e2e/**" path is reserved for the future real-DB
        // harness. Nothing under tests/e2e/** today — leave the slot open.

        // Individual tests, left here to aid in quick, focused testing:
        // '**/tests/auth/local/login.test.ts',
        // '**/tests/auth/local/logout.test.ts',
        // '**/tests/collections/EdanCollection.test.ts',
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
    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
    moduleNameMapper: { '^axios$': require.resolve('axios'), },
    globalTeardown: '<rootDir>/tests/teardown.ts'
};
