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

// A Smithsonian ARK's public form is the n2t.net URL, which is what EDAN indexes as a record's public
// id (guid). A stored ARK may be bare ('ark:/65665/…' or 'ark:65665/…') or already a full URL —
// normalize to that public URL; '' for anything without an 'ark:' segment.
function toArkUrl(value: string): string {
    const v = (value || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    const idx = v.indexOf('ark:');
    return idx >= 0 ? `http://n2t.net/${v.substring(idx)}` : '';
}

// EDAN's getContent does NOT resolve an ARK URL (404); EDAN *search* does. Query by the ARK and return
// the raw row whose public id matches it exactly (carries status/publicSearch/type/content, the fields
// edanRecordToState/edanHasScene read). Exact match avoids the fuzzy neighbours a search also returns.
async function fetchByArk(ICol: COL.ICollection, arkUrl: string): Promise<COL.EdanRecord | null> {
    if (!arkUrl) return null;
    const res = await ICol.queryCollection(arkUrl, 25, 0, { gatherRaw: true });
    if (!res || !res.records) return null;
    const match = res.records.find(r => r.identifierPublic === arkUrl && r.raw);
    return match ? (match.raw as COL.EdanRecord) : null;
}

// The ARK-URL for a SystemObject's ARK Identifier, used as an EDAN fallback when no edanmdm record id
// resolves (or its lookup misses). '' when the object has no ARK. Defensive: any resolution error
// degrades to no-ARK rather than failing the sweep.
async function arkUrlForSystemObject(idSystemObject: number): Promise<string> {
    try {
        const vocab = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeARK);
        if (!vocab)
            return '';
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);
        if (!identifiers)
            return '';
        for (const ident of identifiers)
            if (ident.idVIdentifierType === vocab.idVocabulary && ident.IdentifierValue)
                return toArkUrl(ident.IdentifierValue);
        return '';
    } catch (error) {
        RK.logError(RK.LogSection.eCOLL, 'sync from EDAN ARK resolve failed',
            error instanceof Error ? error.message : String(error), { idSystemObject }, SRC);
        return '';
    }
}

// Cap on how many items a run touches, so a sweep does not hammer EDAN while being evaluated. 'all'
// (or an unset value) means no cap. Selected as a pre-run param.
function parseLimit(params: any): number {
    const raw = params?.limit;
    if (raw === undefined || raw === 'all') return Infinity;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : Infinity;
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

type EdanTarget = { idSystemObject: number; name: string; edanUrl: string; edanId: string; arkUrl: string };

async function subjectTargets(limit: number): Promise<EdanTarget[]> {
    const all = await DBAPI.Subject.fetchAll();
    if (!all) return [];
    const subjects = Number.isFinite(limit) ? all.slice(0, limit) : all;
    const targets: EdanTarget[] = [];
    for (const subject of subjects) {
        const soInfo = await CACHE.SystemObjectCache.getSystemFromSubject(subject);
        if (!soInfo || !soInfo.idSystemObject) continue;
        // computeTargetRecord prepends 'edanmdm:'; the stored record id may already carry the scheme, so
        // normalize via toEdanUrl to avoid a double 'edanmdm:edanmdm:' prefix. The ARK (when present) is
        // a fallback for records that carry no EDAN Record ID or whose record id misses on EDAN.
        const target = await SubjectHelpers.computeTargetRecord(soInfo.idSystemObject);
        const arkUrl = await arkUrlForSystemObject(soInfo.idSystemObject);
        targets.push({ idSystemObject: soInfo.idSystemObject, name: subject.Name, edanUrl: toEdanUrl(target.recordId), edanId: '', arkUrl });
    }
    return targets;
}

async function sceneTargets(limit: number): Promise<EdanTarget[]> {
    const all = await DBAPI.Scene.fetchAll();
    if (!all) return [];
    const scenes = Number.isFinite(limit) ? all.slice(0, limit) : all;
    const targets: EdanTarget[] = [];
    for (const scene of scenes) {
        const so = await DBAPI.SystemObject.fetchFromSceneID(scene.idScene);
        if (!so) continue;
        // Scene EDAN identity: prefer the EdanUUID — its presence means the scene was already published
        // to EDAN and assigned an id, so it is the direct handle. Only when Packrat has no UUID do we
        // fall back to the assigned record id (DB identifier or SVX); that path also does the SVX read,
        // which the UUID path skips.
        if (scene.EdanUUID) {
            targets.push({ idSystemObject: so.idSystemObject, name: scene.Name, edanUrl: '', edanId: scene.EdanUUID, arkUrl: '' });
            continue;
        }
        const rec = await SceneHelpers.validateEdanRecordId(so.idSystemObject, scene.idScene);
        const recordId: string = rec.dbEdanRecordId || rec.svxEdanRecordId || '';
        targets.push({ idSystemObject: so.idSystemObject, name: scene.Name, edanUrl: toEdanUrl(recordId), edanId: '', arkUrl: '' });
    }
    return targets;
}

async function resolveRow(target: EdanTarget, ICol: COL.ICollection): Promise<BulkOpRow> {
    const packrat: COMMON.ePublishedState = await currentPackratState(target.idSystemObject);
    const hasIdentity: boolean = !!(target.edanUrl || target.edanId || target.arkUrl);

    let record: COL.EdanRecord | null = null;
    let note: string = '';
    let viaArk: boolean = false;
    if (!hasIdentity) {
        note = 'No EDAN Record ID';
    } else {
        // Primary: the edanmdm record id (url form) or the scene's EDAN UUID (id form).
        if (target.edanUrl || target.edanId) {
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
        }
        // Fallback: the ARK (via search). Covers records with no EDAN Record ID, or an id that is
        // stale/missing on EDAN. Never overrides a primary hit.
        if (!record && !note && target.arkUrl) {
            try {
                record = await fetchByArk(ICol, target.arkUrl);
                if (record) viaArk = true;
            } catch (error) {
                RK.logError(RK.LogSection.eCOLL, 'sync from EDAN ARK lookup failed',
                    error instanceof Error ? error.message : String(error),
                    { idSystemObject: target.idSystemObject }, SRC);
                note = 'EDAN lookup failed';
            }
        }
        if (!record && !note)
            note = 'Not found on EDAN';
    }

    const edanState: COMMON.ePublishedState = edanRecordToState(record);
    const isCandidate: boolean = packrat !== edanState;
    const statusNote: string = isCandidate ? 'Drift' : 'In sync';
    return {
        id: target.idSystemObject,
        name: target.name,
        isCandidate,
        rowData: {
            packratState: COMMON.PublishedStateEnumToString(packrat),
            edanState: COMMON.PublishedStateEnumToString(edanState),
            edanSearchable: record ? (record.publicSearch ? 'Yes' : 'No') : '—',
            note: note || (viaArk ? `${statusNote} · via ARK` : statusNote),
        },
        defaultSettings: { targetState: String(edanState) },
        current: { targetState: String(packrat) },
    };
}

// --- Model target: a model's owning Subject holds the edanmdm; the question is whether EDAN has a 3D
// scene for it, and whether Packrat has a scene for the model. Report-only (backfill discovery). ---

// A model's EDAN record id comes from its owning Subject (Model -> Items -> Subjects -> EDAN Record ID);
// the owning Subject's ARK is carried alongside as an EDAN fallback.
async function subjectRecordForModel(idModel: number): Promise<{ recordId: string; url: string; arkUrl: string }> {
    const items = await DBAPI.Item.fetchMasterFromModels([idModel]);
    const itemIds: number[] = items ? items.map(i => i.idItem) : [];
    const subjects = itemIds.length > 0 ? await DBAPI.Subject.fetchMasterFromItems(itemIds) : null;
    if (!subjects) return { recordId: '', url: '', arkUrl: '' };
    let arkUrl: string = '';
    for (const subject of subjects) {
        const subjectSO = await DBAPI.SystemObject.fetchFromSubjectID(subject.idSubject);
        if (!subjectSO) continue;
        const target = await SubjectHelpers.computeTargetRecord(subjectSO.idSystemObject);
        if (!arkUrl) arkUrl = await arkUrlForSystemObject(subjectSO.idSystemObject);
        // Normalize to avoid a double 'edanmdm:' when the stored id already carries the scheme.
        if (target.recordId) return { recordId: target.recordId, url: toEdanUrl(target.recordId), arkUrl };
    }
    return { recordId: '', url: '', arkUrl };
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
    const { recordId, url, arkUrl } = await subjectRecordForModel(model.idModel);
    let edanLabel: string;
    let searchable = '—';
    let edanHas = false;
    let note = '';
    if (!recordId && !arkUrl) {
        edanLabel = 'No EDAN Record ID';
        note = 'Subject has no EDAN Record ID';
    } else {
        let record: COL.EdanRecord | null = null;
        let viaArk = false;
        if (recordId) {
            try {
                record = await ICol.fetchContent(undefined, url);
            } catch (error) {
                RK.logError(RK.LogSection.eCOLL, 'sync from EDAN model lookup failed',
                    error instanceof Error ? error.message : String(error), { idSystemObject, recordId }, SRC);
                note = 'EDAN lookup failed';
            }
        }
        // Fallback to the owning Subject's ARK (via search) when no record id resolved.
        if (!record && !note && arkUrl) {
            try {
                record = await fetchByArk(ICol, arkUrl);
                if (record) viaArk = true;
            } catch (error) {
                RK.logError(RK.LogSection.eCOLL, 'sync from EDAN model ARK lookup failed',
                    error instanceof Error ? error.message : String(error), { idSystemObject }, SRC);
                note = 'EDAN lookup failed';
            }
        }
        if (!record) {
            edanLabel = note ? 'Lookup failed' : 'Not found on EDAN';
            if (!note) note = 'Record not found on EDAN';
        } else {
            searchable = record.publicSearch ? 'Yes' : 'No';
            edanHas = edanHasScene(record);
            edanLabel = `${edanHas ? 'Scene present' : 'No 3D scene'}${viaArk ? ' (via ARK)' : ''}`;
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

async function gatherModels(report: BulkOpReporter, limit: number): Promise<BulkOpRow[]> {
    const all = await DBAPI.Model.fetchAll();
    if (!all) return [];
    // Only master models carry the EDAN identity (via the owning Subject); derivatives/downloads are not
    // synced. Filter to Purpose = Master; if the vocab can't be resolved, log and fall back to all.
    const masterVocab = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeMaster);
    let masters = all;
    if (masterVocab)
        masters = all.filter(m => m.idVPurpose === masterVocab.idVocabulary);
    else
        RK.logWarning(RK.LogSection.eCOLL, 'sync from EDAN', 'master model vocab unresolved; sweeping all models', {}, SRC);
    const models = Number.isFinite(limit) ? masters.slice(0, limit) : masters;
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
 * Check Subjects, Scenes, or Models against EDAN. The EDAN record is resolved by the edanmdm record id
 * (or a scene's EDAN UUID) via getContent; when that is absent or misses, the object's ARK Identifier is
 * tried as a fallback via EDAN search (getContent does not resolve ARK URLs). Subjects/Scenes report
 * Packrat vs EDAN publish state
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
        { key: 'limit', label: 'Max items', type: 'select', default: '25',
            options: [{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '100', label: '100' }, { value: '500', label: '500' }, { value: 'all', label: 'All' }] },
    ],
    gather: async ({ params }: BulkOpGatherArgs, report: BulkOpReporter): Promise<BulkOpRow[]> => {
        const limit: number = parseLimit(params);
        if (params?.targetType === 'model')
            return gatherModels(report, limit);

        const targetType: string = params?.targetType === 'scene' ? 'scene' : 'subject';
        const targets: EdanTarget[] = targetType === 'scene' ? await sceneTargets(limit) : await subjectTargets(limit);
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
