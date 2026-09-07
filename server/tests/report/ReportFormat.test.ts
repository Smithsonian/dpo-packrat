import * as COMMON from '@dpo-packrat/common';
import { ReportFormat } from '../../report/impl/ReportFormat';

// Pure-function coverage for the structured workflow-report format. No DB needed.
describe('Report: format (de)serialization', () => {
    test('parseEvents: empty body yields an empty array', () => {
        expect(ReportFormat.parseEvents('')).toEqual([]);
        expect(ReportFormat.parseEvents('[]')).toEqual([]);
    });

    test('parseEvents: round-trips a valid event array (unicode preserved)', () => {
        const events: COMMON.IWorkflowReportEvent[] = [
            { ts: '2026-08-16T13:45:26.000Z', phase: 'engine', code: COMMON.WorkflowReportCode.JobCreate, msg: 'Creating si-voyager-scene' },
            { ts: '2026-08-16T13:45:27.000Z', phase: 'cook', code: COMMON.WorkflowReportCode.JobStart, msg: 'xCharacters—Unicode', data: { cookJobId: 'abc' } }
        ];
        const parsed = ReportFormat.parseEvents(JSON.stringify(events));
        expect(parsed).toEqual(events);
        expect(parsed[1].msg).toBe('xCharacters—Unicode');
    });

    test('parseEvents: a non-empty, non-array body is preserved as one legacy.text event (never throws)', () => {
        const legacy = ReportFormat.parseEvents('some <b>old</b> html blob');
        expect(legacy).toHaveLength(1);
        expect(legacy[0].code).toBe(COMMON.WorkflowReportCode.LegacyText);
        expect(legacy[0].msg).toBe('some <b>old</b> html blob');

        const notArray = ReportFormat.parseEvents('{"a":1}');
        expect(notArray).toHaveLength(1);
        expect(notArray[0].code).toBe(COMMON.WorkflowReportCode.LegacyText);
    });

    test('serializeSummary: short summary is stored verbatim and re-parses', () => {
        const summary: COMMON.IWorkflowReportSummary = {
            subject: 'DPO Testing', idSubject: 1294, scene: 'xCharacters—Unicode', idScene: null as unknown as undefined,
            idModel: 614, idSystemObject: 12178, mediaGroup: 'Cook 1 Test (B)',
            cookServer: 'Cook Server: 1', cookJobId: '0d21006c', input: 'Model_Test.obj', recipe: 'si-voyager-scene'
        };
        const serialized = ReportFormat.serializeSummary(summary);
        expect(serialized.length).toBeLessThanOrEqual(COMMON.WorkflowReportSummaryMaxLength);
        expect(JSON.parse(serialized).idSystemObject).toBe(12178);
    });

    test('serializeSummary: over-length summary truncates NAMES, keeps ids, and stays valid JSON <= 512', () => {
        const summary: COMMON.IWorkflowReportSummary = {
            subject: 'S'.repeat(400), scene: 'C'.repeat(400), input: 'I'.repeat(400),
            idSubject: 1294, idScene: 555, idModel: 614, idSystemObject: 12178
        };
        const serialized = ReportFormat.serializeSummary(summary);
        expect(serialized.length).toBeLessThanOrEqual(COMMON.WorkflowReportSummaryMaxLength);
        const parsed = JSON.parse(serialized); // must not throw
        expect(parsed.idSystemObject).toBe(12178);
        expect(parsed.idSubject).toBe(1294);
        expect(parsed.idScene).toBe(555);
        expect(parsed.idModel).toBe(614);
    });

    test('serializeSummary: pathological names collapse to ids-only, still valid JSON', () => {
        const summary: COMMON.IWorkflowReportSummary = {
            subject: 'S'.repeat(5000), scene: 'C'.repeat(5000), input: 'I'.repeat(5000),
            idSystemObject: 12178, idScene: 555
        };
        const serialized = ReportFormat.serializeSummary(summary);
        expect(serialized.length).toBeLessThanOrEqual(COMMON.WorkflowReportSummaryMaxLength);
        const parsed = JSON.parse(serialized);
        expect(parsed.idSystemObject).toBe(12178);
        expect(parsed.idScene).toBe(555);
    });

    test('mergeJSONReports: a single report emits its own body (not wrapped in an array)', () => {
        const body = JSON.stringify([{ ts: '', phase: 'cook', code: 'x', msg: 'a' }]);
        const merged = ReportFormat.mergeJSONReports([body]);
        const parsed = JSON.parse(merged);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].code).toBe('x');
    });

    test('mergeJSONReports: a set emits an array of report bodies', () => {
        const a = JSON.stringify([{ code: 'a' }]);
        const b = JSON.stringify([{ code: 'b' }]);
        const parsed = JSON.parse(ReportFormat.mergeJSONReports([a, b]));
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(2);
        expect(parsed[0][0].code).toBe('a');
        expect(parsed[1][0].code).toBe('b');
    });

    test('mergeJSONReports: an unparseable body is preserved verbatim, not fatal', () => {
        const good = JSON.stringify([{ code: 'ok' }]);
        const parsed = JSON.parse(ReportFormat.mergeJSONReports([good, 'not json']));
        expect(parsed).toHaveLength(2);
        expect(parsed[1]).toBe('not json');
    });

    test('mergeJSONReports: empty body defaults to an empty array', () => {
        const parsed = JSON.parse(ReportFormat.mergeJSONReports(['']));
        expect(parsed).toEqual([]);
    });
});
