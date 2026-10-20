/* eslint-disable @typescript-eslint/no-explicit-any */
import publish from '../../graphql/schema/systemobject/resolvers/mutations/publish';
import * as COL from '../../collections/interface';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import { Authorization, AUTH_ERROR } from '../../auth/Authorization';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import * as AUDITTX from '../../audit/withAuditTransaction';
import { Config } from '../../config';

// Hermetic coverage for the publish mutation resolver's authorization gates and its
// success-path audit emit. Every collaborator is mocked — no DB, no EDAN, no storage:
// Authorization (context + access), the SystemObject/Subject/Unit lookups, the prior
// published state, ICol.publish, and the audit emit. These guard the fail-closed
// access check, the Subject admin + unit-allowlist gate, that an authorized scene
// publish reaches ICol.publish with the intended state, and that success emits the
// correct publish/unpublish action with the before/after state diff.

const SUBJECT_UNIT_NOT_ALLOWED = 'ZZZUNIT'; // deliberately outside subjectPublishUnitAllowlist

function makeCtx(isAdmin: boolean): any {
    return {
        idUser: 1, isAdmin, authorizedUnitIds: [], authorizedProjectIds: [],
        effectiveProjectIds: null, effectiveProjectSOIds: null,
        effectiveUnitIds: [], effectiveUnitSOIds: null, authorizedUnitSOIds: null,
    };
}

function args(idSystemObject: number, eState: COMMON.ePublishedState): any {
    return { input: { idSystemObject, eState } };
}

describe('GraphQL resolver: publish authz + audit', () => {
    let publishFn: jest.Mock;

    beforeEach(() => {
        publishFn = jest.fn().mockResolvedValue({ success: true });
        jest.spyOn(COL.CollectionFactory, 'getInstance').mockReturnValue({ publish: publishFn } as unknown as COL.ICollection);
        // Keep the success-path audit emit hermetic: run the wrap inline, no tx, no row.
        jest.spyOn(AUDITTX, 'withAuditTransaction').mockImplementation(async (cb: () => Promise<unknown>) => cb());
        jest.spyOn(AuditFactory, 'emitSemantic').mockResolvedValue(undefined as never);
    });

    afterEach(() => jest.restoreAllMocks());

    test('denies when the caller cannot access the target (fail-closed), without publishing', async () => {
        jest.spyOn(Authorization, 'getContext').mockReturnValue(makeCtx(true));
        jest.spyOn(Authorization, 'canAccessSystemObject').mockResolvedValue(false);

        const res = await publish({} as any, args(100, COMMON.ePublishedState.ePublished));
        expect(res.success).toBe(false);
        expect(res.message).toBe(AUTH_ERROR.ACCESS_DENIED);
        expect(publishFn).not.toHaveBeenCalled();
    });

    test('denies a Subject publish for a non-admin (ADMIN_REQUIRED), without publishing', async () => {
        jest.spyOn(Authorization, 'getContext').mockReturnValue(makeCtx(false));
        jest.spyOn(Authorization, 'canAccessSystemObject').mockResolvedValue(true);
        jest.spyOn(CACHE.SystemObjectCache, 'getObjectFromSystem')
            .mockResolvedValue({ idObject: 5, eObjectType: COMMON.eSystemObjectType.eSubject } as DBAPI.ObjectIDAndType);

        const res = await publish({} as any, args(100, COMMON.ePublishedState.ePublished));
        expect(res.success).toBe(false);
        expect(res.message).toBe(AUTH_ERROR.ADMIN_REQUIRED);
        expect(publishFn).not.toHaveBeenCalled();
    });

    test('denies a Subject publish from a unit outside the allowlist, without publishing', async () => {
        jest.spyOn(Authorization, 'getContext').mockReturnValue(makeCtx(true));
        jest.spyOn(Authorization, 'canAccessSystemObject').mockResolvedValue(true);
        jest.spyOn(CACHE.SystemObjectCache, 'getObjectFromSystem')
            .mockResolvedValue({ idObject: 5, eObjectType: COMMON.eSystemObjectType.eSubject } as DBAPI.ObjectIDAndType);
        jest.spyOn(DBAPI.Subject, 'fetch').mockResolvedValue({ idSubject: 5, idUnit: 9 } as DBAPI.Subject);
        jest.spyOn(DBAPI.Unit, 'fetch').mockResolvedValue({ idUnit: 9, Abbreviation: SUBJECT_UNIT_NOT_ALLOWED } as DBAPI.Unit);

        expect(Config.features.subjectPublishUnitAllowlist).not.toContain(SUBJECT_UNIT_NOT_ALLOWED);
        const res = await publish({} as any, args(100, COMMON.ePublishedState.ePublished));
        expect(res.success).toBe(false);
        expect(res.message).toMatch(/Subject publishing is limited to units/);
        expect(publishFn).not.toHaveBeenCalled();
    });

    test('authorized scene publish calls ICol.publish with the intended state and emits a publish audit', async () => {
        jest.spyOn(Authorization, 'getContext').mockReturnValue(makeCtx(true));
        jest.spyOn(Authorization, 'canAccessSystemObject').mockResolvedValue(true);
        jest.spyOn(CACHE.SystemObjectCache, 'getObjectFromSystem')
            .mockResolvedValue({ idObject: 7, eObjectType: COMMON.eSystemObjectType.eScene } as DBAPI.ObjectIDAndType);
        jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
            .mockResolvedValue({ publishedStateEnum: () => COMMON.ePublishedState.eNotPublished } as unknown as DBAPI.SystemObjectVersion);
        const emit = jest.spyOn(AuditFactory, 'emitSemantic').mockResolvedValue(undefined as never);

        const res = await publish({} as any, args(100, COMMON.ePublishedState.ePublished));
        expect(res.success).toBe(true);
        expect(res.eState).toBe(COMMON.ePublishedState.ePublished);
        expect(publishFn).toHaveBeenCalledWith(100, COMMON.ePublishedState.ePublished);

        expect(emit).toHaveBeenCalledTimes(1);
        const emitArgs = emit.mock.calls[0][0] as { action: any; idSystemObject: number; payload: any };
        expect(emitArgs.action).toBe(DBAPI.eAuditType.eActionPublish);
        expect(emitArgs.idSystemObject).toBe(100);
        expect(emitArgs.payload).toEqual({
            before: { eState: COMMON.ePublishedState.eNotPublished, eStateName: COMMON.ePublishedState[COMMON.ePublishedState.eNotPublished] },
            after: { eState: COMMON.ePublishedState.ePublished, eStateName: COMMON.ePublishedState[COMMON.ePublishedState.ePublished] },
        });
    });

    test('unpublishing an authorized scene emits the unpublish action', async () => {
        jest.spyOn(Authorization, 'getContext').mockReturnValue(makeCtx(true));
        jest.spyOn(Authorization, 'canAccessSystemObject').mockResolvedValue(true);
        jest.spyOn(CACHE.SystemObjectCache, 'getObjectFromSystem')
            .mockResolvedValue({ idObject: 7, eObjectType: COMMON.eSystemObjectType.eScene } as DBAPI.ObjectIDAndType);
        jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
            .mockResolvedValue({ publishedStateEnum: () => COMMON.ePublishedState.ePublished } as unknown as DBAPI.SystemObjectVersion);
        const emit = jest.spyOn(AuditFactory, 'emitSemantic').mockResolvedValue(undefined as never);

        const res = await publish({} as any, args(100, COMMON.ePublishedState.eNotPublished));
        expect(res.success).toBe(true);
        expect(publishFn).toHaveBeenCalledWith(100, COMMON.ePublishedState.eNotPublished);
        expect((emit.mock.calls[0][0] as any).action).toBe(DBAPI.eAuditType.eActionUnpublish);
    });
});
