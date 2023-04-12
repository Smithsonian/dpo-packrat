/**
 * Cache Test suite
 */
import cacheControlTest from './CacheControl.test';
import licenseCacheTest from './LicenseCacheTest.test';
import systemObjectCacheTest from './SystemObjectCache.test';
import userCacheTest from './UserCacheTest.test';
import vocabularyCacheTest from './VocabularyCache.test';
import { EventFactory } from '../../event/interface/EventFactory';

beforeAll(() => {
    EventFactory.getInstance();
});

describe('Cache Test Suite', () => {
    licenseCacheTest();
    systemObjectCacheTest();
    userCacheTest();
    vocabularyCacheTest();
    cacheControlTest();
});