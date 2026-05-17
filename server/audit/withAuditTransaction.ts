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
 * Idempotent under nesting: when invoked inside a scope that already has a
 * wrapping tx (LS.auditBuffer is set), the call short-circuits and just runs
 * `fn` directly. The outer wrapper's buffer collects any audit emits and
 * flushes them atomically on its own commit. This makes the wrapper safe to
 * sprinkle through DBObject CRUD without worrying about whether the caller
 * already opened a tx.
 *
 * This wrapper does NOT manage entry-point Actor resolution; the caller must
 * already have an Actor on LocalStore (via HTTP middleware or withActor).
 */
import { Prisma } from '@prisma/client';
// Import DBConnection directly rather than via the connection index barrel so
// we don't pull DBObject back into this module — DBObject imports us, and a
// barrel import would close a runtime-evaluation cycle.
import { DBConnection } from '../db/connection/DBConnection';
import type { PrismaClientTrans } from '../db/connection/DBConnection';
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
    // Short-circuit when an outer transaction is already active on this scope.
    // Two flavors both qualify:
    //   - auditBuffer set: an outer withAuditTransaction is wrapping us; its
    //     buffer accumulates emits and the outer commit flushes them.
    //   - transactionNumber set without auditBuffer: a legacy caller opened
    //     its own prismaClient.$transaction and registered the tx client via
    //     DBConnection.setPrismaTransaction (e.g. SystemObjectVersion.cloneObjectAndXrefs).
    //     AuditFactory.emit falls through to a direct insert via DBConnection.prisma,
    //     which resolves to that tx client, so the audit row still commits with
    //     the business write.
    // Either way, nesting a fresh Prisma $transaction inside an existing one
    // is unsupported and would split audit rows away from business writes.
    const existingLS: LocalStore | undefined = ASL.getStore();
    if (existingLS?.auditBuffer !== undefined || existingLS?.transactionNumber !== undefined)
        return fn();

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
    const prismaClient = DBConnection.prisma;
    if (!DBConnection.isFullPrismaClient(prismaClient))
        throw new Error('withAuditTransaction cannot nest: the active prisma client is already a transaction');

    // Build a private child LocalStore for this wrap rather than mutating the
    // parent's auditBuffer / invalidationQueue slots. Two reasons:
    //   1. Sibling wraps that overlap (e.g. through async boundaries that
    //      ASL didn't propagate cleanly across) would otherwise clobber each
    //      other's audit buffer via a shared slot.
    //   2. Nested wraps that fail the idempotency short-circuit (because
    //      ASL lost the outer scope) would otherwise corrupt the parent's
    //      buffer when their `finally` restored a stale priorBuffer.
    // The child carries the parent's identity / correlation / auth fields so
    // audit rows look identical; everything tx-scoped lives on the child.
    const parent: LocalStore = await ASL.getOrCreateStore();
    const child: LocalStore = parent.forkChildScope();
    child.auditBuffer = [];
    child.invalidationQueue = new Set<number>();

    return prismaClient.$transaction(async (tx) => {
        // Pin the child LS inside the tx callback. Prisma's $transaction body
        // runs through internal async hops where ASL.getStore() can lose its
        // connection to the caller's scope. ASL.run keeps the child (with
        // transactionNumber set) visible to every DB API call inside the tx,
        // so DBConnection.prisma routes consistently to the tx client rather
        // than alternating to the regular client.
        return ASL.run(child, async () => {
            const txNumber = await DBConnection.setPrismaTransaction(tx);
            try {
                const result = await fn();
                await flushAuditBuffer(tx, child.auditBuffer!);
                return result;
            } finally {
                DBConnection.clearPrismaTransaction(txNumber);
                // No restore needed: child is per-wrap, parent untouched.
            }
        });
    }, {
        timeout: timeoutMs,
        maxWait: Math.min(timeoutMs, 10000),
    }).then(async result => {
        // Post-commit invalidation. Runs outside the tx lock window.
        for (const id of child.invalidationQueue!)
            SystemObjectInvalidation.invalidate(id);
        return result;
    });
}

async function flushAuditBuffer(tx: PrismaClientTrans, buffer: AuditBufferEntry[]): Promise<void> {
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
