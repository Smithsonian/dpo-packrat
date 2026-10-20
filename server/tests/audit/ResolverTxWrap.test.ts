import { withAuditTransaction } from '../../audit/withAuditTransaction';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Actor } from '../../audit/Actor';
import { withActor } from '../../audit/resolveActor';
import * as DBC from '../../db/connection';
import { SystemObjectInvalidation } from '../../cache/SystemObjectInvalidation';
import rollbackSystemObjectVersion from '../../graphql/schema/systemobject/resolvers/mutations/rollbackSystemObjectVersion';
import { MutationRollbackSystemObjectVersionArgs } from '../../types/graphql';
import { Parent } from '../../types/resolvers';

/**
 * Verifies that resolver-layer mutations route their audit writes through
 * the tx-scoped buffer and flush atomically. The wiring is correctness-
 * critical: a missed wrap means business writes commit while audit rows
 * could fail silently.
 */

type CreateManyFn = jest.Mock<Promise<{ count: number }>, [{ data: unknown[] }]>;

function fakeTx(): { createMany: CreateManyFn; client: DBC.PrismaClientTrans } {
    const createMany: CreateManyFn = jest.fn().mockResolvedValue({ count: 0 });
    return {
        createMany,
        client: { audit: { createMany } } as unknown as DBC.PrismaClientTrans,
    };
}

describe('Resolver-layer withAuditTransaction wraps', () => {
    let setTxSpy: jest.SpyInstance;
    let clearTxSpy: jest.SpyInstance;
    let invalidateSpy: jest.SpyInstance;

    beforeEach(() => {
        setTxSpy = jest.spyOn(DBC.DBConnection, 'setPrismaTransaction').mockResolvedValue(1);
        clearTxSpy = jest.spyOn(DBC.DBConnection, 'clearPrismaTransaction').mockImplementation(() => {});
        invalidateSpy = jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
        void setTxSpy; void clearTxSpy; void invalidateSpy;
    });
    afterEach(() => jest.restoreAllMocks());

    test('emit() inside wrapper buffers; flushes via tx.audit.createMany on commit', async () => {
        const tx = fakeTx();
        jest.spyOn(DBC.DBConnection.prisma as unknown as { $transaction: (...args: unknown[]) => unknown }, '$transaction' as never)
            .mockImplementation(((cb: unknown) => (cb as (t: DBC.PrismaClientTrans) => unknown)(tx.client)) as never);

        await withActor(Actor.user(7), async () => {
            await withAuditTransaction(async () => {
                await AuditFactory.emitSemantic({ action: 100 /* eActionPublish */, idSystemObject: 1, payload: { x: 1 } });
                await AuditFactory.emitSemantic({ action: 102 /* eActionAssignLicense */, idSystemObject: 1, payload: { x: 2 } });
                await AuditFactory.emitSemantic({ action: 110 /* eActionApproveForPublication */, idSystemObject: 1, payload: { x: 3 } });
            });
        });

        expect(tx.createMany).toHaveBeenCalledTimes(1);
        expect(tx.createMany.mock.calls[0][0].data).toHaveLength(3);
    });

    test('thrown error inside wrapper rolls back: createMany never called', async () => {
        const tx = fakeTx();
        const txSpy = jest.spyOn(DBC.DBConnection.prisma as unknown as { $transaction: (...args: unknown[]) => unknown }, '$transaction' as never)
            .mockImplementation(((cb: unknown) => (cb as (t: DBC.PrismaClientTrans) => unknown)(tx.client)) as never);

        await expect(
            withActor(Actor.user(7), async () => {
                await withAuditTransaction(async () => {
                    await AuditFactory.emitSemantic({ action: 100, idSystemObject: 1 });
                    throw new Error('business write failed');
                });
            })
        ).rejects.toThrow('business write failed');

        // The Prisma transaction was opened, but the buffer flushed only if the
        // callback returned successfully. On a thrown error the buffer is
        // discarded (Prisma rolls back).
        expect(txSpy).toHaveBeenCalledTimes(1);
        expect(tx.createMany).not.toHaveBeenCalled();
    });

    test('post-commit invalidation queue runs only after the tx returns', async () => {
        const tx = fakeTx();
        jest.spyOn(DBC.DBConnection.prisma as unknown as { $transaction: (...args: unknown[]) => unknown }, '$transaction' as never)
            .mockImplementation(((cb: unknown) => (cb as (t: DBC.PrismaClientTrans) => unknown)(tx.client)) as never);

        await withActor(Actor.user(7), async () => {
            await withAuditTransaction(async () => {
                await AuditFactory.emitSemantic({ action: 110, idSystemObject: 555 });
                // Inside the tx, invalidate must NOT have fired yet — cache
                // flushing before commit could expose stale rows to readers.
                expect(invalidateSpy).not.toHaveBeenCalled();
            });
        });

        // Once the wrapper returns, queued invalidations fire.
        expect(invalidateSpy).toHaveBeenCalledWith(555);
    });
});

describe('Reason enforcement on rollback', () => {
    // Invoke the REAL rollbackSystemObjectVersion resolver: its rollbackNotes
    // guard returns before any DB/auth work, so these cases are hermetic and
    // exercise the actual product guard (not a copy of it).
    const call = (rollbackNotes: string | null | undefined) =>
        rollbackSystemObjectVersion(
            null as unknown as Parent,
            { input: { idSystemObjectVersion: 1, rollbackNotes, time: null } } as unknown as MutationRollbackSystemObjectVersionArgs);

    test('rollbackNotes enforcement: empty string is rejected', async () => {
        expect(await call('')).toMatchObject({ success: false, message: 'rollbackNotes is required' });
    });
    test('rollbackNotes enforcement: whitespace-only is rejected', async () => {
        expect(await call('   ')).toMatchObject({ success: false, message: 'rollbackNotes is required' });
    });
    test('rollbackNotes enforcement: null and undefined are rejected', async () => {
        expect(await call(null)).toMatchObject({ success: false, message: 'rollbackNotes is required' });
        expect(await call(undefined)).toMatchObject({ success: false, message: 'rollbackNotes is required' });
    });
});
