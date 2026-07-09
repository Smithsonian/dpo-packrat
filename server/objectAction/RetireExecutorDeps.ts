import * as DBAPI from '../db';
import * as COL from '../collections/interface';
import * as COMMON from '@dpo-packrat/common';
import * as H from '../utils/helpers';
import { withAuditTransaction } from '../audit/withAuditTransaction';
import { AuditFactory } from '../audit/interface/AuditFactory';
import { eAuditType } from '../db/api/ObjectType';
import { RecordKeeper as RK } from '../records/recordKeeper';
import { ASL } from '../utils/localStore';
import { executeRetire, RetireExecutorDeps, RetireExecutionResult, RetireItemResult, RetireItemStatus, UnpublishResult } from './RetireExecutor';

function item(node: DBAPI.ResolvedNode, status: RetireItemStatus, error?: string): RetireItemResult {
    return { idSystemObject: node.idSystemObject, eObjectType: node.eObjectType, kind: node.kind, status, error };
}

/** Scenes among the candidates whose latest version is currently published to EDAN. */
async function findPublishedScenes(candidates: DBAPI.ResolvedNode[]): Promise<number[]> {
    const ids: number[] = [];
    for (const c of candidates) {
        if (c.eObjectType !== COMMON.eSystemObjectType.eScene)
            continue;
        const SOV: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(c.idSystemObject);
        if (SOV && SOV.publishedStateEnum() !== COMMON.ePublishedState.eNotPublished)
            ids.push(c.idSystemObject);
    }
    return ids;
}

/** Unpublish one scene from EDAN by re-upserting its package with unpublished flags, then record a
 *  semantic unpublish audit — mirroring the manual publish mutation. External HTTP; not in a tx. */
async function unpublishScene(idSystemObject: number): Promise<UnpublishResult> {
    const SOVPrior: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(idSystemObject);
    const prevState: COMMON.ePublishedState | null = SOVPrior ? SOVPrior.publishedStateEnum() : null;

    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
    let ok: boolean;
    try {
        ok = await ICol.publish(idSystemObject, COMMON.ePublishedState.eNotPublished);
    } catch (error) {
        RK.logError(RK.LogSection.eCOLL, 'retire unpublish', 'EDAN unpublish threw',
            { idSystemObject, error: H.Helpers.getErrorString(error) }, 'ObjectAction.Retire');
        return { success: false, error: H.Helpers.getErrorString(error) };
    }
    if (!ok)
        return { success: false, error: 'EDAN unpublish failed' };

    await withAuditTransaction(async () => {
        await AuditFactory.emitSemantic({
            action: eAuditType.eActionUnpublish,
            idSystemObject,
            payload: {
                before: { eState: prevState, eStateName: prevState !== null ? COMMON.ePublishedState[prevState] : null },
                after: { eState: COMMON.ePublishedState.eNotPublished, eStateName: COMMON.ePublishedState[COMMON.ePublishedState.eNotPublished] },
                trigger: 'retire',
            },
        });
    });
    return { success: true };
}

/**
 * Flip the Retired flag for every candidate in one audit transaction. The root (candidate 0) is
 * written first with a semantic retire/reinstate row; its idAudit threads into every descendant as
 * parentRetirement.idAudit so the retirement tree is reconstructable from the Audit table.
 */
async function applyRetireFlags(candidates: DBAPI.ResolvedNode[], retire: boolean): Promise<RetireItemResult[]> {
    const results: RetireItemResult[] = [];
    // Pass the acting Actor so a semantic eActionRetire/eActionReinstate row is emitted (not just the
    // base eDBUpdate); the root's idAudit then threads into descendants as parentRetirement.idAudit.
    const actor = ASL.getStore()?.getActor();
    await withAuditTransaction(async () => {
        let rootAuditId: number | null = null;
        for (let i = 0; i < candidates.length; i++) {
            const c: DBAPI.ResolvedNode = candidates[i];
            const isRoot: boolean = i === 0;
            const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(c.idSystemObject);
            if (!SO) {
                results.push(item(c, 'failed', 'unable to fetch SystemObject'));
                continue;
            }

            const alreadyInState: boolean = retire ? SO.Retired : !SO.Retired;
            if (alreadyInState) {
                results.push(item(c, 'skipped'));
                continue;
            }

            const ctx = { actor, reason: null, parentAuditId: isRoot ? null : rootAuditId };
            const res = retire ? await SO.retireObjectWithContext(ctx) : await SO.reinstateObjectWithContext(ctx);
            if (res.success) {
                if (isRoot)
                    rootAuditId = res.idAudit;
                results.push(item(c, 'succeeded'));
            } else
                results.push(item(c, 'failed', `${retire ? 'retire' : 'reinstate'} write failed`));
        }
    });
    return results;
}

/** Production dependencies: resolve against the DB, unpublish via EDAN, flip flags transactionally. */
export const dbRetireExecutorDeps: RetireExecutorDeps = {
    resolve: (idSystemObject: number) => DBAPI.resolveRetireCandidatesFromSystemObject(idSystemObject),
    findPublishedScenes,
    unpublishScene,
    applyFlags: applyRetireFlags,
};

/** Retire or reinstate an object and its resolved dependents/assets against the live DB and EDAN. */
export async function retireSystemObjectTree(idSystemObject: number, retire: boolean): Promise<RetireExecutionResult> {
    return executeRetire(idSystemObject, retire, dbRetireExecutorDeps);
}
