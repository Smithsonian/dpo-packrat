import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COL from '../../collections/interface';
import { SubjectHelpers, SubjectTargetRecord } from '../../utils/subjectHelpers';
import { SubjectEDANSync, eSubjectEDANSyncPhase } from '../../utils/subjectEDANSync';

// Minimal Subject stand-in; only idSubject + Name are read by the sweep.
function subject(idSubject: number, Name: string): DBAPI.Subject {
    return { idSubject, Name } as DBAPI.Subject;
}

function target(recordId: string, unitCode: string = 'NMNH'): SubjectTargetRecord {
    return { recordId, unitCode, dataSource: 'Unit', url: recordId ? `edanmdm:${recordId}` : '' };
}

describe('SubjectEDANSync — sweep outcome classification', () => {
    afterEach(() => jest.restoreAllMocks());

    test('classifies Live / NoRecordID / NotFound and accumulates the summary', async () => {
        // Four subjects: Live, no record id, not found on EDAN, and an EDAN lookup that throws.
        const subjects = [subject(1, 'Live One'), subject(2, 'No Record'), subject(3, 'Missing'), subject(4, 'Throws')];
        jest.spyOn(DBAPI.Subject, 'fetchAll').mockResolvedValue(subjects);

        // idSystemObject = idSubject * 10 for each.
        jest.spyOn(CACHE.SystemObjectCache, 'getSystemFromSubject')
            .mockImplementation(async (s: DBAPI.Subject) => ({ idSystemObject: s.idSubject * 10 } as DBAPI.SystemObjectInfo));

        const targets: { [id: number]: SubjectTargetRecord } = {
            10: target('rec-1'),
            20: target(''),        // no EDAN Record ID
            30: target('rec-3'),
            40: target('rec-4'),
        };
        jest.spyOn(SubjectHelpers, 'computeTargetRecord').mockImplementation(async (idSO: number) => targets[idSO]);

        const fetchContent = jest.fn(async (_id?: string, url?: string) => {
            if (url === 'edanmdm:rec-1') return { status: 0, publicSearch: true } as COL.EdanRecord;
            if (url === 'edanmdm:rec-3') return null;                      // not found
            if (url === 'edanmdm:rec-4') throw new Error('EDAN down');     // lookup error → NotFound, no abort
            return null;
        });
        jest.spyOn(COL.CollectionFactory, 'getInstance').mockReturnValue({ fetchContent } as unknown as COL.ICollection);

        const started: boolean = await SubjectEDANSync.run();
        expect(started).toBe(true);

        const progress = SubjectEDANSync.progress;
        expect(progress.phase).toBe(eSubjectEDANSyncPhase.eCompleted);
        expect(progress.total).toBe(4);
        expect(progress.processed).toBe(4);
        expect(progress.summary).toEqual({ live: 1, noRecordID: 1, notFound: 2 });
        expect(progress.error).toBeNull();
        expect(SubjectEDANSync.isRunning).toBe(false);

        const results = SubjectEDANSync.results;
        expect(results).toHaveLength(4);

        const live = results.find(r => r.idSubject === 1);
        expect(live?.outcome).toBe('Live');
        expect(live?.reason).toBe('');
        expect(live?.edanStatus).toBe(0);
        expect(live?.edanPublicSearch).toBe(true);

        expect(results.find(r => r.idSubject === 2)?.outcome).toBe('NoRecordID');
        expect(results.find(r => r.idSubject === 3)?.outcome).toBe('NotFound');
        // The throwing lookup is recorded as NotFound and did not abort the run.
        expect(results.find(r => r.idSubject === 4)?.outcome).toBe('NotFound');
    });

    test('sets the error phase when the Subject enumeration fails', async () => {
        jest.spyOn(DBAPI.Subject, 'fetchAll').mockResolvedValue(null);
        await SubjectEDANSync.run();
        const progress = SubjectEDANSync.progress;
        expect(progress.phase).toBe(eSubjectEDANSyncPhase.eError);
        expect(progress.error).toBeTruthy();
        expect(SubjectEDANSync.isRunning).toBe(false);
    });
});
