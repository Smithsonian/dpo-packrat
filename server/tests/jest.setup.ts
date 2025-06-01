// jest.setup.ts
import { RecordKeeper as RK } from '../records/recordKeeper';
import { EventFactory } from '../event/interface/EventFactory';

beforeEach(async () => {
    // initialize our logger for all tests
    await RK.initialize(RK.SubSystem.LOGGER);

    // initialize event engine for all tests
    EventFactory.getInstance().then( engine => {
        engine?.initialize().then( result => {
            if(!result)
                RK.logCritical(RK.LogSection.eEVENT,'cannot initialize');
            else if(result.success===false)
                RK.logCritical(RK.LogSection.eEVENT,'cannot initialize',result.message);
         })
    })
});

afterEach(async () => {
    await RK.drainAllQueues();
});
