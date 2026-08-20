/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../db';
import { cookOutputSuffixes } from '../../../../job/impl/Cook/CookOutputContract';
import { NameHelpers, UNKNOWN_NAME } from '../../../../utils/nameHelpers';
import { BulkOperationDef, BulkOpRow, BulkOpGatherArgs, BulkOpReporter, BulkOpApplyResult } from './BulkOpTypes';

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
        case 'fixable':    return 'Affected (manual)';
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
        isCandidate: false, // review-only: every row is report-only; no row is selectable / auto-correctable
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
 * REVIEW-ONLY. Reports scenes whose download/SVX asset filenames drifted from the current Subject.Name
 * — the state that makes the Generate Downloads pre-flight guard and the scene-generation SVX check
 * hard block after a subject is renamed — and classifies each. It performs NO correction.
 *
 * Why no automated rename: a safe correction is a three-part transaction — rename the storage assets,
 * rewrite the SVX's internal `asset.uri` references, AND update the derivative model/asset DB records.
 * Renaming the files alone would break the published/viewed SVX (its internal URIs would point at
 * filenames that no longer exist) and leave the DB inconsistent. So remediation is manual for now (or
 * a future correction op that performs all three). The scene-generation and Generate Downloads hard
 * blocks are what prevent NEW drift from being created; this op only surfaces existing drift.
 *
 * Scope param (both are report scopes; nothing is selectable):
 *   - `fixable`  (default) — list only cleanly-identifiable single Subject.Name drift.
 *   - `affected` — additionally list scenes affected but not cleanly classifiable (mixed basenames),
 *     each with a Status + reason so the extent and cause are visible.
 *
 * Classification gate: a scene is flagged only when canonical resolves to exactly one Subject.Name AND
 * every Cook-output asset shares one old basename that differs from it. Multi-subject / ambiguous and
 * mixed-basename scenes are reported (or omitted), never guessed at. (Multi-subject scenes take the
 * source-filename basename, which a subject rename does not change, so a uniform one is not affected.)
 */
export const fixSceneBasenames: BulkOperationDef = {
    key: 'fixSceneBasenames',
    label: 'Review Scene Basenames',
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
    // Review-only: no automated correction. A safe rename must also rewrite the SVX internal asset
    // references and the model/asset DB records (see the header), so it is left to manual remediation.
    // No row is selectable, so the harness never invokes this; it refuses defensively if ever called.
    apply: async (): Promise<BulkOpApplyResult> => {
        return {
            success: false,
            message: 'Review Scene Basenames is review-only: a safe rename must also rewrite the SVX '
                + 'internal asset references and the model DB records, so correction is manual.',
        };
    },
};
