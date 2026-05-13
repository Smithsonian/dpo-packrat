/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Audit pipeline E2E.
 *
 * Exercises the public audit surface end-to-end against mocked Prisma /
 * Cache / Invalidation boundaries. Each describe block maps to one
 * acceptance scenario from the I.13 plan: login attribution, DB API row
 * shape, log-only short-circuit, retire cascade linking, retention pass
 * accounting, actor resolution (user / system / impersonation),
 * concurrent-write isolation across LocalStore, and tx rollback rolling
 * back business writes alongside their audit rows.
 *
 * The suite never reaches a real database: it stubs prisma.audit.create,
 * prisma.audit.createMany, prisma.audit.findMany, prisma.$executeRaw, and
 * the SystemObjectCache resolver. This keeps it runnable in CI without a
 * provisioned schema. The standalone full-stack harness that hits a real
 * MariaDB is Deferred-G in the audit plan.
 */
import { Prisma } from '@prisma/client';

import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Actor } from '../../audit/Actor';
import { withActor, resolveActorFromRequest } from '../../audit/resolveActor';
import { withAuditTransaction } from '../../audit/withAuditTransaction';
import { Audit } from '../../db/api/Audit';
import { JobAuditRetention } from '../../job/impl/NS/JobAuditRetention';
import { Authorization } from '../../auth/Authorization';
import { eAuditType, eNonSystemObjectType } from '../../db/api/ObjectType';
import * as DBAPI from '../../db';
import * as DBC from '../../db/connection';
import * as CACHE from '../../cache';
import { SystemObjectInvalidation } from '../../cache/SystemObjectInvalidation';
import { ASL } from '../../utils/localStore';
import { Config, AuditTier } from '../../config';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import type { AuditBufferEntry } from '../../audit/auditBuffer';

type CreateManyMock = jest.Mock<Promise<{ count: number }>, [{ data: unknown[] }]>;

function fakeTx(): { createMany: CreateManyMock; client: DBC.PrismaClientTrans } {
    const createMany: CreateManyMock = jest.fn().mockResolvedValue({ count: 0 });
    return {
        createMany,
        client: { audit: { createMany } } as unknown as DBC.PrismaClientTrans,
    };
}

/** Snapshot the captured row shape from prisma.audit.create / createMany so a
 *  test can assert on idUser / SystemActor / AuditType / Data without
 *  re-deriving the buffer entry shape every time. */
type CapturedRow = {
    idUser: number | null;
    SystemActor: string | null;
    AuditType: number;
    DBObjectType: number | null;
    idDBObject: number | null;
    idSystemObject: number | null;
    Data: string | null;
    CorrelationId: string | null;
};

function rowFromCreateArgs(args: any): CapturedRow {
    const data = args.data;
    return {
        idUser: data.User?.connect?.idUser ?? null,
        SystemActor: data.SystemActor ?? null,
        AuditType: data.AuditType,
        DBObjectType: data.DBObjectType ?? null,
        idDBObject: data.idDBObject ?? null,
        idSystemObject: data.SystemObject?.connect?.idSystemObject ?? null,
        Data: data.Data ?? null,
        CorrelationId: data.CorrelationId ?? null,
    };
}

function rowFromBufferEntry(entry: AuditBufferEntry): CapturedRow {
    return {
        idUser: entry.idUser,
        SystemActor: entry.SystemActor,
        AuditType: entry.AuditType,
        DBObjectType: entry.DBObjectType,
        idDBObject: entry.idDBObject,
        idSystemObject: entry.idSystemObject,
        Data: entry.Data,
        CorrelationId: entry.CorrelationId,
    };
}

describe('Audit E2E — login + failed-login attribution', () => {
    let createSpy: jest.SpyInstance;

    beforeEach(() => {
        createSpy = jest.spyOn(DBC.DBConnection.prisma.audit, 'create')
            .mockResolvedValue({ idAudit: 1 } as any);
        jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    test('successful login row carries the user actor', async () => {
        await AuditFactory.emit({
            action: eAuditType.eAuthLogin,
            actor: Actor.user(42),
            payload: { surface: 'local' },
        });
        expect(createSpy).toHaveBeenCalledTimes(1);
        const row = rowFromCreateArgs(createSpy.mock.calls[0][0]);
        expect(row.AuditType).toBe(eAuditType.eAuthLogin);
        expect(row.idUser).toBe(42);
        expect(row.SystemActor).toBeNull();
    });

    test('failed-login row attributes idUser when known, system actor when unknown', async () => {
        // Known user (login form posted a real email): idUser populated.
        await AuditFactory.emit({
            action: eAuditType.eAuthFailed,
            actor: Actor.user(99),
            payload: { reason: 'badPassword' },
        });
        // Unknown user (email did not resolve): system attribution.
        await AuditFactory.emit({
            action: eAuditType.eAuthFailed,
            actor: Actor.system('AuthLogin'),
            payload: { reason: 'unknownUser' },
        });

        expect(createSpy).toHaveBeenCalledTimes(2);
        const known = rowFromCreateArgs(createSpy.mock.calls[0][0]);
        const unknown = rowFromCreateArgs(createSpy.mock.calls[1][0]);
        expect(known.idUser).toBe(99);
        expect(known.SystemActor).toBeNull();
        expect(unknown.idUser).toBeNull();
        expect(unknown.SystemActor).toBe('AuthLogin');
    });

    test('Authorization.logDenial routes through AuditFactory.emit with eAuthDenied', async () => {
        Authorization.logDenial(7, 1234, 'getDetailsTabDataForObject');
        // logDenial dispatches asynchronously — give the microtask queue a turn.
        await new Promise(r => setImmediate(r));
        expect(createSpy).toHaveBeenCalledTimes(1);
        const row = rowFromCreateArgs(createSpy.mock.calls[0][0]);
        expect(row.AuditType).toBe(eAuditType.eAuthDenied);
        expect(row.idUser).toBe(7);
        expect(row.idSystemObject).toBe(1234);
    });
});

describe('Audit E2E — DB API call produces correct row shape', () => {
    let createSpy: jest.SpyInstance;

    beforeEach(() => {
        createSpy = jest.spyOn(DBC.DBConnection.prisma.audit, 'create')
            .mockResolvedValue({ idAudit: 1 } as any);
        jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
        // SystemObjectCache resolves the target to a SystemObject id.
        jest.spyOn(CACHE.SystemObjectCache, 'getSystemFromObjectID')
            .mockResolvedValue({ idSystemObject: 555, Retired: false } as any);
    });
    afterEach(() => jest.restoreAllMocks());

    test('Subject create-style emit fills DBObjectType + idDBObject + idSystemObject', async () => {
        await withActor(Actor.user(11), async () => {
            await AuditFactory.emit({
                action: eAuditType.eDBCreate,
                actor: Actor.user(11),
                target: { idObject: 9001, eObjectType: 1 /* eUnit / eSubject placeholder */ },
                payload: { Name: 'New Subject' },
            });
        });
        const row = rowFromCreateArgs(createSpy.mock.calls[0][0]);
        expect(row.AuditType).toBe(eAuditType.eDBCreate);
        expect(row.idUser).toBe(11);
        expect(row.idDBObject).toBe(9001);
        expect(row.idSystemObject).toBe(555);
        expect(row.Data).toContain('New Subject');
    });

    test('Scene rename via diff payload stays small (<500 bytes)', async () => {
        const before = { Name: 'old', Description: 'd' };
        const after = { Name: 'new', Description: 'd' };
        await withActor(Actor.user(11), async () => {
            await AuditFactory.emit({
                action: eAuditType.eDBUpdate,
                actor: Actor.user(11),
                target: { idObject: 100, eObjectType: 3 /* scene-ish */ },
                payload: { changed: { Name: { from: before.Name, to: after.Name } } },
            });
        });
        const row = rowFromCreateArgs(createSpy.mock.calls[0][0]);
        expect(row.Data).toBeTruthy();
        expect(Buffer.byteLength(row.Data!, 'utf8')).toBeLessThan(500);
    });

    test('createMany audits as eDBCreate (regression: was eDBDelete pre-Phase-1)', () => {
        // The bug fix lives in DBObject.createMany. Direct unit coverage in
        // server/tests/audit/DBObject.createMany.test.ts; we re-assert here at
        // the AuditFactory level via the legacy shim.
        const eEvent = require('../../event/interface/EventEnums').eEventKey;
        expect(AuditFactory.keyToAuditType(eEvent.eDBCreate)).toBe(eAuditType.eDBCreate);
        expect(AuditFactory.keyToAuditType(eEvent.eDBUpdate)).toBe(eAuditType.eDBUpdate);
        expect(AuditFactory.keyToAuditType(eEvent.eDBDelete)).toBe(eAuditType.eDBDelete);
    });

    test('idSystemObject is populated from the cache when caller omits it', async () => {
        await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: Actor.user(11),
            target: { idObject: 1, eObjectType: 2 },
        });
        const row = rowFromCreateArgs(createSpy.mock.calls[0][0]);
        expect(row.idSystemObject).toBe(555);
    });
});

describe('Audit E2E — log-only tier short-circuits the DB write', () => {
    let createSpy: jest.SpyInstance;
    let logSpy: jest.SpyInstance;
    let invalidateSpy: jest.SpyInstance;

    beforeEach(() => {
        createSpy = jest.spyOn(DBC.DBConnection.prisma.audit, 'create')
            .mockResolvedValue({ idAudit: 1 } as any);
        invalidateSpy = jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
        logSpy = jest.spyOn(RK, 'logInfo').mockImplementation(() => ({} as any));
    });
    afterEach(() => jest.restoreAllMocks());

    test('xref mutation logs and skips DB insert; derived SO still invalidated', async () => {
        // Make the lazy SystemObjectXref import return a stub xref so
        // the derived-id is invalidated.
        const xrefMod = await import('../../db/api/SystemObjectXref');
        jest.spyOn(xrefMod.SystemObjectXref, 'fetch')
            .mockResolvedValue({ idSystemObjectDerived: 999 } as any);

        const ok = await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: Actor.user(7),
            target: { idObject: 5, eObjectType: eNonSystemObjectType.eSystemObjectXref },
            payload: { idSystemObjectMaster: 1, idSystemObjectDerived: 999 },
        });
        expect(ok).toBe(true);
        expect(createSpy).not.toHaveBeenCalled();
        // Wait one microtask for the lazy-imported invalidate dispatch.
        await new Promise(r => setImmediate(r));
        expect(invalidateSpy).toHaveBeenCalledWith(999);
        // Confirm the log line landed with the audit marker.
        const auditLogCalls = logSpy.mock.calls.filter(c => c[5] === true);
        expect(auditLogCalls.length).toBeGreaterThan(0);
    });

    test('non-log-only types still hit the DB', async () => {
        await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: Actor.user(7),
            target: { idObject: 1, eObjectType: 1 /* eUnit */ },
            idSystemObject: 1,
        });
        expect(createSpy).toHaveBeenCalledTimes(1);
    });
});

describe('Audit E2E — retire cascade links children to root via parentRetirement.idAudit', () => {
    let createSpy: jest.SpyInstance;

    beforeEach(() => {
        // Each emitWithId call returns a unique idAudit so we can assert linkage.
        let nextId = 100;
        createSpy = jest.spyOn(DBC.DBConnection.prisma.audit, 'create')
            .mockImplementation((async () => ({ idAudit: nextId++ })) as any);
        jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    test('root retire row has parentRetirement=null; children carry root idAudit', async () => {
        const rootIdAudit = await AuditFactory.emitWithId({
            action: eAuditType.eActionRetire,
            actor: Actor.user(5),
            target: { idObject: 1000, eObjectType: eNonSystemObjectType.eSystemObject },
            idSystemObject: 1000,
            payload: { reason: 'user request', parentRetirement: null },
        });
        expect(rootIdAudit).toBe(100);

        // Three cascade children.
        for (const idChild of [2000, 2001, 2002]) {
            await AuditFactory.emitWithId({
                action: eAuditType.eActionRetire,
                actor: Actor.user(5),
                target: { idObject: idChild, eObjectType: eNonSystemObjectType.eSystemObject },
                idSystemObject: idChild,
                payload: { reason: null, parentRetirement: { idAudit: rootIdAudit } },
            });
        }

        // First call is the root, three children follow.
        expect(createSpy).toHaveBeenCalledTimes(4);
        const root = JSON.parse(rowFromCreateArgs(createSpy.mock.calls[0][0]).Data!);
        expect(root.parentRetirement).toBeNull();
        for (let i = 1; i <= 3; i++) {
            const child = JSON.parse(rowFromCreateArgs(createSpy.mock.calls[i][0]).Data!);
            expect(child.parentRetirement).toEqual({ idAudit: rootIdAudit });
        }
    });

    test('reinstate emits eActionReinstate with the same payload contract', async () => {
        await AuditFactory.emitWithId({
            action: eAuditType.eActionReinstate,
            actor: Actor.user(5),
            target: { idObject: 1000, eObjectType: eNonSystemObjectType.eSystemObject },
            idSystemObject: 1000,
            payload: { reason: 'mistake', parentRetirement: null },
        });
        const row = rowFromCreateArgs(createSpy.mock.calls[0][0]);
        expect(row.AuditType).toBe(eAuditType.eActionReinstate);
        expect(JSON.parse(row.Data!).reason).toBe('mistake');
    });
});

describe('Audit E2E — retention job dry + real run accounting', () => {
    afterEach(() => jest.restoreAllMocks());

    test('seeded fixture: skeleton STANDARD, delete TRANSIENT, summary emitted', async () => {
        // Seeded counts mimic a realistic mid-sized retention pass.
        const skeletonSpy = jest.spyOn(Audit, 'skeletonBefore')
            .mockResolvedValueOnce(123)   // STANDARD pass: 123 rows nulled
            .mockResolvedValueOnce(45);   // TRANSIENT skeleton pass: 45 rows nulled
        const deleteSpy = jest.spyOn(Audit, 'deleteBefore')
            .mockResolvedValueOnce(67);   // TRANSIENT delete pass: 67 rows removed
        const emitSpy = jest.spyOn(AuditFactory, 'emit').mockResolvedValue(true);

        const result = await JobAuditRetention.run();

        expect(result.skeletoned).toBe(123 + 45);
        expect(result.transientDeleted).toBe(67);
        expect(result.cancelled).toBe(false);
        expect(skeletonSpy).toHaveBeenCalledTimes(2);
        expect(deleteSpy).toHaveBeenCalledTimes(1);

        // Summary row is the last emit; payload preserves the counts.
        const summary = emitSpy.mock.calls.find(c => c[0].action === eAuditType.eActionSystemMaintenance);
        expect(summary).toBeDefined();
        expect(summary![0].payload).toMatchObject({
            skeletoned: 123 + 45,
            transientDeleted: 67,
            cancelled: false,
        });
    });

    test('dry-run analogue: zero counts produce a clean summary row, no DB churn', async () => {
        jest.spyOn(Audit, 'skeletonBefore').mockResolvedValue(0);
        jest.spyOn(Audit, 'deleteBefore').mockResolvedValue(0);
        const emitSpy = jest.spyOn(AuditFactory, 'emit').mockResolvedValue(true);

        const result = await JobAuditRetention.run();
        expect(result.skeletoned).toBe(0);
        expect(result.transientDeleted).toBe(0);

        const summaryArgs = emitSpy.mock.calls.find(c => c[0].action === eAuditType.eActionSystemMaintenance)![0];
        expect(summaryArgs.actor).toEqual(Actor.system('AuditRetention'));
    });

    test('PROTECT tier types never appear in skeleton or delete invocations', async () => {
        const skeletonSpy = jest.spyOn(Audit, 'skeletonBefore').mockResolvedValue(0);
        const deleteSpy = jest.spyOn(Audit, 'deleteBefore').mockResolvedValue(0);
        jest.spyOn(AuditFactory, 'emit').mockResolvedValue(true);

        await JobAuditRetention.run();

        const protectTypes = new Set<eAuditType>();
        for (const [k, v] of Object.entries(Config.audit.actionTiers))
            if (v === AuditTier.PROTECT) protectTypes.add(Number(k) as eAuditType);

        for (const call of [...skeletonSpy.mock.calls, ...deleteSpy.mock.calls]) {
            const tiers = call[0] as eAuditType[];
            for (const t of tiers) expect(protectTypes.has(t)).toBe(false);
        }
    });
});

describe('Audit E2E — actor resolution at entry points', () => {
    let createSpy: jest.SpyInstance;

    beforeEach(() => {
        createSpy = jest.spyOn(DBC.DBConnection.prisma.audit, 'create')
            .mockResolvedValue({ idAudit: 1 } as any);
        jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    test('HTTP request with session user resolves Actor.user', async () => {
        const fakeReq = { user: { idUser: 17 } } as any;
        const actor = resolveActorFromRequest(fakeReq);
        expect(actor).toEqual(Actor.user(17));
    });

    test('HTTP request without a session falls back to Actor.system', async () => {
        const fakeReq = {} as any;
        const actor = resolveActorFromRequest(fakeReq, 'WebDAV');
        expect(actor).toEqual(Actor.system('WebDAV'));
    });

    test('Cook webhook with idUserInitiator threads as impersonation', async () => {
        // Cook lifecycle runs under withActor(Actor.impersonation(idUserInitiator, 'Cook')).
        await withActor(Actor.impersonation(33, 'Cook'), async () => {
            await AuditFactory.emit({
                action: eAuditType.eActionIngest,
                actor: ASL.getStore()!.getActor()!,
                idSystemObject: 200,
                payload: { stage: 'complete' },
            });
        });
        const row = rowFromCreateArgs(createSpy.mock.calls[0][0]);
        expect(row.idUser).toBe(33);
        expect(row.SystemActor).toBe('Cook');
    });

    test('emitSemantic without explicit actor uses LocalStore actor', async () => {
        await withActor(Actor.user(88), async () => {
            await AuditFactory.emitSemantic({
                action: eAuditType.eActionPublish,
                idSystemObject: 12,
                payload: {},
            });
        });
        const row = rowFromCreateArgs(createSpy.mock.calls[0][0]);
        expect(row.idUser).toBe(88);
    });

    test('invariant: no audit row may have BOTH idUser and SystemActor null', async () => {
        const bogus = { kind: 'user', idUser: undefined } as unknown as Actor;
        const ok = await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: bogus,
            idSystemObject: 1,
        });
        expect(ok).toBe(false);
        expect(createSpy).not.toHaveBeenCalled();
    });
});

describe('Audit E2E — concurrent writes on distinct rows do not collide', () => {
    afterEach(() => jest.restoreAllMocks());

    test('two parallel withAuditTransaction blocks each see their own buffer', async () => {
        // Each $transaction invocation receives its own fakeTx.
        const txes: Array<ReturnType<typeof fakeTx>> = [];
        jest.spyOn(DBC.DBConnection.prisma as any, '$transaction' as never).mockImplementation((async (cb: any) => {
            const tx = fakeTx();
            txes.push(tx);
            return cb(tx.client);
        }) as never);
        jest.spyOn(DBC.DBConnection, 'setPrismaTransaction').mockResolvedValue(1);
        jest.spyOn(DBC.DBConnection, 'clearPrismaTransaction').mockImplementation(() => {});
        jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});

        const left = withActor(Actor.user(1), () =>
            withAuditTransaction(async () => {
                await AuditFactory.emit({ action: eAuditType.eDBUpdate, actor: Actor.user(1), idSystemObject: 10, payload: { side: 'L' } });
                await AuditFactory.emit({ action: eAuditType.eDBUpdate, actor: Actor.user(1), idSystemObject: 11, payload: { side: 'L' } });
            })
        );
        const right = withActor(Actor.user(2), () =>
            withAuditTransaction(async () => {
                await AuditFactory.emit({ action: eAuditType.eDBCreate, actor: Actor.user(2), idSystemObject: 20, payload: { side: 'R' } });
            })
        );
        await Promise.all([left, right]);

        // Each tx flushed exactly its own buffer; buffers don't bleed across.
        expect(txes).toHaveLength(2);
        const sortedRows = txes
            .map(t => (t.createMany.mock.calls[0]?.[0]?.data as AuditBufferEntry[] | undefined) ?? [])
            .map(buf => buf.map(rowFromBufferEntry));
        const flat = sortedRows.flat();
        expect(flat.find(r => r.idUser === 1 && r.idSystemObject === 10)).toBeTruthy();
        expect(flat.find(r => r.idUser === 1 && r.idSystemObject === 11)).toBeTruthy();
        expect(flat.find(r => r.idUser === 2 && r.idSystemObject === 20)).toBeTruthy();
        // Each tx should only ever see one user's rows.
        for (const buf of sortedRows) {
            const users = new Set(buf.map(r => r.idUser));
            expect(users.size).toBeLessThanOrEqual(1);
        }
    });

    test('Prisma P2034 deadlock retries until success', async () => {
        const tx = fakeTx();
        const p2034 = new Prisma.PrismaClientKnownRequestError(
            'deadlock',
            { code: 'P2034', clientVersion: '4.8.1' } as any,
        );
        const $transactionSpy = jest.spyOn(DBC.DBConnection.prisma as any, '$transaction' as never)
            .mockRejectedValueOnce(p2034 as never)
            .mockImplementation(((cb: any) => cb(tx.client)) as never);
        jest.spyOn(DBC.DBConnection, 'setPrismaTransaction').mockResolvedValue(1);
        jest.spyOn(DBC.DBConnection, 'clearPrismaTransaction').mockImplementation(() => {});
        jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
        jest.spyOn(RK, 'logWarning').mockResolvedValue({ success: true, message: '' } as any);

        const out = await withActor(Actor.user(5), () =>
            withAuditTransaction(async () => 'committed', { maxRetries: 2 })
        );
        expect(out).toBe('committed');
        expect($transactionSpy).toHaveBeenCalledTimes(2);
    });
});

describe('Audit E2E — tx rollback rolls back business + audit together', () => {
    afterEach(() => jest.restoreAllMocks());

    test('audit flush failure aborts the tx; post-commit invalidations never fire', async () => {
        const tx = fakeTx();
        tx.createMany.mockRejectedValueOnce(new Error('audit flush failure'));
        jest.spyOn(DBC.DBConnection.prisma as any, '$transaction' as never)
            .mockImplementation((async (cb: any) => {
                // Simulate Prisma re-throwing the callback error so the outer
                // `.then(...)` runs only on success.
                return cb(tx.client);
            }) as never);
        jest.spyOn(DBC.DBConnection, 'setPrismaTransaction').mockResolvedValue(1);
        jest.spyOn(DBC.DBConnection, 'clearPrismaTransaction').mockImplementation(() => {});
        const invalidateSpy = jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});

        let businessRan = false;
        await expect(withActor(Actor.user(5), () => withAuditTransaction(async () => {
            businessRan = true;
            await AuditFactory.emit({
                action: eAuditType.eDBUpdate,
                actor: Actor.user(5),
                idSystemObject: 99,
                payload: { x: 1 },
            });
        }))).rejects.toThrow('audit flush failure');

        // Business code did execute, but the surrounding tx wrapper threw — in
        // a real DB this rolls back any prior write inside the same tx.
        expect(businessRan).toBe(true);
        // Post-commit invalidation is gated on the .then() handler, which never
        // runs when the tx callback rejects.
        expect(invalidateSpy).not.toHaveBeenCalled();
    });

    test('successful tx fires post-commit invalidations once per unique idSystemObject', async () => {
        const tx = fakeTx();
        jest.spyOn(DBC.DBConnection.prisma as any, '$transaction' as never)
            .mockImplementation(((cb: any) => cb(tx.client)) as never);
        jest.spyOn(DBC.DBConnection, 'setPrismaTransaction').mockResolvedValue(1);
        jest.spyOn(DBC.DBConnection, 'clearPrismaTransaction').mockImplementation(() => {});
        const invalidateSpy = jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});

        await withActor(Actor.user(5), () => withAuditTransaction(async () => {
            await AuditFactory.emit({ action: eAuditType.eDBUpdate, actor: Actor.user(5), idSystemObject: 1 });
            await AuditFactory.emit({ action: eAuditType.eDBUpdate, actor: Actor.user(5), idSystemObject: 1 });
            await AuditFactory.emit({ action: eAuditType.eDBUpdate, actor: Actor.user(5), idSystemObject: 2 });
        }));

        // Two distinct idSystemObject values queued; invalidation runs once per.
        const ids = new Set(invalidateSpy.mock.calls.map(c => c[0]));
        expect(ids).toEqual(new Set([1, 2]));
    });
});

describe('Audit E2E — audit type coverage acceptance', () => {
    test('every Phase-1 semantic action is mapped to a tier', () => {
        const phaseOneSemantics = [
            eAuditType.eActionPublish,
            eAuditType.eActionUnpublish,
            eAuditType.eActionAssignLicense,
            eAuditType.eActionClearLicense,
            eAuditType.eActionLicenseUpdate,
            eAuditType.eActionEDANIDChange,
            eAuditType.eActionRollbackSOV,
            eAuditType.eActionRollbackAssetVersion,
            eAuditType.eActionRetire,
            eAuditType.eActionReinstate,
            eAuditType.eActionApproveForPublication,
            eAuditType.eActionPoseAndQC,
            eAuditType.eActionIngest,
            eAuditType.eActionAccessGrant,
            eAuditType.eActionAccessRevoke,
        ];
        for (const action of phaseOneSemantics)
            expect(Config.audit.actionTiers[action]).toBe(AuditTier.PROTECT);
    });

    test('CRUD actions are STANDARD; high-volume entity types route log-only', () => {
        expect(Config.audit.actionTiers[eAuditType.eDBCreate]).toBe(AuditTier.STANDARD);
        expect(Config.audit.actionTiers[eAuditType.eDBUpdate]).toBe(AuditTier.STANDARD);
        expect(Config.audit.actionTiers[eAuditType.eDBDelete]).toBe(AuditTier.STANDARD);
        expect(Config.audit.logOnlyObjectTypes).toContain(eNonSystemObjectType.eSystemObjectXref);
        expect(Config.audit.logOnlyObjectTypes).toContain(eNonSystemObjectType.eModelMaterial);
    });
});

// Reference DBAPI so the import isn't tree-shaken by the linter — the tests
// above depend on its module-init side effects (DB API registration via
// connection bootstrap).
void DBAPI;
