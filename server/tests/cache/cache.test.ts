/**
 * Cache Test suite
 */
import * as DBC from '../../db/connection';

import cacheControlTest from './CacheControl.test';
import vocabularyCacheTest from './VocabularyCache.test';
import systemObjectCacheTest from './SystemObjectCache.test';
import { EventFactory } from '../../event/interface/EventFactory';

beforeAll(() => {
    EventFactory.getInstance();
});

afterAll(async done => {
    await DBC.DBConnection.disconnect();
    done();
});

describe('Cache Test Suite', () => {
    systemObjectCacheTest();
    vocabularyCacheTest();
    cacheControlTest();
});