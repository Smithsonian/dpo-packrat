import { INavigation, NavigationFactory, NavigationResult, NavigationResultEntry, NavigationFilter, eMetadata } from '../../../navigation/interface';
// import * as H from '../../../utils/helpers';
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import { eSystemObjectType, ObjectIDAndType, SystemObjectBased, SystemObject } from '../../../db';
import { ObjectGraphTestSetup } from '../../db/composite/ObjectGraph.setup';
import { NAVIGATION_TYPE } from '../../../config';

let nav: INavigation | null = null;
const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();
const metadataColumns: eMetadata[] = [eMetadata.eHierarchyUnit, eMetadata.eHierarchySubject, eMetadata.eHierarchyItem];
LOG;

afterAll(async done => {
    // await H.Helpers.sleep(2000);
    done();
});

describe('Navigation Init', () => {
    test('Navigation Test Setup', async () => {
        await OHTS.initialize();
        await OHTS.wire();

        nav = await NavigationFactory.getInstance(NAVIGATION_TYPE.DB);
        expect(nav).toBeTruthy();

        nav = await NavigationFactory.getInstance();
        expect(nav).toBeTruthy();
    });
});

const mockFilter: NavigationFilter = {
    idRoot: 0,
    objectTypes: [],
    metadataColumns: [],
    objectsToDisplay: [],
    search: '',
    units: [],
    projects: [],
    has: [],
    missing: [],
    captureMethod: [],
    variantType: [],
    modelPurpose: [],
    modelFileType: [],
    dateCreatedFrom: null,
    dateCreatedTo: null,
    rows: 100,
    cursorMark: ''
};

describe('Navigation Traversal', () => {
    test('Navigation Root', async () => {
        jest.setTimeout(60000);

        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eUnit], metadataColumns });
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eProject], metadataColumns });


        // Not yet implemented:
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eSubject], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eItem], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eCaptureData], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eModel], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eScene], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eIntermediaryFile], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eProjectDocumentation], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eAsset], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eAssetVersion], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eActor], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eStakeholder], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: 0, objectTypes: [eSystemObjectType.eUnknown], metadataColumns }, false);
    });

    test('Navigation Children', async () => {
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.unit1), objectTypes: [eSystemObjectType.eSubject], metadataColumns });
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.project1), objectTypes: [eSystemObjectType.eSubject], metadataColumns });
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.subject1), objectTypes: [eSystemObjectType.eItem], metadataColumns });
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.item1), objectTypes: [eSystemObjectType.eCaptureData, eSystemObjectType.eModel, eSystemObjectType.eScene], metadataColumns });


        // Not yet implemented:
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.captureData1), objectTypes: [eSystemObjectType.eAsset], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.model1), objectTypes: [eSystemObjectType.eAsset], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.scene1), objectTypes: [eSystemObjectType.eAsset], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.projectDocumentation1), objectTypes: [eSystemObjectType.eAsset], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.intermediaryFile1), objectTypes: [eSystemObjectType.eAsset], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.actor1), objectTypes: [eSystemObjectType.eAsset], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.stakeholder1), objectTypes: [eSystemObjectType.eAsset], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.asset1), objectTypes: [eSystemObjectType.eAssetVersion], metadataColumns }, false);
        await testNavigation({ ...mockFilter, idRoot: await getSOID(OHTS.assetVersion1a), objectTypes: [eSystemObjectType.eAssetVersion], metadataColumns }, false);
    });

    test('Navigation Invalid', async () => {
        await testNavigation({ ...mockFilter, idRoot: 100000000000, objectTypes: [eSystemObjectType.eSubject], metadataColumns }, false);
    });

});

async function getSOID(SOBased: SystemObjectBased | null): Promise<number> {
    const SO: SystemObject | null = SOBased ? await SOBased.fetchSystemObject() : null;
    expect(SO).toBeTruthy();
    return (SO) ? SO.idSystemObject : 0;
}


async function testNavigation(filter: NavigationFilter, expectSuccess: boolean = true): Promise<void> {
    expect(nav).toBeTruthy(); if (!nav) return;

    const navResult: NavigationResult = await nav.getObjectChildren(filter);
    validateResult(navResult, expectSuccess);
    if (expectSuccess) {
        // LOG.info(`Filter: ${JSON.stringify(filter)}`, LOG.LS.eTEST);
        await validateResultEntries(navResult.entries, filter.objectTypes);
    }
}

function validateResult(navResult: NavigationResult, expectSuccess: boolean = true): void {
    // LOG.info(`${JSON.stringify(navResult)}`, LOG.LS.eTEST);
    if (expectSuccess) {
        expect(navResult.success).toBeTruthy();
        expect(navResult.entries.length).toBeGreaterThan(0);
    } else {
        expect(navResult.success).toBeFalsy();
        expect(navResult.entries.length).toEqual(0);
    }
    expect(navResult.metadataColumns).toEqual(expect.arrayContaining(metadataColumns));
    expect(metadataColumns).toEqual(expect.arrayContaining(navResult.metadataColumns));
}

async function validateResultEntries(navResultEntries: NavigationResultEntry[], objectTypes: eSystemObjectType[]): Promise<void> {
    for (const NRE of navResultEntries) {
        // LOG.info(`${JSON.stringify(NRE)}`, LOG.LS.eTEST);
        expect(objectTypes).toEqual(expect.arrayContaining([NRE.objectType]));
        expect(NRE.metadata.length).toEqual(metadataColumns.length);

        const oID: ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(NRE.idSystemObject);
        expect(oID).toBeTruthy();
        if (oID) {
            expect(NRE.idObject).toEqual(oID.idObject);
            expect(NRE.objectType).toEqual(oID.eObjectType);
        }
    }
}