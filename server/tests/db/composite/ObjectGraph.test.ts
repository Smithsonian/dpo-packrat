import * as DBAPI from '../../../db';
import * as UTIL from '../api';
import * as LOG from '../../../utils/logger';
import { ObjectGraphTestSetup } from './ObjectGraph.setup';

const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();

// *******************************************************************
// DB Composite ObjectGraph
// *******************************************************************
describe('DB Composite ObjectGraph Setup', () => {
    test('DB Composite DB Object Creation', async () => {
        await OHTS.initialize();
        await OHTS.wire();
    });
});

describe('DB Composite ObjectGraph Ancestor', () => {
    test('DB Composite ObjectGraph Ancestor ProjectDocumentation', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.projectDocumentation1, DBAPI.eObjectGraphMode.eAncestors);
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

    test('DB Composite ObjectGraph Ancestor CaptureData', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.captureData1, DBAPI.eObjectGraphMode.eAncestors);
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

    test('DB Composite ObjectGraph Ancestor Master Model', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.model1, DBAPI.eObjectGraphMode.eAncestors);
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

    test('DB Composite ObjectGraph Ancestor Scene', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.scene1, DBAPI.eObjectGraphMode.eAncestors);
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

    test('DB Composite ObjectGraph Ancestor Derived Model', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.model2, DBAPI.eObjectGraphMode.eAncestors);
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

    test('DB Composite ObjectGraph Ancestor IntermediaryFile', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.intermediaryFile1, DBAPI.eObjectGraphMode.eAncestors);
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

    test('DB Composite ObjectGraph Ancestor Asset', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.asset1, DBAPI.eObjectGraphMode.eAncestors);
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
            testAssetIDs(OA.asset, [OHTS.asset1]);
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Ancestor AssetVersion', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.assetVersion1c, DBAPI.eObjectGraphMode.eAncestors);
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
            testAssetIDs(OA.asset, [OHTS.asset1]);
        expect(OA.assetVersion).toBeTruthy();
        if (OA.assetVersion)
            expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion1c]));
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Ancestor Actor 1', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.actor1, DBAPI.eObjectGraphMode.eAncestors);
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

    test('DB Composite ObjectGraph Ancestor Actor 2', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.actor2, DBAPI.eObjectGraphMode.eAncestors);
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

    test('DB Composite ObjectGraph Ancestor Stakeholder', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.stakeholder1, DBAPI.eObjectGraphMode.eAncestors);
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

    test('DB Composite ObjectGraph Ancestor Subject', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.subject4, DBAPI.eObjectGraphMode.eAncestors);
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

describe('DB Composite ObjectGraph Descendent', () => {
    test('DB Composite ObjectGraph Descendent Unit', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.unit1, DBAPI.eObjectGraphMode.eDescendents);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeTruthy();
        expect(OA.project).toEqual(expect.arrayContaining([OHTS.project1]));
        expect(OA.subject).toBeTruthy();
        expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1, OHTS.subject2, OHTS.subject3, OHTS.subject4]));
        expect(OA.item).toBeTruthy();
        expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1, OHTS.item2, OHTS.item3, OHTS.item4]));
        expect(OA.captureData).toBeTruthy();
        expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1, OHTS.captureData2]));
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeTruthy();
        expect(OA.intermediaryFile).toEqual(expect.arrayContaining([OHTS.intermediaryFile1]));
        expect(OA.projectDocumentation).toBeTruthy();
        expect(OA.projectDocumentation).toEqual(expect.arrayContaining([OHTS.projectDocumentation1]));
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset1, OHTS.asset2, OHTS.asset3, OHTS.asset4, OHTS.asset5, OHTS.asset6, OHTS.asset7, OHTS.asset8, OHTS.asset9, OHTS.asset10, OHTS.assetT1, OHTS.assetT2, OHTS.assetT3, OHTS.assetT4, OHTS.assetT5]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion1a, OHTS.assetVersion1b, OHTS.assetVersion1c, OHTS.assetVersion2, OHTS.assetVersion3, OHTS.assetVersion4, OHTS.assetVersion5, OHTS.assetVersion6, OHTS.assetVersion7, OHTS.assetVersion8a, OHTS.assetVersion8b, OHTS.assetVersion8c, OHTS.assetVersion9, OHTS.assetVersion10, OHTS.assetVersionT1, OHTS.assetVersionT2, OHTS.assetVersionT3, OHTS.assetVersionT4, OHTS.assetVersionT5]));
        expect(OA.actor).toBeTruthy();
        expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor1, OHTS.actor2]));
        expect(OA.stakeholder).toBeTruthy();
        expect(OA.stakeholder).toEqual(expect.arrayContaining([OHTS.stakeholder1, OHTS.stakeholder2]));
    });

    test('DB Composite ObjectGraph Descendent Project', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.project1, DBAPI.eObjectGraphMode.eDescendents);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeTruthy();
        expect(OA.project).toEqual(expect.arrayContaining([OHTS.project1]));
        expect(OA.subject).toBeTruthy();
        expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject2, OHTS.subject3, OHTS.subject4]));
        expect(OA.item).toBeTruthy();
        expect(OA.item).toEqual(expect.arrayContaining([OHTS.item3, OHTS.item4]));
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeTruthy();
        expect(OA.intermediaryFile).toEqual(expect.arrayContaining([OHTS.intermediaryFile1]));
        expect(OA.projectDocumentation).toBeTruthy();
        expect(OA.projectDocumentation).toEqual(expect.arrayContaining([OHTS.projectDocumentation1]));
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset9, OHTS.asset10]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion9, OHTS.assetVersion10]));
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeTruthy();
        expect(OA.stakeholder).toEqual(expect.arrayContaining([OHTS.stakeholder1, OHTS.stakeholder2]));
    });

    test('DB Composite ObjectGraph Descendent Subject', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.subject1, DBAPI.eObjectGraphMode.eDescendents);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1, OHTS.item2]));
        expect(OA.captureData).toBeTruthy();
        expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1, OHTS.captureData2]));
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset1, OHTS.asset2, OHTS.asset3, OHTS.asset4, OHTS.asset5, OHTS.asset6, OHTS.asset7, OHTS.asset8, OHTS.assetT1, OHTS.assetT2, OHTS.assetT3, OHTS.assetT4, OHTS.assetT5]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion1a, OHTS.assetVersion1b, OHTS.assetVersion1c, OHTS.assetVersion2, OHTS.assetVersion3, OHTS.assetVersion4, OHTS.assetVersion5, OHTS.assetVersion6, OHTS.assetVersion7, OHTS.assetVersion8a, OHTS.assetVersion8b, OHTS.assetVersion8c, OHTS.assetVersionT1, OHTS.assetVersionT2, OHTS.assetVersionT3, OHTS.assetVersionT4, OHTS.assetVersionT5]));
        expect(OA.actor).toBeTruthy();
        expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor1, OHTS.actor2]));
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Item', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.item1, DBAPI.eObjectGraphMode.eDescendents);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeTruthy();
        expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1, OHTS.captureData2]));
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset1, OHTS.asset2, OHTS.asset3, OHTS.asset4, OHTS.asset5, OHTS.asset6, OHTS.asset7, OHTS.asset8, OHTS.assetT2, OHTS.assetT3, OHTS.assetT4, OHTS.assetT5]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion1a, OHTS.assetVersion1b, OHTS.assetVersion1c, OHTS.assetVersion2, OHTS.assetVersion3, OHTS.assetVersion4, OHTS.assetVersion5, OHTS.assetVersion6, OHTS.assetVersion7, OHTS.assetVersion8a, OHTS.assetVersion8b, OHTS.assetVersion8c, OHTS.assetVersionT2, OHTS.assetVersionT3, OHTS.assetVersionT4, OHTS.assetVersionT5]));
        expect(OA.actor).toBeTruthy();
        expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor1, OHTS.actor2]));
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Capture Data', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.captureData1, DBAPI.eObjectGraphMode.eDescendents);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeTruthy();
        expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1]));
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset1, OHTS.asset2, OHTS.asset3, OHTS.asset4, OHTS.asset5, OHTS.asset6, OHTS.asset7, OHTS.asset8, OHTS.assetT4, OHTS.assetT5]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion1a, OHTS.assetVersion1b, OHTS.assetVersion1c, OHTS.assetVersion2, OHTS.assetVersion3, OHTS.assetVersion4, OHTS.assetVersion5, OHTS.assetVersion6, OHTS.assetVersion7, OHTS.assetVersion8a, OHTS.assetVersion8b, OHTS.assetVersion8c, OHTS.assetVersionT4, OHTS.assetVersionT5]));
        expect(OA.actor).toBeTruthy();
        expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor1, OHTS.actor2]));
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Model Master', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.model1, DBAPI.eObjectGraphMode.eDescendents);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset2, OHTS.asset3, OHTS.asset4, OHTS.asset5, OHTS.asset6, OHTS.asset7, OHTS.asset8, OHTS.assetT4, OHTS.assetT5]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion2, OHTS.assetVersion3, OHTS.assetVersion4, OHTS.assetVersion5, OHTS.assetVersion6, OHTS.assetVersion7, OHTS.assetVersion8a, OHTS.assetVersion8b, OHTS.assetVersion8c, OHTS.assetVersionT4, OHTS.assetVersionT5]));
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Model Derived', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.model2, DBAPI.eObjectGraphMode.eDescendents);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model2]));
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset5]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion5]));
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Scene', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.scene1, DBAPI.eObjectGraphMode.eDescendents);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset5, OHTS.asset6, OHTS.asset7, OHTS.asset8, OHTS.assetT5]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion5, OHTS.assetVersion6, OHTS.assetVersion7, OHTS.assetVersion8a, OHTS.assetVersion8b, OHTS.assetVersion8c, OHTS.assetVersionT5]));
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });
});

describe('DB Composite ObjectGraph Descendent With Depth 1', () => {
    test('DB Composite ObjectGraph Descendent Unit Depth 1', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.unit1, DBAPI.eObjectGraphMode.eDescendents, true, true, 1);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeTruthy();
        expect(OA.project).toEqual(expect.arrayContaining([OHTS.project1]));
        expect(OA.subject).toBeTruthy();
        expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1, OHTS.subject2]));
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeTruthy();
        expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor1]));
        expect(OA.stakeholder).toBeTruthy();
        expect(OA.stakeholder).toEqual(expect.arrayContaining([OHTS.stakeholder1]));
    });

    test('DB Composite ObjectGraph Descendent Project Depth 1', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.project1, DBAPI.eObjectGraphMode.eDescendents, true, true, 1);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeTruthy();
        expect(OA.project).toEqual(expect.arrayContaining([OHTS.project1]));
        expect(OA.subject).toBeTruthy();
        expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject2, OHTS.subject3, OHTS.subject4]));
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeTruthy();
        expect(OA.projectDocumentation).toEqual(expect.arrayContaining([OHTS.projectDocumentation1]));
        expect(OA.asset).toBeFalsy();
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeTruthy();
        expect(OA.stakeholder).toEqual(expect.arrayContaining([OHTS.stakeholder1, OHTS.stakeholder2]));
    });

    test('DB Composite ObjectGraph Descendent Subject Depth 1', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.subject1, DBAPI.eObjectGraphMode.eDescendents, true, true, 1);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1, OHTS.item2]));
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeFalsy();
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.assetT1]);
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Item', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.item1, DBAPI.eObjectGraphMode.eDescendents, true, true, 1);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeTruthy();
        expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1, OHTS.captureData2]));
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.assetT2]);
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Capture Data', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.captureData1, DBAPI.eObjectGraphMode.eDescendents, true, true, 1);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeTruthy();
        expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1]));
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1]));
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset1]);
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeTruthy();
        expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor1, OHTS.actor2]));
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Model Master', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.model1, DBAPI.eObjectGraphMode.eDescendents, true, true, 1);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset2, OHTS.asset3, OHTS.asset4, OHTS.assetT4]);
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Model Derived', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.model2, DBAPI.eObjectGraphMode.eDescendents, true, true, 1);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model2]));
        expect(OA.scene).toBeFalsy();
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset5]);
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });

    test('DB Composite ObjectGraph Descendent Scene', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.scene1, DBAPI.eObjectGraphMode.eDescendents, true, true, 1);
        if (!OA)
            return;
        expect(OA.unit).toBeFalsy();
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeFalsy();
        expect(OA.item).toBeFalsy();
        expect(OA.captureData).toBeFalsy();
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset8, OHTS.assetT5]);
        expect(OA.assetVersion).toBeFalsy();
        expect(OA.actor).toBeFalsy();
        expect(OA.stakeholder).toBeFalsy();
    });
});

describe('DB Composite ObjectGraph All', () => {
    test('DB Composite ObjectGraph All Unit', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.unit1, DBAPI.eObjectGraphMode.eAll);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeTruthy();
        expect(OA.project).toEqual(expect.arrayContaining([OHTS.project1]));
        expect(OA.subject).toBeTruthy();
        expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1, OHTS.subject2, OHTS.subject3, OHTS.subject4]));
        expect(OA.item).toBeTruthy();
        expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1, OHTS.item2, OHTS.item3, OHTS.item4]));
        expect(OA.captureData).toBeTruthy();
        expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1, OHTS.captureData2]));
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeTruthy();
        expect(OA.intermediaryFile).toEqual(expect.arrayContaining([OHTS.intermediaryFile1]));
        expect(OA.projectDocumentation).toBeTruthy();
        expect(OA.projectDocumentation).toEqual(expect.arrayContaining([OHTS.projectDocumentation1]));
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset1, OHTS.asset2, OHTS.asset3, OHTS.asset4, OHTS.asset5, OHTS.asset6, OHTS.asset7, OHTS.asset8, OHTS.asset9, OHTS.asset10, OHTS.assetT1, OHTS.assetT2, OHTS.assetT3, OHTS.assetT4, OHTS.assetT5]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion1a, OHTS.assetVersion1b, OHTS.assetVersion1c, OHTS.assetVersion2, OHTS.assetVersion3, OHTS.assetVersion4, OHTS.assetVersion5, OHTS.assetVersion6, OHTS.assetVersion7, OHTS.assetVersion8a, OHTS.assetVersion8b, OHTS.assetVersion8c, OHTS.assetVersion9, OHTS.assetVersion10, OHTS.assetVersionT1, OHTS.assetVersionT2, OHTS.assetVersionT3, OHTS.assetVersionT4, OHTS.assetVersionT5]));
        expect(OA.actor).toBeTruthy();
        expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor1, OHTS.actor2]));
        expect(OA.stakeholder).toBeTruthy();
        expect(OA.stakeholder).toEqual(expect.arrayContaining([OHTS.stakeholder1, OHTS.stakeholder2]));
    });

    test('DB Composite ObjectGraph All Item', async () => {
        const OA: DBAPI.ObjectGraph | null = await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.item1, DBAPI.eObjectGraphMode.eAll);
        if (!OA)
            return;
        expect(OA.unit).toBeTruthy();
        expect(OA.unit).toEqual(expect.arrayContaining([OHTS.unit1]));
        expect(OA.project).toBeFalsy();
        expect(OA.subject).toBeTruthy();
        expect(OA.subject).toEqual(expect.arrayContaining([OHTS.subject1]));
        expect(OA.item).toBeTruthy();
        expect(OA.item).toEqual(expect.arrayContaining([OHTS.item1]));
        expect(OA.captureData).toBeTruthy();
        expect(OA.captureData).toEqual(expect.arrayContaining([OHTS.captureData1, OHTS.captureData2]));
        expect(OA.model).toBeTruthy();
        expect(OA.model).toEqual(expect.arrayContaining([OHTS.model1, OHTS.model2, OHTS.model3, OHTS.model4]));
        expect(OA.scene).toBeTruthy();
        expect(OA.scene).toEqual(expect.arrayContaining([OHTS.scene1]));
        expect(OA.intermediaryFile).toBeFalsy();
        expect(OA.projectDocumentation).toBeFalsy();
        expect(OA.asset).toBeTruthy();
        testAssetIDs(OA.asset, [OHTS.asset1, OHTS.asset2, OHTS.asset3, OHTS.asset4, OHTS.asset5, OHTS.asset6, OHTS.asset7, OHTS.asset8, OHTS.assetT2, OHTS.assetT3, OHTS.assetT4, OHTS.assetT5]);
        expect(OA.assetVersion).toBeTruthy();
        expect(OA.assetVersion).toEqual(expect.arrayContaining([OHTS.assetVersion1a, OHTS.assetVersion1b, OHTS.assetVersion1c, OHTS.assetVersion2, OHTS.assetVersion3, OHTS.assetVersion4, OHTS.assetVersion5, OHTS.assetVersion6, OHTS.assetVersion7, OHTS.assetVersion8a, OHTS.assetVersion8b, OHTS.assetVersion8c, OHTS.assetVersionT2, OHTS.assetVersionT3, OHTS.assetVersionT4, OHTS.assetVersionT5]));
        expect(OA.actor).toBeTruthy();
        expect(OA.actor).toEqual(expect.arrayContaining([OHTS.actor1, OHTS.actor2]));
        expect(OA.stakeholder).toBeFalsy();
    });

    /*
    test.only('DB Composite ObjectGraphDatabase', async () => {
        jest.setTimeout(60000000);
        const OGDB: DBAPI.ObjectGraphDatabase = new DBAPI.ObjectGraphDatabase();
        expect(await OGDB.fetch()).toBeTruthy();
    });
    */
});

// ************************************************************
// Keep these last, as these mess up the hierarchy!
// ************************************************************
describe('DB Composite ObjectGraph.fetch Invalid', () => {
    test('DB Composite ObjectGraph Invalid Object Wiring Ascending 1', async () => {
        LOG.info('NOTICE: Errors that follow are due to invalid wiring and are expected!', LOG.LS.eTEST);
        await UTIL.createXref(OHTS.intermediaryFile1, OHTS.subject4);
        await UTIL.createXref(OHTS.projectDocumentation1, OHTS.subject4);
        await UTIL.createXref(OHTS.scene1, OHTS.subject4);
        await UTIL.createXref(OHTS.model1, OHTS.subject4);
        await UTIL.createXref(OHTS.captureData1, OHTS.subject4);
        await UTIL.createXref(OHTS.item1, OHTS.subject4);
        await UTIL.createXref(OHTS.assetT1, OHTS.subject4);
        await UTIL.createXref(OHTS.assetVersionT1, OHTS.subject4);
        await UTIL.createXref(OHTS.actor1, OHTS.subject4);
        await UTIL.createXref(OHTS.stakeholder1, OHTS.subject4);
        await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.subject4, DBAPI.eObjectGraphMode.eAncestors, false, true);
    });

    test('DB Composite ObjectGraph Invalid Object Wiring Ascending 2', async () => {
        await UTIL.createXref(OHTS.subject4, OHTS.stakeholder1);
        await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.stakeholder1, DBAPI.eObjectGraphMode.eAncestors, false, false);
    });

    test('DB Composite ObjectGraph Invalid Object Wiring Ascending 3', async () => {
        await UTIL.createXref(OHTS.project1, OHTS.actor1);
        await UTIL.createXref(OHTS.unit1, OHTS.actor1);
        await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.actor1, DBAPI.eObjectGraphMode.eAncestors, false, true);
    });

    test('DB Composite ObjectGraph Invalid Object Wiring Ascending 4', async () => {
        await UTIL.createXref(OHTS.unit1, OHTS.item1);
        await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.item1, DBAPI.eObjectGraphMode.eAncestors, false, true);
    });

    test('DB Composite ObjectGraph Simple Cycle Ascending', async () => {
        await UTIL.createXref(OHTS.scene1, OHTS.scene1);
        await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.scene1, DBAPI.eObjectGraphMode.eAncestors, false, false);
    });

    test('DB Composite ObjectGraph Complex Cycle Ascending', async () => {
        await UTIL.createXref(OHTS.model1, OHTS.captureData1); // already wired captureData1 <- model1
        await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.model1, DBAPI.eObjectGraphMode.eAncestors, false, false);
    });

    test('DB Composite ObjectGraph Invalid Input', async () => {
        const OA: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(0, DBAPI.eObjectGraphMode.eAncestors);
        expect(await OA.fetch()).toBeTruthy();
    });

    test('DB Composite ObjectGraph Invalid Object Wiring Descending 1', async () => {
        await UTIL.createXref(OHTS.asset2, OHTS.actor2);
        await UTIL.createXref(OHTS.asset2, OHTS.captureData2);
        await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.asset2, DBAPI.eObjectGraphMode.eDescendents, false, false);
    });

    test('DB Composite ObjectGraph Invalid Object Wiring Descending 2', async () => {
        await UTIL.createXref(OHTS.actor2, OHTS.assetVersion2);
        await UTIL.createXref(OHTS.actor2, OHTS.intermediaryFile1);
        await UTIL.createXref(OHTS.assetVersion2, OHTS.intermediaryFile1);
        await UTIL.createXref(OHTS.actor2, OHTS.item3);
        await UTIL.createXref(OHTS.item3, OHTS.model4);
        await UTIL.createXref(OHTS.actor2, OHTS.model4);
        await UTIL.createXref(OHTS.model4, OHTS.project2);
        await UTIL.createXref(OHTS.actor2, OHTS.project2);
        await UTIL.createXref(OHTS.actor2, OHTS.projectDocumentation1);
        await UTIL.createXref(OHTS.model4, OHTS.projectDocumentation1);
        await UTIL.createXref(OHTS.actor2, OHTS.scene1);
        await UTIL.createXref(OHTS.model4, OHTS.scene1);
        await UTIL.createXref(OHTS.actor2, OHTS.stakeholder1);
        await UTIL.createXref(OHTS.model4, OHTS.stakeholder1);
        await UTIL.createXref(OHTS.actor2, OHTS.subject3);
        await UTIL.createXref(OHTS.model4, OHTS.subject3);
        await UTIL.createXref(OHTS.actor2, OHTS.unit1);
        await UTIL.createXref(OHTS.model4, OHTS.intermediaryFile1);
        await ObjectGraphTestSetup.testObjectGraphFetch(OHTS.actor2, DBAPI.eObjectGraphMode.eDescendents, false, false);
    });
});

function testAssetIDs(assetReceived: DBAPI.Asset[] | null, assetExpected: (DBAPI.Asset | null)[]): void {
    expect(assetReceived).toBeTruthy();
    if (!assetReceived)
        return;
    const expectedIDs: number[] = [];
    const receivedIDs: number[] = [];
    for (const asset of assetExpected)
        if (asset)
            expectedIDs.push(asset.idAsset);
    for (const asset of assetReceived)
        receivedIDs.push(asset.idAsset);
    expect(expectedIDs).toEqual(expect.arrayContaining(receivedIDs));
}
