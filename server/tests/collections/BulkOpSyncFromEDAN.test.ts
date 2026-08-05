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
