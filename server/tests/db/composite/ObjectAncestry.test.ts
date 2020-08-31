import * as DBAPI from '../../../db';
import * as UTIL from '../api';
import * as LOG from '../../../utils/logger';
import { ObjectHierarchyTestSetup } from './ObjectHierarchy.setup';

afterAll(async done => {
    done();
});

const OHTS: ObjectHierarchyTestSetup = new ObjectHierarchyTestSetup();

// *******************************************************************
// DB Composite ObjectAncestry
// *******************************************************************
describe('DB Composite ObjectAncestry Setup', () => {
    test('DB Composite DB Object Creation', async () => {
        await OHTS.initialize();
        await OHTS.wire();
    });
});

describe('DB Composite ObjectAncestry.fetch', () => {
    test('DB Composite ObjectAncestry ProjectDocumentation', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.projectDocumentation1);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1, OHTS.unit2]));
        expect(OA.project).toBeTruthy();
        if (OA.project)
            expect(OA.project).toEqual(expect.arrayContaining([OHTS.project1]));
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeTruthy();
        if (OA.projectDocumentation)
            expect(OA.projectDocumentation).toEqual(expect.arrayContaining([OHTS.projectDocumentation1]));
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry CaptureData', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.captureData1);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        if (OA.item)
            expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        if (OA.captureData)
            expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1]));
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry Master Model', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.model1);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        if (OA.item)
            expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        if (OA.captureData)
            expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1, OHTS.captureData2]));
        expect(OA.model).toBeTruthy();
        if (OA.model)
            expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1]));
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry Scene', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.scene1);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        if (OA.item)
            expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        if (OA.captureData)
            expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1, OHTS.captureData2]));
        expect(OA.model).toBeTruthy();
        if (OA.model)
            expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1]));
        expect(OA.scene).toBeTruthy();
        if (OA.scene)
            expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry Derived Model', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.model2);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        if (OA.item)
            expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        if (OA.captureData)
            expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1, OHTS.captureData2]));
        expect(OA.model).toBeTruthy();
        if (OA.model)
            expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2]));
        expect(OA.scene).toBeTruthy();
        if (OA.scene)
            expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry IntermediaryFile', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.intermediaryFile1);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1, OHTS.unit2]));
        expect(OA.project).toBeTruthy();
        if (OA.project)
            expect(OA.project).toEqual(expect.arrayContaining([OHTS.project1]));
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject2]));
        expect(OA.item).toBeTruthy();
        if (OA.item)
            expect(OA.item).toEqual(expect.arrayContaining([OHTS.item3]));
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeTruthy();
        if (OA.intermediaryFile)
            expect(OA.intermediaryFile).toEqual(expect.arrayContaining([OHTS.intermediaryFile1]));
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry Asset', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.asset3);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        if (OA.item)
            expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        if (OA.captureData)
            expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1]));
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        if (OA.asset)
            testAssetIDs(OA.asset, [OHTS.asset3]);
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry AssetVersion', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.assetVersion3c);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        if (OA.item)
            expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        if (OA.captureData)
            expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1]));
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        if (OA.asset)
            testAssetIDs(OA.asset, [OHTS.asset3]);
        expect(OA.assetVersion).toBeTruthy();
        if (OA.assetVersion)
            expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion3c]));
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry Actor 1', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.actor1);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        if (OA.item)
            expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        if (OA.captureData)
            expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1]));
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeTruthy();
        if (OA.actor)
            expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor1]));
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry Actor 2', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.actor2);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        if (OA.item)
            expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        if (OA.captureData)
            expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1]));
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeTruthy();
        if (OA.actor)
            expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor2]));
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectAncestry Stakeholder', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.stakeholder1);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1, OHTS.unit2]));
        expect(OA.project).toBeTruthy();
        if (OA.project)
            expect(OA.project).toEqual(expect.arrayContaining([OHTS.project1]));
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeTruthy();
        if (OA.stakeholder)
            expect(OA.stakeholder).toEqual(expect.arrayContaining([OHTS.stakeholder1]));
    });

    test('DB Composite ObjectAncestry Subject', async () => {
        const OA: DBAPI.ObjectAncestry | null = await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.subject4);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        if (OA.unit)
            expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit2]));
        expect(OA.project).toBeTruthy();
        if (OA.project)
            expect(OA.project).toEqual(expect.arrayContaining([OHTS.project1, OHTS.project2]));
        expect(OA.subject).toBeTruthy();
        if (OA.subject)
            expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject4]));
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

});

// ************************************************************
// Keep these last, as these mess up the hierarchy!
// ************************************************************
describe('DB Composite ObjectAncestry.fetch Invalid', () => {
    test('DB Composite ObjectAncestry Invalid Object Wiring 1', async () => {
        LOG.logger.info('NOTICE: Errors that follow are due to invalid wiring and are expected!');
        await UTIL.createXref(OHTS.intermediaryFile1, OHTS.subject4);
        await UTIL.createXref(OHTS.projectDocumentation1, OHTS.subject4);
        await UTIL.createXref(OHTS.scene1, OHTS.subject4);
        await UTIL.createXref(OHTS.model1, OHTS.subject4);
        await UTIL.createXref(OHTS.captureData1, OHTS.subject4);
        await UTIL.createXref(OHTS.item1, OHTS.subject4);
        await UTIL.createXref(OHTS.asset1, OHTS.subject4);
        await UTIL.createXref(OHTS.assetVersion1, OHTS.subject4);
        await UTIL.createXref(OHTS.actor1, OHTS.subject4);
        await UTIL.createXref(OHTS.stakeholder1, OHTS.subject4);
        await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.subject4, false, true);
    });

    test('DB Composite ObjectAncestry Invalid Object Wiring 2', async () => {
        await UTIL.createXref(OHTS.subject4, OHTS.stakeholder1);
        await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.stakeholder1, false, false);
    });

    test('DB Composite ObjectAncestry Invalid Object Wiring 3', async () => {
        await UTIL.createXref(OHTS.project1, OHTS.actor1);
        await UTIL.createXref(OHTS.unit1, OHTS.actor1);
        await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.actor1, false, true);
    });

    test('DB Composite ObjectAncestry Invalid Object Wiring 4', async () => {
        await UTIL.createXref(OHTS.unit1, OHTS.item1);
        await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.item1, false, true);
    });

    test('DB Composite ObjectAncestry Simple Cycle', async () => {
        await UTIL.createXref(OHTS.scene1, OHTS.scene1);
        await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.scene1, false, false);
    });

    test('DB Composite ObjectAncestry Complex Cycle', async () => {
        await UTIL.createXref(OHTS.model1, OHTS.captureData1); // already wired captureData1 <- model1
        await ObjectHierarchyTestSetup.testObjectAncestryFetch(OHTS.model1, false, false);
    });

    test('DB Composite ObjectAncestry Invalid Input', async () => {
        const OA: DBAPI.ObjectAncestry = new DBAPI.ObjectAncestry(0);
        expect(await OA.fetch()).toBeTruthy();
    });
});

function testAssetIDs(assetReceived: DBAPI.Asset[], assetExpected: (DBAPI.Asset | null)[]): void {
    const expectedIDs: number[] = [];
    const receivedIDs: number[] = [];
    for (const asset of assetExpected)
        if (asset)
            expectedIDs.push(asset.idAsset);
    for (const asset of assetReceived)
        receivedIDs.push(asset.idAsset);
    expect(expectedIDs).toEqual(expect.arrayContaining(receivedIDs));
}
