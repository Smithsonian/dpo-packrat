/**
 * Cache Test suite
 */
import * as DBC from '../../db/connection';

import cacheControlTest from './CacheControl.test';
import vocabularyCacheTest from './VocabularyCache.test';

afterAll(async done => {
    await DBC.DBConnection.disconnect();
    done();
});

describe('Cache Test Suite', () => {
    vocabularyCacheTest();
    cacheControlTest();
});