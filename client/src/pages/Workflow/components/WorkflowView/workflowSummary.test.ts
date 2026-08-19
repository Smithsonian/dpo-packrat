import { parseWorkflowSummary } from './workflowSummary';

describe('parseWorkflowSummary', () => {
    test('parses a valid JSON summary from an application/json row', () => {
        const summary = { subject: 'DPO Testing', idSystemObject: 12178, cookServer: 'Cook Server: 1', cookJobId: 'abc' };
        const result = parseWorkflowSummary({ ReportMimeType: 'application/json', Summary: JSON.stringify(summary) });
        expect(result).not.toBeNull();
        expect(result?.idSystemObject).toBe(12178);
        expect(result?.cookServer).toBe('Cook Server: 1');
    });

    test('returns null for legacy (non-JSON) rows', () => {
        const result = parseWorkflowSummary({ ReportMimeType: 'text/html', Summary: '{"idSystemObject":1}' });
        expect(result).toBeNull();
    });

    test('returns null when the summary is absent', () => {
        expect(parseWorkflowSummary({ ReportMimeType: 'application/json', Summary: null })).toBeNull();
        expect(parseWorkflowSummary({ ReportMimeType: 'application/json' })).toBeNull();
    });

    test('returns null for invalid JSON rather than throwing', () => {
        expect(parseWorkflowSummary({ ReportMimeType: 'application/json', Summary: 'not json' })).toBeNull();
    });

    test('returns null for null/undefined rows', () => {
        expect(parseWorkflowSummary(null)).toBeNull();
        expect(parseWorkflowSummary(undefined)).toBeNull();
    });
});
