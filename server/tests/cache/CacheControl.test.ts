import * as CACHE from '../../cache';

const cacheControlTest = (): void => {
    describe('Cache: CacheControl', () => {
        test('Cache: CacheControl.flushAll', async () => {
            CACHE.CacheControl.flushAll();
            // Nothing to validate!
        });

        test('Cache: CacheControl.clearAll', async () => {
            CACHE.CacheControl.clearAll();
            // Nothing to validate!
        });
    });
};

export default cacheControlTest;
