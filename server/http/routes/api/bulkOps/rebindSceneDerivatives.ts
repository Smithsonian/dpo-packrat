/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../db';
import { SceneHelpers } from '../../../../utils/sceneHelpers';
import { RecordKeeper as RK } from '../../../../records/recordKeeper';
import { BulkOperationDef, BulkOpRow, BulkOpGatherArgs, BulkOpReporter, BulkOpApplyResult } from './BulkOpTypes';

async function sceneName(idSystemObject: number): Promise<string> {
    const so = await DBAPI.SystemObject.fetch(idSystemObject);
    if (so?.idScene) {
        const scene = await DBAPI.Scene.fetch(so.idScene);
        if (scene) return scene.Name;
    }
    return `SystemObject ${idSystemObject}`;
}

// The full candidate universe when the client does not scope the sweep to a project's scenes.
async function candidateSystemObjectIds(): Promise<number[]> {
    const scenes = await DBAPI.Scene.fetchAll();
    if (!scenes) return [];
    const ids: number[] = [];
    for (const scene of scenes) {
        const so = await DBAPI.SystemObject.fetchFromSceneID(scene.idScene);
        if (so) ids.push(so.idSystemObject);
    }
    return ids;
}

// The derivative asset versions (idAsset) that are NOT bound to the scene's latest SystemObjectVersion.
async function computeMissing(idSystemObject: number): Promise<{ derivativeCount: number; missing: DBAPI.AssetVersion[]; idLatestSOV: number } | null> {
    const so = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!so || !so.idScene)
        return null;
    const latestSOV = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
    if (!latestSOV)
        return null; // a scene with no version yet -- nothing to repair
    const boundMap: Map<number, number> = (await DBAPI.SystemObjectVersionAssetVersionXref.fetchLatestAssetVersionMap(idSystemObject)) ?? new Map<number, number>();
    const derivatives: DBAPI.AssetVersion[] = await SceneHelpers.getSceneDerivativeAssetVersions(idSystemObject);
    const missing: DBAPI.AssetVersion[] = derivatives.filter(av => !boundMap.has(av.idAsset));
    return { derivativeCount: derivatives.length, missing, idLatestSOV: latestSOV.idSystemObjectVersion };
}

// Read-only per-scene evaluation. Only scenes whose latest version is MISSING one or more current
// derivative assets are shown (the ones needing repair); complete scenes are omitted.
async function evaluateOne(idSystemObject: number): Promise<BulkOpRow | null> {
    const gap = await computeMissing(idSystemObject);
    if (!gap || gap.missing.length === 0)
        return null;
    const missingNames: string = gap.missing.map(av => av.FileName).sort().join(', ');
    return {
        id: idSystemObject,
        name: await sceneName(idSystemObject),
        isCandidate: true,
        rowData: {
            latestVersion: gap.idLatestSOV,
            derivativeCount: gap.derivativeCount,
            missingCount: gap.missing.length,
            missing: missingNames || '—',
        },
    };
}

/**
 * Repair scenes whose current version's asset manifest is missing derivative-model assets (downloads /
 * AR / web) that are linked via ModelSceneXref. Gather sweeps scenes (all, or a client-scoped subset)
 * and lists those with a gap; apply binds the missing derivatives into the scene's latest version
 * in place -- no new version is created, so publish state is untouched.
 */
export const rebindSceneDerivatives: BulkOperationDef = {
    key: 'rebindSceneDerivatives',
    label: 'Rebind Scene Derivatives',
    columns: [
        { key: 'latestVersion', label: 'Latest Version' },
        { key: 'derivativeCount', label: 'Derivatives (MSX)' },
        { key: 'missingCount', label: 'Missing From Version' },
        { key: 'missing', label: 'Missing Files' },
    ],
    rowSettings: [],
    gather: async ({ scopedIds }: BulkOpGatherArgs, report: BulkOpReporter): Promise<BulkOpRow[]> => {
        const ids: number[] = (scopedIds && scopedIds.length > 0) ? scopedIds : await candidateSystemObjectIds();
        report(0, ids.length);
        const rows: BulkOpRow[] = [];
        let processed = 0;
        for (const id of ids) {
            const row = await evaluateOne(id);
            if (row) rows.push(row);
            report(++processed, ids.length);
        }
        return rows;
    },
    apply: async (idSystemObject: number, _rowSettings: any, idUser: number): Promise<BulkOpApplyResult> => {
        const gap = await computeMissing(idSystemObject);
        if (!gap)
            return { success: false, message: 'not a scene, or no scene version to repair' };
        if (gap.missing.length === 0)
            return { success: true, message: 'already complete', rowData: { missingCount: 0, missing: '—' } };

        const missingBefore: number = gap.missing.length;
        // Bind into the current latest version in place (idempotent); no new SystemObjectVersion, so
        // published state is not affected.
        await SceneHelpers.ensureSceneDerivativeBindings(idSystemObject, gap.idLatestSOV);

        const after = await computeMissing(idSystemObject);
        const missingAfter: number = after ? after.missing.length : 0;
        RK.logInfo(RK.LogSection.eHTTP,'rebind scene derivatives',`bound ${missingBefore - missingAfter} derivative(s) into scene version`,
            { idSystemObject, idSystemObjectVersion: gap.idLatestSOV, missingBefore, missingAfter, idUser },'HTTP.Route.BulkOp');

        return {
            success: missingAfter === 0,
            message: missingAfter === 0 ? `bound ${missingBefore} missing derivative(s)` : `bound ${missingBefore - missingAfter}, ${missingAfter} still missing`,
            rowData: { missingCount: missingAfter, missing: after && after.missing.length > 0 ? after.missing.map(av => av.FileName).sort().join(', ') : '—' },
        };
    },
};
