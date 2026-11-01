/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildPartialStateFailurePayload, IngestPartialState } from '../../graphql/schema/ingestion/resolvers/mutations/ingestData';

/**
 * The partial-state failure path in ingestData builds one structured cleanup
 * payload (emitted via logCritical and a semantic audit row). These tests invoke
 * the real, exported payload builder — the same code the resolver runs — so a
 * change to the payload shape or recovery hints is caught here. The resolver
 * wiring (that this payload reaches logCritical + the audit row) is covered by
 * the integration suite.
 */
describe('Ingest partial-state failure payload', () => {
    function state(overrides: Partial<IngestPartialState>): IngestPartialState {
        return {
            phase: 'init',
            idSubjects: [], idItems: [], idProjects: [],
            idCaptureDatas: [], idModels: [], idScenes: [], idOthers: [],
            idAssetVersionsStaged: [],
            correlationId: null, startedMs: Date.now(),
            ...overrides,
        };
    }

    test('pre-storage failure: no staged asset versions; hint says no storage to clean', () => {
        const payload: any = buildPartialStateFailurePayload(
            state({ phase: 'pre-storage', idSubjects: [101], correlationId: 'corr-1', startedMs: Date.now() - 50 }),
            'failure to retrieve or create media group', null, 42);
        expect(payload.sentinel).toBe('INGEST_PARTIAL_STATE_FAILURE');
        expect(payload.phase).toBe('pre-storage');
        expect(payload.recoveryHint).toContain('no storage cleanup');
        expect(payload.ids.idSubjects).toEqual([101]);
        expect(payload.ids.idAssetVersionsStaged).toEqual([]);
        expect(payload.counts.subjects).toBe(1);
        expect(payload.correlationId).toBe('corr-1');
        expect(payload.idUser).toBe(42);
        expect(payload.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('storage failure: staged asset versions listed; error message captured', () => {
        const payload: any = buildPartialStateFailurePayload(
            state({ phase: 'storage', idSubjects: [101], idItems: [202], idAssetVersionsStaged: [301, 302], startedMs: Date.now() - 1000 }),
            'promotion crashed', new Error('disk full'), 7);
        expect(payload.phase).toBe('storage');
        expect(payload.recoveryHint).toContain('mid-storage failure');
        expect(payload.ids.idAssetVersionsStaged).toEqual([301, 302]);
        expect(payload.counts.assetVersionsStaged).toBe(2);
        expect(payload.errorMessage).toBe('disk full');
        expect(payload.errorStack).toBeDefined();
    });

    test('post-storage failure: hint references derived objects + asset cleanup', () => {
        const payload: any = buildPartialStateFailurePayload(
            state({ phase: 'post-storage', idItems: [202], idScenes: [501], idAssetVersionsStaged: [301, 302, 303], correlationId: 'corr-2', startedMs: Date.now() - 500 }),
            'failure to wire media group to asset owner', null, null);
        expect(payload.phase).toBe('post-storage');
        expect(payload.recoveryHint).toContain('post-storage failure');
        expect(payload.ids.idAssetVersionsStaged.length).toBe(3);
        expect(payload.counts.assetVersionsStaged).toBe(3);
        expect(payload.idUser).toBeNull();
    });

    test('workflow failure: hint says trigger Cook manually, no data loss', () => {
        const payload: any = buildPartialStateFailurePayload(
            state({ phase: 'workflow', idAssetVersionsStaged: [301], correlationId: 'corr-3', startedMs: Date.now() - 100 }),
            'failure to notify workflow engine about ingestion event', null, 42);
        expect(payload.phase).toBe('workflow');
        expect(payload.recoveryHint).toContain('trigger Cook manually');
        expect(payload.errorMessage).toBeUndefined();
    });

    test('init failure carries the sentinel and a non-Error reason string', () => {
        const payload: any = buildPartialStateFailurePayload(
            state({ phase: 'init' }), 'threw', 'boom-string', 42);
        expect(payload.sentinel).toBe('INGEST_PARTIAL_STATE_FAILURE');
        expect(payload.phase).toBe('init');
        expect(payload.recoveryHint).toContain('no storage cleanup');
        expect(payload.errorMessage).toBe('boom-string');
    });
});
