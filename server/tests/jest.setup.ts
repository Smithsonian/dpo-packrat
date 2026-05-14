// jest.setup.ts
import { RecordKeeper as RK } from '../records/recordKeeper';
import { NavigationFactory } from '../navigation/interface/NavigationFactory';

beforeEach(async () => {
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