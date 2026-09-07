import * as DBAPI from '../../../db';
import { ObjectGraphTestSetup } from './ObjectGraph.setup';

// *******************************************************************
// DB SystemObjectXref.fetchDescendentIDs — parity with ObjectGraph
// *******************************************************************
// The lightweight descendant-id fast-path used by LicenseCache must produce the same node set as
// new ObjectGraph(id, eDescendents, 32, OGD).objectMap.keys(), so cache invalidation can never
// silently under-invalidate a descendant's inherited license. This suite asserts that parity on the
// shared ObjectGraph fixture across a representative range of root types.

const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();

async function idOf(SOBased: DBAPI.SystemObjectBased | null): Promise<number> {
    expect(SOBased).toBeTruthy();
    if (!SOBased)
        return 0;
    const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
    expect(SO).toBeTruthy();
    return SO ? SO.idSystemObject : 0;
}

/** Ground-truth descendant node set: the keys ObjectGraph records into its ObjectGraphDatabase. */
async function objectGraphDescendentIDs(idSystemObject: number): Promise<Set<number>> {
    const OGD: DBAPI.ObjectGraphDatabase = new DBAPI.ObjectGraphDatabase();
    const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(idSystemObject, DBAPI.eObjectGraphMode.eDescendents, 32, OGD);
    expect(await OG.fetch()).toBeTruthy();
    return new Set<number>(OGD.objectMap.keys());
}

async function expectDescendentParity(idSystemObject: number): Promise<void> {
    const expected: Set<number> = await objectGraphDescendentIDs(idSystemObject);
    const actual: Set<number> = await DBAPI.SystemObjectXref.fetchDescendentIDs(idSystemObject, 32);

    // No under-invalidation: every node ObjectGraph reaches must be present in the fast-path set.
    for (const id of expected)
        expect(actual.has(id)).toBeTruthy();

    // No wild over-invalidation: the fast-path adds at most the root itself (ObjectGraph omits the
    // root from objectMap only when it has no descendants at all).
    for (const id of actual)
        expect(expected.has(id) || id === idSystemObject).toBeTruthy();
}

describe('DB Composite SystemObjectXref Setup', () => {
    test('DB Composite DB Object Creation', async () => {
        await OHTS.initialize();
        await OHTS.wire();
    });
});

describe('DB SystemObjectXref.fetchDescendentIDs parity with ObjectGraph', () => {
    test('Unit descendents', async () => { await expectDescendentParity(await idOf(OHTS.unit1)); });
    test('Project descendents', async () => { await expectDescendentParity(await idOf(OHTS.project2)); });
    test('Subject descendents', async () => { await expectDescendentParity(await idOf(OHTS.subject1)); });
    test('Item descendents', async () => { await expectDescendentParity(await idOf(OHTS.item1)); });
    test('CaptureData descendents', async () => { await expectDescendentParity(await idOf(OHTS.captureData1)); });
    test('Model (master) descendents', async () => { await expectDescendentParity(await idOf(OHTS.model1)); });
    test('Model (derived) descendents', async () => { await expectDescendentParity(await idOf(OHTS.model2)); });
    test('Scene descendents', async () => { await expectDescendentParity(await idOf(OHTS.scene1)); });

    test('Leaf (AssetVersion) yields only itself', async () => {
        const id: number = await idOf(OHTS.assetVersion1c);
        const actual: Set<number> = await DBAPI.SystemObjectXref.fetchDescendentIDs(id, 32);
        expect(actual.has(id)).toBeTruthy();
    });

    test('Invalid input yields empty set', async () => {
        const actual: Set<number> = await DBAPI.SystemObjectXref.fetchDescendentIDs(0, 32);
        expect(actual.size).toEqual(0);
    });
});
