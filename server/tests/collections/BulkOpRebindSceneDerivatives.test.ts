import * as DBAPI from '../../db';
import { SceneHelpers } from '../../utils/sceneHelpers';
import { BulkOpJob } from '../../http/routes/api/bulkOps/BulkOpTypes';
import { rebindSceneDerivatives } from '../../http/routes/api/bulkOps/rebindSceneDerivatives';

const AV = (idAsset: number, idAssetVersion: number, FileName: string): DBAPI.AssetVersion =>
    ({ idAsset, idAssetVersion, FileName } as DBAPI.AssetVersion);

describe('SceneHelpers.getSceneDerivativeAssetVersions', () => {
    afterEach(() => jest.restoreAllMocks());

    test('collects non-retired derivative asset versions, skipping retired models', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.ModelSceneXref, 'fetchFromScene').mockResolvedValue([
            { idModel: 10 }, { idModel: 11 }, { idModel: 12 },
        ] as unknown as DBAPI.ModelSceneXref[]);
        jest.spyOn(DBAPI.SystemObject, 'fetchFromModelID').mockImplementation(async (idModel: number) => {
            if (idModel === 10) return { idSystemObject: 100, Retired: false } as DBAPI.SystemObject;
            if (idModel === 11) return { idSystemObject: 110, Retired: false } as DBAPI.SystemObject;
            return { idSystemObject: 120, Retired: true } as DBAPI.SystemObject; // idModel 12 is retired
        });
        const av1 = AV(1, 11, 'a.glb');
        const av2 = AV(2, 22, 'b.zip');
        const fetchAV = jest.spyOn(DBAPI.AssetVersion, 'fetchLatestFromSystemObject').mockImplementation(async (idSO: number) => {
            if (idSO === 100) return [av1];
            if (idSO === 110) return [av2];
            return null;
        });

        const result = await SceneHelpers.getSceneDerivativeAssetVersions(1000);
        expect(result).toEqual([av1, av2]);
        // the retired model's SystemObject (120) is never queried for assets
        expect(fetchAV).not.toHaveBeenCalledWith(120);
    });

    test('returns [] for a non-scene system object', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: null } as unknown as DBAPI.SystemObject);
        expect(await SceneHelpers.getSceneDerivativeAssetVersions(1000)).toEqual([]);
    });
});

describe('SceneHelpers.ensureSceneDerivativeBindings', () => {
    afterEach(() => jest.restoreAllMocks());

    test('binds only the derivatives missing from the version', async () => {
        jest.spyOn(SceneHelpers, 'getSceneDerivativeAssetVersions').mockResolvedValue([AV(1, 11, 'a.glb'), AV(2, 22, 'b.zip')]);
        // av1 already bound to this version; av2 missing
        jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'fetchAssetVersionMap')
            .mockResolvedValue(new Map<number, number>([[1, 11]]));
        const addOrUpdate = jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'addOrUpdate')
            .mockResolvedValue({} as DBAPI.SystemObjectVersionAssetVersionXref);

        const count = await SceneHelpers.ensureSceneDerivativeBindings(1000, 500);
        expect(count).toBe(1);
        expect(addOrUpdate).toHaveBeenCalledTimes(1);
        expect(addOrUpdate).toHaveBeenCalledWith(500, 2, 22); // only the missing derivative
    });

    test('is a no-op when every derivative is already bound to that version', async () => {
        jest.spyOn(SceneHelpers, 'getSceneDerivativeAssetVersions').mockResolvedValue([AV(1, 11, 'a.glb')]);
        jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'fetchAssetVersionMap')
            .mockResolvedValue(new Map<number, number>([[1, 11]]));
        const addOrUpdate = jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'addOrUpdate')
            .mockResolvedValue({} as DBAPI.SystemObjectVersionAssetVersionXref);

        const count = await SceneHelpers.ensureSceneDerivativeBindings(1000, 500);
        expect(count).toBe(0);
        expect(addOrUpdate).not.toHaveBeenCalled();
    });

    test('rebinds a derivative whose asset version changed', async () => {
        jest.spyOn(SceneHelpers, 'getSceneDerivativeAssetVersions').mockResolvedValue([AV(1, 12, 'a.glb')]); // now v12
        jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'fetchAssetVersionMap')
            .mockResolvedValue(new Map<number, number>([[1, 11]])); // version had the older v11
        const addOrUpdate = jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'addOrUpdate')
            .mockResolvedValue({} as DBAPI.SystemObjectVersionAssetVersionXref);

        const count = await SceneHelpers.ensureSceneDerivativeBindings(1000, 500);
        expect(count).toBe(1);
        expect(addOrUpdate).toHaveBeenCalledWith(500, 1, 12);
    });

    test('returns 0 without touching bindings when there are no derivatives', async () => {
        jest.spyOn(SceneHelpers, 'getSceneDerivativeAssetVersions').mockResolvedValue([]);
        const addOrUpdate = jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'addOrUpdate');
        expect(await SceneHelpers.ensureSceneDerivativeBindings(1000, 500)).toBe(0);
        expect(addOrUpdate).not.toHaveBeenCalled();
    });
});

describe('Bulk op: Rebind Scene Derivatives', () => {
    afterEach(() => jest.restoreAllMocks());

    test('gather lists only scenes whose latest version is missing derivatives', async () => {
        jest.spyOn(DBAPI.Scene, 'fetchAll').mockResolvedValue([{ idScene: 1 }, { idScene: 2 }] as unknown as DBAPI.Scene[]);
        jest.spyOn(DBAPI.SystemObject, 'fetchFromSceneID')
            .mockImplementation(async (idScene: number) => ({ idSystemObject: idScene * 1000 } as DBAPI.SystemObject));
        jest.spyOn(DBAPI.SystemObject, 'fetch')
            .mockImplementation(async (idSystemObject: number) => ({ idScene: idSystemObject / 1000 } as DBAPI.SystemObject));
        jest.spyOn(DBAPI.Scene, 'fetch')
            .mockImplementation(async (idScene: number) => ({ Name: `Scene ${idScene}` } as DBAPI.Scene));
        jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
            .mockImplementation(async (idSystemObject: number) => ({ idSystemObjectVersion: idSystemObject + 1 } as DBAPI.SystemObjectVersion));

        // Scene 1 (idSO 1000): derivative b.zip present in MSX, bound set empty → missing.
        // Scene 2 (idSO 2000): derivative c.glb present in MSX and bound → complete (omitted).
        jest.spyOn(SceneHelpers, 'getSceneDerivativeAssetVersions')
            .mockImplementation(async (idSO: number) => (idSO === 1000 ? [AV(2, 22, 'b.zip')] : [AV(3, 33, 'c.glb')]));
        jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'fetchLatestAssetVersionMap')
            .mockImplementation(async (idSO: number) => (idSO === 1000 ? new Map<number, number>() : new Map<number, number>([[3, 33]])));

        const started = await BulkOpJob.run(rebindSceneDerivatives, { params: {} });
        expect(started).toBe(true);
        expect(BulkOpJob.progress.phase).toBe('completed');
        expect(BulkOpJob.progress.total).toBe(2); // both scenes swept

        const rows = BulkOpJob.rows;
        expect(rows).toHaveLength(1); // only the one needing repair is shown
        const row = rows.find(r => r.id === 1000);
        expect(row?.isCandidate).toBe(true);
        expect(row?.rowData.derivativeCount).toBe(1);
        expect(row?.rowData.missingCount).toBe(1);
        expect(row?.rowData.missing).toBe('b.zip');
        expect(row?.rowData.latestVersion).toBe(1001);
    });

    test('apply binds the missing derivatives into the latest version in place', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
            .mockResolvedValue({ idSystemObjectVersion: 1001 } as DBAPI.SystemObjectVersion);
        jest.spyOn(SceneHelpers, 'getSceneDerivativeAssetVersions').mockResolvedValue([AV(2, 22, 'b.zip')]);
        // before apply: missing; after apply: bound
        jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'fetchLatestAssetVersionMap')
            .mockResolvedValueOnce(new Map<number, number>())
            .mockResolvedValueOnce(new Map<number, number>([[2, 22]]));
        const ensure = jest.spyOn(SceneHelpers, 'ensureSceneDerivativeBindings').mockResolvedValue(1);

        const res = await rebindSceneDerivatives.apply(1000, {}, 1, {});
        expect(ensure).toHaveBeenCalledWith(1000, 1001); // in place, into the latest version
        expect(res.success).toBe(true);
        expect(res.message).toContain('bound 1');
        expect(res.rowData.missingCount).toBe(0);
    });

    test('apply is a no-op when the scene version is already complete', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: 1 } as DBAPI.SystemObject);
        jest.spyOn(DBAPI.SystemObjectVersion, 'fetchLatestFromSystemObject')
            .mockResolvedValue({ idSystemObjectVersion: 1001 } as DBAPI.SystemObjectVersion);
        jest.spyOn(SceneHelpers, 'getSceneDerivativeAssetVersions').mockResolvedValue([AV(2, 22, 'b.zip')]);
        jest.spyOn(DBAPI.SystemObjectVersionAssetVersionXref, 'fetchLatestAssetVersionMap')
            .mockResolvedValue(new Map<number, number>([[2, 22]]));
        const ensure = jest.spyOn(SceneHelpers, 'ensureSceneDerivativeBindings').mockResolvedValue(0);

        const res = await rebindSceneDerivatives.apply(1000, {}, 1, {});
        expect(res.success).toBe(true);
        expect(res.message).toBe('already complete');
        expect(ensure).not.toHaveBeenCalled();
    });

    test('apply fails cleanly for a non-scene system object', async () => {
        jest.spyOn(DBAPI.SystemObject, 'fetch').mockResolvedValue({ idScene: null } as unknown as DBAPI.SystemObject);
        const res = await rebindSceneDerivatives.apply(1000, {}, 1, {});
        expect(res.success).toBe(false);
        expect(res.message).toContain('not a scene');
    });
});
