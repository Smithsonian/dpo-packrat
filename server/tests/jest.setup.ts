// jest.setup.ts
import { RecordKeeper as RK } from '../records/recordKeeper';
import { NavigationFactory } from '../navigation/interface/NavigationFactory';
import { ASL, LocalStore } from '../utils/localStore';
import { Actor } from '../audit/Actor';
import * as DBC from '../db/connection';
import { Logger } from '../records/logger/log';
import { installLogGate, assertNoUnexpectedLogs, mergeCapturedIntoBaseline, BASELINE_WRITE_MODE } from './logGate';

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

    // Honesty gate: after the file's logs have flushed, either seed the ratchet
    // baseline (write mode) or fail the file on any error/critical emitted by a
    // caller not in the baseline.
    if (BASELINE_WRITE_MODE)
        mergeCapturedIntoBaseline();
    else
        assertNoUnexpectedLogs(expect.getState().testPath ?? 'unknown');
});