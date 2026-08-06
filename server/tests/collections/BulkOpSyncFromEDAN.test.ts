/* eslint-disable camelcase */
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COL from '../../collections/interface';
import * as COMMON from '@dpo-packrat/common';
import { SubjectHelpers } from '../../utils/subjectHelpers';
import { BulkOpJob } from '../../http/routes/api/bulkOps/BulkOpTypes';
import { syncFromEDAN } from '../../http/routes/api/bulkOps/syncFromEDAN';

describe('Bulk op: Sync from EDAN — gather via the async harness job', () => {
    afterEach(() => jest.restoreAllMocks());

    test('classifies drift vs in-sync and defaults each row to the EDAN state', async () => {
        // Subject 1 (idSO 10): Packrat says Not Published, EDAN says Public → drift (a candidate).
        // Subject 2 (idSO 20): no EDAN Record ID → cannot confirm, not a candidate.
        jest.spyOn(DBAPI.Subject, 'fetchAll').mockResolvedValue([
            { idSubject: 1, Name: 'Drifted' }, { idSubject: 2, Name: 'No Record' },
        ] as unknown as DBAPI.Subject[]);
        jest.spyOn(CACHE.SystemObjectCache, 'getSystemFromSubject')
            .mockImplementation(async (s: DBAPI.Subject) => ({ idSystemObject: s.idSubject * 10 } as DBAPI.SystemObjectInfo));
        jest.spyOn(SubjectHelpers, 'computeTargetRecord').mockImplementation(async (idSO: number) =>
            idSO === 10
                ? { recordId: 'rec-1', unitCode: 'NMNH', dataSource: 'Unit', url: 'edanmdm:rec-1' }
                : { recordId: '', unitCode: '', dataSource: '', url: '' });

        // No publish/unpublish audit event → current Packrat state falls back to the latest version field.
        jest.spyOn(DBAPI.Audit, 'fetchLatestPublicationEvent').mockResolvedValue(null);
        jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
            .mockResolvedValue({ publishedStateEnum: () => COMMON.ePublishedState.eNotPublished } as DBAPI.SystemObjectVersion);

        const fetchContent = jest.fn(async (_id?: string, url?: string) =>
            url === 'edanmdm:rec-1' ? ({ status: 0, publicSearch: true } as COL.EdanRecord) : null);
        jest.spyOn(COL.CollectionFactory, 'getInstance').mockReturnValue({ fetchContent } as unknown as COL.ICollection);

        const started: boolean = await BulkOpJob.run(syncFromEDAN, { params: { targetType: 'subject' } });
        expect(started).toBe(true);

        const progress = BulkOpJob.progress;
        expect(progress.phase).toBe('completed');
        expect(progress.operation).toBe('syncFromEDAN');
        expect(progress.total).toBe(2);
        expect(progress.processed).toBe(2);

        const rows = BulkOpJob.rows;
        expect(rows).toHaveLength(2);

        const drifted = rows.find(r => r.id === 10);
        expect(drifted?.isCandidate).toBe(true);
        expect(drifted?.rowData.packratState).toBe('Not Published');
        expect(drifted?.rowData.edanState).toBe('Public');
        expect(drifted?.rowData.edanSearchable).toBe('Yes');
        // Default reconcile target is EDAN's state; current is the local state.
        expect(drifted?.defaultSettings.targetState).toBe(String(COMMON.ePublishedState.ePublished));
        expect(drifted?.current.targetState).toBe(String(COMMON.ePublishedState.eNotPublished));

        const noRecord = rows.find(r => r.id === 20);
        expect(noRecord?.isCandidate).toBe(false);
        expect(noRecord?.rowData.note).toBe('No EDAN Record ID');
        expect(noRecord?.rowData.edanState).toBe('Not Published');
    });

    test('normalizes an already-prefixed record id (no double edanmdm)', async () => {
        jest.spyOn(DBAPI.Subject, 'fetchAll').mockResolvedValue([{ idSubject: 1, Name: 'Prefixed' }] as unknown as DBAPI.Subject[]);
        jest.spyOn(CACHE.SystemObjectCache, 'getSystemFromSubject')
            .mockResolvedValue({ idSystemObject: 10 } as DBAPI.SystemObjectInfo);
        // The stored record id already carries the scheme; computeTargetRecord's url double-prefixes it.
        jest.spyOn(SubjectHelpers, 'computeTargetRecord')
            .mockResolvedValue({ recordId: 'edanmdm:nmah_1', unitCode: '', dataSource: '', url: 'edanmdm:edanmdm:nmah_1' });
        jest.spyOn(DBAPI.Audit, 'fetchLatestPublicationEvent').mockResolvedValue(null);
        jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
            .mockResolvedValue({ publishedStateEnum: () => COMMON.ePublishedState.eNotPublished } as DBAPI.SystemObjectVersion);
        const fetchContent = jest.fn(async () => null);
        jest.spyOn(COL.CollectionFactory, 'getInstance').mockReturnValue({ fetchContent } as unknown as COL.ICollection);

        await BulkOpJob.run(syncFromEDAN, { params: { targetType: 'subject' } });
        // The lookup uses the normalized single-scheme url, not the double-prefixed one.
        expect(fetchContent).toHaveBeenCalledWith(undefined, 'edanmdm:nmah_1');
    });

    test('caps the number of items via the limit param', async () => {
        const subs = Array.from({ length: 5 }, (_v, i) => ({ idSubject: i + 1, Name: `S${i + 1}` }));
        jest.spyOn(DBAPI.Subject, 'fetchAll').mockResolvedValue(subs as unknown as DBAPI.Subject[]);
        jest.spyOn(CACHE.SystemObjectCache, 'getSystemFromSubject')
            .mockImplementation(async (s: DBAPI.Subject) => ({ idSystemObject: s.idSubject * 10 } as DBAPI.SystemObjectInfo));
        jest.spyOn(SubjectHelpers, 'computeTargetRecord')
            .mockResolvedValue({ recordId: '', unitCode: '', dataSource: '', url: '' });
        jest.spyOn(DBAPI.Audit, 'fetchLatestPublicationEvent').mockResolvedValue(null);
        jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
            .mockResolvedValue({ publishedStateEnum: () => COMMON.ePublishedState.eNotPublished } as DBAPI.SystemObjectVersion);
        const fetchContent = jest.fn(async () => null);
        jest.spyOn(COL.CollectionFactory, 'getInstance').mockReturnValue({ fetchContent } as unknown as COL.ICollection);

        await BulkOpJob.run(syncFromEDAN, { params: { targetType: 'subject', limit: '2' } });
        expect(BulkOpJob.progress.total).toBe(2);
        expect(BulkOpJob.rows).toHaveLength(2);
    });

    test('completes with zero rows when there are no subjects', async () => {
        jest.spyOn(DBAPI.Subject, 'fetchAll').mockResolvedValue(null);
        jest.spyOn(COL.CollectionFactory, 'getInstance')
            .mockReturnValue({ fetchContent: jest.fn() } as unknown as COL.ICollection);
        // gather returns an empty list (no subjects) rather than throwing → completes with zero rows.
        await BulkOpJob.run(syncFromEDAN, { params: { targetType: 'subject' } });
        const progress = BulkOpJob.progress;
        expect(progress.phase).toBe('completed');
        expect(progress.total).toBe(0);
        expect(BulkOpJob.rows).toHaveLength(0);
    });
});

describe('Bulk op: Sync from EDAN — Models (report-only backfill discovery)', () => {
    afterEach(() => jest.restoreAllMocks());

    test('flags a model whose EDAN record has a scene but Packrat does not', async () => {
        // Model 1: EDAN record carries a Voyager scene, Packrat has none → backfill candidate.
        // Model 2: EDAN record has no 3D, Packrat already has a scene → not a candidate.
        jest.spyOn(DBAPI.Model, 'fetchAll').mockResolvedValue([
            { idModel: 1, Name: 'Master A' }, { idModel: 2, Name: 'Master B' },
        ] as unknown as DBAPI.Model[]);
        jest.spyOn(DBAPI.SystemObject, 'fetchFromModelID')
            .mockImplementation(async (idModel: number) => ({ idSystemObject: idModel * 100 } as DBAPI.SystemObject));

        // Model 1 has no Packrat scene; Model 2 has one (idScene 5, idSystemObject 500).
        jest.spyOn(DBAPI.Scene, 'fetchFromXref')
            .mockImplementation(async (idModel: number) => idModel === 2 ? ([{ idScene: 5 }] as unknown as DBAPI.Scene[]) : null);
        jest.spyOn(DBAPI.SystemObject, 'fetchFromSceneID').mockResolvedValue({ idSystemObject: 500 } as DBAPI.SystemObject);

        // Owning-subject resolution: Model -> Items -> Subjects -> EDAN Record ID.
        jest.spyOn(DBAPI.Item, 'fetchMasterFromModels')
            .mockImplementation(async (ids: number[]) => [{ idItem: ids[0] * 10 }] as unknown as DBAPI.Item[]);
        jest.spyOn(DBAPI.Subject, 'fetchMasterFromItems')
            .mockImplementation(async (ids: number[]) => [{ idSubject: ids[0] / 10 }] as unknown as DBAPI.Subject[]);
        jest.spyOn(DBAPI.SystemObject, 'fetchFromSubjectID')
            .mockImplementation(async (idSubject: number) => ({ idSystemObject: idSubject * 1000 } as DBAPI.SystemObject));
        jest.spyOn(SubjectHelpers, 'computeTargetRecord').mockImplementation(async (idSO: number) => {
            const idModel = idSO / 1000;
            return { recordId: `rec-M${idModel}`, unitCode: '', dataSource: '', url: `edanmdm:rec-M${idModel}` };
        });

        // No publish event → current scene state falls back to the version field (Public for the scene).
        jest.spyOn(DBAPI.Audit, 'fetchLatestPublicationEvent').mockResolvedValue(null);
        jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
            .mockResolvedValue({ publishedStateEnum: () => COMMON.ePublishedState.ePublished } as DBAPI.SystemObjectVersion);

        const fetchContent = jest.fn(async (_id?: string, url?: string) => {
            if (url === 'edanmdm:rec-M1') return { status: 0, publicSearch: true, content: { online_media: { media: [{ voyagerId: 'abc' }] } } } as unknown as COL.EdanRecord;
            if (url === 'edanmdm:rec-M2') return { status: 0, publicSearch: false, content: { online_media: { media: [{ idsId: 'x' }] } } } as unknown as COL.EdanRecord;
            return null;
        });
        jest.spyOn(COL.CollectionFactory, 'getInstance').mockReturnValue({ fetchContent } as unknown as COL.ICollection);

        await BulkOpJob.run(syncFromEDAN, { params: { targetType: 'model' } });
        expect(BulkOpJob.progress.phase).toBe('completed');
        const rows = BulkOpJob.rows;
        expect(rows).toHaveLength(2);

        const backfill = rows.find(r => r.id === 100);
        expect(backfill?.isCandidate).toBe(true);
        expect(backfill?.rowData.edanState).toBe('Scene present');
        expect(backfill?.rowData.packratState).toBe('No Scene');
        expect(backfill?.rowData.note).toContain('backfill candidate');

        const hasScene = rows.find(r => r.id === 200);
        expect(hasScene?.isCandidate).toBe(false);
        expect(hasScene?.rowData.edanState).toBe('No 3D scene');
        expect(hasScene?.rowData.packratState).toBe('Scene: Public');
        expect(hasScene?.rowData.note).toBe('Packrat scene only');
    });

    test('apply is report-only for models (no change)', async () => {
        const res = await syncFromEDAN.apply(100, {}, 1, { targetType: 'model' });
        expect(res.success).toBe(false);
        expect(res.message).toContain('report-only');
    });
});
