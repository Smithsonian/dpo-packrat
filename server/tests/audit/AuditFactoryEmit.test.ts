import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Actor } from '../../audit/Actor';
import { withActor } from '../../audit/resolveActor';
import { eAuditType, eNonSystemObjectType } from '../../db/api/ObjectType';
import * as COMMON from '@dpo-packrat/common';
import * as DBC from '../../db/connection';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import { SystemObjectInvalidation } from '../../cache/SystemObjectInvalidation';
import { eEventKey } from '../../event/interface/EventEnums';

describe('AuditFactory.emit writes directly and skips event pipeline', () => {
    let createSpy: jest.SpyInstance;
    let cacheSpy: jest.SpyInstance;
    let invalidateSpy: jest.SpyInstance;

    beforeEach(() => {
        createSpy = jest
            .spyOn(DBC.DBConnection.prisma.audit, 'create')
            // mock returns the resolved value; cast sidesteps the full Prisma return type.
            .mockResolvedValue({ idAudit: 1 } as unknown as Awaited<ReturnType<typeof DBC.DBConnection.prisma.audit.create>>);
        cacheSpy = jest
            .spyOn(CACHE.SystemObjectCache, 'getSystemFromObjectID')
            .mockResolvedValue({ idSystemObject: 999 } as unknown as DBAPI.SystemObjectInfo);
        invalidateSpy = jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('user actor: idUser set, SystemActor null', async () => {
        const ok = await AuditFactory.emit({
            action: eAuditType.eActionPublish,
            actor: Actor.user(42),
            payload: { note: 'hello' },
        });
        expect(ok).toBe(true);
        expect(createSpy).toHaveBeenCalledTimes(1);
        const data = createSpy.mock.calls[0][0].data;
        expect(data.User).toEqual({ connect: { idUser: 42 } });
        expect(data.SystemActor).toBeNull();
        expect(data.AuditType).toBe(eAuditType.eActionPublish);
    });

    test('system actor: SystemActor set, no User connect', async () => {
        const ok = await AuditFactory.emit({
            action: eAuditType.eActionSystemMaintenance,
            actor: Actor.system('AuditRetention'),
        });
        expect(ok).toBe(true);
        const data = createSpy.mock.calls[0][0].data;
        expect(data.User).toBeUndefined();
        expect(data.SystemActor).toBe('AuditRetention');
    });

    test('impersonation actor: both idUser and SystemActor set', async () => {
        const ok = await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: Actor.impersonation(7, 'Cook'),
        });
        expect(ok).toBe(true);
        const data = createSpy.mock.calls[0][0].data;
        expect(data.User).toEqual({ connect: { idUser: 7 } });
        expect(data.SystemActor).toBe('Cook');
    });

    test('resolves idSystemObject via SystemObjectCache when target is a SystemObject type', async () => {
        const ok = await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: Actor.user(1),
            target: { idObject: 5, eObjectType: COMMON.eSystemObjectType.eScene },
        });
        expect(ok).toBe(true);
        expect(cacheSpy).toHaveBeenCalledTimes(1);
        const data = createSpy.mock.calls[0][0].data;
        expect(data.SystemObject).toEqual({ connect: { idSystemObject: 999 } });
    });

    test('skips cache lookup for eAudit self-target (no infinite recursion)', async () => {
        await AuditFactory.emit({
            action: eAuditType.eDBCreate,
            actor: Actor.user(1),
            target: { idObject: 1, eObjectType: eNonSystemObjectType.eAudit },
        });
        expect(cacheSpy).not.toHaveBeenCalled();
    });

    test('invalidates SystemObject cache and reindex after write', async () => {
        await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: Actor.user(1),
            target: { idObject: 5, eObjectType: COMMON.eSystemObjectType.eScene },
        });
        expect(invalidateSpy).toHaveBeenCalledWith(999);
    });

    test('rejects actor that would produce both-null columns', async () => {
        // Construct an invalid actor synthetically; the public constructors prevent this shape.
        const bogus = { kind: 'user', idUser: undefined } as unknown as Actor;
        const ok = await AuditFactory.emit({ action: eAuditType.eDBCreate, actor: bogus });
        expect(ok).toBe(false);
        expect(createSpy).not.toHaveBeenCalled();
    });
});

describe('AuditFactory.audit legacy shim resolves actor from LocalStore', () => {
    let createSpy: jest.SpyInstance;

    beforeEach(() => {
        createSpy = jest
            .spyOn(DBC.DBConnection.prisma.audit, 'create')
            .mockResolvedValue({ idAudit: 1 } as unknown as Awaited<ReturnType<typeof DBC.DBConnection.prisma.audit.create>>);
        jest.spyOn(CACHE.SystemObjectCache, 'getSystemFromObjectID')
            .mockResolvedValue({ idSystemObject: 321 } as unknown as DBAPI.SystemObjectInfo);
        jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    test('reads actor from LocalStore when inside withActor scope', async () => {
        await withActor(Actor.user(55), async () => {
            const ok = await AuditFactory.audit({ id: 1 }, { idObject: 7, eObjectType: COMMON.eSystemObjectType.eScene }, eEventKey.eDBCreate);
            expect(ok).toBe(true);
        });
        const data = createSpy.mock.calls[0][0].data;
        expect(data.User).toEqual({ connect: { idUser: 55 } });
        expect(data.AuditType).toBe(eAuditType.eDBCreate);
    });

    test('returns false when no actor is available on the LocalStore', async () => {
        const ok = await AuditFactory.audit({}, { idObject: 1, eObjectType: COMMON.eSystemObjectType.eScene }, eEventKey.eDBUpdate);
        expect(ok).toBe(false);
        expect(createSpy).not.toHaveBeenCalled();
    });
});
