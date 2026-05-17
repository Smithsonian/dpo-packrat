/**
 * Direct cache-flush + Solr-reindex helper invoked after a SystemObject-visible
 * DB mutation. Replaces the side-effects that used to ride the eDB event-consumer
 * path. Callers own the fire-and-forget lifetime.
 */
import * as NAV from '../navigation/interface';
import { SystemObjectCache } from './SystemObjectCache';
import { RecordKeeper as RK } from '../records/recordKeeper';

export class SystemObjectInvalidation {
    /**
     * Flush the SystemObject cache entry and schedule a Solr reindex for the
     * supplied idSystemObject. Safe to call with null/undefined — no-op.
     *
     * Any thrown error is logged and swallowed; invalidation is best-effort and
     * must not fail business writes.
     */
    static invalidate(idSystemObject: number | null | undefined): void {
        if (!idSystemObject) return;
        try {
            // flushObject is fire-and-forget by design
            void SystemObjectCache.flushObject(idSystemObject);
            NAV.NavigationFactory.scheduleObjectIndexing(idSystemObject);
        } catch (err) {
            RK.logError(RK.LogSection.eCACHE,
                'SystemObject invalidation failed',
                err instanceof Error ? err.message : String(err),
                { idSystemObject },
                'Cache.SystemObjectInvalidation');
        }
    }
}
