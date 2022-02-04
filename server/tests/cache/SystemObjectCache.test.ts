import { SystemObjectCache } from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
// import * as H from '../../utils/helpers';
import { ObjectGraphTestSetup } from '../db/composite/ObjectGraph.setup';
import { createItemTest } from '../db/api';
import * as L from 'lodash';

afterAll(async done => {
    // await H.Helpers.sleep(4000);
    done();
});
enum eCacheTestMode {
    eInitial,
    eClear,
    eFlush
}
const OHTS: ObjectGraphTestSetup = new ObjectGraphTestSetup();

const systemObjectCacheTest = (): void => {
    systemObjectCacheTestWorker(eCacheTestMode.eInitial);
    // systemObjectCacheTestWorker(eCacheTestMode.eClear);
    // systemObjectCacheTestWorker(eCacheTestMode.eFlush);
    systemObjectCacheTestClearFlush();
};

function systemObjectCacheTestWorker(eMode: eCacheTestMode): void {
    let description: string = '';
    switch (eMode) {
        case eCacheTestMode.eInitial: description = 'initial'; break;
        case eCacheTestMode.eClear: description = 'post clear'; break;
        case eCacheTestMode.eFlush: description = 'post flush'; break;
    }

    let systemObjectAll: DBAPI.SystemObject[] = [];

    describe('Cache: SystemObjectCache ' + description, () => {
        test('Cache: SystemObjectCache Setup ' + description, async () => {
            switch (eMode) {
                case eCacheTestMode.eInitial:
                    await OHTS.initialize();
                    await OHTS.wire();
                    break;
                case eCacheTestMode.eClear: await SystemObjectCache.clear(); break;
                case eCacheTestMode.eFlush: await SystemObjectCache.flush(); break;
            }
        });

        test('Cache: SystemObjectCache Setup Fetch ' + description, async () => {
            const SOFetch = await DBAPI.SystemObject.fetchAll();
            expect(SOFetch).toBeTruthy();
            expect(SOFetch ? SOFetch.length : /* istanbul ignore next */ 0).toBeGreaterThan(0);
            systemObjectAll = SOFetch || [];
            // LOG.info(`Fetched SO: ${systemObjectAll.length}`, LOG.LS.eTEST);
        });

        test('Cache: SystemObjectCache Methods ' + description, async () => {
            const soFetchCount: number = systemObjectAll.length;
            for (let test = 0; test < 100; test++) {
                const lookup: number = Math.floor(Math.random() * soFetchCount);
                const SOExamine: DBAPI.SystemObject = systemObjectAll[lookup];
                await testSystemObject(SOExamine);
            }

            /*
            jest.setTimeout(600000);
            for (const SOExamine of systemObjectAll) {
                await testSystemObject(SOExamine);
            }
            */
        });

        test('Cache: SystemObjectCache.getSystemFromObjectIDInternal ' + description, async () => {
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eUnit });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eProject });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eSubject });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eItem });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eCaptureData });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eModel });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eScene });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eIntermediaryFile });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eProjectDocumentation });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eAsset });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eAssetVersion });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eActor });
            await testObjectAndID({ idObject: 1, eObjectType: COMMON.eSystemObjectType.eStakeholder });
        });

        test('Cache: SystemObjectCache Cache Misses ' + description, async () => {
            const item1: DBAPI.Item = await createItemTest({ idItem: 0, idAssetThumbnail: null, idGeoLocation: null, Name: 'SystemObjectCacheTest 1', EntireSubject: true });
            const item2: DBAPI.Item = await createItemTest({ idItem: 0, idAssetThumbnail: null, idGeoLocation: null, Name: 'SystemObjectCacheTest 2', EntireSubject: true });
            expect(item1.idItem).toBeGreaterThan(0);
            expect(item2.idItem).toBeGreaterThan(0);

            const SOItem1: DBAPI.SystemObject | null = await item1.fetchSystemObject();
            expect(SOItem1).toBeTruthy();
            if (SOItem1)
                await testSystemObject(SOItem1);
            await testObjectAndID({ idObject: item2.idItem, eObjectType: COMMON.eSystemObjectType.eItem });
        });

        test('Cache: SystemObjectCache Invalid and Other ' + description, async () => {
            let oIDFetch: DBAPI.ObjectIDAndType | undefined = await SystemObjectCache.getObjectFromSystem(1000000000);
            expect(oIDFetch).toBeFalsy();

            const oIDsID: DBAPI.SystemObjectIDAndType | undefined = await SystemObjectCache.getObjectAndSystemFromSystem(1000000000);
            expect(oIDsID).toBeFalsy();

            const SOInfo: DBAPI.SystemObjectInfo | undefined = await SystemObjectCache.getSystemFromObjectID({ idObject: 1000000000, eObjectType: COMMON.eSystemObjectType.eItem });
            expect(SOInfo).toBeFalsy();

            oIDFetch = SystemObjectCache.convertSystemObjectToObjectID(null);
            expect(oIDFetch).toBeFalsy();

            const SOInvalid: DBAPI.SystemObject = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false });
            oIDFetch = SystemObjectCache.convertSystemObjectToObjectID(SOInvalid);
            expect(oIDFetch).toBeFalsy();
        });
    });
}

function systemObjectCacheTestClearFlush(): void {
    describe('Cache: SystemObjectCache clear/flush', () => {
        test('Cache: SystemObjectCache.clear and SystemObjectCache.flush', async () => {
            await SystemObjectCache.clear();
            await SystemObjectCache.flush();
        });
    });
}

async function testSystemObject(SOExamine: DBAPI.SystemObject): Promise<boolean> {
    // LOG.info(`Testing ${JSON.stringify(SOExamine)}`, LOG.LS.eTEST);
    const oID: DBAPI.ObjectIDAndType | undefined = SystemObjectCache.convertSystemObjectToObjectID(SOExamine);
    expect(oID).toBeTruthy();
    if (!oID)
        return false;

    let SO: DBAPI.SystemObject | null = null;
    const { idObject, eObjectType } = oID;
    switch (eObjectType) {
        case COMMON.eSystemObjectType.eUnit: SO = await DBAPI.SystemObject.fetchFromUnitID(idObject); break;
        case COMMON.eSystemObjectType.eProject: SO = await DBAPI.SystemObject.fetchFromProjectID(idObject); break;
        case COMMON.eSystemObjectType.eSubject: SO = await DBAPI.SystemObject.fetchFromSubjectID(idObject); break;
        case COMMON.eSystemObjectType.eItem: SO = await DBAPI.SystemObject.fetchFromItemID(idObject); break;
        case COMMON.eSystemObjectType.eCaptureData: SO = await DBAPI.SystemObject.fetchFromCaptureDataID(idObject); break;
        case COMMON.eSystemObjectType.eModel: SO = await DBAPI.SystemObject.fetchFromModelID(idObject); break;
        case COMMON.eSystemObjectType.eScene: SO = await DBAPI.SystemObject.fetchFromSceneID(idObject); break;
        case COMMON.eSystemObjectType.eIntermediaryFile: SO = await DBAPI.SystemObject.fetchFromIntermediaryFileID(idObject); break;
        case COMMON.eSystemObjectType.eProjectDocumentation: SO = await DBAPI.SystemObject.fetchFromProjectDocumentationID(idObject); break;
        case COMMON.eSystemObjectType.eAsset: SO = await DBAPI.SystemObject.fetchFromAssetID(idObject); break;
        case COMMON.eSystemObjectType.eAssetVersion: SO = await DBAPI.SystemObject.fetchFromAssetVersionID(idObject); break;
        case COMMON.eSystemObjectType.eActor: SO = await DBAPI.SystemObject.fetchFromActorID(idObject); break;
        case COMMON.eSystemObjectType.eStakeholder: SO = await DBAPI.SystemObject.fetchFromStakeholderID(idObject); break;
        case COMMON.eSystemObjectType.eUnknown:
            LOG.error(`SystemObjectCache.convertSystemObjectToObjectID(${JSON.stringify(SOExamine)}) encountered unknown SystemObject type: ${JSON.stringify(oID)}`, LOG.LS.eTEST);
            expect(eObjectType).not.toEqual(COMMON.eSystemObjectType.eUnknown);
            break;
    }
    expect(SO).toBeTruthy();
    if (SO)
        expect(SO).toEqual(SOExamine);

    // LOG.info(`Got here 1 ${SOExamine.idSystemObject}`, LOG.LS.eTEST);
    const oIDFetch: DBAPI.ObjectIDAndType | undefined = await SystemObjectCache.getObjectFromSystem(SOExamine.idSystemObject);
    expect(oIDFetch).toBeTruthy();

    if (!L.isEqual(oIDFetch, oID))
        LOG.error(`testSystemObject fetched ${JSON.stringify(oIDFetch)} vs ${JSON.stringify(oID)}: ${JSON.stringify(SOExamine)}`, LOG.LS.eTEST);
    expect(oIDFetch).toEqual(oID);

    const oIDsID: DBAPI.SystemObjectIDAndType | undefined = await SystemObjectCache.getObjectAndSystemFromSystem(SOExamine.idSystemObject);
    expect(oIDsID).toBeTruthy();
    if (oIDsID) {
        expect(oIDsID.oID).toEqual(oID);
        expect(oIDsID.sID.idSystemObject).toEqual(SOExamine.idSystemObject);
        expect(oIDsID.sID.Retired).toEqual(SOExamine.Retired);
    }

    // LOG.info(`Got here 2 ${SOExamine.idSystemObject}`, LOG.LS.eTEST);
    const SOInfo: DBAPI.SystemObjectInfo | undefined = await SystemObjectCache.getSystemFromObjectID(oID);
    expect(SOInfo).toBeTruthy();
    if (!SOInfo)
        return false;

    expect(SOInfo.idSystemObject).toEqual(SOExamine.idSystemObject);
    expect(SOInfo.Retired).toEqual(SOExamine.Retired);

    const name1: string | undefined = await SystemObjectCache.getObjectName(SOExamine);
    const name2: string | undefined = await SystemObjectCache.getObjectNameByID(SOExamine.idSystemObject);
    expect(name1).not.toBeUndefined();
    expect(name2).not.toBeUndefined();
    expect(name1).toEqual(name2);
    return true;
}

async function testObjectAndID(oID: DBAPI.ObjectIDAndType): Promise<boolean> {
    // LOG.info(`Testing ${JSON.stringify(oID)}`, LOG.LS.eTEST);
    let SO: DBAPI.SystemObject | null = null;
    let SOI: DBAPI.SystemObjectInfo | undefined = undefined;
    const { idObject, eObjectType } = oID;
    switch (eObjectType) {
        case COMMON.eSystemObjectType.eUnit: {
            SO = await DBAPI.SystemObject.fetchFromUnitID(idObject);
            const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(oID.idObject);
            SOI = (unit) ? await SystemObjectCache.getSystemFromUnit(unit) : undefined;
        } break;
        case COMMON.eSystemObjectType.eProject: {
            SO = await DBAPI.SystemObject.fetchFromProjectID(idObject);
            const project: DBAPI.Project | null = await DBAPI.Project.fetch(oID.idObject);
            SOI = (project) ? await SystemObjectCache.getSystemFromProject(project) : undefined;
        } break;
        case COMMON.eSystemObjectType.eSubject: {
            SO = await DBAPI.SystemObject.fetchFromSubjectID(idObject);
            const subject: DBAPI.Subject | null = await DBAPI.Subject.fetch(oID.idObject);
            SOI = (subject) ? await SystemObjectCache.getSystemFromSubject(subject) : undefined;
        } break;
        case COMMON.eSystemObjectType.eItem: {
            SO = await DBAPI.SystemObject.fetchFromItemID(idObject);
            const item: DBAPI.Item | null = await DBAPI.Item.fetch(oID.idObject);
            SOI = (item) ? await SystemObjectCache.getSystemFromItem(item) : undefined;
        } break;
        case COMMON.eSystemObjectType.eCaptureData: {
            SO = await DBAPI.SystemObject.fetchFromCaptureDataID(idObject);
            const captureData: DBAPI.CaptureData | null = await DBAPI.CaptureData.fetch(oID.idObject);
            SOI = (captureData) ? await SystemObjectCache.getSystemFromCaptureData(captureData) : undefined;
        } break;
        case COMMON.eSystemObjectType.eModel: {
            SO = await DBAPI.SystemObject.fetchFromModelID(idObject);
            const model: DBAPI.Model | null = await DBAPI.Model.fetch(oID.idObject);
            SOI = (model) ? await SystemObjectCache.getSystemFromModel(model) : undefined;
        } break;
        case COMMON.eSystemObjectType.eScene: {
            SO = await DBAPI.SystemObject.fetchFromSceneID(idObject);
            const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(oID.idObject);
            SOI = (scene) ? await SystemObjectCache.getSystemFromScene(scene) : undefined;
        } break;
        case COMMON.eSystemObjectType.eIntermediaryFile: {
            SO = await DBAPI.SystemObject.fetchFromIntermediaryFileID(idObject);
            const intermediaryFile: DBAPI.IntermediaryFile | null = await DBAPI.IntermediaryFile.fetch(oID.idObject);
            SOI = (intermediaryFile) ? await SystemObjectCache.getSystemFromIntermediaryFile(intermediaryFile) : undefined;
        } break;
        case COMMON.eSystemObjectType.eProjectDocumentation: {
            SO = await DBAPI.SystemObject.fetchFromProjectDocumentationID(idObject);
            const projectDocumentation: DBAPI.ProjectDocumentation | null = await DBAPI.ProjectDocumentation.fetch(oID.idObject);
            SOI = (projectDocumentation) ? await SystemObjectCache.getSystemFromProjectDocumentation(projectDocumentation) : undefined;
        } break;
        case COMMON.eSystemObjectType.eAsset: {
            SO = await DBAPI.SystemObject.fetchFromAssetID(idObject);
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(oID.idObject);
            SOI = (asset) ? await SystemObjectCache.getSystemFromAsset(asset) : undefined;
        } break;
        case COMMON.eSystemObjectType.eAssetVersion: {
            SO = await DBAPI.SystemObject.fetchFromAssetVersionID(idObject);
            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(oID.idObject);
            SOI = (assetVersion) ? await SystemObjectCache.getSystemFromAssetVersion(assetVersion) : undefined;
        } break;
        case COMMON.eSystemObjectType.eActor: {
            SO = await DBAPI.SystemObject.fetchFromActorID(idObject);
            const actor: DBAPI.Actor | null = await DBAPI.Actor.fetch(oID.idObject);
            SOI = (actor) ? await SystemObjectCache.getSystemFromActor(actor) : undefined;
        } break;
        case COMMON.eSystemObjectType.eStakeholder: {
            SO = await DBAPI.SystemObject.fetchFromStakeholderID(idObject);
            const stakeholder: DBAPI.Stakeholder | null = await DBAPI.Stakeholder.fetch(oID.idObject);
            SOI = (stakeholder) ? await SystemObjectCache.getSystemFromStakeholder(stakeholder) : undefined;
        } break;
        case COMMON.eSystemObjectType.eUnknown:
            LOG.error('Invalid Test Case!', LOG.LS.eTEST);
            expect(eObjectType).not.toEqual(COMMON.eSystemObjectType.eUnknown);
            break;
    }

    expect(SO).toBeTruthy();
    if (!SO)
        return false;

    expect(SOI).toBeTruthy();
    if (!SOI)
        return false;

    expect(SOI.idSystemObject).toEqual(SO.idSystemObject);
    expect(SOI.Retired).toEqual(SO.Retired);

    const SOInfo: DBAPI.SystemObjectInfo | undefined = await SystemObjectCache.getSystemFromObjectID(oID);
    expect(SOInfo).toBeTruthy();
    if (!SOInfo)
        return false;
    expect(SOInfo).toEqual(SOI);

    expect(SOInfo.idSystemObject).toEqual(SO.idSystemObject);
    expect(SOInfo.Retired).toEqual(SO.Retired);

    const oIDFetch: DBAPI.ObjectIDAndType | undefined = await SystemObjectCache.getObjectFromSystem(SO.idSystemObject);
    expect(oIDFetch).toBeTruthy();
    expect(oIDFetch).toEqual(oID);
    return true;
}

export default systemObjectCacheTest;
