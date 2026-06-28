import * as COMMON from '@dpo-packrat/common';

// Pure-function coverage for the custom/auxiliary download contract (P1/P2). No DB or EDAN needed.
describe('Custom Downloads: common contract', () => {
    test('EDAN file_quality mapping (boundary translation)', () => {
        // internal category -> exact EDAN file_quality wire token
        expect(COMMON.toEdanFileQuality('Watertight')).toEqual('Water_tight');
        expect(COMMON.toEdanFileQuality('Full resolution')).toEqual('Full_resolution');
        expect(COMMON.toEdanFileQuality('Medium resolution')).toEqual('Medium_resolution');
        expect(COMMON.toEdanFileQuality('Low resolution')).toEqual('Low_resolution');
        expect(COMMON.toEdanFileQuality('iOS AR model')).toEqual('iOS AR model'); // not a file_quality token; as-is
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

// A8: the four formerly-hardcoded Cook suffix lists now derive from CookDownloadDescriptors. These
// tests pin the central source to the exact strings each site used, proving the refactor is
// behavior-preserving.
describe('Cook download single source of truth (A8)', () => {
    const sortEq = (a: string[], b: string[]) => expect([...a].sort()).toEqual([...b].sort());

    test('short form matches the former ModelSceneXref.isDownloadable() list', () => {
        sortEq(COMMON.cookDownloadSuffixes('short'), [
            '4096_std.glb', '4096-gltf_std.zip', '2048_std_draco.glb',
            '2048_std.usdz', 'full_resolution-obj_std.zip', '4096-obj_std.zip',
        ]);
        sortEq(COMMON.CookDownloadFileSuffixes, COMMON.cookDownloadSuffixes('short'));
    });

    test('full form matches the former verifyIncomingCookData download suffixes (excl. .svx.json)', () => {
        sortEq(COMMON.cookDownloadSuffixes('full'), [
            '-150k-4096_std.glb', '-100k-2048_std_draco.glb', '-100k-2048_std.usdz',
            '-full_resolution-obj_std.zip', '-150k-4096-gltf_std.zip', '-150k-4096-obj_std.zip',
        ]);
    });

    test('zip subset matches the former isSceneDownloadZipFile list', () => {
        sortEq(COMMON.cookDownloadSuffixes('full').filter(s => s.endsWith('.zip')), [
            '-full_resolution-obj_std.zip', '-150k-4096-gltf_std.zip', '-150k-4096-obj_std.zip',
        ]);
    });

    test('suffixFull -> typeKey matches the former inferDownloadProperties suffixMap', () => {
        const expected: { [suffix: string]: string } = {
            '-full_resolution-obj_std.zip': 'objZipFull',
            '-150k-4096-obj_std.zip': 'objZipLow',
            '-150k-4096-gltf_std.zip': 'gltfZipLow',
            '-150k-4096_std.glb': 'webAssetGlbLowUncompressed',
            '-100k-2048_std_draco.glb': 'webAssetGlbARCompressed',
            '-100k-2048_std.usdz': 'usdz',
        };
        const actual: { [suffix: string]: string } = {};
        for (const d of COMMON.CookDownloadDescriptors)
            actual[d.suffixFull] = d.typeKey;
        expect(actual).toEqual(expected);
    });

    test('suffixShort is always a substring of suffixFull', () => {
        for (const d of COMMON.CookDownloadDescriptors)
            expect(d.suffixFull.includes(d.suffixShort)).toBe(true);
    });
});
