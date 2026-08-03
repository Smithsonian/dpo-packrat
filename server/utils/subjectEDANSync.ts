import * as DBAPI from '../db';
import * as CACHE from '../cache';
import * as COL from '../collections/interface';
import { SubjectHelpers, SubjectTargetRecord } from './subjectHelpers';
import { RecordKeeper as RK } from '../records/recordKeeper';
import * as H from './helpers';

const SRC = 'Utils.SubjectEDANSync';

export enum eSubjectEDANSyncPhase {
    eIdle = 0,
    eRunning = 1,
    eCompleted = 2,
    eError = 3,
}

/** The three mutually exclusive outcomes a Subject resolves to (the §15.3 contract). */
export type eSubjectEDANSyncOutcome = 'Live' | 'NoRecordID' | 'NotFound';

/** One Subject's reconciliation result. `reason` is '' for Live and a human-readable explanation for
 * every unconfirmable Subject. `edanStatus` / `edanPublicSearch` are populated only when Live, so the
 * UI can distinguish a live-and-public record from one that exists but is unpublished/not searchable. */
export type SubjectEDANSyncResult = {
    idSystemObject: number;
    idSubject: number;
    name: string;
    unitCode: string;
    recordId: string;
    outcome: eSubjectEDANSyncOutcome;
    reason: string;
    edanStatus: number | null;
    edanPublicSearch: boolean | null;
};

export type SubjectEDANSyncSummary = { live: number; noRecordID: number; notFound: number };

export type SubjectEDANSyncProgress = {
    phase: eSubjectEDANSyncPhase;
    processed: number;
    total: number;
    startTime: string | null;
    endTime: string | null;
    error: string | null;
    summary: SubjectEDANSyncSummary;
};

/**
 * Read-only reconciliation sweep: walk every Subject, resolve its EDAN target record, and report
 * whether EDAN confirms it live. Modeled on the Solr (re)index job — an in-memory progress singleton
 * driven by a fire-and-forget async run that the client polls. Does NOT mutate PublishedState.
 */
export class SubjectEDANSync {
    private static _progress: SubjectEDANSyncProgress = SubjectEDANSync.idleProgress();
    private static _results: SubjectEDANSyncResult[] = [];
    private static _running: boolean = false;

    // Throttle between EDAN lookups so a full-Subject sweep does not hammer the collection API.
    private static readonly throttleMs: number = 100;

    private static idleProgress(): SubjectEDANSyncProgress {
        return { phase: eSubjectEDANSyncPhase.eIdle, processed: 0, total: 0, startTime: null, endTime: null,
            error: null, summary: { live: 0, noRecordID: 0, notFound: 0 } };
    }

    /** A defensive copy so a poll can never observe a partially mutated singleton. */
    static get progress(): SubjectEDANSyncProgress {
        return { ...SubjectEDANSync._progress, summary: { ...SubjectEDANSync._progress.summary } };
    }

    static get results(): SubjectEDANSyncResult[] {
        return [...SubjectEDANSync._results];
    }

    static get isRunning(): boolean {
        return SubjectEDANSync._running;
    }

    /** Start a sweep. Returns false when one is already running (the caller should report that). This
     * is awaited by run() internally but the route fires it without awaiting; progress is polled. */
    static async run(): Promise<boolean> {
        if (SubjectEDANSync._running)
            return false;
        SubjectEDANSync._running = true;
        SubjectEDANSync._results = [];
        SubjectEDANSync._progress = { ...SubjectEDANSync.idleProgress(),
            phase: eSubjectEDANSyncPhase.eRunning, startTime: new Date().toISOString() };

        try {
            await SubjectEDANSync.sweep();
            SubjectEDANSync._progress.phase = eSubjectEDANSyncPhase.eCompleted;
        } catch (error) {
            const message: string = H.Helpers.getErrorString(error);
            SubjectEDANSync._progress.phase = eSubjectEDANSyncPhase.eError;
            SubjectEDANSync._progress.error = message;
            RK.logError(RK.LogSection.eCOLL, 'subject EDAN sync failed', message, {}, SRC);
        } finally {
            SubjectEDANSync._progress.endTime = new Date().toISOString();
            SubjectEDANSync._running = false;
        }
        return true;
    }

    private static async sweep(): Promise<void> {
        const subjects: DBAPI.Subject[] | null = await DBAPI.Subject.fetchAll();
        if (!subjects)
            throw new Error('unable to fetch subjects');
        SubjectEDANSync._progress.total = subjects.length;

        const ICol: COL.ICollection = COL.CollectionFactory.getInstance();

        for (const subject of subjects) {
            const result: SubjectEDANSyncResult = await SubjectEDANSync.resolveSubject(subject, ICol);
            SubjectEDANSync._results.push(result);
            if (result.outcome === 'Live')
                SubjectEDANSync._progress.summary.live++;
            else if (result.outcome === 'NoRecordID')
                SubjectEDANSync._progress.summary.noRecordID++;
            else
                SubjectEDANSync._progress.summary.notFound++;
            SubjectEDANSync._progress.processed++;

            if (SubjectEDANSync.throttleMs > 0)
                await new Promise(resolve => setTimeout(resolve, SubjectEDANSync.throttleMs));
        }
    }

    private static async resolveSubject(subject: DBAPI.Subject, ICol: COL.ICollection): Promise<SubjectEDANSyncResult> {
        const base: SubjectEDANSyncResult = { idSystemObject: 0, idSubject: subject.idSubject, name: subject.Name,
            unitCode: '', recordId: '', outcome: 'NotFound', reason: '', edanStatus: null, edanPublicSearch: null };

        const soInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromSubject(subject);
        if (!soInfo || !soInfo.idSystemObject)
            return { ...base, outcome: 'NotFound', reason: 'Cannot confirm — no SystemObject for Subject' };
        base.idSystemObject = soInfo.idSystemObject;

        const target: SubjectTargetRecord = await SubjectHelpers.computeTargetRecord(soInfo.idSystemObject);
        base.unitCode = target.unitCode;
        base.recordId = target.recordId;

        if (!target.recordId)
            return { ...base, outcome: 'NoRecordID', reason: 'Cannot confirm — No EDAN Record ID' };

        try {
            const record: COL.EdanRecord | null = await ICol.fetchContent(undefined, target.url);
            if (!record)
                return { ...base, outcome: 'NotFound', reason: 'Cannot confirm — Not found on EDAN' };
            return { ...base, outcome: 'Live', reason: '',
                edanStatus: record.status ?? null, edanPublicSearch: record.publicSearch ?? null };
        } catch (error) {
            // A single EDAN lookup failure records Not found for this Subject and never aborts the run.
            RK.logError(RK.LogSection.eCOLL, 'subject EDAN sync lookup failed', H.Helpers.getErrorString(error),
                { idSystemObject: soInfo.idSystemObject, recordId: target.recordId }, SRC);
            return { ...base, outcome: 'NotFound', reason: 'Cannot confirm — Not found on EDAN' };
        }
    }
}
