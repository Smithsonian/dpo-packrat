import * as COMMON from '@dpo-packrat/common';

// Pure-function coverage for the custom/auxiliary download contract (P1/P2). No DB or EDAN needed.
describe('Custom Downloads: common contract', () => {
    test('EDAN file_quality mapping (boundary translation)', () => {
        // P1: only Watertight is corrected; the rest pass through unchanged (zero regression)
        expect(COMMON.toEdanFileQuality('Watertight')).toEqual('Water_tight');
        expect(COMMON.toEdanFileQuality('Full resolution')).toEqual('Full resolution');
        expect(COMMON.toEdanFileQuality('Low resolution')).toEqual('Low resolution');
        expect(COMMON.toEdanFileQuality('iOS AR model')).toEqual('iOS AR model');
        // unknown values pass through untouched
        expect(COMMON.toEdanFileQuality('SomethingElse')).toEqual('SomethingElse');
        // every category is present in the single source map
        expect(Object.keys(COMMON.EdanFileQualityMap)).toEqual(
            expect.arrayContaining(['Full resolution', 'Medium resolution', 'Low resolution', 'Watertight', 'iOS AR model']));
    });

    test('custom download usage helpers', () => {
        expect(COMMON.customDownloadUsage('watertight')).toEqual('Download:watertight');
        expect(COMMON.customDownloadUsage('other')).toEqual('Download:other');

        expect(COMMON.isCustomDownloadUsage('Download:watertight')).toBe(true);
        expect(COMMON.isCustomDownloadUsage('Download:other')).toBe(true);
        // Cook download usages and non-custom usages are not custom downloads
        expect(COMMON.isCustomDownloadUsage('Download:objZipLow')).toBe(false);
        expect(COMMON.isCustomDownloadUsage('App3D')).toBe(false);
        expect(COMMON.isCustomDownloadUsage(null)).toBe(false);
        expect(COMMON.isCustomDownloadUsage(undefined)).toBe(false);
    });

    test('download type whitelist', () => {
        expect(COMMON.CustomDownloadTypes).toEqual(['watertight', 'other']);
    });

    test('accepted vs must-zip upload extensions', () => {
        // raw-shippable (each maps to an EDAN file_type)
        expect(COMMON.CustomDownloadAcceptedExtensions).toEqual(expect.arrayContaining(['.glb', '.ply', '.usdz', '.zip']));
        // valid model formats with no standalone EDAN file_type -> must be zipped
        expect(COMMON.CustomDownloadMustZipExtensions).toEqual(expect.arrayContaining(['.obj', '.stl']));
        // the two sets must not overlap
        for (const ext of COMMON.CustomDownloadMustZipExtensions)
            expect(COMMON.CustomDownloadAcceptedExtensions).not.toContain(ext);
    });

    test('Cook download suffixes (masquerade guard source)', () => {
        expect(COMMON.CookDownloadFileSuffixes).toEqual(expect.arrayContaining([
            '4096_std.glb', '4096-gltf_std.zip', '2048_std_draco.glb',
            '2048_std.usdz', 'full_resolution-obj_std.zip', '4096-obj_std.zip',
        ]));
    });
});
