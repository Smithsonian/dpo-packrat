import * as DBAPI from '../../db';
import { Unit, Project, Subject, Item, CaptureData, Model, Scene, IntermediaryFile, ProjectDocumentation,
    Asset, AssetVersion, Actor, Stakeholder, SystemObject, eSystemObjectType } from '../../db';
import { SystemObjectCache, ObjectIDAndType, SystemObjectInfo } from '../../cache';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import { ObjectGraphTestSetup } from '../db/composite/ObjectGraph.setup';
import * as UTIL from '../db/api';

afterAll(async done => {
    await H.Helpers.sleep(4000);
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
            // LOG.logger.info(`Fetched SO: ${systemObjectAll.length}`);
        });

        test('Cache: SystemObjectCache Methods ' + description, async () => {
            const soFetchCount: number = systemObjectAll.length;
            for (let test = 0; test < 100; test++) {
                const lookup: number = Math.floor(Math.random() * soFetchCount);
                const SOExamine: DBAPI.SystemObject = systemObjectAll[lookup];
                await testSystemObject(SOExamine);
            }
        });

        test('Cache: SystemObjectCache.getSystemFromObjectIDInternal ' + description, async () => {
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eUnit });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eProject });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eSubject });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eItem });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eCaptureData });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eModel });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eScene });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eIntermediaryFile });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eProjectDocumentation });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eAsset });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eAssetVersion });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eActor });
            await testObjectAndID({ idObject: 1, eObjectType: eSystemObjectType.eStakeholder });
        });

        test('Cache: SystemObjectCache Cache Misses ' + description, async () => {
            const item1: DBAPI.Item = await UTIL.createItemTest({ idItem: 0, idAssetThumbnail: null, idGeoLocation: null, Name: 'SystemObjectCacheTest 1', EntireSubject: true });
            const item2: DBAPI.Item = await UTIL.createItemTest({ idItem: 0, idAssetThumbnail: null, idGeoLocation: null, Name: 'SystemObjectCacheTest 2', EntireSubject: true });
            expect(item1.idItem).toBeGreaterThan(0);
            expect(item2.idItem).toBeGreaterThan(0);

            const SOItem1: DBAPI.SystemObject | null = await item1.fetchSystemObject();
            expect(SOItem1).toBeTruthy();
            if (SOItem1)
                await testSystemObject(SOItem1);
            await testObjectAndID({ idObject: item2.idItem, eObjectType: eSystemObjectType.eItem });
        });

        test('Cache: SystemObjectCache Invalid and Other ' + description, async () => {
            let oIDFetch: ObjectIDAndType | undefined = await SystemObjectCache.getObjectFromSystem(1000000000);
            expect(oIDFetch).toBeFalsy();

            const SOInfo: SystemObjectInfo | undefined = await SystemObjectCache.getSystemFromObjectID({ idObject: 1000000000, eObjectType: eSystemObjectType.eItem });
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
    // LOG.logger.info(`Testing ${JSON.stringify(SOExamine)}`);
    const oID: ObjectIDAndType | undefined = SystemObjectCache.convertSystemObjectToObjectID(SOExamine);
    expect(oID).toBeTruthy();
    if (!oID)
        return false;

    let SO: SystemObject | null = null;
    const { idObject, eObjectType } = oID;
    switch (eObjectType) {
        case eSystemObjectType.eUnit: SO = await SystemObject.fetchFromUnitID(idObject); break;
        case eSystemObjectType.eProject: SO = await SystemObject.fetchFromProjectID(idObject); break;
        case eSystemObjectType.eSubject: SO = await SystemObject.fetchFromSubjectID(idObject); break;
        case eSystemObjectType.eItem: SO = await SystemObject.fetchFromItemID(idObject); break;
        case eSystemObjectType.eCaptureData: SO = await SystemObject.fetchFromCaptureDataID(idObject); break;
        case eSystemObjectType.eModel: SO = await SystemObject.fetchFromModelID(idObject); break;
        case eSystemObjectType.eScene: SO = await SystemObject.fetchFromSceneID(idObject); break;
        case eSystemObjectType.eIntermediaryFile: SO = await SystemObject.fetchFromIntermediaryFileID(idObject); break;
        case eSystemObjectType.eProjectDocumentation: SO = await SystemObject.fetchFromProjectDocumentationID(idObject); break;
        case eSystemObjectType.eAsset: SO = await SystemObject.fetchFromAssetID(idObject); break;
        case eSystemObjectType.eAssetVersion: SO = await SystemObject.fetchFromAssetVersionID(idObject); break;
        case eSystemObjectType.eActor: SO = await SystemObject.fetchFromActorID(idObject); break;
        case eSystemObjectType.eStakeholder: SO = await SystemObject.fetchFromStakeholderID(idObject); break;
        case eSystemObjectType.eUnknown:
            LOG.logger.error(`SystemObjectCache.convertSystemObjectToObjectID(${JSON.stringify(SOExamine)}) encountered unknown SystemObject type: ${JSON.stringify(oID)}`);
            expect(eObjectType).not.toEqual(eSystemObjectType.eUnknown);
            break;
    }
    expect(SO).toBeTruthy();
    if (SO)
        expect(SO).toEqual(SOExamine);

    // LOG.logger.info(`Got here 1 ${SOExamine.idSystemObject}`);
    const oIDFetch: ObjectIDAndType | undefined = await SystemObjectCache.getObjectFromSystem(SOExamine.idSystemObject);
    expect(oIDFetch).toBeTruthy();
    expect(oIDFetch).toEqual(oID);

    // LOG.logger.info(`Got here 2 ${SOExamine.idSystemObject}`);
    const SOInfo: SystemObjectInfo | undefined = await SystemObjectCache.getSystemFromObjectID(oID);
    expect(SOInfo).toBeTruthy();
    if (SOInfo) {
        expect(SOInfo.idSystemObject).toEqual(SOExamine.idSystemObject);
        expect(SOInfo.Retired).toEqual(SOExamine.Retired);
        return true;
    }
    return false;
}

async function testObjectAndID(oID: ObjectIDAndType): Promise<boolean> {
    // LOG.logger.info(`Testing ${JSON.stringify(oID)}`);
    let SO: SystemObject | null = null;
    let SOI: SystemObjectInfo | undefined = undefined;
    const { idObject, eObjectType } = oID;
    switch (eObjectType) {
        case eSystemObjectType.eUnit: {
            SO = await SystemObject.fetchFromUnitID(idObject);
            const unit: Unit | null = await Unit.fetch(oID.idObject);
            SOI = (unit) ? await SystemObjectCache.getSystemFromUnit(unit) : undefined;
        } break;
        case eSystemObjectType.eProject: {
            SO = await SystemObject.fetchFromProjectID(idObject);
            const project: Project | null = await Project.fetch(oID.idObject);
            SOI = (project) ? await SystemObjectCache.getSystemFromProject(project) : undefined;
        } break;
        case eSystemObjectType.eSubject: {
            SO = await SystemObject.fetchFromSubjectID(idObject);
            const subject: Subject | null = await Subject.fetch(oID.idObject);
            SOI = (subject) ? await SystemObjectCache.getSystemFromSubject(subject) : undefined;
        } break;
        case eSystemObjectType.eItem: {
            SO = await SystemObject.fetchFromItemID(idObject);
            const item: Item | null = await Item.fetch(oID.idObject);
            SOI = (item) ? await SystemObjectCache.getSystemFromItem(item) : undefined;
        } break;
        case eSystemObjectType.eCaptureData: {
            SO = await SystemObject.fetchFromCaptureDataID(idObject);
            const captureData: CaptureData | null = await CaptureData.fetch(oID.idObject);
            SOI = (captureData) ? await SystemObjectCache.getSystemFromCaptureData(captureData) : undefined;
        } break;
        case eSystemObjectType.eModel: {
            SO = await SystemObject.fetchFromModelID(idObject);
            const model: Model | null = await Model.fetch(oID.idObject);
            SOI = (model) ? await SystemObjectCache.getSystemFromModel(model) : undefined;
        } break;
        case eSystemObjectType.eScene: {
            SO = await SystemObject.fetchFromSceneID(idObject);
            const scene: Scene | null = await Scene.fetch(oID.idObject);
            SOI = (scene) ? await SystemObjectCache.getSystemFromScene(scene) : undefined;
        } break;
        case eSystemObjectType.eIntermediaryFile: {
            SO = await SystemObject.fetchFromIntermediaryFileID(idObject);
            const intermediaryFile: IntermediaryFile | null = await IntermediaryFile.fetch(oID.idObject);
            SOI = (intermediaryFile) ? await SystemObjectCache.getSystemFromIntermediaryFile(intermediaryFile) : undefined;
        } break;
        case eSystemObjectType.eProjectDocumentation: {
            SO = await SystemObject.fetchFromProjectDocumentationID(idObject);
            const projectDocumentation: ProjectDocumentation | null = await ProjectDocumentation.fetch(oID.idObject);
            SOI = (projectDocumentation) ? await SystemObjectCache.getSystemFromProjectDocumentation(projectDocumentation) : undefined;
        } break;
        case eSystemObjectType.eAsset: {
            SO = await SystemObject.fetchFromAssetID(idObject);
            const asset: Asset | null = await Asset.fetch(oID.idObject);
            SOI = (asset) ? await SystemObjectCache.getSystemFromAsset(asset) : undefined;
        } break;
        case eSystemObjectType.eAssetVersion: {
            SO = await SystemObject.fetchFromAssetVersionID(idObject);
            const assetVersion: AssetVersion | null = await AssetVersion.fetch(oID.idObject);
            SOI = (assetVersion) ? await SystemObjectCache.getSystemFromAssetVersion(assetVersion) : undefined;
        } break;
        case eSystemObjectType.eActor: {
            SO = await SystemObject.fetchFromActorID(idObject);
            const actor: Actor | null = await Actor.fetch(oID.idObject);
            SOI = (actor) ? await SystemObjectCache.getSystemFromActor(actor) : undefined;
        } break;
        case eSystemObjectType.eStakeholder: {
            SO = await SystemObject.fetchFromStakeholderID(idObject);
            const stakeholder: Stakeholder | null = await Stakeholder.fetch(oID.idObject);
            SOI = (stakeholder) ? await SystemObjectCache.getSystemFromStakeholder(stakeholder) : undefined;
        } break;
        case eSystemObjectType.eUnknown:
            LOG.logger.error('Invalid Test Case!');
            expect(eObjectType).not.toEqual(eSystemObjectType.eUnknown);
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

    const SOInfo: SystemObjectInfo | undefined = await SystemObjectCache.getSystemFromObjectID(oID);
    expect(SOInfo).toBeTruthy();
    if (!SOInfo)
        return false;
    expect(SOInfo).toEqual(SOI);

    expect(SOInfo.idSystemObject).toEqual(SO.idSystemObject);
    expect(SOInfo.Retired).toEqual(SO.Retired);

    const oIDFetch: ObjectIDAndType | undefined = await SystemObjectCache.getObjectFromSystem(SO.idSystemObject);
    expect(oIDFetch).toBeTruthy();
    expect(oIDFetch).toEqual(oID);
    return true;
}

export default systemObjectCacheTest;
