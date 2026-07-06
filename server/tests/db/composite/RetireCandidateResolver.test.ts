import { eSystemObjectType } from '@dpo-packrat/common';
import { resolveRetireCandidates, ResolvedNode, RetireGraphSource } from '../../../db/api/composite/RetireCandidateResolver';

function obj(idSystemObject: number, eObjectType: eSystemObjectType, retired: boolean = false): ResolvedNode {
    return { idSystemObject, eObjectType, retired, depth: 0, kind: 'object' };
}
function asset(idSystemObject: number): ResolvedNode {
    return { idSystemObject, eObjectType: eSystemObjectType.eAsset, retired: false, depth: 0, kind: 'asset' };
}

class MemSource implements RetireGraphSource {
    constructor(
        private children: Map<number, ResolvedNode[]> = new Map<number, ResolvedNode[]>(),
        private assets: Map<number, ResolvedNode[]> = new Map<number, ResolvedNode[]>(),
    ) {}
    async getChildren(idSystemObject: number): Promise<ResolvedNode[]> {
        return (this.children.get(idSystemObject) ?? []).map(n => ({ ...n }));
    }
    async getAssets(node: ResolvedNode): Promise<ResolvedNode[]> {
        return (this.assets.get(node.idSystemObject) ?? []).map(n => ({ ...n }));
    }
}

const ids = (nodes: ResolvedNode[]): number[] => nodes.map(n => n.idSystemObject).sort((a, b) => a - b);

describe('resolveRetireCandidates', () => {
    test('collects root, derived objects, and their assets (deduped)', async () => {
        const root = obj(1, eSystemObjectType.eItem);
        const source = new MemSource(
            new Map([
                [1, [obj(2, eSystemObjectType.eModel), obj(3, eSystemObjectType.eScene)]],
                [3, [obj(4, eSystemObjectType.eModel)]],
            ]),
            new Map([
                [2, [asset(10)]],
                [3, [asset(11)]],
                [4, [asset(12)]],
            ]),
        );
        const { candidates, blockers } = await resolveRetireCandidates(root, source);
        expect(blockers).toHaveLength(0);
        expect(ids(candidates)).toEqual([1, 2, 3, 4, 10, 11, 12]);
    });

    test('terminates on a cycle', async () => {
        const root = obj(1, eSystemObjectType.eModel);
        const source = new MemSource(new Map([
            [1, [obj(2, eSystemObjectType.eModel)]],
            [2, [obj(1, eSystemObjectType.eModel)]], // back-edge
        ]));
        const { candidates } = await resolveRetireCandidates(root, source);
        expect(ids(candidates)).toEqual([1, 2]);
    });

    test('dedupes a diamond', async () => {
        const root = obj(1, eSystemObjectType.eItem);
        const source = new MemSource(new Map([
            [1, [obj(2, eSystemObjectType.eModel), obj(3, eSystemObjectType.eModel)]],
            [2, [obj(4, eSystemObjectType.eScene)]],
            [3, [obj(4, eSystemObjectType.eScene)]], // same child reached twice
        ]));
        const { candidates } = await resolveRetireCandidates(root, source);
        expect(ids(candidates)).toEqual([1, 2, 3, 4]);
    });

    test('scope guard blocks a container below the root and skips its subtree', async () => {
        const root = obj(1, eSystemObjectType.eModel);
        const source = new MemSource(new Map([
            [1, [obj(2, eSystemObjectType.eSubject)]],  // inverted: container under a Model
            [2, [obj(3, eSystemObjectType.eItem)]],     // must NOT be reached
        ]));
        const { candidates, blockers } = await resolveRetireCandidates(root, source);
        expect(ids(candidates)).toEqual([1]);
        expect(blockers).toHaveLength(1);
        expect(blockers[0].node.idSystemObject).toBe(2);
        expect(blockers[0].reason).toBe('containerBelowRoot');
    });

    test('permits legitimate downward container cascade (Unit root)', async () => {
        const root = obj(1, eSystemObjectType.eUnit);
        const source = new MemSource(new Map([
            [1, [obj(2, eSystemObjectType.eSubject)]],
            [2, [obj(3, eSystemObjectType.eItem)]],
            [3, [obj(4, eSystemObjectType.eScene)]],
        ]));
        const { candidates, blockers } = await resolveRetireCandidates(root, source);
        expect(blockers).toHaveLength(0);
        expect(ids(candidates)).toEqual([1, 2, 3, 4]);
    });

    test('dedupes an asset shared across two owners', async () => {
        const root = obj(1, eSystemObjectType.eScene);
        const source = new MemSource(
            new Map([[1, [obj(2, eSystemObjectType.eModel)]]]),
            new Map([
                [1, [asset(10)]],
                [2, [asset(10)]], // same asset owned by scene and its model
            ]),
        );
        const { candidates } = await resolveRetireCandidates(root, source);
        expect(ids(candidates)).toEqual([1, 2, 10]);
    });

    test('records depth increasing down the graph', async () => {
        const root = obj(1, eSystemObjectType.eItem);
        const source = new MemSource(new Map([
            [1, [obj(2, eSystemObjectType.eModel)]],
            [2, [obj(3, eSystemObjectType.eScene)]],
        ]));
        const { candidates } = await resolveRetireCandidates(root, source);
        const byId = new Map(candidates.map(n => [n.idSystemObject, n.depth]));
        expect(byId.get(1)).toBe(0);
        expect(byId.get(2)).toBe(1);
        expect(byId.get(3)).toBe(2);
    });
});
