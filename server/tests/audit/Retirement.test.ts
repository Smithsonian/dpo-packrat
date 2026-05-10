import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Actor } from '../../audit/Actor';
import { eAuditType, eNonSystemObjectType } from '../../db/api/ObjectType';
import * as DBC from '../../db/connection';
import { SystemObjectInvalidation } from '../../cache/SystemObjectInvalidation';

/**
 * Retirement semantic rows go through AuditFactory.emitWithId so they
 * always produce a concrete idAudit the cascade can link against. These
 * tests exercise the emit path, actor attribution, and the parent-link
 * payload shape — they do not require a live DB for the SystemObject flag
 * flip (that's covered by the wider dbcreation suite).
 */
describe('Retirement semantic audit (emitWithId)', () => {
    let createSpy: jest.SpyInstance;

    beforeEach(() => {
        createSpy = jest.spyOn(DBC.DBConnection.prisma.audit, 'create')
            .mockResolvedValue({ idAudit: 101 } as unknown as Awaited<ReturnType<typeof DBC.DBConnection.prisma.audit.create>>);
        jest.spyOn(SystemObjectInvalidation, 'invalidate').mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    test('root retire writes eActionRetire with reason and null parentRetirement', async () => {
        const idAudit = await AuditFactory.emitWithId({
            action: eAuditType.eActionRetire,
            actor: Actor.user(5),
            target: { idObject: 1000, eObjectType: eNonSystemObjectType.eSystemObject },
            idSystemObject: 1000,
            payload: { reason: 'user request', parentRetirement: null },
        });
        expect(idAudit).toBe(101);
        expect(createSpy).toHaveBeenCalledTimes(1);
        const data = createSpy.mock.calls[0][0].data;
        expect(data.AuditType).toBe(eAuditType.eActionRetire);
        const parsed = JSON.parse(data.Data);
        expect(parsed.reason).toBe('user request');
        expect(parsed.parentRetirement).toBeNull();
    });

    test('cascade child carries parentRetirement.idAudit linking to the root', async () => {
        const parentIdAudit = 101;
        await AuditFactory.emitWithId({
            action: eAuditType.eActionRetire,
            actor: Actor.user(5),
            target: { idObject: 2000, eObjectType: eNonSystemObjectType.eSystemObject },
            idSystemObject: 2000,
            payload: { reason: null, parentRetirement: { idAudit: parentIdAudit } },
        });
        const data = createSpy.mock.calls[0][0].data;
        const parsed = JSON.parse(data.Data);
        expect(parsed.parentRetirement).toEqual({ idAudit: parentIdAudit });
    });

    test('reinstate emits eActionReinstate with same payload shape', async () => {
        await AuditFactory.emitWithId({
            action: eAuditType.eActionReinstate,
            actor: Actor.user(5),
            target: { idObject: 1000, eObjectType: eNonSystemObjectType.eSystemObject },
            idSystemObject: 1000,
            payload: { reason: 'mistake', parentRetirement: null },
        });
        const data = createSpy.mock.calls[0][0].data;
        expect(data.AuditType).toBe(eAuditType.eActionReinstate);
        const parsed = JSON.parse(data.Data);
        expect(parsed.reason).toBe('mistake');
    });

    test('impersonation actor puts Cook in SystemActor and user in idUser', async () => {
        await AuditFactory.emitWithId({
            action: eAuditType.eActionRetire,
            actor: Actor.impersonation(7, 'Cook'),
            target: { idObject: 1, eObjectType: eNonSystemObjectType.eSystemObject },
            payload: { reason: null, parentRetirement: null },
        });
        const data = createSpy.mock.calls[0][0].data;
        expect(data.User).toEqual({ connect: { idUser: 7 } });
        expect(data.SystemActor).toBe('Cook');
    });

    test('invalid actor fails fast without hitting the DB', async () => {
        const bogus = { kind: 'user', idUser: undefined } as unknown as Actor;
        const idAudit = await AuditFactory.emitWithId({
            action: eAuditType.eActionRetire,
            actor: bogus,
            target: { idObject: 1, eObjectType: eNonSystemObjectType.eSystemObject },
        });
        expect(idAudit).toBeNull();
        expect(createSpy).not.toHaveBeenCalled();
    });
});
