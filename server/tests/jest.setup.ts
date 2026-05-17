// jest.setup.ts
import { RecordKeeper as RK } from '../records/recordKeeper';
import { NavigationFactory } from '../navigation/interface/NavigationFactory';
import { ASL, LocalStore } from '../utils/localStore';
import { Actor } from '../audit/Actor';

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
});

afterEach(async () => {
    await RK.drainAllQueues();
});

afterAll(async () => {
    NavigationFactory.cleanup();
    await RK.shutdown();
});