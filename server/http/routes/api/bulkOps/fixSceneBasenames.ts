/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../db';
import * as STORE from '../../../../storage/interface';
import { cookOutputSuffixes } from '../../../../job/impl/Cook/CookOutputContract';
import { NameHelpers, UNKNOWN_NAME } from '../../../../utils/nameHelpers';
import { RecordKeeper as RK } from '../../../../records/recordKeeper';
import { BulkOperationDef, BulkOpRow, BulkOpGatherArgs, BulkOpReporter, BulkOpApplyResult } from './BulkOpTypes';

const SRC = 'HTTP.Route.BulkOp.FixSceneBasenames';

// The endsWith-form suffixes of every Cook-output asset (6 downloads + the .svx.json descriptor),
// sourced from the shared CookOutputContract so this stays aligned with the guards it recovers from.
const COOK_SUFFIXES: string[] = cookOutputSuffixes('si-generate-downloads');

function matchingSuffix(fileName: string): string | undefined {
    return COOK_SUFFIXES.find(s => fileName.endsWith(s));
}

// The classification of a scene's Cook-output basenames.
//   fixable    — one uniform old basename that differs from the canonical Subject.Name; safe to rename.
//   consistent — outputs already carry the canonical basename.
//   mixed      — outputs carry more than one basename (a half-completed prior state); not a clean rename.
//   unresolved — canonical Subject.Name can't be derived (multi-subject / ambiguous hierarchy); such
//                scenes take the source-filename basename, which a subject rename does not change, so
//                a uniform one is not "affected" by this issue.
//   no-outputs — no Cook-output assets to evaluate.  not-scene — the object is not a scene.
type SceneStatus = 'not-scene' | 'no-outputs' | 'consistent' | 'fixable' | 'mixed' | 'unresolved';

interface StateInfo {
    status: SceneStatus;
    canonical: string | null;
    bases: string[];                                              // distinct output basenames
    fileCount: number;                                           // number of Cook-output assets
    renames: { asset: DBAPI.Asset; from: string; to: string }[]; // populated only for 'fixable'
    reason: string;                                             // human-readable, for the report / refusal
}

async function sceneFromSystemObject(idSystemObject: number): Promise<DBAPI.Scene | null> {
    const so = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!so || !so.idScene)
        return null;
    return DBAPI.Scene.fetch(so.idScene);
}

async function sceneName(idSystemObject: number): Promise<string> {
    const scene = await sceneFromSystemObject(idSystemObject);
    return scene ? scene.Name : `SystemObject ${idSystemObject}`;
}

// The full candidate universe when the client does not scope the sweep to a project's scenes.
async function candidateSceneSystemObjectIds(): Promise<number[]> {
    const scenes = await DBAPI.Scene.fetchAll();
    if (!scenes) return [];
    const ids: number[] = [];
    for (const scene of scenes) {
        const so = await DBAPI.SystemObject.fetchFromSceneID(scene.idScene);
        if (so) ids.push(so.idSystemObject);
    }
    return ids;
}

// The canonical scene basename Generate Downloads would derive right now: for a single-subject scene
// this resolves to the Subject's Name (sceneDisplayName('', [MH]) -> subject.Name). Returns null for
// every case where that is NOT confidently the Subject.Name — a master model that is absent/ambiguous,
// an unresolvable hierarchy, or multiple subjects.
async function computeCanonicalBaseName(idScene: number): Promise<string | null> {
    const masters = await DBAPI.Model.fetchMasterFromScene(idScene);
    if (!masters || masters.length !== 1)
        return null;
    const MH = await NameHelpers.computeModelHierarchy(masters[0]);
    if (!MH)
        return null;
    if (!MH.subjects || MH.subjects.length !== 1)
        return null;
    const base: string = NameHelpers.sceneDisplayName('', [MH]); // '' = no user subtitle, matching generation
    if (!base || base === UNKNOWN_NAME)
        return null;
    return NameHelpers.sanitizeFileName(base);
}

// Classify a scene by its Cook-output basenames vs the canonical Subject.Name.
async function computeState(idSystemObject: number): Promise<StateInfo> {
    const base = (status: SceneStatus, reason: string): StateInfo => ({ status, canonical: null, bases: [], fileCount: 0, renames: [], reason });

    const scene = await sceneFromSystemObject(idSystemObject);
    if (!scene)
        return base('not-scene', 'not a scene');

    const assets = await DBAPI.Asset.fetchFromScene(scene.idScene);
    const outputs: { asset: DBAPI.Asset; suffix: string; base: string }[] = [];
    for (const a of (assets ?? [])) {
        const suffix = matchingSuffix(a.FileName);
        if (suffix)
            outputs.push({ asset: a, suffix, base: a.FileName.slice(0, a.FileName.length - suffix.length) });
    }
    if (outputs.length === 0)
        return base('no-outputs', 'no Cook-output assets to evaluate');

    const bases: string[] = [...new Set(outputs.map(o => o.base))];
    const fileCount: number = outputs.length;
    const canonical = await computeCanonicalBaseName(scene.idScene);

    if (bases.length > 1)
        return { status: 'mixed', canonical, bases, fileCount, renames: [],
            reason: `outputs carry ${bases.length} distinct basenames (${bases.join(', ')}); not a single clean rename` };

    // exactly one uniform output basename
    if (!canonical)
        return { status: 'unresolved', canonical: null, bases, fileCount, renames: [],
            reason: 'canonical Subject.Name could not be resolved (multi-subject or ambiguous hierarchy)' };
    if (bases[0] === canonical)
        return { status: 'consistent', canonical, bases, fileCount, renames: [], reason: '' };

    const renames = outputs.map(o => ({ asset: o.asset, from: o.asset.FileName, to: `${canonical}${o.suffix}` }));
    return { status: 'fixable', canonical, bases, fileCount, renames, reason: `${bases[0]} → ${canonical}` };
}

function statusLabel(status: SceneStatus): string {
    switch (status) {
        case 'fixable':    return 'Fixable';
        case 'mixed':      return 'Mixed basenames (manual)';
        case 'consistent': return 'Consistent';
        case 'unresolved': return 'Name unresolved (manual)';
        default:           return status;
    }
}

async function toRow(idSystemObject: number, state: StateInfo): Promise<BulkOpRow> {
    const details: string = state.status === 'fixable'
        ? state.renames.map(r => `${r.from} → ${r.to}`).sort().join(', ')
        : state.reason;
    return {
        id: idSystemObject,
        name: await sceneName(idSystemObject),
        isCandidate: state.status === 'fixable', // only fixable rows are selectable; the rest are report-only
        rowData: {
            status: statusLabel(state.status),
            canonicalName: state.canonical ?? '—',
            currentBasename: state.bases.join(', '),
            fileCount: state.fileCount,
            details,
        },
    };
}

/**
 * Recover a scene whose download/SVX asset filenames drifted from the current Subject.Name (the state
 * that makes the Generate Downloads pre-flight guard and the scene-generation SVX check hard block
 * after a subject is renamed). `apply` renames each Cook-output asset to the canonical basename via
 * AssetStorageAdapter.renameAsset — an OCFL-aware rename creating a new, non-destructive AssetVersion.
 *
 * Scope param:
 *   - `fixable`  (default) — list only scenes we can confidently repair (selectable).
 *   - `affected` (report-only) — additionally list scenes that are affected but NOT auto-fixable
 *     (mixed basenames), each with a Status + reason so the extent and cause are visible. Only
 *     `fixable` rows are selectable; the report rows can be seen but not acted on.
 *
 * Confidence gate (both gather and apply): the op only acts on a single, uniform Subject.Name rename
 * — canonical resolves to exactly one Subject.Name AND every Cook-output asset shares one old
 * basename that differs from it. Multi-subject / ambiguous-hierarchy and mixed-basename scenes are
 * refused, not guessed at. (Multi-subject scenes take the source-filename basename, which a subject
 * rename does not change, so a uniform one is not affected and is not listed even in `affected`.)
 *
 * Scope boundary: renames the download and SVX *filenames* only. It does NOT rename derivative model
 * records or re-point the SVX's internal `asset.uri` values, so it does not by itself clear the deeper
 * scene-generation model-name fork. It unblocks Generate Downloads and the SVX-filename check.
 */
export const fixSceneBasenames: BulkOperationDef = {
    key: 'fixSceneBasenames',
    label: 'Fix Scene Basenames',
    columns: [
        { key: 'status', label: 'Status' },
        { key: 'canonicalName', label: 'Canonical Name (Subject)' },
        { key: 'currentBasename', label: 'Current Basename(s)' },
        { key: 'fileCount', label: 'Cook Output Files' },
        { key: 'details', label: 'Details' },
    ],
    rowSettings: [],
    params: [{
        key: 'mode',
        label: 'Scope',
        type: 'select',
        options: [
            { value: 'fixable', label: 'Fixable only' },
            { value: 'affected', label: 'All affected (report-only)' },
        ],
        default: 'fixable',
    }],
    gather: async ({ scopedIds, params }: BulkOpGatherArgs, report: BulkOpReporter): Promise<BulkOpRow[]> => {
        const mode: string = (params && params.mode === 'affected') ? 'affected' : 'fixable';
        const ids: number[] = (scopedIds && scopedIds.length > 0) ? scopedIds : await candidateSceneSystemObjectIds();
        report(0, ids.length);
        const rows: BulkOpRow[] = [];
        let processed = 0;
        for (const id of ids) {
            const state = await computeState(id);
            const include: boolean = mode === 'affected'
                ? (state.status === 'fixable' || state.status === 'mixed')
                : (state.status === 'fixable');
            if (include)
                rows.push(await toRow(id, state));
            report(++processed, ids.length);
        }
        return rows;
    },
    apply: async (idSystemObject: number, _rowSettings: any, idUser: number): Promise<BulkOpApplyResult> => {
        const state = await computeState(idSystemObject);

        if (state.status === 'consistent')
            return { success: true, message: 'already consistent', rowData: { status: 'Consistent', fileCount: 0, details: '—' } };
        if (state.status !== 'fixable')
            return { success: false, message: `refused: ${state.reason || state.status}` };

        const user = await DBAPI.User.fetch(idUser);
        const opInfo: STORE.OperationInfo = {
            message: `Fix scene basenames → ${state.canonical}`,
            idUser,
            userEmailAddress: user?.EmailAddress ?? '',
            userName: user?.Name ?? '',
        };

        const renamed: string[] = [];
        const failed: string[] = [];
        for (const r of state.renames) {
            const ASR = await STORE.AssetStorageAdapter.renameAsset(r.asset, r.to, opInfo);
            if (ASR.success)
                renamed.push(`${r.from} → ${r.to}`);
            else {
                failed.push(r.from);
                RK.logError(RK.LogSection.eHTTP,'fix scene basenames','asset rename failed',
                    { idSystemObject, from: r.from, to: r.to, error: ASR.error, idUser },SRC);
            }
        }

        const after = await computeState(idSystemObject);
        const remaining: number = after.status === 'fixable' ? after.renames.length : 0;
        RK.logInfo(RK.LogSection.eHTTP,'fix scene basenames',`renamed ${renamed.length} asset(s), ${remaining} remaining`,
            { idSystemObject, canonicalName: state.canonical, renamed, failed, idUser },SRC);

        return {
            success: failed.length === 0 && remaining === 0,
            message: failed.length === 0
                ? `renamed ${renamed.length} asset(s) to ${state.canonical}`
                : `renamed ${renamed.length}, ${failed.length} failed`,
            rowData: {
                status: statusLabel(after.status),
                fileCount: remaining,
                details: after.status === 'fixable' ? after.renames.map(r => `${r.from} → ${r.to}`).sort().join(', ') : '—',
            },
        };
    },
};
