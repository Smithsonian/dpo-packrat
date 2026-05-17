import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Actor } from '../../audit/Actor';
import { withActor } from '../../audit/resolveActor';
import { eAuditType } from '../../db/api/ObjectType';
import * as COMMON from '@dpo-packrat/common';
import * as DBC from '../../db/connection';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import { SystemObjectInvalidation } from '../../cache/SystemObjectInvalidation';
import { ASL, LocalStore } from '../../utils/localStore';

describe('CorrelationId threading through audit emits', () => {
    let createSpy: jest.SpyInstance;

    beforeEach(() => {
        createSpy = jest
            .spyOn(DBC.DBConnection.prisma.audit, 'create')
            .mockResolvedValue({ idAudit: 1 } as unknown as Awaited<ReturnType<typeof DBC.DBConnection.prisma.audit.create>>);
        jest.spyOn(CACHE.SystemObjectCache, 'getSystemFromObjectID')
            .mockResolvedValue({ idSystemObject: 999 } as unknown as DBAPI.SystemObjectInfo);
        jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    test('emit() falls back to LocalStore.correlationId when args omit it', async () => {
        const LS = new LocalStore(true, 42);
        LS.correlationId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        await ASL.run(LS, async () => {
            await AuditFactory.emit({ action: eAuditType.eDBUpdate, actor: Actor.user(42) });
        });
        expect(createSpy.mock.calls[0][0].data.CorrelationId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    });

    test('emit() prefers explicit args.correlationId over the LocalStore fallback', async () => {
        const LS = new LocalStore(true, 1);
        LS.correlationId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        await ASL.run(LS, async () => {
            await AuditFactory.emit({
                action: eAuditType.eDBUpdate,
                actor: Actor.user(1),
                correlationId: 'explicit-override-id',
            });
        });
        expect(createSpy.mock.calls[0][0].data.CorrelationId).toBe('explicit-override-id');
    });

    test('emit() writes null when no LocalStore is present and args omit the id', async () => {
        await AuditFactory.emit({ action: eAuditType.eDBCreate, actor: Actor.system('CLI') });
        expect(createSpy.mock.calls[0][0].data.CorrelationId).toBeNull();
    });

    test('emitWithId() picks up the LocalStore correlationId', async () => {
        const LS = new LocalStore(true, 7);
        LS.correlationId = '11111111-2222-3333-4444-555555555555';
        await ASL.run(LS, async () => {
            await AuditFactory.emitWithId({
                action: eAuditType.eActionRetire,
                actor: Actor.user(7),
                target: { idObject: 5, eObjectType: COMMON.eSystemObjectType.eScene },
            });
        });
        expect(createSpy.mock.calls[0][0].data.CorrelationId).toBe('11111111-2222-3333-4444-555555555555');
    });

    test('every emit under one withActor scope shares one correlationId', async () => {
        await withActor(Actor.system('AuditRetention'), async () => {
            await AuditFactory.emit({ action: eAuditType.eActionSystemMaintenance, actor: Actor.system('AuditRetention') });
            await AuditFactory.emit({ action: eAuditType.eDBCreate, actor: Actor.system('AuditRetention') });
            await AuditFactory.emit({ action: eAuditType.eDBDelete, actor: Actor.system('AuditRetention') });
        });
        const ids = createSpy.mock.calls.map(c => c[0].data.CorrelationId);
        expect(ids).toHaveLength(3);
        expect(ids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(new Set(ids).size).toBe(1);
    });

    test('two parallel withActor scopes get distinct correlationIds', async () => {
        await Promise.all([
            withActor(Actor.system('AuditRetention'), async () => {
                await AuditFactory.emit({ action: eAuditType.eDBCreate, actor: Actor.system('AuditRetention') });
            }),
            withActor(Actor.system('AuditRetention'), async () => {
                await AuditFactory.emit({ action: eAuditType.eDBCreate, actor: Actor.system('AuditRetention') });
            }),
        ]);
        const ids = createSpy.mock.calls.map(c => c[0].data.CorrelationId);
        expect(ids).toHaveLength(2);
        expect(ids[0]).not.toBe(ids[1]);
    });

    test('withActor inside an existing scope inherits the parent correlationId', async () => {
        const LS = new LocalStore(true, 99);
        LS.correlationId = 'parent--correlation-id-here-1234567890';
        await ASL.run(LS, async () => {
            await withActor(Actor.impersonation(99, 'Cook'), async () => {
                await AuditFactory.emit({ action: eAuditType.eDBUpdate, actor: Actor.impersonation(99, 'Cook') });
            });
        });
        expect(createSpy.mock.calls[0][0].data.CorrelationId).toBe('parent--correlation-id-here-1234567890');
    });
});
