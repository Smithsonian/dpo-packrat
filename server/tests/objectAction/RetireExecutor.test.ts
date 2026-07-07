import { eSystemObjectType } from '@dpo-packrat/common';
import type { ResolvedNode, RetireResolution } from '../../db/api/composite/RetireCandidateResolver';
import { executeRetire, RetireExecutorDeps, RetireItemResult, UnpublishResult } from '../../objectAction/RetireExecutor';

function obj(idSystemObject: number, eObjectType: eSystemObjectType): ResolvedNode {
    return { idSystemObject, eObjectType, retired: false, depth: 0, kind: 'object' };
}

/** Deps whose behavior is scripted per test, with call tracking. */
function makeDeps(opts: {
    resolution: RetireResolution | null;
    publishedScenes?: number[];
    unpublish?: (id: number) => UnpublishResult;
}): RetireExecutorDeps & { applyFlagsCalls: Array<{ retire: boolean }>; unpublishCalls: number[] } {
    const applyFlagsCalls: Array<{ retire: boolean }> = [];
    const unpublishCalls: number[] = [];
    return {
        applyFlagsCalls,
        unpublishCalls,
        resolve: async () => opts.resolution,
        findPublishedScenes: async () => opts.publishedScenes ?? [],
        unpublishScene: async (id: number): Promise<UnpublishResult> => {
            unpublishCalls.push(id);
            return opts.unpublish ? opts.unpublish(id) : { success: true };
        },
        applyFlags: async (candidates: ResolvedNode[], retire: boolean): Promise<RetireItemResult[]> => {
            applyFlagsCalls.push({ retire });
            return candidates.map(c => ({ idSystemObject: c.idSystemObject, eObjectType: c.eObjectType, kind: c.kind, status: 'succeeded' }));
        },
    };
}

const statusOf = (items: RetireItemResult[], id: number) => items.find(i => i.idSystemObject === id)?.status;

describe('executeRetire', () => {
    test('reinstate flips flags without touching EDAN', async () => {
        const deps = makeDeps({ resolution: { candidates: [obj(1, eSystemObjectType.eScene)], blockers: [] } });
        const res = await executeRetire(1, false, deps);
        expect(res.applied).toBe(true);
        expect(res.retire).toBe(false);
        expect(deps.unpublishCalls).toHaveLength(0);
        expect(deps.applyFlagsCalls).toEqual([{ retire: false }]);
    });

    test('retire with no published scenes flips flags directly', async () => {
        const deps = makeDeps({
            resolution: { candidates: [obj(1, eSystemObjectType.eItem), obj(2, eSystemObjectType.eModel)], blockers: [] },
            publishedScenes: [],
        });
        const res = await executeRetire(1, true, deps);
        expect(res.applied).toBe(true);
        expect(deps.unpublishCalls).toHaveLength(0);
        expect(deps.applyFlagsCalls).toEqual([{ retire: true }]);
    });

    test('retire unpublishes a published scene, then flips flags', async () => {
        const deps = makeDeps({
            resolution: { candidates: [obj(1, eSystemObjectType.eItem), obj(2, eSystemObjectType.eScene)], blockers: [] },
            publishedScenes: [2],
        });
        const res = await executeRetire(1, true, deps);
        expect(res.applied).toBe(true);
        expect(deps.unpublishCalls).toEqual([2]);
        expect(deps.applyFlagsCalls).toEqual([{ retire: true }]);
        expect(res.items.find(i => i.idSystemObject === 2)?.unpublishedFromEdan).toBe(true);
        expect(res.message).toMatch(/unpublished 1 scene/);
    });

    test('aborts all when an EDAN unpublish fails — no flags flipped', async () => {
        const deps = makeDeps({
            resolution: { candidates: [obj(1, eSystemObjectType.eItem), obj(2, eSystemObjectType.eScene)], blockers: [] },
            publishedScenes: [2],
            unpublish: () => ({ success: false, error: 'EDAN 500' }),
        });
        const res = await executeRetire(1, true, deps);
        expect(res.applied).toBe(false);
        expect(res.edanFailures).toBe(1);
        expect(deps.applyFlagsCalls).toHaveLength(0); // abort before flag flip
        expect(statusOf(res.items, 2)).toBe('failed');
        expect(res.items.find(i => i.idSystemObject === 2)?.error).toBe('EDAN 500');
        expect(statusOf(res.items, 1)).toBe('notApplied');
    });

    test('on abort, a scene already unpublished is flagged as drift, not silently dropped', async () => {
        const deps = makeDeps({
            resolution: { candidates: [obj(2, eSystemObjectType.eScene), obj(3, eSystemObjectType.eScene)], blockers: [] },
            publishedScenes: [2, 3],
            unpublish: (id: number) => (id === 3 ? { success: false, error: 'EDAN 500' } : { success: true }),
        });
        const res = await executeRetire(2, true, deps);
        expect(res.applied).toBe(false);
        expect(statusOf(res.items, 2)).toBe('notApplied');
        expect(res.items.find(i => i.idSystemObject === 2)?.unpublishedFromEdan).toBe(true);
        expect(statusOf(res.items, 3)).toBe('failed');
        expect(deps.applyFlagsCalls).toHaveLength(0);
    });

    test('reports failure when the candidate set cannot be resolved', async () => {
        const deps = makeDeps({ resolution: null });
        const res = await executeRetire(99, true, deps);
        expect(res.applied).toBe(false);
        expect(res.items).toHaveLength(0);
        expect(res.message).toMatch(/99/);
    });
});
