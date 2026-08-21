/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../db';
import * as COL from '../../../../collections/interface';
import * as COMMON from '@dpo-packrat/common';
import { AuditFactory } from '../../../../audit/interface/AuditFactory';
import { withAuditTransaction } from '../../../../audit/withAuditTransaction';
import { RecordKeeper as RK } from '../../../../records/recordKeeper';
import { BulkOperationDef, BulkOpRow, BulkOpGatherArgs, BulkOpReporter, BulkOpApplyResult } from './BulkOpTypes';

const SRC = 'HTTP.Route.BulkOp.RepublishScenes';

// The states a scene can be (re)published to. Leaving the per-row Select at the current state re-pushes
// the scene to EDAN unchanged (the refresh use case); choosing another state changes it.
const PUBLISH_TARGET_STATES: COMMON.ePublishedState[] = [
    COMMON.ePublishedState.ePublished,
    COMMON.ePublishedState.eAPIOnly,
    COMMON.ePublishedState.eInternal,
    COMMON.ePublishedState.eNotPublished,
];

// A published value is any state other than Not Published; only these can be reached without passing the
// Approved-for-Publication / Posed-and-QC'd gate (unpublishing is always allowed).
function isPublishedState(s: COMMON.ePublishedState): boolean {
    return s === COMMON.ePublishedState.ePublished ||
        s === COMMON.ePublishedState.eAPIOnly ||
        s === COMMON.ePublishedState.eInternal;
}

// Read after.eState from a publish/unpublish audit payload (the shape publish.ts / RetireExecutorDeps.ts
// emit) — the authoritative CURRENT Packrat state, matching what the details page derives.
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

// Read-only per-scene evaluation. Only scenes that were ever published (carry an EdanUUID) are listed;
// scenes that cannot be published because they are not Approved-for-Publication / Posed-and-QC'd are shown
// report-only (isCandidate:false) with the reason, so the blocked set is visible but cannot be acted on.
async function evaluateOne(idSystemObject: number): Promise<BulkOpRow | null> {
    const so = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!so || !so.idScene)
        return null;
    const scene = await DBAPI.Scene.fetch(so.idScene);
    if (!scene || !scene.EdanUUID)
        return null; // never published to EDAN — nothing to republish

    const current: COMMON.ePublishedState = await currentPackratState(idSystemObject);
    const currentName: string = COMMON.PublishedStateEnumToString(current);
    const qcOK: boolean = scene.ApprovedForPublication && scene.PosedAndQCd;
    const note: string = qcOK ? '' : 'Not Approved / Not QC\'d — publish blocked';

    return {
        id: idSystemObject,
        name: scene.Name,
        isCandidate: qcOK,
        rowData: { currentStatus: currentName, edanRecord: scene.EdanUUID, note },
        defaultSettings: { targetState: String(current) },
        current: { targetState: String(current) },
    };
}

/**
 * Republish scenes to EDAN. Gather lists every scene that was ever published (has an EdanUUID); each row's
 * per-row Select defaults to the scene's current published state, so running a row unchanged re-pushes it
 * to EDAN (refresh), while choosing another state changes it. Scenes that are not Approved-for-Publication
 * / Posed-and-QC'd are shown report-only (not selectable); apply re-checks the gate and refuses them.
 *
 * apply performs the real EDAN publish via ICol.publish (staging + package upsert) OUTSIDE any transaction,
 * then emits the eActionPublish / eActionUnpublish audit event that the details page reads for current
 * state — mirroring the publish GraphQL mutation.
 */
export const republishScenes: BulkOperationDef = {
    key: 'republishScenes',
    label: 'Republish Scenes',
    columns: [
        { key: 'currentStatus', label: 'Current Status' },
        { key: 'edanRecord', label: 'EDAN Record' },
        { key: 'note', label: 'Note' },
    ],
    rowSettings: [
        { key: 'targetState', label: 'Publish To', type: 'select',
            options: PUBLISH_TARGET_STATES.map(s => ({ value: String(s), label: COMMON.PublishedStateEnumToString(s) })) },
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
    apply: async (idSystemObject: number, rowSettings: any, _idUser: number): Promise<BulkOpApplyResult> => {
        const target: number = Number(rowSettings?.targetState);
        if (!Number.isInteger(target) || COMMON.ePublishedState[target] === undefined)
            return { success: false, message: `invalid target state '${rowSettings?.targetState}'` };

        const so = await DBAPI.SystemObject.fetch(idSystemObject);
        if (!so || !so.idScene)
            return { success: false, message: 'not a scene' };
        const scene = await DBAPI.Scene.fetch(so.idScene);
        if (!scene)
            return { success: false, message: `cannot fetch scene ${so.idScene}` };

        // Re-check the publish gate (double-guards the report-only rows): publishing to a live state
        // requires the scene be Approved-for-Publication and Posed-and-QC'd. Unpublishing is always allowed.
        if (isPublishedState(target) && (!scene.ApprovedForPublication || !scene.PosedAndQCd))
            return { success: false, message: 'refused: not Approved-for-Publication / Posed-and-QC\'d' };

        const prior: COMMON.ePublishedState = await currentPackratState(idSystemObject);
        const priorName: string = COMMON.PublishedStateEnumToString(prior);
        const targetName: string = COMMON.PublishedStateEnumToString(target);

        // ICol.publish stages the scene and upserts the EDAN 3D package; it does external HTTP + hot-folder
        // I/O and MUST NOT run inside a Prisma transaction. It updates SystemObjectVersion.PublishedState
        // internally; we emit the audit event (the authoritative current-state record) after it succeeds.
        const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
        const publishRes = await ICol.publish(idSystemObject, target);
        if (!publishRes.success)
            return { success: false, message: publishRes.error ?? 'publish failed' };

        const isUnpublish: boolean = target === COMMON.ePublishedState.eNotPublished;
        await withAuditTransaction(async (): Promise<void> => {
            await AuditFactory.emitSemantic({
                action: isUnpublish ? DBAPI.eAuditType.eActionUnpublish : DBAPI.eAuditType.eActionPublish,
                idSystemObject,
                payload: {
                    before: { eState: prior, eStateName: priorName },
                    after: { eState: target, eStateName: targetName },
                    via: 'bulkOperation',
                },
            });
        });

        RK.logInfo(RK.LogSection.eHTTP, 'republish scene', `${priorName} → ${targetName}`,
            { idSystemObject, idScene: scene.idScene }, SRC);

        const message: string = prior === target ? `re-pushed (${targetName})` : `${priorName} → ${targetName}`;
        return { success: true, message, rowData: { currentStatus: targetName } };
    },
};
