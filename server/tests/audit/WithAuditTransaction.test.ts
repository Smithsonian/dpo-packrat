import { Prisma } from '@prisma/client';
import { withAuditTransaction } from '../../audit/withAuditTransaction';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Actor } from '../../audit/Actor';
import { withActor } from '../../audit/resolveActor';
import { eAuditType } from '../../db/api/ObjectType';
import * as DBC from '../../db/connection';
import { SystemObjectInvalidation } from '../../cache/SystemObjectInvalidation';
import { RecordKeeper as RK } from '../../records/recordKeeper';

type CreateManyFn = jest.Mock<Promise<{ count: number }>, [{ data: unknown[] }]>;

function fakeTx() {
    const createMany: CreateManyFn = jest.fn().mockResolvedValue({ count: 0 });
    return {
        createMany,
        client: { audit: { createMany } } as unknown as DBC.PrismaClientTrans,
    };
}

describe('withAuditTransaction wrapper', () => {
    let $transactionSpy: jest.SpyInstance;
    let setTxSpy: jest.SpyInstance;
    let clearTxSpy: jest.SpyInstance;
    let invalidateSpy: jest.SpyInstance;

    beforeEach(() => {
        setTxSpy = jest.spyOn(DBC.DBConnection, 'setPrismaTransaction').mockResolvedValue(1);
        clearTxSpy = jest.spyOn(DBC.DBConnection, 'clearPrismaTransaction').mockImplementation(() => {});
        invalidateSpy = jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    test('flushes buffered audit rows atomically via tx.audit.createMany', async () => {
        const tx = fakeTx();
        $transactionSpy = jest.spyOn(DBC.DBConnection.prisma as unknown as { $transaction: (...args: unknown[]) => unknown }, '$transaction' as never).mockImplementation(
            ((cb: unknown) => (cb as (t: DBC.PrismaClientTrans) => unknown)(tx.client)) as never
        );

        await withActor(Actor.user(5), async () => {
            await withAuditTransaction(async () => {
                await AuditFactory.emit({ action: eAuditType.eDBUpdate, actor: Actor.user(5) });
                await AuditFactory.emit({ action: eAuditType.eDBCreate, actor: Actor.user(5) });
            });
        });

        expect($transactionSpy).toHaveBeenCalledTimes(1);
        expect(tx.createMany).toHaveBeenCalledTimes(1);
        expect(tx.createMany.mock.calls[0][0].data).toHaveLength(2);
        expect(setTxSpy).toHaveBeenCalledTimes(1);
        expect(clearTxSpy).toHaveBeenCalledTimes(1);
    });

    test('audit buffer flush failure rolls back the whole tx', async () => {
        const tx = fakeTx();
        tx.createMany.mockRejectedValueOnce(new Error('flush boom'));
        jest.spyOn(DBC.DBConnection.prisma as unknown as { $transaction: (...args: unknown[]) => unknown }, '$transaction' as never).mockImplementation(
            ((cb: unknown) => (cb as (t: DBC.PrismaClientTrans) => unknown)(tx.client)) as never
        );
        await expect(withActor(Actor.user(5), () => withAuditTransaction(async () => {
            await AuditFactory.emit({ action: eAuditType.eDBUpdate, actor: Actor.user(5) });
        }))).rejects.toThrow('flush boom');
        expect(invalidateSpy).not.toHaveBeenCalled(); // post-commit hook never runs on failure
    });

    test('retries up to Config.txDeadlockRetries on P2034', async () => {
        const tx = fakeTx();
        const p2034 = new Prisma.PrismaClientKnownRequestError('deadlock', {
            code: 'P2034', clientVersion: '4.8.1'
        });
        const sp = jest.spyOn(DBC.DBConnection.prisma as unknown as { $transaction: (...args: unknown[]) => unknown }, '$transaction' as never)
            .mockRejectedValueOnce(p2034 as never)
            .mockRejectedValueOnce(p2034 as never)
            .mockImplementation(
                ((cb: unknown) => (cb as (t: DBC.PrismaClientTrans) => unknown)(tx.client)) as never
            );
        const logSpy = jest.spyOn(RK, 'logWarning').mockResolvedValue({ success: true, message: '' });

        const result = await withActor(Actor.user(5), () =>
            withAuditTransaction(async () => 'ok', { maxRetries: 3 })
        );
        expect(result).toBe('ok');
        expect(sp).toHaveBeenCalledTimes(3);
        expect(logSpy).toHaveBeenCalled();
    });

    test('surfaces errors that are not deadlocks without retry', async () => {
        const sp = jest.spyOn(DBC.DBConnection.prisma as unknown as { $transaction: (...args: unknown[]) => unknown }, '$transaction' as never)
            .mockRejectedValue(new Error('not a deadlock') as never);
        await expect(withActor(Actor.user(5), () =>
            withAuditTransaction(async () => 'ok')
        )).rejects.toThrow('not a deadlock');
        expect(sp).toHaveBeenCalledTimes(1);
    });

    test('drains invalidationQueue after commit', async () => {
        const tx = fakeTx();
        jest.spyOn(DBC.DBConnection.prisma as unknown as { $transaction: (...args: unknown[]) => unknown }, '$transaction' as never).mockImplementation(
            ((cb: unknown) => (cb as (t: DBC.PrismaClientTrans) => unknown)(tx.client)) as never
        );
        // Populate the invalidation queue directly; AuditFactory.emit uses
        // this when idSystemObject is resolved.
        await withActor(Actor.user(5), async () => {
            await withAuditTransaction(async () => {
                await AuditFactory.emit({
                    action: eAuditType.eDBUpdate,
                    actor: Actor.user(5),
                    idSystemObject: 42,
                });
            });
        });
        expect(invalidateSpy).toHaveBeenCalledWith(42);
    });
});
