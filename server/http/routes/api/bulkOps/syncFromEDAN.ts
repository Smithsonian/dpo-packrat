/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../db';
import * as CACHE from '../../../../cache';
import * as COL from '../../../../collections/interface';
import * as COMMON from '@dpo-packrat/common';
import { SubjectHelpers } from '../../../../utils/subjectHelpers';
import { SceneHelpers } from '../../../../utils/sceneHelpers';
import { AuditFactory } from '../../../../audit/interface/AuditFactory';
import { withAuditTransaction } from '../../../../audit/withAuditTransaction';
import { RecordKeeper as RK } from '../../../../records/recordKeeper';
import { BulkOperationDef, BulkOpRow, BulkOpGatherArgs, BulkOpReporter, BulkOpApplyResult } from './BulkOpTypes';

const SRC = 'HTTP.Route.BulkOp.SyncFromEDAN';
const THROTTLE_MS = 100;

// The publish states the user can reconcile a row to; the default is EDAN's confirmed state.
const PUBLISHED_STATES: COMMON.ePublishedState[] = [
    COMMON.ePublishedState.eNotPublished,
    COMMON.ePublishedState.eAPIOnly,
    COMMON.ePublishedState.ePublished,
    COMMON.ePublishedState.eInternal,
];

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// A record id may already carry an EDAN scheme (edanmdm:/edanlists:); bare ids default to edanmdm.
function toEdanUrl(recordId: string): string {
    if (!recordId) return '';
    return recordId.includes(':') ? recordId : `edanmdm:${recordId}`;
}

// Read after.eState from a publish/unpublish audit payload (the shape publish.ts / RetireExecutorDeps.ts
// emit). This is the authoritative CURRENT Packrat state — matching what the details page derives.
function parsePublicationState(data: string | null): COMMON.ePublishedState | null {
    if (!data) return null;
    try {
        const parsed = JSON.parse(data);
        const eState: unknown = parsed?.after?.eState;
        if (typeof eState !== 'number' || COMMON.ePublishedState[eState] === undefined)
            return null;
        return eState as COMMON.ePublishedState;
    } catch {
        return null;
    }
}

// Current Packrat published state: the latest publish/unpublish audit event, falling back to the latest
// version's field for un-audited (legacy) objects — the same rule the details page uses.
async function currentPackratState(idSystemObject: number): Promise<COMMON.ePublishedState> {
    const ev = await DBAPI.Audit.fetchLatestPublicationEvent(idSystemObject);
    const st = ev ? parsePublicationState(ev.Data) : null;
    if (st !== null)
        return st;
    const sov = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
    return sov ? sov.publishedStateEnum() : COMMON.ePublishedState.eNotPublished;
}

// Map an EDAN record to the publish state it represents. EDAN status 0 = published; publicSearch marks
// public vs unlisted. A missing record (or unpublished status) reads as Not Published.
function edanRecordToState(record: COL.EdanRecord | null): COMMON.ePublishedState {
    if (!record || record.status !== 0)
        return COMMON.ePublishedState.eNotPublished;
    return record.publicSearch ? COMMON.ePublishedState.ePublished : COMMON.ePublishedState.eAPIOnly;
}

type EdanTarget = { idSystemObject: number; name: string; edanUrl: string; edanId: string };

async function subjectTargets(): Promise<EdanTarget[]> {
    const subjects = await DBAPI.Subject.fetchAll();
    if (!subjects) return [];
    const targets: EdanTarget[] = [];
    for (const subject of subjects) {
        const soInfo = await CACHE.SystemObjectCache.getSystemFromSubject(subject);
        if (!soInfo || !soInfo.idSystemObject) continue;
        const target = await SubjectHelpers.computeTargetRecord(soInfo.idSystemObject);
        targets.push({ idSystemObject: soInfo.idSystemObject, name: subject.Name, edanUrl: target.url, edanId: '' });
    }
    return targets;
}

async function sceneTargets(): Promise<EdanTarget[]> {
    const scenes = await DBAPI.Scene.fetchAll();
    if (!scenes) return [];
    const targets: EdanTarget[] = [];
    for (const scene of scenes) {
        const so = await DBAPI.SystemObject.fetchFromSceneID(scene.idScene);
        if (!so) continue;
        // Scene EDAN identity: prefer the EdanUUID — its presence means the scene was already published
        // to EDAN and assigned an id, so it is the direct handle. Only when Packrat has no UUID do we
        // fall back to the assigned record id (DB identifier or SVX); that path also does the SVX read,
        // which the UUID path skips.
        if (scene.EdanUUID) {
            targets.push({ idSystemObject: so.idSystemObject, name: scene.Name, edanUrl: '', edanId: scene.EdanUUID });
            continue;
        }
        const rec = await SceneHelpers.validateEdanRecordId(so.idSystemObject, scene.idScene);
        const recordId: string = rec.dbEdanRecordId || rec.svxEdanRecordId || '';
        targets.push({ idSystemObject: so.idSystemObject, name: scene.Name, edanUrl: toEdanUrl(recordId), edanId: '' });
    }
    return targets;
}

async function resolveRow(target: EdanTarget, ICol: COL.ICollection): Promise<BulkOpRow> {
    const packrat: COMMON.ePublishedState = await currentPackratState(target.idSystemObject);
    const hasIdentity: boolean = !!(target.edanUrl || target.edanId);

    let record: COL.EdanRecord | null = null;
    let note: string = '';
    if (!hasIdentity) {
        note = 'No EDAN Record ID';
    } else {
        try {
            record = target.edanUrl
                ? await ICol.fetchContent(undefined, target.edanUrl)
                : await ICol.fetchContent(target.edanId);
        } catch (error) {
            RK.logError(RK.LogSection.eCOLL, 'sync from EDAN lookup failed',
                error instanceof Error ? error.message : String(error),
                { idSystemObject: target.idSystemObject }, SRC);
            note = 'EDAN lookup failed';
        }
        if (!record && !note)
            note = 'Not found on EDAN';
    }

    const edanState: COMMON.ePublishedState = edanRecordToState(record);
    const isCandidate: boolean = packrat !== edanState;
    return {
        id: target.idSystemObject,
        name: target.name,
        isCandidate,
        rowData: {
            packratState: COMMON.PublishedStateEnumToString(packrat),
            edanState: COMMON.PublishedStateEnumToString(edanState),
            edanSearchable: record ? (record.publicSearch ? 'Yes' : 'No') : '—',
            note: note || (isCandidate ? 'Drift' : 'In sync'),
        },
        defaultSettings: { targetState: String(edanState) },
        current: { targetState: String(packrat) },
    };
}

// --- Model target: a model's owning Subject holds the edanmdm; the question is whether EDAN has a 3D
// scene for it, and whether Packrat has a scene for the model. Report-only (backfill discovery). ---

// A model's EDAN record id comes from its owning Subject (Model -> Items -> Subjects -> EDAN Record ID).
async function subjectRecordForModel(idModel: number): Promise<{ recordId: string; url: string }> {
    const items = await DBAPI.Item.fetchMasterFromModels([idModel]);
    const itemIds: number[] = items ? items.map(i => i.idItem) : [];
    const subjects = itemIds.length > 0 ? await DBAPI.Subject.fetchMasterFromItems(itemIds) : null;
    if (!subjects) return { recordId: '', url: '' };
    for (const subject of subjects) {
        const subjectSO = await DBAPI.SystemObject.fetchFromSubjectID(subject.idSubject);
        if (!subjectSO) continue;
        const target = await SubjectHelpers.computeTargetRecord(subjectSO.idSystemObject);
        if (target.recordId) return { recordId: target.recordId, url: target.url };
    }
    return { recordId: '', url: '' };
}

// Detect whether an EDAN record carries a 3D scene. EDAN assigns type '3d_package' to a 3D record; its
// content holds the processed SVX with a 'Voyager Scene' (the submitted SVX) and a 'Package' (the full
// asset package). The record type is the primary signal; scanning the content for those markers is the
// fallback, covering an edanmdm record that references a 3D package rather than being one.
function edanHasScene(record: COL.EdanRecord | null): boolean {
    if (!record) return false;
    if (typeof record.type === 'string' && record.type.toLowerCase().includes('3d_package'))
        return true;
    const content = JSON.stringify(record.content ?? record).toLowerCase();
    return content.includes('3d_package') || content.includes('voyager scene')
        || content.includes('voyagerid') || content.includes('voyager');
}

async function resolveModelRow(model: DBAPI.Model, ICol: COL.ICollection): Promise<BulkOpRow> {
    const so = await DBAPI.SystemObject.fetchFromModelID(model.idModel);
    const idSystemObject: number = so ? so.idSystemObject : 0;

    // Packrat scene(s) for this model, via ModelSceneXref.
    const scenes = await DBAPI.Scene.fetchFromXref(model.idModel);
    const packratHasScene: boolean = !!(scenes && scenes.length > 0);
    let packratLabel = 'No Scene';
    if (scenes && scenes.length > 0) {
        const sceneSO = await DBAPI.SystemObject.fetchFromSceneID(scenes[0].idScene);
        const state = sceneSO ? await currentPackratState(sceneSO.idSystemObject) : COMMON.ePublishedState.eNotPublished;
        packratLabel = `Scene: ${COMMON.PublishedStateEnumToString(state)}`;
    }

    // The owning Subject's EDAN record → does EDAN have a 3D scene for it.
    const { recordId, url } = await subjectRecordForModel(model.idModel);
    let edanLabel: string;
    let searchable = '—';
    let edanHas = false;
    let note = '';
    if (!recordId) {
        edanLabel = 'No EDAN Record ID';
        note = 'Subject has no EDAN Record ID';
    } else {
        let record: COL.EdanRecord | null = null;
        try {
            record = await ICol.fetchContent(undefined, url);
        } catch (error) {
            RK.logError(RK.LogSection.eCOLL, 'sync from EDAN model lookup failed',
                error instanceof Error ? error.message : String(error), { idSystemObject, recordId }, SRC);
            note = 'EDAN lookup failed';
        }
        if (!record) {
            edanLabel = note ? 'Lookup failed' : 'Not found on EDAN';
            if (!note) note = 'Record not found on EDAN';
        } else {
            searchable = record.publicSearch ? 'Yes' : 'No';
            edanHas = edanHasScene(record);
            edanLabel = edanHas ? 'Scene present' : 'No 3D scene';
        }
    }

    if (!note) {
        if (edanHas && !packratHasScene) note = 'EDAN scene, no Packrat scene — backfill candidate';
        else if (edanHas && packratHasScene) note = 'Both present';
        else if (!edanHas && packratHasScene) note = 'Packrat scene only';
        else note = 'Neither';
    }
    // Report-only: a row is flagged when EDAN has a scene Packrat is missing (the backfill signal).
    const isCandidate: boolean = edanHas && !packratHasScene;

    return {
        id: idSystemObject,
        name: model.Name,
        isCandidate,
        rowData: { packratState: packratLabel, edanState: edanLabel, edanSearchable: searchable, note },
        defaultSettings: {},
        current: {},
    };
}

async function gatherModels(report: BulkOpReporter): Promise<BulkOpRow[]> {
    const models = await DBAPI.Model.fetchAll();
    if (!models) return [];
    report(0, models.length);
    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
    const rows: BulkOpRow[] = [];
    let processed = 0;
    for (const model of models) {
        rows.push(await resolveModelRow(model, ICol));
        report(++processed, models.length);
        if (THROTTLE_MS > 0)
            await sleep(THROTTLE_MS);
    }
    return rows;
}

/**
 * Check Subjects, Scenes, or Models against EDAN. Subjects/Scenes report Packrat vs EDAN publish state
 * and support an explicit per-row reconcile (adopt a chosen state into Packrat — never touches EDAN,
 * never automatic). Models report whether EDAN has a 3D scene for the owning Subject's record and
 * whether Packrat has a scene — report-only for now (a backfill action is future work). Target is a param.
 */
export const syncFromEDAN: BulkOperationDef = {
    key: 'syncFromEDAN',
    label: 'Sync from EDAN',
    columns: [
        { key: 'packratState', label: 'Packrat State' },
        { key: 'edanState', label: 'EDAN State' },
        { key: 'edanSearchable', label: 'EDAN Searchable' },
        { key: 'note', label: 'Note' },
    ],
    rowSettings: [
        { key: 'targetState', label: 'Set Packrat To', type: 'select',
            options: PUBLISHED_STATES.map(s => ({ value: String(s), label: COMMON.PublishedStateEnumToString(s) })) },
    ],
    params: [
        { key: 'targetType', label: 'Target', type: 'select', default: 'subject',
            options: [{ value: 'subject', label: 'Subjects' }, { value: 'scene', label: 'Scenes' }, { value: 'model', label: 'Models' }] },
    ],
    gather: async ({ params }: BulkOpGatherArgs, report: BulkOpReporter): Promise<BulkOpRow[]> => {
        if (params?.targetType === 'model')
            return gatherModels(report);

        const targetType: string = params?.targetType === 'scene' ? 'scene' : 'subject';
        const targets: EdanTarget[] = targetType === 'scene' ? await sceneTargets() : await subjectTargets();
        report(0, targets.length);

        const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
        const rows: BulkOpRow[] = [];
        let processed = 0;
        for (const target of targets) {
            rows.push(await resolveRow(target, ICol));
            report(++processed, targets.length);
            if (THROTTLE_MS > 0)
                await sleep(THROTTLE_MS);
        }
        return rows;
    },
    apply: async (idSystemObject: number, rowSettings: any, _idUser: number, params: any): Promise<BulkOpApplyResult> => {
        // Models are report-only: no reconcile action exists yet (scene backfill is future work).
        if (params?.targetType === 'model')
            return { success: false, message: 'Models are report-only; no change is applied' };

        const target: number = Number(rowSettings?.targetState);
        if (!Number.isInteger(target) || COMMON.ePublishedState[target] === undefined)
            return { success: false, message: `invalid target state '${rowSettings?.targetState}'` };

        const prior: COMMON.ePublishedState = await currentPackratState(idSystemObject);
        if (prior === target)
            return { success: true, message: 'already in sync' };

        const priorName: string = COMMON.PublishedStateEnumToString(prior);
        const targetName: string = COMMON.PublishedStateEnumToString(target);

        // Reconcile the LOCAL label to the chosen state. The audit event is what the details page reads
        // for current state, so it must be emitted (not just the version field) or the label won't move.
        const ok = await withAuditTransaction(async (): Promise<boolean> => {
            const sov = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
            if (sov && sov.publishedStateEnum() !== target) {
                sov.setPublishedState(target);
                if (!await sov.update())
                    return false;
            }
            const isUnpublish: boolean = target === COMMON.ePublishedState.eNotPublished;
            await AuditFactory.emitSemantic({
                action: isUnpublish ? DBAPI.eAuditType.eActionUnpublish : DBAPI.eAuditType.eActionPublish,
                idSystemObject,
                payload: {
                    before: { eState: prior, eStateName: priorName },
                    after: { eState: target, eStateName: targetName },
                    via: 'edanReconcile',
                },
            });
            return true;
        });
        if (!ok)
            return { success: false, message: 'failed to update published state' };
        return { success: true, message: `${priorName} → ${targetName}`, rowData: { packratState: targetName } };
    },
};
