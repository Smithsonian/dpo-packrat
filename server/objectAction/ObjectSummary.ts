import * as DBAPI from '../db';
import * as CACHE from '../cache';
import * as COMMON from '@dpo-packrat/common';
import { SystemObjectTypeToName } from '../db/api/ObjectType';
import { RecordKeeper as RK } from '../records/recordKeeper';
import type { ResolvedNode, ResolvedNodeKind, ScopeBlocker } from '../db';
import type { RetireItemResult, RetireItemStatus } from './RetireExecutor';

/**
 * Presentation view of one object in an action response. `describe` populates the full set; action
 * responses (retire/reinstate) carry the lightweight identity fields plus `status`/`error` and let
 * the client merge them onto the preview rows it already holds.
 */
export type ObjectSummary = {
    idSystemObject: number;
    eObjectType: COMMON.eSystemObjectType;
    objectType: string;                  // human-readable type name
    name: string | null;
    kind: ResolvedNodeKind;
    depth?: number;
    retired?: boolean;
    unit?: string | null;
    project?: string | null;
    subject?: string | null;
    publishedState?: string;             // scenes only
    edanUUID?: string | null;            // scenes only
    status?: RetireItemStatus;           // action responses only
    unpublishedFromEdan?: boolean;
    error?: string;
    blockerReason?: ScopeBlocker['reason'];
};

async function objectName(idSystemObject: number): Promise<string | null> {
    return (await CACHE.SystemObjectCache.getObjectNameByID(idSystemObject)) ?? null;
}

/** Ancestry (unit/project/subject names) for an object node, best-effort. */
async function ancestry(idSystemObject: number): Promise<{ unit: string | null; project: string | null; subject: string | null }> {
    const empty = { unit: null, project: null, subject: null };
    const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eAncestors);
    if (!await OG.fetch()) {
        RK.logError(RK.LogSection.eDB, 'object summary', 'unable to compute ancestry',
            { idSystemObject }, 'ObjectAction.Summary');
        return empty;
    }
    return {
        unit: OG.unit?.[0]?.Name ?? null,
        project: OG.project?.[0]?.Name ?? null,
        subject: OG.subject?.[0]?.Name ?? null,
    };
}

/** Published state + EdanUUID for a scene node. */
async function sceneState(idSystemObject: number): Promise<{ publishedState: string; edanUUID: string | null }> {
    const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
    const publishedState: string = COMMON.PublishedStateEnumToString(SOV ? SOV.publishedStateEnum() : COMMON.ePublishedState.eNotPublished);

    let edanUUID: string | null = null;
    const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
    if (SO?.idScene) {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(SO.idScene);
        edanUUID = scene?.EdanUUID ?? null;
    }
    return { publishedState, edanUUID };
}

/** Full enrichment for the preview (`describe`): name, ancestry, and scene publish state. */
export async function describeSummaries(nodes: ResolvedNode[]): Promise<ObjectSummary[]> {
    const summaries: ObjectSummary[] = [];
    for (const node of nodes) {
        const summary: ObjectSummary = {
            idSystemObject: node.idSystemObject,
            eObjectType: node.eObjectType,
            objectType: SystemObjectTypeToName(node.eObjectType),
            name: await objectName(node.idSystemObject),
            kind: node.kind,
            depth: node.depth,
            retired: node.retired,
        };
        if (node.kind === 'object') {
            const anc = await ancestry(node.idSystemObject);
            summary.unit = anc.unit;
            summary.project = anc.project;
            summary.subject = anc.subject;
        }
        if (node.eObjectType === COMMON.eSystemObjectType.eScene) {
            const state = await sceneState(node.idSystemObject);
            summary.publishedState = state.publishedState;
            summary.edanUUID = state.edanUUID;
        }
        summaries.push(summary);
    }
    return summaries;
}

/** Lightweight enrichment for action results: identity + per-item outcome. */
export async function resultSummaries(items: RetireItemResult[]): Promise<ObjectSummary[]> {
    const summaries: ObjectSummary[] = [];
    for (const item of items) {
        summaries.push({
            idSystemObject: item.idSystemObject,
            eObjectType: item.eObjectType,
            objectType: SystemObjectTypeToName(item.eObjectType),
            name: await objectName(item.idSystemObject),
            kind: item.kind,
            status: item.status,
            unpublishedFromEdan: item.unpublishedFromEdan,
            error: item.error,
        });
    }
    return summaries;
}

/** Summaries for scope blockers (containers refused by the guard), tagged with the reason. */
export async function blockerSummaries(blockers: ScopeBlocker[]): Promise<ObjectSummary[]> {
    const summaries: ObjectSummary[] = [];
    for (const blocker of blockers) {
        summaries.push({
            idSystemObject: blocker.node.idSystemObject,
            eObjectType: blocker.node.eObjectType,
            objectType: SystemObjectTypeToName(blocker.node.eObjectType),
            name: await objectName(blocker.node.idSystemObject),
            kind: blocker.node.kind,
            depth: blocker.node.depth,
            blockerReason: blocker.reason,
        });
    }
    return summaries;
}
