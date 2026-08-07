/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../db';
import * as COMMON from '@dpo-packrat/common';
import { SceneHelpers } from '../../../../utils/sceneHelpers';
import { AuditFactory } from '../../../../audit/interface/AuditFactory';
import { BulkOperationDef, BulkOpRow, BulkOpGatherArgs, BulkOpReporter, BulkOpApplyResult } from './BulkOpTypes';

const SCENE_UNIT_OPTIONS: string[] = ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'];

async function sceneName(idSystemObject: number): Promise<string> {
    const so = await DBAPI.SystemObject.fetch(idSystemObject);
    if (so?.idScene) {
        const scene = await DBAPI.Scene.fetch(so.idScene);
        if (scene) return scene.Name;
    }
    return `SystemObject ${idSystemObject}`;
}

function fmtVec(v: number[] | null | undefined): string {
    if (!Array.isArray(v) || v.length < 3) return '—';
    return `(${v.map(n => (Number.isFinite(n) ? String(Number(n.toFixed(4))) : '?')).join(', ')})`;
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

// Read-only per-scene evaluation. Returns null for scenes that are neither fixable mismatches nor
// cleanly matching (they are not shown); a matching scene is shown as a no-change row.
async function evaluateOne(idSystemObject: number): Promise<BulkOpRow | null> {
    const name = await sceneName(idSystemObject);
    const e = await SceneHelpers.evaluateSceneScale(idSystemObject);
    const mismatch: boolean = e.state === 'mismatch' && e.canFix;
    if (!mismatch && e.state !== 'ok')
        return null;
    return {
        id: idSystemObject,
        name,
        isCandidate: mismatch,
        rowData: { currentUnits: e.currentUnits ?? 'unset', bboxSize: fmtVec(e.bboxSizeMeters), suggestedUnit: e.intendedUnits },
        defaultSettings: { units: e.intendedUnits },
        current: { units: e.currentUnits ?? '' },
    };
}

/** Fix a scene's Voyager display units. Gather sweeps scenes (all, or a client-scoped subset) and
 * evaluates each locally; apply rewrites the SVX units for one scene. */
export const fixDisplayUnits: BulkOperationDef = {
    key: 'fixDisplayUnits',
    label: 'Fix Display Units',
    columns: [
        { key: 'currentUnits', label: 'Current Units' },
        { key: 'bboxSize', label: 'Bounding Box Size (m)' },
        { key: 'suggestedUnit', label: 'Suggested Unit' },
    ],
    rowSettings: [
        { key: 'units', label: 'Target Units', type: 'select', options: SCENE_UNIT_OPTIONS.map(u => ({ value: u, label: u })) },
    ],
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
    apply: async (idSystemObject: number, rowSettings: any, idUser: number): Promise<BulkOpApplyResult> => {
        const units: string = String(rowSettings?.units ?? '').trim().toLowerCase();
        if (!SCENE_UNIT_OPTIONS.includes(units))
            return { success: false, message: `invalid unit '${units}'` };
        const so = await DBAPI.SystemObject.fetch(idSystemObject);
        if (!so || !so.idScene)
            return { success: false, message: 'not a scene' };
        const scene = await DBAPI.Scene.fetch(so.idScene);
        if (!scene)
            return { success: false, message: `cannot fetch scene ${so.idScene}` };

        const patch = await SceneHelpers.patchSvxUnits(idSystemObject, scene, units, idUser);
        if (!patch.success)
            return { success: false, message: patch.error };

        await AuditFactory.emitSemantic({
            action: DBAPI.eAuditType.eActionSVXUnitsFixed,
            target: { idObject: scene.idScene, eObjectType: COMMON.eSystemObjectType.eScene },
            idSystemObject,
            payload: { before: { units: patch.oldUnits }, after: { units: patch.newUnits }, idAssetVersion: patch.idAssetVersion, via: 'bulkOperation' },
        });
        // Return the op-column keys so the client can merge them into the row: after the fix the current
        // units are the new units, and the suggestion now matches (no longer a mismatch).
        return {
            success: true,
            message: `${patch.oldUnits ?? 'unset'} → ${patch.newUnits}`,
            rowData: { currentUnits: patch.newUnits, suggestedUnit: patch.newUnits },
        };
    },
};
