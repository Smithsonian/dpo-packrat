import * as DBAPI from '../../db';
import * as STORE from '../../storage/interface';
import { NameHelpers, ModelHierarchy } from '../../utils/nameHelpers';
import { BulkOpJob } from '../../http/routes/api/bulkOps/BulkOpTypes';
import { fixSceneBasenames } from '../../http/routes/api/bulkOps/fixSceneBasenames';

// The full Cook-output set (6 downloads + SVX) for a scene, all sharing one basename.
const outputSet = (base: string): string[] => [
    `${base}-150k-4096_std.glb`, `${base}-100k-2048_std_draco.glb`, `${base}-100k-2048_std.usdz`,
    `${base}-full_resolution-obj_std.zip`, `${base}-150k-4096-gltf_std.zip`, `${base}-150k-4096-obj_std.zip`,
    `${base}.svx.json`,
];

// A messy set: outputs carry two different basenames (a half-completed prior state).
const mixedSet = (): string[] => [
    'OldName-150k-4096_std.glb', 'OldName-100k-2048_std_draco.glb', 'OldName-100k-2048_std.usdz',
    'DifferentName-full_resolution-obj_std.zip', 'OldName-150k-4096-gltf_std.zip', 'OldName-150k-4096-obj_std.zip',
    'OldName.svx.json',
];

const asAsset = (idAsset: number, FileName: string): DBAPI.Asset =>
    ({ idAsset, FileName, StorageKey: `sk-${idAsset}` } as DBAPI.Asset);

// Resolve the canonical Subject.Name confidently: one master, a hierarchy with exactly one subject,
// and a display name that sanitizes to `canonical`.
function stubCanonicalName(canonical: string): void {
    jest.spyOn(DBAPI.Model, 'fetchMasterFromScene').mockResolvedValue([{ idModel: 7 } as DBAPI.Model]);
    jest.spyOn(NameHelpers, 'computeModelHierarchy').mockResolvedValue({ subjects: [{ idSubject: 1 }] } as unknown as ModelHierarchy);
    jest.spyOn(NameHelpers, 'sceneDisplayName').mockReturnValue(canonical);
    jest.spyOn(NameHelpers, 'sanitizeFileName').mockImplementation((s: string) => s);
}

function stubMultiSubject(): void {
    jest.spyOn(DBAPI.Model, 'fetchMasterFromScene').mockResolvedValue([{ idModel: 7 } as DBAPI.Model]);
    jest.spyOn(NameHelpers, 'computeModelHierarchy').mockResolvedValue({ subjects: [{ idSubject: 1 }, { idSubject: 2 }] } as unknown as ModelHierarchy);
}

describe('Bulk op: Fix Scene Basenames', () => {
    afterEach(() => jest.restoreAllMocks());

    test('fixable mode lists only scenes with a confident single Subject.Name rename', async () => {
        jest.spyOn(DBAPI.Scene, 'fetchAll').mockResolvedValue([{ idScene: 1 }, { idScene: 2 }] as unknown as DBAPI.Scene[]);
        jest.spyOn(DBAPI.SystemObject, 'fetchFromSceneID')
            .mockImplementation(async (idScene: number) => ({ idSystemObject: idScene * 1000 } as DBAPI.SystemObject));
        jest.spyOn(DBAPI.SystemObject, 'fetch')
            .mockImplementation(async (idSystemObject: number) => ({ idScene: idSystemObject / 1000 } as DBAPI.SystemObject));
        jest.spyOn(DBAPI.Scene, 'fetch')
            .mockImplementation(async (idScene: number) => ({ idScene, Name: `Scene ${idScene}` } as DBAPI.Scene));
        stubCanonicalName('NewName');
        // Scene 1: old uniform basename → fixable. Scene 2: already canonical → consistent (omitted).
        jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockImplementation(async (idScene: number) =>
            (idScene === 1 ? outputSet('OldName') : outputSet('NewName')).map((fn, i) => asAsset(i + 1, fn)));

        await BulkOpJob.run(fixSceneBasenames, { params: { mode: 'fixable' } });
        const rows = BulkOpJob.rows;
        expect(rows).toHaveLength(1);
        const row = rows.find(r => r.id === 1000);
        expect(row?.isCandidate).toBe(true);
        expect(row?.rowData.status).toBe('Fixable');
        expect(row?.rowData.canonicalName).toBe('NewName');
        expect(row?.rowData.currentBasename).toBe('OldName');
        expect(row?.rowData.fileCount).toBe(7);
        expect(row?.rowData.details).toContain('OldName.svx.json → NewName.svx.json');
    });

    test('fixable mode omits a mixed-basename scene', async () => {
        jest.spyOn(DBAPI.Scene, 'fetchAll').mockResolvedValue([{ idScene: 1 }] as unknown as DBAPI.Scene[]);
        jest.spyOn(DBAPI.SystemObject, 'fetchFromSceneID').mockResolvedValue({ idSystemObject: 1000 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.Scene, 'fetch').mockResolvedValue({ idScene: 1, Name: 'Scene 1' } as DBAPI.Scene);
        stubCanonicalName('NewName');
        jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue(mixedSet().map((fn, i) => asAsset(i + 1, fn)));

        await BulkOpJob.run(fixSceneBasenames, { params: { mode: 'fixable' } });
        expect(BulkOpJob.rows).toHaveLength(0);
    });

    test('affected mode lists both fixable and mixed scenes; only fixable is selectable', async () => {
        jest.spyOn(DBAPI.Scene, 'fetchAll').mockResolvedValue([{ idScene: 1 }, { idScene: 2 }] as unknown as DBAPI.Scene[]);
        jest.spyOn(DBAPI.SystemObject, 'fetchFromSceneID')
            .mockImplementation(async (idScene: number) => ({ idSystemObject: idScene * 1000 } as DBAPI.SystemObject));
        jest.spyOn(DBAPI.SystemObject, 'fetch')
            .mockImplementation(async (idSystemObject: number) => ({ idScene: idSystemObject / 1000 } as DBAPI.SystemObject));
        jest.spyOn(DBAPI.Scene, 'fetch')
            .mockImplementation(async (idScene: number) => ({ idScene, Name: `Scene ${idScene}` } as DBAPI.Scene));
        stubCanonicalName('NewName');
        // Scene 1: fixable (uniform old base). Scene 2: mixed basenames.
        jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockImplementation(async (idScene: number) =>
            (idScene === 1 ? outputSet('OldName') : mixedSet()).map((fn, i) => asAsset(i + 1, fn)));

        await BulkOpJob.run(fixSceneBasenames, { params: { mode: 'affected' } });
        const rows = BulkOpJob.rows;
        expect(rows).toHaveLength(2);

        const fixable = rows.find(r => r.id === 1000);
        expect(fixable?.isCandidate).toBe(true);
        expect(fixable?.rowData.status).toBe('Fixable');

        const mixed = rows.find(r => r.id === 2000);
        expect(mixed?.isCandidate).toBe(false); // report-only: visible but not selectable
        expect(mixed?.rowData.status).toContain('Mixed');
        expect(mixed?.rowData.details).toContain('distinct basenames');
    });

    test('affected mode still omits a uniform multi-subject scene (not affected by subject renames)', async () => {
        jest.spyOn(DBAPI.Scene, 'fetchAll').mockResolvedValue([{ idScene: 1 }] as unknown as DBAPI.Scene[]);
        jest.spyOn(DBAPI.SystemObject, 'fetchFromSceneID').mockResolvedValue({ idSystemObject: 1000 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.Scene, 'fetch').mockResolvedValue({ idScene: 1, Name: 'Scene 1' } as DBAPI.Scene);
        stubMultiSubject();
        jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue(outputSet('WhateverBase').map((fn, i) => asAsset(i + 1, fn)));

        await BulkOpJob.run(fixSceneBasenames, { params: { mode: 'affected' } });
        expect(BulkOpJob.rows).toHaveLength(0);
    });

    test('apply renames each Cook-output asset to the canonical Subject.Name', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.Scene, 'fetch').mockResolvedValue({ idScene: 1, Name: 'Scene 1' } as DBAPI.Scene);
        jest.spyOn(DBAPI.User, 'fetch').mockResolvedValue({ idUser: 5, Name: 'Curator', EmailAddress: 'c@si.edu' } as DBAPI.User);
        stubCanonicalName('NewName');

        const drifted = outputSet('OldName').map((fn, i) => asAsset(i + 1, fn));
        const fixed = outputSet('NewName').map((fn, i) => asAsset(i + 1, fn));
        jest.spyOn(DBAPI.Asset, 'fetchFromScene')
            .mockResolvedValueOnce(drifted)   // first evaluation
            .mockResolvedValueOnce(fixed);    // post-rename re-check

        const rename = jest.spyOn(STORE.AssetStorageAdapter, 'renameAsset')
            .mockResolvedValue({ success: true } as STORE.AssetStorageResult);

        const res = await fixSceneBasenames.apply(1000, {}, 5, {});
        expect(rename).toHaveBeenCalledTimes(7);
        for (const call of rename.mock.calls) {
            expect((call[1] as string).startsWith('NewName')).toBe(true);
            expect((call[2] as STORE.OperationInfo).userEmailAddress).toBe('c@si.edu');
        }
        expect(res.success).toBe(true);
        expect(res.message).toContain('renamed 7');
        expect(res.rowData.fileCount).toBe(0);
    });

    test('apply refuses a mixed-basename scene and renames nothing', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.Scene, 'fetch').mockResolvedValue({ idScene: 1, Name: 'Scene 1' } as DBAPI.Scene);
        stubCanonicalName('NewName');
        jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue(mixedSet().map((fn, i) => asAsset(i + 1, fn)));
        const rename = jest.spyOn(STORE.AssetStorageAdapter, 'renameAsset');

        const res = await fixSceneBasenames.apply(1000, {}, 5, {});
        expect(res.success).toBe(false);
        expect(res.message).toContain('refused');
        expect(rename).not.toHaveBeenCalled();
    });

    test('apply refuses a multi-subject scene and renames nothing', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.Scene, 'fetch').mockResolvedValue({ idScene: 1, Name: 'Scene 1' } as DBAPI.Scene);
        stubMultiSubject();
        jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue(outputSet('WhateverBase').map((fn, i) => asAsset(i + 1, fn)));
        const rename = jest.spyOn(STORE.AssetStorageAdapter, 'renameAsset');

        const res = await fixSceneBasenames.apply(1000, {}, 5, {});
        expect(res.success).toBe(false);
        expect(res.message).toContain('refused');
        expect(rename).not.toHaveBeenCalled();
    });

    test('apply reports partial failure when a rename fails', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.Scene, 'fetch').mockResolvedValue({ idScene: 1, Name: 'Scene 1' } as DBAPI.Scene);
        jest.spyOn(DBAPI.User, 'fetch').mockResolvedValue({ idUser: 5, Name: 'Curator', EmailAddress: 'c@si.edu' } as DBAPI.User);
        stubCanonicalName('NewName');
        jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue(outputSet('OldName').map((fn, i) => asAsset(i + 1, fn)));
        jest.spyOn(STORE.AssetStorageAdapter, 'renameAsset')
            .mockResolvedValue({ success: false, error: 'storage locked' } as STORE.AssetStorageResult);

        const res = await fixSceneBasenames.apply(1000, {}, 5, {});
        expect(res.success).toBe(false);
        expect(res.message).toContain('failed');
    });

    test('apply refuses cleanly for a non-scene system object', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: null } as unknown as DBAPI.SystemObject);
        const res = await fixSceneBasenames.apply(1000, {}, 5, {});
        expect(res.success).toBe(false);
        expect(res.message).toContain('not a scene');
    });

    test('apply is a no-op when the scene is already consistent', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.Scene, 'fetch').mockResolvedValue({ idScene: 1, Name: 'Scene 1' } as DBAPI.Scene);
        stubCanonicalName('NewName');
        jest.spyOn(DBAPI.Asset, 'fetchFromScene').mockResolvedValue(outputSet('NewName').map((fn, i) => asAsset(i + 1, fn)));
        const rename = jest.spyOn(STORE.AssetStorageAdapter, 'renameAsset');

        const res = await fixSceneBasenames.apply(1000, {}, 5, {});
        expect(res.success).toBe(true);
        expect(res.message).toBe('already consistent');
        expect(rename).not.toHaveBeenCalled();
    });
});
