import * as COMMON from '@dpo-packrat/common';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Actor } from '../../audit/Actor';
import { eAuditType, eNonSystemObjectType } from '../../db/api/ObjectType';
import * as DBC from '../../db/connection';
import * as CACHE from '../../cache';
import * as DBAPI from '../../db';
import { SystemObjectInvalidation } from '../../cache/SystemObjectInvalidation';
import { RecordKeeper as RK } from '../../records/recordKeeper';

describe('AuditFactory.emit log-only tier routing', () => {
    let createSpy: jest.SpyInstance;
    let infoSpy: jest.SpyInstance;
    let invalidateSpy: jest.SpyInstance;

    beforeEach(() => {
        createSpy = jest
            .spyOn(DBC.DBConnection.prisma.audit, 'create')
            .mockResolvedValue({ idAudit: 1 } as unknown as Awaited<ReturnType<typeof DBC.DBConnection.prisma.audit.create>>);
        infoSpy = jest.spyOn(RK, 'logInfo').mockResolvedValue({ success: true, message: '' });
        invalidateSpy = jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
        jest.spyOn(CACHE.SystemObjectCache, 'getSystemFromObjectID')
            .mockResolvedValue({ idSystemObject: 999 } as unknown as DBAPI.SystemObjectInfo);
    });

    afterEach(() => jest.restoreAllMocks());

    test('log-only entity types never call prisma.audit.create', async () => {
        const ok = await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: Actor.user(1),
            target: { idObject: 42, eObjectType: eNonSystemObjectType.eModelMaterial },
            payload: { diff: 'color' },
        });
        expect(ok).toBe(true);
        expect(createSpy).not.toHaveBeenCalled();
    });

    test('log-only emits RK.logInfo with audit=true and a structured payload', async () => {
        await AuditFactory.emit({
            action: eAuditType.eDBCreate,
            actor: Actor.user(5),
            target: { idObject: 100, eObjectType: eNonSystemObjectType.eMetadata },
            payload: { name: 'foo' },
        });
        expect(infoSpy).toHaveBeenCalledTimes(1);
        const [sec, , , data, , auditFlag] = infoSpy.mock.calls[0];
        expect(sec).toBe(RK.LogSection.eAUDIT);
        expect(auditFlag).toBe(true);
        expect(data).toMatchObject({
            action: eAuditType.eDBCreate,
            actor: 'user(5)',
            target: { idObject: 100, eObjectType: eNonSystemObjectType.eMetadata },
            payload: { name: 'foo' },
        });
    });

    test('non-log-only entities still hit prisma.audit.create', async () => {
        await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: Actor.user(1),
            target: { idObject: 7, eObjectType: COMMON.eSystemObjectType.eScene },
        });
        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(infoSpy).not.toHaveBeenCalled();
    });

    test('xref log-only mutation still invalidates the derived SystemObject', async () => {
        jest.spyOn(DBAPI.SystemObjectXref, 'fetch').mockResolvedValue({
            idSystemObjectXref: 11,
            idSystemObjectMaster: 100,
            idSystemObjectDerived: 200,
        } as unknown as DBAPI.SystemObjectXref);

        await AuditFactory.emit({
            action: eAuditType.eDBUpdate,
            actor: Actor.user(1),
            target: { idObject: 11, eObjectType: eNonSystemObjectType.eSystemObjectXref },
        });
        // Give the fire-and-forget invalidation task a tick to resolve.
        await new Promise(resolve => setImmediate(resolve));

        expect(createSpy).not.toHaveBeenCalled();
        expect(invalidateSpy).toHaveBeenCalledWith(200);
    });
});
