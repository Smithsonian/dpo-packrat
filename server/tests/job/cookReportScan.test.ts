import * as COMMON from '@dpo-packrat/common';
import { scanCookReport } from '../../job/impl/Cook/CookReportScan';

describe('Cook: CookReportScan.scanCookReport', () => {
    test('a successful (done) report yields no findings', () => {
        const result = scanCookReport({ state: 'done', steps: { 'inspect-mesh': { log: [{ message: 'ok' }] } } });
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
    });

    test('an unknown tool termination is surfaced as a named CookError', () => {
        const result = scanCookReport({ state: 'error', error: 'Tool XNormal: terminated with code: 1' });
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(COMMON.WorkflowReportCode.CookError);
        expect(result.errors[0].level).toBe('error');
        expect(result.errors[0].message).toBe('Cook step "XNormal" failed. See the Cook report.');
    });

    test('Blender termination with an unsupported-zip log line reads as a corrupt zip', () => {
        const result = scanCookReport({
            state: 'error',
            error: 'Tool Blender: terminated with code: 1',
            steps: { 'inspect-mesh': { log: [{ message: 'Error: Unsupported file type: .zip' }] } }
        });
        expect(result.errors[0].message).toBe('Zip package is invalid or corrupt.');
    });

    test('Blender termination without the zip marker reads as a generic Blender failure', () => {
        const result = scanCookReport({ state: 'error', error: 'Tool Blender: terminated with code: 1' });
        expect(result.errors[0].message).toBe('Blender step failed. See the Cook report.');
    });

    test('MeshSmith termination with an invalid-vertex log line reads as a bad mesh', () => {
        const result = scanCookReport({
            state: 'error',
            error: 'Tool MeshSmith: terminated with code: 1',
            steps: { 'inspect-mesh': { log: [{ message: 'Invalid vertex index at 42' }] } }
        });
        expect(result.errors[0].message).toBe('Invalid mesh. Missing vertices or faces.');
    });

    test('an errored report with no top-level error falls back to a step error', () => {
        const result = scanCookReport({
            state: 'error',
            steps: { convert: { error: 'Tool Draco: terminated with code: 2' } }
        });
        expect(result.errors[0].message).toBe('Cook step "Draco" failed. See the Cook report.');
    });

    test('an unrecognized error string is surfaced verbatim', () => {
        const result = scanCookReport({ state: 'error', error: 'disk full while writing output' });
        expect(result.errors[0].message).toBe('disk full while writing output');
    });

    test('a non-object report is handled without throwing', () => {
        expect(scanCookReport(null).errors).toHaveLength(0);
        expect(scanCookReport('boom').errors).toHaveLength(0);
    });
});
