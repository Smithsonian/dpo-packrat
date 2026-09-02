import * as COMMON from '@dpo-packrat/common';
import { scanCookReport, collectInspectionWarnings, collectCookLogWarnings } from '../../job/impl/Cook/CookReportScan';

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

describe('Cook: CookReportScan.collectInspectionWarnings', () => {
    // Material shapes mirror real Cook inspection output: an empty/unmatched .mtl resolves to a
    // default material carrying only a roughness channel (idJobRun 611/616), a healthy material
    // carries a diffuse channel (idJobRun 612/613).
    const emptyMaterial = { name: 'Material', channels: [{ type: 'roughness', value: '1.0' }] };
    const texturedMaterial = { name: 'Material', channels: [{ type: 'reflection' }, { type: 'diffuse', uri: 'Box_Test_Txr.png' }] };
    const withMesh = (statistics: Record<string, unknown>, materials: Record<string, unknown>[] = [texturedMaterial]) =>
        ({ scene: { materials }, meshes: [{ statistics }] });

    test('a healthy textured model yields no warnings', () => {
        const warnings = collectInspectionWarnings(withMesh({ hasNormals: true }));
        expect(warnings).toHaveLength(0);
    });

    test('a mesh without normals warns (non-blocking)', () => {
        const warnings = collectInspectionWarnings(withMesh({ hasNormals: false }));
        expect(warnings).toHaveLength(1);
        expect(warnings[0].code).toBe(COMMON.WorkflowReportCode.CookWarning);
        expect(warnings[0].level).toBe('warn');
        expect(warnings[0].message).toMatch(/no normals/i);
    });

    test('an empty/unmatched material (no diffuse channel) warns', () => {
        const warnings = collectInspectionWarnings(withMesh({ hasNormals: true }, [emptyMaterial]));
        expect(warnings).toHaveLength(1);
        expect(warnings[0].message).toMatch(/no diffuse channel/i);
    });

    test('a solid-colour material with a diffuse value is not flagged', () => {
        const solidColour = { name: 'Material', channels: [{ type: 'diffuse', value: '1.0, 1.0, 1.0, 1.0' }] };
        const warnings = collectInspectionWarnings(withMesh({ hasNormals: true }, [solidColour]));
        expect(warnings).toHaveLength(0);
    });

    test('both advisories can fire together', () => {
        const warnings = collectInspectionWarnings(withMesh({ hasNormals: false }, [emptyMaterial]));
        expect(warnings).toHaveLength(2);
    });

    test('a missing/garbage inspection root yields no warnings', () => {
        expect(collectInspectionWarnings(null)).toHaveLength(0);
        expect(collectInspectionWarnings({})).toHaveLength(0);
        expect(collectInspectionWarnings('nope')).toHaveLength(0);
    });
});

describe('Cook: CookReportScan.collectCookLogWarnings', () => {
    // Log shape mirrors real Cook output: { time, level, message }. The offending lines carry a
    // '[ISSUE]' prefix but land at level 'debug', so the rules key off message content, not level.
    const reportWith = (...msgs: string[]) =>
        ({ state: 'done', steps: { 'inspect-mesh': { log: msgs.map(message => ({ level: 'debug', message })) } } });

    test('a missing texture image (Cannot load image file) warns', () => {
        const warnings = collectCookLogWarnings(reportWith('[ISSUE] io.image | WARNING Cannot load image file: Box_Test_Txr.png'));
        expect(warnings).toHaveLength(1);
        expect(warnings[0].code).toBe(COMMON.WorkflowReportCode.CookWarning);
        expect(warnings[0].level).toBe('warn');
        expect(warnings[0].message).toMatch(/texture image could not be loaded/i);
    });

    test('a missing/unreadable .mtl (cannot read from MTL file) warns', () => {
        const warnings = collectCookLogWarnings(reportWith('[ISSUE] io.obj | ERROR OBJ import: cannot read from MTL file: \'Model_Test_xMtl.mtl\''));
        expect(warnings).toHaveLength(1);
        expect(warnings[0].message).toMatch(/material library \(\.mtl\) could not be read/i);
    });

    test('benign engine chatter (DeprecationWarning) is not surfaced', () => {
        const warnings = collectCookLogWarnings(reportWith('[ISSUE] BlenderInspectMesh.py:320: DeprecationWarning: \'Material.use_nodes\' is expected to be removed in Blender 6.0'));
        expect(warnings).toHaveLength(0);
    });

    test('each distinct problem is reported once even across repeated log lines', () => {
        const warnings = collectCookLogWarnings(reportWith(
            'WARNING Cannot load image file: a.png',
            'WARNING Cannot load image file: b.png',
        ));
        expect(warnings).toHaveLength(1);
    });

    test('scanCookReport folds log warnings into a successful report', () => {
        const result = scanCookReport(reportWith('WARNING Cannot load image file: Box_Test_Txr.png'));
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].code).toBe(COMMON.WorkflowReportCode.CookWarning);
    });

    test('image-load warnings are suppressed for si-packrat-inspect (textures are not sent to it)', () => {
        const report = { state: 'done', recipe: { name: 'si-packrat-inspect' },
            steps: { 'inspect-mesh': { log: [{ level: 'debug', message: '[ISSUE] io.obj | WARNING Cannot load image file: DPO_Testing-150k-4096-diffuse.jpg' }] } } };
        expect(collectCookLogWarnings(report)).toHaveLength(0);
    });

    test('an unreadable .mtl still warns for si-packrat-inspect (the .mtl IS sent to it)', () => {
        const report = { state: 'done', recipe: { name: 'si-packrat-inspect' },
            steps: { 'inspect-mesh': { log: [{ level: 'debug', message: 'ERROR OBJ import: cannot read from MTL file: \'Model_Test.mtl\'' }] } } };
        const warnings = collectCookLogWarnings(report);
        expect(warnings).toHaveLength(1);
        expect(warnings[0].message).toMatch(/material library \(\.mtl\) could not be read/i);
    });

    test('a non-object report is handled without throwing', () => {
        expect(collectCookLogWarnings(null)).toHaveLength(0);
        expect(collectCookLogWarnings('boom')).toHaveLength(0);
    });
});
