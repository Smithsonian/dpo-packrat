/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../db';
import * as COMMON from '@dpo-packrat/common';
import { ASL, LocalStore } from '../../../utils/localStore';
import { isAuthenticated } from '../../auth';
import { Authorization, AUTH_ERROR } from '../../../auth/Authorization';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { SceneHelpers } from '../../../utils/sceneHelpers';
import { Request, Response } from 'express';

// --- Op contract (the harness core) ---
// Each operation is a registry entry. A new op = a new entry; the route and client are generic.
interface BulkOpColumn { key: string; label: string; }
interface BulkOpSetting { key: string; label: string; type: 'select'; options: { value: string; label: string }[]; }
interface BulkOpValidateResult { isCandidate: boolean; name: string; rowData?: any; defaultSettings?: any; }
interface BulkOpApplyResult { success: boolean; message?: string; rowData?: any; }
interface BulkOperationDef {
    key: string;
    label: string;
    columns: BulkOpColumn[];                                      // op-declared table columns
    rowSettings: BulkOpSetting[];                                 // op-declared per-row editable settings schema
    candidateSystemObjectIds: () => Promise<number[]>;           // full candidate set (when the client does not scope the sweep)
    validate: (idSystemObject: number) => Promise<BulkOpValidateResult>;  // read-only: is it a candidate + its row columns/defaults
    apply: (idSystemObject: number, rowSettings: any, idUser: number) => Promise<BulkOpApplyResult>; // mutate ONE object
}

function respond(res: Response, success: boolean, message: string | undefined, data?: any): void {
    res.status(200).send(JSON.stringify({ success, message, data }));
}

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

// --- Op 1: Fix Display Units ---
const fixDisplayUnits: BulkOperationDef = {
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
    candidateSystemObjectIds: async (): Promise<number[]> => {
        const scenes = await DBAPI.Scene.fetchAll();
        if (!scenes) return [];
        const ids: number[] = [];
        for (const scene of scenes) {
            const so = await DBAPI.SystemObject.fetchFromSceneID(scene.idScene);
            if (so) ids.push(so.idSystemObject);
        }
        return ids;
    },
    validate: async (idSystemObject: number): Promise<BulkOpValidateResult> => {
        const name = await sceneName(idSystemObject);
        const e = await SceneHelpers.evaluateSceneScale(idSystemObject);
        // candidate = a single-model scene with an implausible (fixable) unit mismatch
        if (e.state !== 'mismatch' || !e.canFix)
            return { isCandidate: false, name };
        return {
            isCandidate: true,
            name,
            rowData: { currentUnits: e.currentUnits ?? 'unset', bboxSize: fmtVec(e.bboxSizeMeters), suggestedUnit: e.intendedUnits },
            defaultSettings: { units: e.intendedUnits },
        };
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
        return { success: true, message: `${patch.oldUnits ?? 'unset'} → ${patch.newUnits}`, rowData: { newUnits: patch.newUnits } };
    },
};

const OPERATIONS: Record<string, BulkOperationDef> = {
    [fixDisplayUnits.key]: fixDisplayUnits,
};

/**
 * POST /api/bulk/operation — run a registered bulk operation over objects, one at a time.
 * Body: { operation, mode: 'describe'|'validate'|'apply', idSystemObject?, idSystemObjects?, rowSettings? }.
 *   describe — return the op's columns + per-row settings schema.
 *   validate — read-only sweep; returns the candidate rows (op columns + default settings).
 *   apply    — mutate ONE object with its (possibly edited) settings; the client loops these sequentially.
 * Admin-gated; apply is additionally per-object authorized.
 */
export async function bulkOperation(req: Request, res: Response): Promise<void> {
    if (!isAuthenticated(req)) {
        respond(res, false, 'bulkOperation: not authenticated');
        return;
    }
    const LS: LocalStore | undefined = ASL.getStore();
    if (!LS || !LS.idUser) {
        respond(res, false, 'bulkOperation: missing local store/user');
        return;
    }
    const idUser: number = LS.idUser;

    const ctx = Authorization.getContext();
    if (!ctx || !ctx.isAdmin) {
        respond(res, false, AUTH_ERROR.ACCESS_DENIED);
        return;
    }

    const { operation, mode, idSystemObject, idSystemObjects, rowSettings } = req.body ?? {};
    const op: BulkOperationDef | undefined = typeof operation === 'string' ? OPERATIONS[operation] : undefined;
    if (!op) {
        respond(res, false, `bulkOperation: unknown operation '${operation}'. Known: ${Object.keys(OPERATIONS).join(', ')}`);
        return;
    }

    try {
        if (mode === 'describe') {
            respond(res, true, undefined, { key: op.key, label: op.label, columns: op.columns, rowSettings: op.rowSettings });
            return;
        }

        if (mode === 'validate') {
            const ids: number[] = Array.isArray(idSystemObjects) && idSystemObjects.length > 0
                ? idSystemObjects.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n > 0)
                : await op.candidateSystemObjectIds();
            const rows: any[] = [];
            for (const id of ids) {
                const r = await op.validate(id);
                if (r.isCandidate)
                    rows.push({ id, name: r.name, rowData: r.rowData, defaultSettings: r.defaultSettings });
            }
            respond(res, true, undefined, { operation: op.key, columns: op.columns, rowSettings: op.rowSettings, rows });
            return;
        }

        if (mode === 'apply') {
            const idSO: number = Number(idSystemObject);
            if (!Number.isInteger(idSO) || idSO <= 0) {
                respond(res, false, 'bulkOperation: apply requires a valid idSystemObject');
                return;
            }
            if (!await Authorization.canAccessSystemObject(ctx, idSO)) {
                respond(res, false, AUTH_ERROR.ACCESS_DENIED);
                return;
            }
            const result = await op.apply(idSO, rowSettings ?? {}, idUser);
            respond(res, result.success, result.message, { id: idSO, ...result });
            return;
        }

        respond(res, false, 'bulkOperation: mode must be describe, validate, or apply');
    } catch (error) {
        RK.logError(RK.LogSection.eHTTP, 'bulkOperation failed',
            error instanceof Error ? error.message : String(error), { operation, mode }, 'HTTP.Route.BulkOperation');
        respond(res, false, `bulkOperation: ${error instanceof Error ? error.message : 'unexpected error'}`);
    }
}
