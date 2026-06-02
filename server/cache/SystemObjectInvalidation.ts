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
        // Defer to the next event-loop tick so any Prisma transaction that
        // triggered this invalidation has fully closed before we issue our own
        // queries. The audit emit path commonly fires us during the parent
        // transaction's commit window; without this defer the downstream
        // flushObject's findUnique races the transaction shutdown and Prisma
        // rejects with "Transaction already closed: Could not perform
        // operation." setImmediate runs after the current macrotask completes,
        // by which time the wrapping $transaction has resolved. Idempotent
        // with the explicit .then() defer in withAuditTransaction — adding
        // another tick is harmless. Re-throws are still caught and logged.
        setImmediate(() => {
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
        });
    }
}
