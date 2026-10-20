import * as fs from 'fs';
import * as path from 'path';
import * as DBAPI from '../../db';
import * as STORE from '../../storage/interface';
import * as COMMON from '@dpo-packrat/common';
import * as UTIL from '../db/api';
import { JobCookSIGenerateDownloads } from '../../job/impl/Cook/JobCookSIGenerateDownloads';
import { WorkflowUtil } from '../../workflow/impl/Packrat/WorkflowUtil';

// Hermetic coverage for the Cook-download persist path: processModelFile ingests a
// generated download into the sandbox OCFL store and wires it into the repository.
// A master Model + Scene + User are self-seeded; the download stream is served from a
// committed fixture; the only external side effect (si-packrat-inspect via
// WorkflowUtil.computeModelMetrics) is stubbed so no real Cook job fires. Everything
// else runs for real — model creation, system-object wiring, the AssetStorageAdapter
// ingest, and ModelSceneXref persistence — so a regression in the persist logic
// (missing AssetVersion, unwired derived model, missing/stale MSX) turns this red.

const FIXTURE = path.resolve(__dirname, '..', 'mock', 'parity', 'model-package', 'Model_Test.obj');

function makeJob(): any {
    const jc: any = Object.create(JobCookSIGenerateDownloads.prototype);
    jc.name = () => 'si-generate-downloads';
    jc._dbJobRun = { idJobRun: 1 };
    jc.appendToReportAndLog = jest.fn(async () => ({ success: true }));
    return jc;
}

async function seedMasterModel(): Promise<DBAPI.Model> {
    const v = (await import('../../cache')).VocabularyCache;
    const ark = await v.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeARK);
    return UTIL.createModelTest({
        Name: 'TR12 Master Model', DateCreated: UTIL.nowCleansed(), idVCreationMethod: ark!.idVocabulary,
        idVModality: ark!.idVocabulary, idVUnits: ark!.idVocabulary, idVPurpose: ark!.idVocabulary,
        idVFileType: ark!.idVocabulary, idAssetThumbnail: null, CountAnimations: 0, CountCameras: 0,
        CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0,
        CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY', IsDracoCompressed: false,
        AutomationTag: null, CountTriangles: 0, Title: '', idModel: 0, Variant: '[]',
    });
}

describe('Cook persist: processModelFile ingests a download and wires it in', () => {
    let user: DBAPI.User;
    let scene: DBAPI.Scene;
    let master: DBAPI.Model;
    let metricsSpy: jest.SpyInstance;

    beforeAll(async () => {
        user = await UTIL.createUserTest({
            Name: 'TR12 User', EmailAddress: 'tr12@si.edu', SecurityID: 'TR12', Active: true,
            DateActivated: UTIL.nowCleansed(), DateDisabled: null, WorkflowNotificationTime: UTIL.nowCleansed(),
            EmailSettings: 0, idUser: 0, SlackID: '',
        });
        scene = await UTIL.createSceneTest({
            Name: 'TR12 Scene', idAssetThumbnail: null, CountScene: 0, CountNode: 0, CountCamera: 0,
            CountLight: 0, CountModel: 0, CountMeta: 0, CountSetup: 0, CountTour: 0, EdanUUID: null,
            PosedAndQCd: true, ApprovedForPublication: true, Title: '', idScene: 0,
        });
        master = await seedMasterModel();

        // Stub only si-packrat-inspect: it would otherwise submit a real Cook job.
        metricsSpy = jest.spyOn(WorkflowUtil, 'computeModelMetrics').mockResolvedValue({ success: true });
    });

    afterAll(() => {
        metricsSpy.mockRestore();
    });

    test('creates an ingested AssetVersion, a scene-derived model, and its ModelSceneXref', async () => {
        const fileItem = {
            downloadType: 'webAssetGlbLowUncompressed',
            fileType: 'model',
            fileName: 'tr12-test-low.glb',
            success: true,
        };
        const RSR: STORE.ReadStreamResult = {
            readStream: fs.createReadStream(FIXTURE), fileName: fileItem.fileName, storageHash: null, success: true,
        };

        const result = await makeJob().processModelFile(scene, master, fileItem, RSR, user.idUser);
        expect(result).toBeTruthy();

        // An AssetVersion was created and committed to the sandbox OCFL store.
        const av: DBAPI.AssetVersion | null = result.assetVersion;
        expect(av).toBeTruthy();
        expect(av!.idAssetVersion).toBeGreaterThan(0);
        expect(av!.Ingested).toBe(true);
        expect(Number(av!.StorageSize)).toBeGreaterThan(0);
        expect(av!.FileName).toBe(fileItem.fileName);

        // The bits landed in the sandbox OCFL store: the object's inventory.json exists
        // under the asset's storage key. (A streaming read-back would leave an open file
        // handle that blocks the sandbox teardown rmdir on Windows.)
        const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(av!.idAsset);
        expect(asset).toBeTruthy();
        const storage: any = await STORE.StorageFactory.getInstance();
        const objectRoot: string = storage.ocflRoot.computeLocationObjectRoot(asset!.StorageKey);
        expect(fs.existsSync(path.join(objectRoot, 'inventory.json'))).toBe(true);

        // A new derived Model was created and wired to BOTH the scene and the master model.
        const derived: DBAPI.Model | null = await DBAPI.Model.fetch(result.MSX.idModel);
        expect(derived).toBeTruthy();
        const soDerived: DBAPI.SystemObject | null = await derived!.fetchSystemObject();
        expect(soDerived).toBeTruthy();
        const soScene: DBAPI.SystemObject | null = await scene.fetchSystemObject();
        const soMaster: DBAPI.SystemObject | null = await master.fetchSystemObject();
        const parents: DBAPI.SystemObject[] | null = await DBAPI.SystemObject.fetchMasterFromXref(soDerived!.idSystemObject);
        const parentIds: number[] = (parents ?? []).map(p => p.idSystemObject);
        expect(parentIds).toEqual(expect.arrayContaining([soScene!.idSystemObject, soMaster!.idSystemObject]));

        // The ModelSceneXref was persisted with the ingested file size and the derived model.
        expect(result.MSX.idModelSceneXref).toBeGreaterThan(0);
        expect(result.MSX.idScene).toBe(scene.idScene);
        expect(Number(result.MSX.FileSize)).toBe(Number(av!.StorageSize));

        // si-packrat-inspect was invoked (stubbed) — not skipped.
        expect(metricsSpy).toHaveBeenCalled();
    });
});
