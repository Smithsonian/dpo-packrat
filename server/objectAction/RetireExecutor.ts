import type { eSystemObjectType } from '@dpo-packrat/common';
import type { ResolvedNode, ResolvedNodeKind, RetireResolution, ScopeBlocker } from '../db';

export type RetireItemStatus =
    | 'succeeded'    // flag was flipped by this operation
    | 'failed'       // this object's EDAN unpublish or flag write failed
    | 'skipped'      // already in the requested state (no-op)
    | 'notApplied';  // in scope, but the operation aborted before touching it

export type RetireItemResult = {
    idSystemObject: number;
    eObjectType: eSystemObjectType;
    kind: ResolvedNodeKind;
    status: RetireItemStatus;
    unpublishedFromEdan?: boolean;   // set when this scene's EDAN package was unpublished by this op
    error?: string;
};

export type RetireExecutionResult = {
    applied: boolean;                // true only when the flag-flip phase ran
    retire: boolean;                 // requested direction
    items: RetireItemResult[];
    blockers: ScopeBlocker[];        // scope-guard anomalies surfaced by the resolver (never acted on)
    edanFailures: number;
    message: string;
};

/** Result of unpublishing one scene from EDAN. */
export type UnpublishResult = { success: boolean; error?: string };

/**
 * Side-effecting operations the executor orchestrates, injected so the abort-all sequencing can be
 * unit-tested with fakes independently of the database and EDAN.
 */
export interface RetireExecutorDeps {
    /** Resolve the candidate set (root + derived + assets) and scope blockers. */
    resolve(idSystemObject: number): Promise<RetireResolution | null>;
    /** idSystemObject of candidates that are scenes currently published to EDAN. */
    findPublishedScenes(candidates: ResolvedNode[]): Promise<number[]>;
    /** Unpublish one scene from EDAN. Runs outside any DB transaction (external HTTP). */
    unpublishScene(idSystemObject: number): Promise<UnpublishResult>;
    /** Flip the Retired flag for every candidate in one transaction; returns a per-item outcome. */
    applyFlags(candidates: ResolvedNode[], retire: boolean): Promise<RetireItemResult[]>;
}

function summarize(retire: boolean, items: RetireItemResult[], unpublished: number): string {
    const changed: number = items.filter(i => i.status === 'succeeded').length;
    const skipped: number = items.filter(i => i.status === 'skipped').length;
    const verb: string = retire ? 'Retired' : 'Reinstated';
    const suffix: string = (retire && unpublished > 0) ? `; unpublished ${unpublished} scene(s) from EDAN` : '';
    return `${verb} ${changed} object(s)${skipped > 0 ? `, ${skipped} already in state` : ''}${suffix}`;
}

/**
 * Retire or reinstate a resolved object tree.
 *
 * Retire is phased so that a published scene never survives in EDAN behind a retired Packrat object:
 *   1. Unpublish every affected published scene from EDAN (external, outside any tx).
 *   2. If any unpublish fails, ABORT — no Retired flags are flipped — and report the failures. The
 *      DB is untouched and the operation is retriable; already-succeeded unpublishes are not rolled
 *      back (a scene left unpublished-but-not-retired is benign and self-heals on retry).
 *   3. Only when every unpublish succeeds are the Retired flags flipped, in one transaction.
 *
 * Reinstate flips flags only — it never republishes to EDAN.
 */
export async function executeRetire(idSystemObject: number, retire: boolean, deps: RetireExecutorDeps): Promise<RetireExecutionResult> {
    const resolution: RetireResolution | null = await deps.resolve(idSystemObject);
    if (!resolution) {
        return { applied: false, retire, items: [], blockers: [], edanFailures: 0,
            message: `Unable to resolve retire candidates for SystemObject ${idSystemObject}` };
    }
    const { candidates, blockers } = resolution;

    if (!retire) {
        const items: RetireItemResult[] = await deps.applyFlags(candidates, false);
        return { applied: true, retire: false, items, blockers, edanFailures: 0, message: summarize(false, items, 0) };
    }

    // Retire: unpublish affected published scenes from EDAN first, outside any transaction.
    const publishedSceneIds: number[] = await deps.findPublishedScenes(candidates);
    const edan: Map<number, UnpublishResult> = new Map<number, UnpublishResult>();
    for (const id of publishedSceneIds)
        edan.set(id, await deps.unpublishScene(id));

    const failedIds: number[] = [...edan.entries()].filter(([, r]) => !r.success).map(([id]) => id);

    if (failedIds.length > 0) {
        // Abort-all: flip no flags. Report each candidate — failed scenes carry the error; everything
        // else is notApplied. A scene that DID unpublish before the abort is flagged so the drift is
        // visible rather than silent.
        const items: RetireItemResult[] = candidates.map(c => {
            const r: UnpublishResult | undefined = edan.get(c.idSystemObject);
            if (r && !r.success)
                return { idSystemObject: c.idSystemObject, eObjectType: c.eObjectType, kind: c.kind, status: 'failed', error: r.error };
            return { idSystemObject: c.idSystemObject, eObjectType: c.eObjectType, kind: c.kind, status: 'notApplied',
                unpublishedFromEdan: r?.success === true ? true : undefined };
        });
        return { applied: false, retire: true, items, blockers, edanFailures: failedIds.length,
            message: `Aborted: ${failedIds.length} scene(s) could not be unpublished from EDAN; no objects were retired` };
    }

    // Every unpublish succeeded (or none were needed): flip flags.
    const items: RetireItemResult[] = await deps.applyFlags(candidates, true);
    for (const item of items)
        if (edan.get(item.idSystemObject)?.success === true)
            item.unpublishedFromEdan = true;

    return { applied: true, retire: true, items, blockers, edanFailures: 0, message: summarize(true, items, edan.size) };
}
