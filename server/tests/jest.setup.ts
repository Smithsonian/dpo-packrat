// jest.setup.ts
import { RecordKeeper as RK } from '../records/recordKeeper';

beforeEach(() => {
    RK.initialize(RK.SubSystem.LOGGER);
});
