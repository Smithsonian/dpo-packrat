// jest.setup.ts
import { RecordKeeper as RK } from '../records/recordKeeper';
import { NavigationFactory } from '../navigation/interface/NavigationFactory';
import { ASL, LocalStore } from '../utils/localStore';
import { Actor } from '../audit/Actor';
import * as DBC from '../db/connection';
import { Logger } from '../records/logger/log';
import { installLogGate, assertNoUnexpectedLogs, mergeCapturedIntoBaseline, BASELINE_WRITE_MODE,
    installAssertionCounter, noteTestAssertionBoundary, reportAssertionCoverage, assertNoZeroAssertionTests } from './logGate';

// In tests the logger's environment resolves to DEVELOPMENT, which adds a winston
// console transport that floods stdout (and bypasses jest's `silent`). Keep run
// output clean by default — logs still go to the file and the in-memory gate.
// `yarn test:diag` (PACKRAT_TEST_VERBOSE=1) keeps the console for debugging.
const TEST_VERBOSE: boolean = process.env.PACKRAT_TEST_VERBOSE === '1';

// Install the log honesty gate at module load — before any test emits — so
// error/critical logs raised during import or in a test are captured. See
// logGate.ts. Each test file runs in its own module registry, so the gate and
// its capture buffer are fresh per file.
installLogGate();

// Install the report-only assertion-count gate (TR-0.8). Wraps the global expect
// to count assertions per file/test; writes a vacuous-test inventory in afterAll.
// Never fails the run — enforcement is a later flip.
installAssertionCounter();

// Establish a LocalStore carrying a system Actor for every test so DB CRUD
// audit emits (DBObject.create/update/delete) can attribute their rows.
// Without this, AuditFactory.audit() logs "no Actor on LocalStore" for every
// mutation and refuses to write. ASL.enterWith() must be re-applied in
// beforeEach since it does not propagate reliably across Jest's async boundaries.
// Reset .actor each time too: withActor() mutates the existing LS's actor in
// place, so the previous test's actor would otherwise leak forward.
//
// Use a fixed correlation id rather than uuidv4() — uuid's crypto.randomBytes
// call lingers as an open handle that Jest flags on exit.
const testLS = new LocalStore(true, null);
testLS.correlationId = 'jest-test-correlation';

beforeAll(() => {
    testLS.actor = Actor.system('JestTest');
    ASL.enterWith(testLS);
});

beforeEach(async () => {
    testLS.actor = Actor.system('JestTest');
    ASL.enterWith(testLS);
    // initialize our logger for all tests
    await RK.initialize(RK.SubSystem.LOGGER);
    if (!TEST_VERBOSE)
        Logger.suppressConsole();
});

afterEach(async () => {
    // Record whether the just-finished test made any assertion (report-only gate).
    const st: { currentTestName?: string; assertionCalls?: number } = expect.getState();
    const jestCalls: number | null = typeof st.assertionCalls === 'number' ? st.assertionCalls : null;
    noteTestAssertionBoundary(st.currentTestName ?? '', jestCalls);
    await RK.drainAllQueues();
});

afterAll(async () => {
    NavigationFactory.cleanup();
    await RK.drainAllQueues();
    await RK.shutdown();
    // Disconnect Prisma in this worker. globalTeardown runs in a separate
    // process, so without this the worker's connection stays open and keeps the
    // process alive (the reason the suite needed --forceExit).
    await DBC.DBConnection.disconnect();

    // End the persistent exiftool-vendored child process (a stay_open batch process
    // the image extractor spawns); otherwise it keeps the worker alive and the run
    // needs --forceExit. Only files that initialized it pay the cost; a later file
    // re-spawns lazily via the extractor's own retry. Loaded dynamically (as in prod).
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const em = require('../metadata/ExtractorImageExiftool');
        const cls = em && em.ExtractorImageExiftool;
        if (cls && cls.exiftoolInit === true) {
            await cls.exiftool.end();
            cls.exiftool = new cls.exiftool.constructor();
            cls.exiftoolInit = false;
        }
    } catch { /* extractor not loaded in this file */ }

    // Assertion-count gate: append this file's coverage to the run inventory
    // before any gate throws.
    const testPath: string = expect.getState().testPath ?? 'unknown';
    reportAssertionCoverage(testPath);

    // Honesty gate + assertion-count gate: after the file's logs have flushed,
    // either seed the ratchet baseline (write mode, no enforcement) or fail the
    // file on a zero-assertion test / an error-critical from a non-baselined caller.
    if (BASELINE_WRITE_MODE) {
        mergeCapturedIntoBaseline();
    } else {
        assertNoZeroAssertionTests(testPath);
        assertNoUnexpectedLogs(testPath);
    }
});