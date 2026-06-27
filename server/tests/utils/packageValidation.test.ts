import * as COMMON from '@dpo-packrat/common';

// Pure unit tests for the @dpo-packrat/common package-type validation predicates. No DB or I/O.

const V = COMMON.eVocabularyID;

const shortName: Map<COMMON.eVocabularyID, string> = new Map([
    [V.eAssetAssetTypeModel, 'Model'],
    [V.eAssetAssetTypeCaptureDataSetPhotogrammetry, 'Photo'],
    [V.eAssetAssetTypeCaptureDataSetVolumetric, 'Volume'],
    [V.eAssetAssetTypeScene, 'Scene'],
    [V.eAssetAssetTypeProjectDocumentation, 'Doc'],
]);

const possibleNames = (files: string[]): string[] =>
    [...COMMON.assessPackage(files).possibleTypes].map(t => shortName.get(t) ?? String(t)).sort();

describe('common: file classification', () => {
    test('classifies decisive extensions', () => {
        expect(COMMON.classifyFile('a.obj')).toBe(COMMON.eFileCategory.eMesh);
        expect(COMMON.classifyFile('a.dcm')).toBe(COMMON.eFileCategory.eVolumetricSlice);
        expect(COMMON.classifyFile('a.DICOM')).toBe(COMMON.eFileCategory.eVolumetricSlice);
        expect(COMMON.classifyFile('a.pca')).toBe(COMMON.eFileCategory.eVolumetricSidecar);
        expect(COMMON.classifyFile('scene.svx.json')).toBe(COMMON.eFileCategory.eSceneDescriptor);
        expect(COMMON.classifyFile('a.png')).toBe(COMMON.eFileCategory.eImage);
        expect(COMMON.classifyFile('a.pdf')).toBe(COMMON.eFileCategory.eDocument);
        expect(COMMON.classifyFile('a.unknownext')).toBe(COMMON.eFileCategory.eUnknown);
        expect(COMMON.classifyFile('noextension')).toBe(COMMON.eFileCategory.eUnknown);
    });
});

describe('common: assessPackage possible types', () => {
    test.each([
        [['model.obj'], ['Model']],
        [['m.obj', 'm.mtl', 't.png'], ['Model']],
        [['a.glb'], ['Model']],
        [['scan.dcm'], ['Volume']],
        [['scan.dcm', 'readme.pdf'], ['Volume']],
        [['log.pca'], ['Doc']],
        [['log.pca', 'notes.pdf'], ['Doc']],
        [['s1.tif', 's2.tif', 's3.tif'], ['Photo', 'Volume']],
        [['s1.tif', 's2.tif', 'log.pca'], ['Volume']],
        [['scene.svx.json', 'm1.glb', 'm2.glb'], ['Scene']],
        [['scene.svx.json'], []],
        [['doc.pdf'], ['Doc']],
        [['mesh.obj', 'scan.dcm'], []],
        [['random.xyz'], []],
        [['a.obj', 'b.svx.json'], ['Scene']],
    ])('%j -> %j', (files: string[], expected: string[]) => {
        expect(possibleNames(files)).toEqual([...expected].sort());
    });
});

describe('common: isCompatible', () => {
    test('membership: selected type must be a possible type', () => {
        const stack = COMMON.assessPackage(['s1.tif', 's2.tif']).possibleTypes;
        expect(COMMON.isCompatible(V.eAssetAssetTypeCaptureDataSetPhotogrammetry, stack)).toBe(true);
        expect(COMMON.isCompatible(V.eAssetAssetTypeCaptureDataSetVolumetric, stack)).toBe(true);
        expect(COMMON.isCompatible(V.eAssetAssetTypeModel, stack)).toBe(false);
    });

    test('contaminated package is incompatible with every gated type', () => {
        const bad = COMMON.assessPackage(['mesh.obj', 'scan.dcm']).possibleTypes;
        expect(COMMON.isCompatible(V.eAssetAssetTypeModel, bad)).toBe(false);
        expect(COMMON.isCompatible(V.eAssetAssetTypeCaptureDataSetVolumetric, bad)).toBe(false);
    });

    test('Other and Bulk Ingestion are exempt (never gated)', () => {
        const bad = COMMON.assessPackage(['mesh.obj', 'scan.dcm']).possibleTypes;
        expect(COMMON.isCompatible(V.eAssetAssetTypeOther, bad)).toBe(true);
        expect(COMMON.isCompatible(V.eAssetAssetTypeBulkIngestion, bad)).toBe(true);
        expect(COMMON.isValidatableType(V.eAssetAssetTypeOther)).toBe(false);
        expect(COMMON.isValidatableType(V.eAssetAssetTypeModel)).toBe(true);
    });
});
