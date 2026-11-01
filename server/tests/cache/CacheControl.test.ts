import * as CACHE from '../../cache';
import { LicenseCache } from '../../cache/LicenseCache';
import { SystemObjectCache } from '../../cache/SystemObjectCache';
import { UserCache } from '../../cache/UserCache';
import { VocabularyCache } from '../../cache/VocabularyCache';

// CacheControl is a thin orchestrator: its contract is that flushAll/clearAll
// delegate to EVERY registered cache (the "keep this list in sync" comments).
// These tests assert that delegation so a cache added without wiring it into
// both methods is caught.
const cacheControlTest = (): void => {
    describe('Cache: CacheControl', () => {
        afterEach(() => jest.restoreAllMocks());

        test('Cache: CacheControl.flushAll flushes every registered cache', async () => {
            const spies: jest.SpyInstance[] = [
                jest.spyOn(LicenseCache, 'flush').mockResolvedValue(undefined),
                jest.spyOn(SystemObjectCache, 'flush').mockResolvedValue(undefined),
                jest.spyOn(UserCache, 'flush').mockResolvedValue(undefined),
                jest.spyOn(VocabularyCache, 'flush').mockResolvedValue(undefined),
            ];
            await CACHE.CacheControl.flushAll();
            for (const spy of spies)
                expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Cache: CacheControl.clearAll clears every registered cache', async () => {
            const spies: jest.SpyInstance[] = [
                jest.spyOn(LicenseCache, 'clear').mockResolvedValue(undefined),
                jest.spyOn(SystemObjectCache, 'clear').mockResolvedValue(undefined),
                jest.spyOn(UserCache, 'clear').mockResolvedValue(undefined),
                jest.spyOn(VocabularyCache, 'clear').mockResolvedValue(undefined),
            ];
            await CACHE.CacheControl.clearAll();
            for (const spy of spies)
                expect(spy).toHaveBeenCalledTimes(1);
        });
    });
};

export default cacheControlTest;
