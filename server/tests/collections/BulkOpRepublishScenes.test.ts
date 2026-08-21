import * as DBAPI from '../../db';
import * as COL from '../../collections/interface';
import * as COMMON from '@dpo-packrat/common';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import * as AUDITTX from '../../audit/withAuditTransaction';
import { BulkOpJob } from '../../http/routes/api/bulkOps/BulkOpTypes';
import { republishScenes } from '../../http/routes/api/bulkOps/republishScenes';

type SceneStub = { idScene: number; Name: string; EdanUUID: string | null; ApprovedForPublication: boolean; PosedAndQCd: boolean };

// Wire the DB reads gather/apply make: scene idScene N ↔ idSystemObject N*1000, each returning the stub.
function stubScenes(scenes: SceneStub[], stateBySO: (idSystemObject: number) => COMMON.ePublishedState): void {
    const byScene: Map<number, SceneStub> = new Map(scenes.map(s => [s.idScene, s]));
    jest.spyOn(DBAPI.Scene, 'fetchAll').mockResolvedValue(scenes.map(s => ({ idScene: s.idScene })) as unknown as DBAPI.Scene[]);
    jest.spyOn(DBAPI.SystemObject, 'fetchFromSceneID')
        .mockImplementation(async (idScene: number) => ({ idSystemObject: idScene * 1000 } as DBAPI.SystemObject));
    jest.spyOn(DBAPI.SystemObject, 'fetch')
        .mockImplementation(async (idSystemObject: number) => ({ idScene: idSystemObject / 1000 } as DBAPI.SystemObject));
    jest.spyOn(DBAPI.Scene, 'fetch')
        .mockImplementation(async (idScene: number) => (byScene.get(idScene) as unknown as DBAPI.Scene) ?? null);
    // No audit event: currentPackratState falls back to the latest version's field.
    jest.spyOn(DBAPI.Audit, 'fetchLatestPublicationEvent').mockResolvedValue(null);
    jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
        .mockImplementation(async (idSystemObject: number) => ({ publishedStateEnum: () => stateBySO(idSystemObject) } as unknown as DBAPI.SystemObjectVersion));
}

describe('Bulk op: Republish Scenes', () => {
    afterEach(() => jest.restoreAllMocks());

    test('gather lists ever-published scenes; QC-blocked is report-only; never-published omitted', async () => {
        stubScenes([
            { idScene: 1, Name: 'Scene 1', EdanUUID: 'uuid-1', ApprovedForPublication: true, PosedAndQCd: true },
            { idScene: 2, Name: 'Scene 2', EdanUUID: 'uuid-2', ApprovedForPublication: false, PosedAndQCd: true },
            { idScene: 3, Name: 'Scene 3', EdanUUID: null, ApprovedForPublication: true, PosedAndQCd: true },
        ], () => COMMON.ePublishedState.ePublished);

        await BulkOpJob.run(republishScenes, { params: {} });
        const rows = BulkOpJob.rows;
        expect(rows).toHaveLength(2); // scene 3 (no EdanUUID) omitted

        const ok = rows.find(r => r.id === 1000);
        expect(ok?.isCandidate).toBe(true);
        expect(ok?.rowData.currentStatus).toBe(COMMON.PublishedStateEnumToString(COMMON.ePublishedState.ePublished));
        expect(ok?.rowData.edanRecord).toBe('uuid-1');
        expect(ok?.defaultSettings.targetState).toBe(String(COMMON.ePublishedState.ePublished));

        const blocked = rows.find(r => r.id === 2000);
        expect(blocked?.isCandidate).toBe(false); // not Approved → report-only
        expect(blocked?.rowData.note).toMatch(/publish blocked/i);
    });

    test('apply republishes a QC-approved scene: calls ICol.publish + emits publish audit', async () => {
        stubScenes([{ idScene: 1, Name: 'Scene 1', EdanUUID: 'uuid-1', ApprovedForPublication: true, PosedAndQCd: true }],
            () => COMMON.ePublishedState.eNotPublished);
        const publish = jest.fn().mockResolvedValue({ success: true });
        jest.spyOn(COL.CollectionFactory, 'getInstance').mockReturnValue({ publish } as unknown as COL.ICollection);
        const emit = jest.spyOn(AuditFactory, 'emitSemantic').mockResolvedValue(undefined as never);
        jest.spyOn(AUDITTX, 'withAuditTransaction').mockImplementation(async (cb: () => Promise<unknown>) => cb());

        const res = await republishScenes.apply(1000, { targetState: String(COMMON.ePublishedState.ePublished) }, 5, {});
        expect(res.success).toBe(true);
        expect(publish).toHaveBeenCalledWith(1000, COMMON.ePublishedState.ePublished);
        expect(emit).toHaveBeenCalledWith(expect.objectContaining({ action: DBAPI.eAuditType.eActionPublish }));
        expect(res.rowData.currentStatus).toBe(COMMON.PublishedStateEnumToString(COMMON.ePublishedState.ePublished));
    });

    test('apply refuses a publish target for a QC-blocked scene without touching EDAN', async () => {
        stubScenes([{ idScene: 1, Name: 'Scene 1', EdanUUID: 'uuid-1', ApprovedForPublication: false, PosedAndQCd: true }],
            () => COMMON.ePublishedState.eNotPublished);
        const publish = jest.fn();
        jest.spyOn(COL.CollectionFactory, 'getInstance').mockReturnValue({ publish } as unknown as COL.ICollection);

        const res = await republishScenes.apply(1000, { targetState: String(COMMON.ePublishedState.ePublished) }, 5, {});
        expect(res.success).toBe(false);
        expect(res.message).toMatch(/refused/i);
        expect(publish).not.toHaveBeenCalled();
    });

    test('apply allows unpublishing a QC-blocked scene', async () => {
        stubScenes([{ idScene: 1, Name: 'Scene 1', EdanUUID: 'uuid-1', ApprovedForPublication: false, PosedAndQCd: false }],
            () => COMMON.ePublishedState.ePublished);
        const publish = jest.fn().mockResolvedValue({ success: true });
        jest.spyOn(COL.CollectionFactory, 'getInstance').mockReturnValue({ publish } as unknown as COL.ICollection);
        jest.spyOn(AuditFactory, 'emitSemantic').mockResolvedValue(undefined as never);
        const tx = jest.spyOn(AUDITTX, 'withAuditTransaction').mockImplementation(async (cb: () => Promise<unknown>) => cb());

        const res = await republishScenes.apply(1000, { targetState: String(COMMON.ePublishedState.eNotPublished) }, 5, {});
        expect(res.success).toBe(true);
        expect(publish).toHaveBeenCalledWith(1000, COMMON.ePublishedState.eNotPublished);
        expect(tx).toHaveBeenCalled();
    });

    test('apply rejects an invalid target state', async () => {
        const res = await republishScenes.apply(1000, { targetState: 'nonsense' }, 5, {});
        expect(res.success).toBe(false);
        expect(res.message).toMatch(/invalid target state/i);
    });

    test('apply surfaces an EDAN publish failure', async () => {
        stubScenes([{ idScene: 1, Name: 'Scene 1', EdanUUID: 'uuid-1', ApprovedForPublication: true, PosedAndQCd: true }],
            () => COMMON.ePublishedState.eNotPublished);
        jest.spyOn(COL.CollectionFactory, 'getInstance')
            .mockReturnValue({ publish: jest.fn().mockResolvedValue({ success: false, error: 'EDAN unreachable' }) } as unknown as COL.ICollection);

        const res = await republishScenes.apply(1000, { targetState: String(COMMON.ePublishedState.ePublished) }, 5, {});
        expect(res.success).toBe(false);
        expect(res.message).toBe('EDAN unreachable');
    });
});
