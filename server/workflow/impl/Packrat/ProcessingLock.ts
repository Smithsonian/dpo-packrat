/**
 * Processing lock on a SystemObject row.
 *
 * A Cook (or any long-running workflow) acquires a lock on a Scene or Model
 * SystemObject so concurrent user edits or duplicate workflow runs cannot
 * race the completion write. The lock is a pair of nullable columns on
 * SystemObject (ProcessingLockedBy / ProcessingLockedAt) acquired via a
 * conditional UPDATE: only rows where ProcessingLockedBy IS NULL or whose
 * lock is older than `Config.workflow.processingLockTimeoutMs` can be taken.
 *
 * Releasing is unconditional NULLing of both columns.
 *
 * Design notes:
 *   - Lock taxonomy is per-idSystemObject. The caller is responsible for
 *     resolving Scene.idScene / Model.idModel to the owning idSystemObject
 *     via SystemObjectCache before calling acquire().
 *   - Stale reclaim is cooperative, not transactional: if a process died
 *     mid-workflow the next Cook run reclaims the lock after the timeout
 *     elapses and logs a warning so operators notice the prior failure.
 *   - The helper does NOT participate in withAuditTransaction; the lock
 *     must be acquired BEFORE the business transaction begins, and released
 *     AFTER commit (or after an exceptional path that rolls back). Keeping
 *     lock acquisition outside the tx ensures two racing Cook jobs do not
 *     both hold open tx connections while contending for the same row.
 */
import * as DBC from '../../../db/connection';
import { Config } from '../../../config';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export type AcquireResult =
    | { kind: 'acquired' }
    | { kind: 'reclaimed-stale'; priorLockedBy: number | null; priorLockedAtMs: number }
    | { kind: 'locked'; lockedBy: number | null; lockedAtMs: number };

export class ProcessingLock {
    /**
     * Attempt to acquire a lock on `idSystemObject` for `lockedBy` (user id or
     * 0 for system). Returns:
     *   - acquired: we now hold the lock.
     *   - reclaimed-stale: prior lock existed but was older than the timeout,
     *     so we took it over. A warning is logged so operators can investigate
     *     the prior workflow's crash path.
     *   - locked: a fresh lock holds; acquire failed. The caller should retry
     *     after the lock is released or report the conflict to the user.
     */
    static async acquire(idSystemObject: number, lockedBy: number): Promise<AcquireResult> {
        const now = new Date();
        const staleCutoff = new Date(now.getTime() - Config.workflow.processingLockTimeoutMs);

        // First attempt: take an unlocked row.
        const fresh = await ProcessingLock.tryUpdate(idSystemObject, lockedBy, now, {
            OR: [
                { ProcessingLockedBy: null },
                { ProcessingLockedAt: { lt: staleCutoff } },
            ],
        });
        if (fresh.count === 1) {
            if (fresh.priorLockedBy !== null) {
                RK.logWarning(RK.LogSection.eJOB, 'reclaimed stale processing lock',
                    'prior lock exceeded processingLockTimeoutMs',
                    { idSystemObject, priorLockedBy: fresh.priorLockedBy,
                        priorLockedAtMs: fresh.priorLockedAtMs, nowLockedBy: lockedBy },
                    'Workflow.ProcessingLock');
                return { kind: 'reclaimed-stale',
                    priorLockedBy: fresh.priorLockedBy, priorLockedAtMs: fresh.priorLockedAtMs };
            }
            return { kind: 'acquired' };
        }

        // Contention: fetch the current holder for the caller's diagnostics.
        const so = await DBC.DBConnection.prisma.systemObject.findUnique({
            where: { idSystemObject },
            select: { ProcessingLockedBy: true, ProcessingLockedAt: true },
        });
        return {
            kind: 'locked',
            lockedBy: so?.ProcessingLockedBy ?? null,
            lockedAtMs: so?.ProcessingLockedAt?.getTime() ?? 0,
        };
    }

    /**
     * Release the lock on `idSystemObject`. Always succeeds even if the row
     * wasn't locked — release is idempotent.
     */
    static async release(idSystemObject: number): Promise<void> {
        try {
            await DBC.DBConnection.prisma.systemObject.update({
                where: { idSystemObject },
                data: { ProcessingLockedBy: null, ProcessingLockedAt: null },
            });
        } catch (err) {
            RK.logError(RK.LogSection.eJOB, 'release processing lock failed',
                err instanceof Error ? err.message : String(err),
                { idSystemObject }, 'Workflow.ProcessingLock');
        }
    }

    /** True when the SystemObject row currently holds a non-stale lock. */
    static async isLocked(idSystemObject: number): Promise<boolean> {
        const so = await DBC.DBConnection.prisma.systemObject.findUnique({
            where: { idSystemObject },
            select: { ProcessingLockedBy: true, ProcessingLockedAt: true },
        });
        if (!so || so.ProcessingLockedBy === null || so.ProcessingLockedAt === null)
            return false;
        const ageMs = Date.now() - so.ProcessingLockedAt.getTime();
        return ageMs < Config.workflow.processingLockTimeoutMs;
    }

    private static async tryUpdate(
        idSystemObject: number,
        lockedBy: number,
        now: Date,
        priorWhere: Record<string, unknown>,
    ): Promise<{ count: number; priorLockedBy: number | null; priorLockedAtMs: number }> {
        const prior = await DBC.DBConnection.prisma.systemObject.findUnique({
            where: { idSystemObject },
            select: { ProcessingLockedBy: true, ProcessingLockedAt: true },
        });
        const priorLockedBy = prior?.ProcessingLockedBy ?? null;
        const priorLockedAtMs = prior?.ProcessingLockedAt?.getTime() ?? 0;

        const result = await DBC.DBConnection.prisma.systemObject.updateMany({
            where: { idSystemObject, ...priorWhere },
            data: { ProcessingLockedBy: lockedBy, ProcessingLockedAt: now },
        });
        return { count: result.count, priorLockedBy, priorLockedAtMs };
    }
}
