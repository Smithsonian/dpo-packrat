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

/**
 * Check every Subject or Scene against EDAN and report Packrat vs EDAN publish state side by side.
 * Read-only gather; apply is an explicit per-row reconcile that adopts a chosen state into Packrat
 * (never touches EDAN, never runs automatically). The target type (Subject / Scene) is a pre-run param.
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
            options: [{ value: 'subject', label: 'Subjects' }, { value: 'scene', label: 'Scenes' }] },
    ],
    gather: async ({ params }: BulkOpGatherArgs, report: BulkOpReporter): Promise<BulkOpRow[]> => {
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
    apply: async (idSystemObject: number, rowSettings: any): Promise<BulkOpApplyResult> => {
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
