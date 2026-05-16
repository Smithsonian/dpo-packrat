/**
 * Run a business mutation and its associated audit writes inside a single
 * prisma.$transaction, with deadlock retry and statement timeout.
 *
 * Contract:
 *   - fn may call DB API methods (DBObject.create/update/delete) and
 *     AuditFactory.emit any number of times. Audit rows are buffered onto
 *     LocalStore.auditBuffer; they flush via tx.audit.createMany(...) right
 *     before commit. If the flush fails the entire tx rolls back.
 *   - SystemObjectInvalidation calls are collected into LocalStore.invalidationQueue
 *     and fired AFTER the tx commits — non-essential work that must never
 *     extend the lock window.
 *   - On Prisma P2034 (deadlock / write conflict) the wrapper retries up to
 *     Config.audit.txDeadlockRetries times with exponential backoff.
 *
 * This wrapper does NOT manage entry-point Actor resolution; the caller must
 * already have an Actor on LocalStore (via HTTP middleware or withActor).
 */
import { Prisma } from '@prisma/client';
import * as DBC from '../db/connection';
import { SystemObjectInvalidation } from '../cache/SystemObjectInvalidation';
import { ASL, LocalStore } from '../utils/localStore';
import { RecordKeeper as RK } from '../records/recordKeeper';
import { Config } from '../config';
import type { AuditBufferEntry } from './auditBuffer';

const DEADLOCK_CODE = 'P2034';
const BACKOFF_MS = [250, 500, 1000];

export type TransactionOptions = {
    /** Overrides Config.audit.txStatementTimeoutMs for this call. */
    timeoutMs?: number;
    /** Overrides Config.audit.txDeadlockRetries for this call. */
    maxRetries?: number;
};

/**
 * Execute `fn` inside a transaction that atomically commits business writes
 * and the audit rows that describe them. Returns whatever `fn` returns.
 */
export async function withAuditTransaction<T>(
    fn: () => Promise<T>,
    options: TransactionOptions = {},
): Promise<T> {
    const timeout = options.timeoutMs ?? Config.audit.txStatementTimeoutMs;
    const maxRetries = options.maxRetries ?? Config.audit.txDeadlockRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await runTransactionOnce(fn, timeout);
        } catch (err) {
            if (!isDeadlock(err) || attempt >= maxRetries) throw err;
            const backoff = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
            RK.logWarning(RK.LogSection.eAUDIT, 'transaction retry',
                `deadlock/retry (attempt ${attempt + 1}/${maxRetries}) in ${backoff}ms`,
                { attempt: attempt + 1, maxRetries, backoff }, 'Audit.Transaction');
            await sleep(backoff);
        }
    }
    // Unreachable: the loop above either returns or throws. This satisfies
    // the TS return-type checker without tripping no-constant-condition.
    throw new Error('withAuditTransaction: exhausted retries without result');
}

async function runTransactionOnce<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    const prismaClient = DBC.DBConnection.prisma;
    if (!DBC.DBConnection.isFullPrismaClient(prismaClient))
        throw new Error('withAuditTransaction cannot nest: the active prisma client is already a transaction');

    const LS: LocalStore = await ASL.getOrCreateStore();

    const invalidations = new Set<number>();
    return prismaClient.$transaction(async (tx) => {
        // Pin the captured LS inside the tx callback. Prisma's $transaction
        // body runs through internal async hops where ASL.getStore() can lose
        // its connection to the caller's scope. Re-entering the same LS via
        // ASL.run keeps LS.transactionNumber visible to every DB API call
        // inside the tx, so DBC.DBConnection.prisma routes consistently to
        // the tx client rather than alternating to the regular client.
        return ASL.run(LS, async () => {
            const txNumber = await DBC.DBConnection.setPrismaTransaction(tx);
            const priorBuffer = LS.auditBuffer;
            const priorQueue = LS.invalidationQueue;
            LS.auditBuffer = [];
            LS.invalidationQueue = invalidations;
            try {
                const result = await fn();
                await flushAuditBuffer(tx, LS.auditBuffer);
                return result;
            } finally {
                LS.auditBuffer = priorBuffer;
                LS.invalidationQueue = priorQueue;
                DBC.DBConnection.clearPrismaTransaction(txNumber);
            }
        });
    }, {
        timeout: timeoutMs,
        maxWait: Math.min(timeoutMs, 10000),
    }).then(async result => {
        // Post-commit invalidation. Runs outside the tx lock window.
        for (const id of invalidations)
            SystemObjectInvalidation.invalidate(id);
        return result;
    });
}

async function flushAuditBuffer(tx: DBC.PrismaClientTrans, buffer: AuditBufferEntry[]): Promise<void> {
    if (buffer.length === 0) return;
    const CHUNK = 500;
    for (let i = 0; i < buffer.length; i += CHUNK) {
        const chunk = buffer.slice(i, i + CHUNK);
        await tx.audit.createMany({ data: chunk });
    }
}

function isDeadlock(err: unknown): boolean {
    if (err && typeof err === 'object' && 'code' in err) {
        return (err as { code: unknown }).code === DEADLOCK_CODE;
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError)
        return err.code === DEADLOCK_CODE;
    return false;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
