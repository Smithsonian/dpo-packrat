import { ProcessingLock } from '../../workflow/impl/Packrat/ProcessingLock';
import { ProcessingLockGuard } from '../../workflow/impl/Packrat/ProcessingLockGuard';
import { Config } from '../../config';
import * as DBC from '../../db/connection';

/**
 * In-memory SystemObject row; shape mirrors the columns the ProcessingLock
 * helper reads/writes.
 */
type Row = {
    idSystemObject: number;
    ProcessingLockedBy: number | null;
    ProcessingLockedAt: Date | null;
};

/**
 * Minimal prisma.systemObject mock with the four call shapes the helper uses:
 * findUnique (select lock columns), updateMany (conditional acquire),
 * update (unconditional release).
 */
function makeStore(initial: Row[]) {
    const rows = new Map<number, Row>(initial.map(r => [r.idSystemObject, { ...r }]));

    const findUnique = jest.fn(async ({ where }: { where: { idSystemObject: number } }) => {
        const row = rows.get(where.idSystemObject);
        if (!row) return null;
        return { ProcessingLockedBy: row.ProcessingLockedBy, ProcessingLockedAt: row.ProcessingLockedAt };
    });

    const updateMany = jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const row = rows.get(where.idSystemObject as number);
        if (!row) return { count: 0 };
        const lockedByClause = (where.OR as Array<Record<string, unknown>>)?.find(o => 'ProcessingLockedBy' in o);
        const staleClause = (where.OR as Array<Record<string, unknown>>)?.find(o => 'ProcessingLockedAt' in o);

        let matches = false;
        if (lockedByClause && row.ProcessingLockedBy === null) matches = true;
        if (staleClause) {
            const cutoff = ((staleClause.ProcessingLockedAt as { lt: Date }).lt);
            if (row.ProcessingLockedAt && row.ProcessingLockedAt < cutoff) matches = true;
        }
        if (!matches) return { count: 0 };

        row.ProcessingLockedBy = data.ProcessingLockedBy as number | null;
        row.ProcessingLockedAt = data.ProcessingLockedAt as Date | null;
        return { count: 1 };
    });

    const update = jest.fn(async ({ where, data }: { where: { idSystemObject: number }; data: Record<string, unknown> }) => {
        const row = rows.get(where.idSystemObject);
        if (row) {
            row.ProcessingLockedBy = data.ProcessingLockedBy as number | null;
            row.ProcessingLockedAt = data.ProcessingLockedAt as Date | null;
        }
        return row ?? { idSystemObject: where.idSystemObject, ProcessingLockedBy: null, ProcessingLockedAt: null };
    });

    return { rows, findUnique, updateMany, update };
}

describe('ProcessingLock', () => {
    let store: ReturnType<typeof makeStore>;

    beforeEach(() => {
        store = makeStore([
            { idSystemObject: 1, ProcessingLockedBy: null, ProcessingLockedAt: null },
            { idSystemObject: 2, ProcessingLockedBy: 5, ProcessingLockedAt: new Date() },
            {
                idSystemObject: 3, ProcessingLockedBy: 7,
                ProcessingLockedAt: new Date(Date.now() - Config.workflow.processingLockTimeoutMs - 60_000),
            },
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (DBC.DBConnection.prisma as any).systemObject = {
            findUnique: store.findUnique,
            updateMany: store.updateMany,
            update: store.update,
        };
    });

    test('acquires a lock on an unlocked row', async () => {
        const result = await ProcessingLock.acquire(1, 42);
        expect(result.kind).toBe('acquired');
        expect(store.rows.get(1)?.ProcessingLockedBy).toBe(42);
        expect(store.rows.get(1)?.ProcessingLockedAt).toBeInstanceOf(Date);
    });

    test('rejects when a fresh lock is held by another user', async () => {
        const result = await ProcessingLock.acquire(2, 42);
        expect(result.kind).toBe('locked');
        if (result.kind === 'locked') {
            expect(result.lockedBy).toBe(5);
            expect(result.lockedAtMs).toBeGreaterThan(0);
        }
        // Row untouched.
        expect(store.rows.get(2)?.ProcessingLockedBy).toBe(5);
    });

    test('reclaims a stale lock and logs', async () => {
        const result = await ProcessingLock.acquire(3, 99);
        expect(result.kind).toBe('reclaimed-stale');
        if (result.kind === 'reclaimed-stale') {
            expect(result.priorLockedBy).toBe(7);
            expect(result.priorLockedAtMs).toBeGreaterThan(0);
        }
        expect(store.rows.get(3)?.ProcessingLockedBy).toBe(99);
    });

    test('release clears both columns idempotently', async () => {
        await ProcessingLock.acquire(1, 42);
        await ProcessingLock.release(1);
        expect(store.rows.get(1)?.ProcessingLockedBy).toBeNull();
        expect(store.rows.get(1)?.ProcessingLockedAt).toBeNull();
        // Second release is a no-op, must not throw.
        await expect(ProcessingLock.release(1)).resolves.toBeUndefined();
    });

    test('isLocked is true only for non-stale locks', async () => {
        expect(await ProcessingLock.isLocked(1)).toBe(false); // unlocked
        expect(await ProcessingLock.isLocked(2)).toBe(true);  // fresh lock
        expect(await ProcessingLock.isLocked(3)).toBe(false); // stale lock treated as unlocked
    });
});

describe('ProcessingLockGuard', () => {
    let store: ReturnType<typeof makeStore>;

    beforeEach(() => {
        store = makeStore([
            { idSystemObject: 1, ProcessingLockedBy: null, ProcessingLockedAt: null },
            { idSystemObject: 2, ProcessingLockedBy: 5, ProcessingLockedAt: new Date() },
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (DBC.DBConnection.prisma as any).systemObject = {
            findUnique: store.findUnique,
            updateMany: store.updateMany,
            update: store.update,
        };
    });

    test('allows a mutation on an unlocked SystemObject', async () => {
        const result = await ProcessingLockGuard.check(1, 'updateScene');
        expect(result.success).toBe(true);
    });

    test('blocks a mutation on a locked SystemObject with a clear error', async () => {
        const result = await ProcessingLockGuard.check(2, 'updateScene');
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toMatch(/updateScene rejected/);
    });
});
