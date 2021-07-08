/**
 * Cache Test suite
 */
import * as DBC from '../../db/connection';

import cacheControlTest from './CacheControl.test';
import licenseCacheTest from './LicenseCacheTest.test';
import systemObjectCacheTest from './SystemObjectCache.test';
import userCacheTest from './UserCacheTest.test';
import vocabularyCacheTest from './VocabularyCache.test';
import { EventFactory } from '../../event/interface/EventFactory';

beforeAll(() => {
    EventFactory.getInstance();
});

afterAll(async done => {
    await DBC.DBConnection.disconnect();
    done();
});

describe('Cache Test Suite', () => {
    licenseCacheTest();
    systemObjectCacheTest();
    userCacheTest();
    vocabularyCacheTest();
    cacheControlTest();
});