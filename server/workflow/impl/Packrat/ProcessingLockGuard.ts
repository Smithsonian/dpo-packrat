/**
 * Guard for user-initiated mutations against SystemObjects currently held by
 * a Cook-style processing lock. Callers opt in from mutation resolvers that
 * would otherwise race a running workflow's completion write.
 *
 * Returns a { success, error } shape so resolvers can surface a clear error
 * without throwing across the GraphQL boundary.
 */
import { ProcessingLock } from './ProcessingLock';

export type GuardResult = { success: true } | { success: false; error: string };

export class ProcessingLockGuard {
    /**
     * Reject when the SystemObject currently holds a non-stale lock. Stale
     * locks are not considered held; they will be reclaimed on the next
     * workflow attempt rather than blocking the user's edit.
     */
    static async check(idSystemObject: number, action: string = 'mutation'): Promise<GuardResult> {
        if (await ProcessingLock.isLocked(idSystemObject))
            return { success: false,
                error: `${action} rejected: SystemObject ${idSystemObject} is currently being processed; retry once the job completes` };
        return { success: true };
    }
}
