import * as DBAPI from '../..';
import * as COMMON from '@dpo-packrat/common';
import { SystemObjectTypeFromSystemObject } from '../ObjectType';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

export type ResolvedNodeKind = 'object' | 'asset';

/** A single object slated for retire/reinstate. `depth` is 0 for the root and increments per level
 *  down the derived graph; assets carry the depth of the object that owns them. */
export type ResolvedNode = {
    idSystemObject: number;
    eObjectType: COMMON.eSystemObjectType;
    retired: boolean;
    depth: number;
    kind: ResolvedNodeKind;
    idParent?: number;               // owning object (assets) or discovering parent (derived objects)
};

/** A descendant that the scope guard refused to include: a structural container (Unit/Project/
 *  Subject/Item) reached below the root, which indicates an inverted xref edge (bad data or a bug).
 *  Its subtree is not traversed, so a container's contents can never be swept into a retire. */
export type ScopeBlocker = {
    node: ResolvedNode;
    reason: 'containerBelowRoot';
};

export type RetireResolution = {
    candidates: ResolvedNode[];   // root first, then derived objects, then their assets; deduped
    blockers: ScopeBlocker[];
};

/** Graph access the resolver needs, injected so the traversal can be unit-tested with in-memory
 *  fixtures (including cycles) independently of the database. */
export interface RetireGraphSource {
    /** Derived (child) objects of the given SystemObject. */
    getChildren(idSystemObject: number): Promise<ResolvedNode[]>;
    /** Asset objects owned by the given node (scene-aware). */
    getAssets(node: ResolvedNode): Promise<ResolvedNode[]>;
}

/**
 * Walks the derived graph beneath `root` and returns the flat, deduped set of objects (and their
 * assets) that a retire/reinstate would touch, plus any scope blockers. Traversal is breadth-first
 * and guarded by a visited-set, so cycles and diamonds terminate and each object appears once. A
 * descendant that is a structural container ranked above the root is recorded as a blocker and its
 * subtree is skipped.
 */
export async function resolveRetireCandidates(root: ResolvedNode, source: RetireGraphSource): Promise<RetireResolution> {
    const visited: Set<number> = new Set<number>([root.idSystemObject]);
    const blockers: ScopeBlocker[] = [];

    // Breadth-first discovery of derived objects, recording the object children of each node. The
    // visited-set makes cycles/diamonds terminate and pins each object under the first parent that
    // reaches it, so `childrenOf` forms a tree.
    const objectOrder: ResolvedNode[] = [root];
    const childrenOf: Map<number, ResolvedNode[]> = new Map<number, ResolvedNode[]>();
    const queue: ResolvedNode[] = [root];
    while (queue.length > 0) {
        const node: ResolvedNode = queue.shift()!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        const children: ResolvedNode[] = await source.getChildren(node.idSystemObject);
        const kept: ResolvedNode[] = [];
        for (const child of children) {
            if (visited.has(child.idSystemObject))
                continue;
            visited.add(child.idSystemObject);

            if (COMMON.isInvertedContainmentEdge(root.eObjectType, child.eObjectType)) {
                blockers.push({ node: { ...child, depth: node.depth + 1, idParent: node.idSystemObject }, reason: 'containerBelowRoot' });
                continue; // do not descend into a container's subtree
            }

            const descendant: ResolvedNode = { ...child, depth: node.depth + 1, idParent: node.idSystemObject };
            kept.push(descendant);
            objectOrder.push(descendant);
            queue.push(descendant);
        }
        childrenOf.set(node.idSystemObject, kept);
    }

    // Collect assets, deduped against everything already seen, and attribute each to its true owner
    // object (asset.idParent) when that owner is in the crawl — so a model's file nests under the
    // model even though the scene's comprehensive fetch surfaced it. Assets whose owner is not a
    // discovered object fall back to the object that surfaced them. Each asset sits one level below
    // its owner so the tree renders it indented under its parent.
    const objectById: Map<number, ResolvedNode> = new Map<number, ResolvedNode>(objectOrder.map(o => [o.idSystemObject, o]));
    const assetsOf: Map<number, ResolvedNode[]> = new Map<number, ResolvedNode[]>();
    for (const node of objectOrder) {
        const assets: ResolvedNode[] = await source.getAssets(node);
        for (const asset of assets) {
            if (visited.has(asset.idSystemObject))
                continue;
            visited.add(asset.idSystemObject);
            const ownerId: number = (asset.idParent !== undefined && objectById.has(asset.idParent)) ? asset.idParent : node.idSystemObject;
            const owner: ResolvedNode = objectById.get(ownerId) ?? node;
            const list: ResolvedNode[] = assetsOf.get(ownerId) ?? [];
            list.push({ ...asset, depth: owner.depth + 1, idParent: ownerId });
            assetsOf.set(ownerId, list);
        }
    }

    // Depth-first assembly: each object, then its assets, then its object children.
    const candidates: ResolvedNode[] = [];
    const emit = (node: ResolvedNode): void => {
        candidates.push(node);
        for (const asset of assetsOf.get(node.idSystemObject) ?? [])
            candidates.push(asset);
        for (const child of childrenOf.get(node.idSystemObject) ?? [])
            emit(child);
    };
    emit(root);

    return { candidates, blockers };
}

/**
 * Database-backed RetireGraphSource. Caches fetched SystemObject rows so asset lookup can reach a
 * scene's underlying idScene without a second round trip.
 */
export class DBRetireGraphSource implements RetireGraphSource {
    private soCache: Map<number, DBAPI.SystemObject> = new Map<number, DBAPI.SystemObject>();

    async loadNode(idSystemObject: number, depth: number, kind: ResolvedNodeKind): Promise<ResolvedNode | null> {
        const SO: DBAPI.SystemObject | null = await this.fetchSO(idSystemObject);
        if (!SO)
            return null;
        return { idSystemObject, eObjectType: SystemObjectTypeFromSystemObject(SO), retired: SO.Retired, depth, kind };
    }

    async getChildren(idSystemObject: number): Promise<ResolvedNode[]> {
        const derived: DBAPI.SystemObject[] | null = await DBAPI.SystemObject.fetchDerivedFromXref(idSystemObject);
        if (!derived)
            return [];
        const nodes: ResolvedNode[] = [];
        for (const SO of derived) {
            this.soCache.set(SO.idSystemObject, SO);
            nodes.push({ idSystemObject: SO.idSystemObject, eObjectType: SystemObjectTypeFromSystemObject(SO),
                retired: SO.Retired, depth: 0, kind: 'object' });
        }
        return nodes;
    }

    async getAssets(node: ResolvedNode): Promise<ResolvedNode[]> {
        // { assetSO: the asset's own SystemObject; ownerSO: the object the asset is attached to }
        const pairs: { assetSO: number; ownerSO: number }[] = (node.eObjectType === COMMON.eSystemObjectType.eScene)
            ? await this.fetchSceneAssets(node.idSystemObject)
            : await this.fetchObjectAssets(node.idSystemObject);

        const nodes: ResolvedNode[] = [];
        for (const { assetSO, ownerSO } of pairs) {
            const SO: DBAPI.SystemObject | null = await this.fetchSO(assetSO);
            if (!SO) {
                RK.logError(RK.LogSection.eDB, 'resolve retire candidates', 'unable to fetch asset SystemObject',
                    { idSystemObject: assetSO, owner: node.idSystemObject }, 'DB.Composite.RetireResolver');
                continue;
            }
            nodes.push({ idSystemObject: assetSO, eObjectType: SystemObjectTypeFromSystemObject(SO), retired: SO.Retired,
                depth: node.depth, kind: 'asset', idParent: ownerSO });
        }
        return nodes;
    }

    private async fetchSceneAssets(idSystemObject: number): Promise<{ assetSO: number; ownerSO: number }[]> {
        const SO: DBAPI.SystemObject | null = await this.fetchSO(idSystemObject);
        if (!SO || !SO.idScene)
            return [];
        const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchFromSceneByVersion(SO.idScene);
        if (!assetVersions)
            return [];
        const pairs: { assetSO: number; ownerSO: number }[] = [];
        const seen: Set<number> = new Set<number>();
        for (const av of assetVersions) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(av.idAsset);
            const assetSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromAssetID(av.idAsset);
            if (!asset || !assetSO || seen.has(assetSO.idSystemObject))
                continue;
            seen.add(assetSO.idSystemObject);
            pairs.push({ assetSO: assetSO.idSystemObject, ownerSO: asset.idSystemObject ?? 0 });
        }
        return pairs;
    }

    private async fetchObjectAssets(idSystemObject: number): Promise<{ assetSO: number; ownerSO: number }[]> {
        const assets: DBAPI.Asset[] | null = await DBAPI.Asset.fetchFromSystemObject(idSystemObject);
        if (!assets)
            return [];
        const pairs: { assetSO: number; ownerSO: number }[] = [];
        for (const asset of assets) {
            const assetSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromAssetID(asset.idAsset);
            if (assetSO)
                pairs.push({ assetSO: assetSO.idSystemObject, ownerSO: asset.idSystemObject ?? idSystemObject });
        }
        return pairs;
    }

    private async fetchSO(idSystemObject: number): Promise<DBAPI.SystemObject | null> {
        const cached: DBAPI.SystemObject | undefined = this.soCache.get(idSystemObject);
        if (cached)
            return cached;
        const SO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (SO)
            this.soCache.set(idSystemObject, SO);
        return SO;
    }
}

/** Resolves the retire/reinstate candidate set for a root SystemObject against the live database. */
export async function resolveRetireCandidatesFromSystemObject(idSystemObject: number): Promise<RetireResolution | null> {
    const source: DBRetireGraphSource = new DBRetireGraphSource();
    const root: ResolvedNode | null = await source.loadNode(idSystemObject, 0, 'object');
    if (!root) {
        RK.logError(RK.LogSection.eDB, 'resolve retire candidates', 'unable to fetch root SystemObject',
            { idSystemObject }, 'DB.Composite.RetireResolver');
        return null;
    }
    return resolveRetireCandidates(root, source);
}
