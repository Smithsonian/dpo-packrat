import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as UTIL from '../api';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

/** Implements the object graph described here: https://confluence.si.edu/download/attachments/100272687/ObjectGraph.png?api=v2 */
export class ObjectGraphTestSetup {
    /* #region Variable Declarations */
    user1: DBAPI.User | null = null;
    unit1: DBAPI.Unit | null = null;
    unit2: DBAPI.Unit | null = null;
    project1: DBAPI.Project | null = null;
    project2: DBAPI.Project | null = null;
    subject1: DBAPI.Subject | null = null;
    subject2: DBAPI.Subject | null = null;
    subject3: DBAPI.Subject | null = null;
    subject4: DBAPI.Subject | null = null;
    item1: DBAPI.Item | null = null;
    item2: DBAPI.Item | null = null;
    item3: DBAPI.Item | null = null;
    item4: DBAPI.Item | null = null;
    captureData1: DBAPI.CaptureData | null = null;
    captureData2: DBAPI.CaptureData | null = null;
    model1: DBAPI.Model | null = null;
    model2: DBAPI.Model | null = null;
    model3: DBAPI.Model | null = null;
    model4: DBAPI.Model | null = null;
    scene1: DBAPI.Scene | null = null;
    projectDocumentation1: DBAPI.ProjectDocumentation | null = null;
    intermediaryFile1: DBAPI.IntermediaryFile | null = null;
    actor1: DBAPI.Actor | null = null;
    actor2: DBAPI.Actor | null = null;
    stakeholder1: DBAPI.Stakeholder | null = null;
    stakeholder2: DBAPI.Stakeholder | null = null;
    assetT1: DBAPI.Asset | null = null;
    assetT2: DBAPI.Asset | null = null;
    assetT3: DBAPI.Asset | null = null;
    assetT4: DBAPI.Asset | null = null;
    assetT5: DBAPI.Asset | null = null;
    asset1: DBAPI.Asset | null = null;
    asset2: DBAPI.Asset | null = null;
    asset3: DBAPI.Asset | null = null;
    asset4: DBAPI.Asset | null = null;
    asset5: DBAPI.Asset | null = null;
    asset6: DBAPI.Asset | null = null;
    asset7: DBAPI.Asset | null = null;
    asset8: DBAPI.Asset | null = null;
    asset9: DBAPI.Asset | null = null;
    asset10: DBAPI.Asset | null = null;
    assetVersionT1: DBAPI.AssetVersion | null = null;
    assetVersionT2: DBAPI.AssetVersion | null = null;
    assetVersionT3: DBAPI.AssetVersion | null = null;
    assetVersionT4: DBAPI.AssetVersion | null = null;
    assetVersionT5: DBAPI.AssetVersion | null = null;
    assetVersion1a: DBAPI.AssetVersion | null = null;
    assetVersion1b: DBAPI.AssetVersion | null = null;
    assetVersion1c: DBAPI.AssetVersion | null = null;
    assetVersion2: DBAPI.AssetVersion | null = null;
    assetVersion3: DBAPI.AssetVersion | null = null;
    assetVersion4: DBAPI.AssetVersion | null = null;
    assetVersion5: DBAPI.AssetVersion | null = null;
    assetVersion6: DBAPI.AssetVersion | null = null;
    assetVersion7: DBAPI.AssetVersion | null = null;
    assetVersion8a: DBAPI.AssetVersion | null = null;
    assetVersion8b: DBAPI.AssetVersion | null = null;
    assetVersion8c: DBAPI.AssetVersion | null = null;
    assetVersion9: DBAPI.AssetVersion | null = null;
    assetVersion10: DBAPI.AssetVersion | null = null;
    v1: DBAPI.Vocabulary | undefined;

    licenseCC0:        DBAPI.License | null = null;
    licenseDownload:   DBAPI.License | null = null;
    licenseView:       DBAPI.License | null = null;
    licenseRestricted: DBAPI.License | null = null;

    idSOUnit1: number = 0;
    idSOUnit2: number = 0;
    idSOProject1: number = 0;
    idSOSubject1: number = 0;
    idSOSubject2: number = 0;
    idSOSubject4: number = 0;
    idSOItem1: number = 0;
    idSOItem2: number = 0;
    idSOCaptureData1: number = 0;
    idSOCaptureData2: number = 0;
    /* #endregion */

    async initialize(): Promise<void> {
        jest.setTimeout(60000);

        let assigned: boolean = true;
        this.v1 = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeARK);
        expect(this.v1).toBeTruthy();
        if (!this.v1)
            return;
        /* #region Object Creation */
        this.user1 = await UTIL.createUserTest({ Name: 'OA Test user1', EmailAddress: 'oatest@si.edu', SecurityID: 'OA Test', Active: true, DateActivated: UTIL.nowCleansed(), DateDisabled: null, WorkflowNotificationTime: UTIL.nowCleansed(), EmailSettings: 0, idUser: 0 });

        this.unit1 = await UTIL.createUnitTest({ Name: 'OA Test unit1', Abbreviation: 'DPO', ARKPrefix: 'http://dpo/', idUnit: 0 });
        this.unit2 = await UTIL.createUnitTest({ Name: 'OA Test unit2', Abbreviation: 'NMNH', ARKPrefix: 'http://nmnh/', idUnit: 0 });
        this.project1 = await UTIL.createProjectTest({ Name: 'OA Test project1', Description: 'OA Test', idProject: 0 });
        this.project2 = await UTIL.createProjectTest({ Name: 'OA Test project2', Description: 'OA Test', idProject: 0 });

        this.assetT1 = await UTIL.createAssetTest({ FileName: 'OA Test assetT1', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersionT1 = await UTIL.createAssetVersionTest({ idAsset: this.assetT1.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersionT1', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersionT1', Version: 0 });
        this.subject1 = await UTIL.createSubjectWithIdentifierTest({ idUnit: this.unit1.idUnit, idAssetThumbnail: this.assetT1.idAsset, idGeoLocation: null, Name: 'OA Test subject1', idIdentifierPreferred: null, idSubject: 0 });
        assigned = await this.assetT1.assignOwner(this.subject1); expect(assigned).toBeTruthy();
        this.subject2 = await UTIL.createSubjectTest({ idUnit: this.unit1.idUnit, idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test subject2', idIdentifierPreferred: null, idSubject: 0 }); // No identifier, on purpose
        this.subject3 = await UTIL.createSubjectWithIdentifierTest({ idUnit: this.unit2.idUnit, idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test subject3', idIdentifierPreferred: null, idSubject: 0 });
        this.subject4 = await UTIL.createSubjectWithIdentifierTest({ idUnit: this.unit2.idUnit, idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test subject4', idIdentifierPreferred: null, idSubject: 0 });

        this.assetT2 = await UTIL.createAssetTest({ FileName: 'OA Test assetT2', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersionT2 = await UTIL.createAssetVersionTest({ idAsset: this.assetT2.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersionT2', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersionT2', Version: 0 });
        this.item1 = await UTIL.createItemTest({ idAssetThumbnail: this.assetT2.idAsset, idGeoLocation: null, Name: 'OA Test item1', Title: '', EntireSubject: true, idItem: 0 });
        assigned = await this.assetT2.assignOwner(this.item1); expect(assigned).toBeTruthy();
        this.item2 = await UTIL.createItemTest({ idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test item2', Title: '', EntireSubject: true, idItem: 0 });
        this.item3 = await UTIL.createItemTest({ idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test item3', Title: '', EntireSubject: true, idItem: 0 });
        this.item4 = await UTIL.createItemTest({ idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test item4', Title: '', EntireSubject: true, idItem: 0 });

        this.asset1 = await UTIL.createAssetTest({ FileName: 'OA Test asset1', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion1a = await UTIL.createAssetVersionTest({ idAsset: this.asset1.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion1a', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion1a', Version: 0 });
        this.assetVersion1b = await UTIL.createAssetVersionTest({ idAsset: this.asset1.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion1b', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion1b', Version: 0 });
        this.assetVersion1c = await UTIL.createAssetVersionTest({ idAsset: this.asset1.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion1c', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion1c', Version: 0 });
        this.captureData1 = await UTIL.createCaptureDataTest({ Name: 'OA Test captureData1', idVCaptureMethod: this.v1.idVocabulary, DateCaptured: UTIL.nowCleansed(), Description: 'OA Test', idAssetThumbnail: null, idCaptureData: 0 });
        assigned = await this.asset1.assignOwner(this.captureData1); expect(assigned).toBeTruthy();

        this.assetT3 = await UTIL.createAssetTest({ FileName: 'OA Test assetT3', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersionT3 = await UTIL.createAssetVersionTest({ idAsset: this.assetT3.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersionT3', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersionT3',Version: 0 });
        this.captureData2 = await UTIL.createCaptureDataTest({ Name: 'OA Test', idVCaptureMethod: this.v1.idVocabulary, DateCaptured: UTIL.nowCleansed(), Description: 'OA Test captureData2', idAssetThumbnail: this.assetT3.idAsset, idCaptureData: 0 });
        assigned = await this.assetT3.assignOwner(this.captureData2); expect(assigned).toBeTruthy();

        this.assetT4 = await UTIL.createAssetTest({ FileName: 'OA Test assetT4', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersionT4 = await UTIL.createAssetVersionTest({ idAsset: this.assetT4.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersionT4', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersionT4',Version: 0 });
        this.asset2 = await UTIL.createAssetTest({ FileName: 'OA Test asset2', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion2 = await UTIL.createAssetVersionTest({ idAsset: this.asset2.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion2', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion2',Version: 0 });
        this.asset3 = await UTIL.createAssetTest({ FileName: 'OA Test asset3', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion3 = await UTIL.createAssetVersionTest({ idAsset: this.asset3.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion3', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion3',Version: 0 });
        this.asset4 = await UTIL.createAssetTest({ FileName: 'OA Test asset4', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion4 = await UTIL.createAssetVersionTest({ idAsset: this.asset4.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion4', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion4',Version: 0 });
        this.model1 = await UTIL.createModelTest({ Name: 'OA Test model1', DateCreated: UTIL.nowCleansed(), idVCreationMethod: this.v1.idVocabulary, idVModality: this.v1.idVocabulary,  idVUnits: this.v1.idVocabulary, idVPurpose: this.v1.idVocabulary, idVFileType: this.v1.idVocabulary, idAssetThumbnail: this.assetT4.idAsset, CountAnimations: 0, CountCameras: 0, CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0, CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY', IsDracoCompressed: false, AutomationTag: null, CountTriangles: 0, Title: '', idModel: 0, ModelUse: '[]' });

        assigned = await this.asset2.assignOwner(this.model1); expect(assigned).toBeTruthy();
        assigned = await this.asset3.assignOwner(this.model1); expect(assigned).toBeTruthy();
        assigned = await this.asset4.assignOwner(this.model1); expect(assigned).toBeTruthy();
        assigned = await this.assetT4.assignOwner(this.model1); expect(assigned).toBeTruthy();

        this.asset5 = await UTIL.createAssetTest({ FileName: 'OA Test asset5', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion5 = await UTIL.createAssetVersionTest({ idAsset: this.asset5.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion5', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion5',Version: 0 });
        this.model2 = await UTIL.createModelTest({ Name: 'OA Test model2', DateCreated: UTIL.nowCleansed(), idVCreationMethod: this.v1.idVocabulary, idVModality: this.v1.idVocabulary,  idVUnits: this.v1.idVocabulary, idVPurpose: this.v1.idVocabulary, idVFileType: this.v1.idVocabulary, idAssetThumbnail: null, CountAnimations: 0, CountCameras: 0, CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0, CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY', IsDracoCompressed: false, AutomationTag: null, CountTriangles: 0, Title: '', idModel: 0, ModelUse: '[]' });
        assigned = await this.asset5.assignOwner(this.model2); expect(assigned).toBeTruthy();

        this.asset6 = await UTIL.createAssetTest({ FileName: 'OA Test asset6', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion6 = await UTIL.createAssetVersionTest({ idAsset: this.asset6.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion6', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion6',Version: 0 });
        this.model3 = await UTIL.createModelTest({ Name: 'OA Test model3', DateCreated: UTIL.nowCleansed(), idVCreationMethod: this.v1.idVocabulary, idVModality: this.v1.idVocabulary,  idVUnits: this.v1.idVocabulary, idVPurpose: this.v1.idVocabulary, idVFileType: this.v1.idVocabulary, idAssetThumbnail: null, CountAnimations: 0, CountCameras: 0, CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0, CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY', IsDracoCompressed: false, AutomationTag: null, CountTriangles: 0, Title: '', idModel: 0, ModelUse: '[]' });
        assigned = await this.asset6.assignOwner(this.model3); expect(assigned).toBeTruthy();

        this.asset7 = await UTIL.createAssetTest({ FileName: 'OA Test asset7', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion7 = await UTIL.createAssetVersionTest({ idAsset: this.asset7.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion7', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion7',Version: 0 });
        this.model4 = await UTIL.createModelTest({ Name: 'OA Test model4', DateCreated: UTIL.nowCleansed(), idVCreationMethod: this.v1.idVocabulary, idVModality: this.v1.idVocabulary,  idVUnits: this.v1.idVocabulary, idVPurpose: this.v1.idVocabulary, idVFileType: this.v1.idVocabulary, idAssetThumbnail: null, CountAnimations: 0, CountCameras: 0, CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0, CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY', IsDracoCompressed: false, AutomationTag: null, CountTriangles: 0, Title: '', idModel: 0, ModelUse: '[]' });
        assigned = await this.asset7.assignOwner(this.model4); expect(assigned).toBeTruthy();

        this.assetT5 = await UTIL.createAssetTest({ FileName: 'OA Test assetT5', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersionT5 = await UTIL.createAssetVersionTest({ idAsset: this.assetT5.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersionT5', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test',Comment: 'OA Test assetVersionT5', Version: 0 });
        this.asset8 = await UTIL.createAssetTest({ FileName: 'OA Test asset8', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion8a = await UTIL.createAssetVersionTest({ idAsset: this.asset8.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion8a', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion8a',Version: 0 });
        this.assetVersion8b = await UTIL.createAssetVersionTest({ idAsset: this.asset8.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion8b', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion8b',Version: 0 });
        this.assetVersion8c = await UTIL.createAssetVersionTest({ idAsset: this.asset8.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion8c', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion8c',Version: 0 });
        this.scene1 = await UTIL.createSceneTest({ Name: 'OA Test scene1', idAssetThumbnail: this.assetT5.idAsset, CountScene: 0, CountNode: 0, CountCamera: 0, CountLight: 0, CountModel: 0, CountMeta: 0, CountSetup: 0, CountTour: 0, EdanUUID: null, PosedAndQCd: true, ApprovedForPublication: true, Title: '', idScene: 0 });
        assigned = await this.asset8.assignOwner(this.scene1); expect(assigned).toBeTruthy();
        assigned = await this.assetT5.assignOwner(this.scene1); expect(assigned).toBeTruthy();

        this.asset9 = await UTIL.createAssetTest({ FileName: 'OA Test asset9', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion9 = await UTIL.createAssetVersionTest({ idAsset: this.asset9.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion9', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion9',Version: 0 });
        this.projectDocumentation1 = await UTIL.createProjectDocumentationTest({ idProject: this.project1.idProject, Name: 'OA Test projectDocumentation1', Description: 'OA Test', idProjectDocumentation: 0 });
        assigned = await this.asset9.assignOwner(this.projectDocumentation1); expect(assigned).toBeTruthy();

        this.asset10 = await UTIL.createAssetTest({ FileName: 'OA Test asset10', idAssetGroup: null, idVAssetType: this.v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        this.assetVersion10 = await UTIL.createAssetVersionTest({ idAsset: this.asset10.idAsset, idUserCreator: this.user1.idUser, DateCreated: UTIL.nowCleansed(), StorageHash: 'OA Test', StorageSize: BigInt(500), idAssetVersion: 0, Ingested: true, BulkIngest: false, FileName: 'OA Test assetVersion10', StorageKeyStaging: '', idSOAttachment: null, FilePath: '/OA Test', Comment: 'OA Test assetVersion10',Version: 0 });
        this.intermediaryFile1 = await UTIL.createIntermediaryFileTest({ idAsset: this.asset10.idAsset, DateCreated: UTIL.nowCleansed(), idIntermediaryFile: 0 });
        assigned = await this.asset10.assignOwner(this.intermediaryFile1); expect(assigned).toBeTruthy();

        this.actor1 = await UTIL.createActorTest({ IndividualName: 'OA Test actor1', OrganizationName: 'OA Test', idUnit: this.unit1.idUnit, idActor: 0 });
        this.actor2 = await UTIL.createActorTest({ IndividualName: 'OA Test actor2', OrganizationName: 'OA Test', idUnit: 0, idActor: 0 });
        this.stakeholder1 = await UTIL.createStakeholderTest({ IndividualName: 'OA Test stakeholder1', OrganizationName: 'OA Test', EmailAddress: 'OA Test', PhoneNumberMobile: 'OA Test', PhoneNumberOffice: 'OA Test', MailingAddress: 'OA Test', idStakeholder: 0 });
        this.stakeholder2 = await UTIL.createStakeholderTest({ IndividualName: 'OA Test stakeholder2', OrganizationName: 'OA Test', EmailAddress: 'OA Test', PhoneNumberMobile: 'OA Test', PhoneNumberOffice: 'OA Test', MailingAddress: 'OA Test', idStakeholder: 0 });

        this.idSOUnit1 = await ObjectGraphTestSetup.fetchSystemObjectID(this.unit1) ?? 0;
        this.idSOUnit2 = await ObjectGraphTestSetup.fetchSystemObjectID(this.unit2) ?? 0;
        this.idSOProject1 = await ObjectGraphTestSetup.fetchSystemObjectID(this.project1) ?? 0;
        this.idSOSubject1 = await ObjectGraphTestSetup.fetchSystemObjectID(this.subject1) ?? 0;
        this.idSOSubject2 = await ObjectGraphTestSetup.fetchSystemObjectID(this.subject2) ?? 0;
        this.idSOSubject4 = await ObjectGraphTestSetup.fetchSystemObjectID(this.subject4) ?? 0;
        this.idSOItem1 = await ObjectGraphTestSetup.fetchSystemObjectID(this.item1) ?? 0;
        this.idSOItem2 = await ObjectGraphTestSetup.fetchSystemObjectID(this.item2) ?? 0;
        this.idSOCaptureData1 = await ObjectGraphTestSetup.fetchSystemObjectID(this.captureData1) ?? 0;
        this.idSOCaptureData2 = await ObjectGraphTestSetup.fetchSystemObjectID(this.captureData2) ?? 0;
        /* #endregion */
    }

    async wire(): Promise<void> {
        // unit-subject is defined via subject.idUnit
        await UTIL.createXref(this.project1, this.item1);
        await UTIL.createXref(this.project2, this.item2);
        await UTIL.createXref(this.project2, this.item3);
        await UTIL.createXref(this.project2, this.item4);
        await UTIL.createXref(this.subject1, this.item1);
        await UTIL.createXref(this.subject1, this.item2);
        await UTIL.createXref(this.subject2, this.item3);
        await UTIL.createXref(this.subject2, this.item4);
        await UTIL.createXref(this.subject4, this.item4);
        await UTIL.createXref(this.item1, this.captureData1);
        await UTIL.createXref(this.item1, this.captureData2);
        await UTIL.createXref(this.item1, this.model1);
        await UTIL.createXref(this.item1, this.model2);
        await UTIL.createXref(this.item1, this.model3);
        await UTIL.createXref(this.item1, this.model4);
        await UTIL.createXref(this.item1, this.scene1);
        await UTIL.createXref(this.captureData1, this.model1);
        await UTIL.createXref(this.captureData2, this.model1);
        await UTIL.createXref(this.model1, this.model2);
        await UTIL.createXref(this.model1, this.model3);
        await UTIL.createXref(this.model1, this.model4);
        await UTIL.createXref(this.model1, this.scene1);
        await UTIL.createXref(this.scene1, this.model2);
        await UTIL.createXref(this.scene1, this.model3);
        await UTIL.createXref(this.scene1, this.model4);
        await UTIL.createXref(this.item2, this.intermediaryFile1);

        // XXX-asset relationships defined via Asset.idSystemObject
        // this.asset1; Thumbnail for this.subject1
        // this.asset2; Thumbnail for this.item1
        // await UTIL.createXref(this.captureData1, this.asset3);
        // await UTIL.createXref(this.model1, this.asset4);
        // await UTIL.createXref(this.model2, this.asset5);
        // await UTIL.createXref(this.model3, this.asset6);
        // await UTIL.createXref(this.model4, this.asset7);
        // await UTIL.createXref(this.scene1, this.asset8);

        // unit-actor is defined via actor.idUnit
        await UTIL.createXref(this.captureData1, this.actor1);
        await UTIL.createXref(this.captureData1, this.actor2);
        await UTIL.createXref(this.project1, this.stakeholder1);
        await UTIL.createXref(this.project2, this.stakeholder2);
        await UTIL.createXref(this.unit1, this.stakeholder1);
        await UTIL.createXref(this.unit1, this.stakeholder2);

        // Asset-AssetVersion is defined via AssetVersion.idAsset
    }

    async assignLicenses(): Promise<boolean> {
        this.licenseCC0        = await CACHE.LicenseCache.getLicenseByEnum(COMMON.eLicense.eViewDownloadCC0) ?? null;
        this.licenseDownload   = await CACHE.LicenseCache.getLicenseByEnum(COMMON.eLicense.eViewDownloadRestriction) ?? null;
        this.licenseView       = await CACHE.LicenseCache.getLicenseByEnum(COMMON.eLicense.eViewOnly) ?? null;
        this.licenseRestricted = await CACHE.LicenseCache.getLicenseByEnum(COMMON.eLicense.eRestricted) ?? null;

        if (!this.licenseCC0 || !this.licenseDownload || !this.licenseView || !this.licenseRestricted) {
            RK.logError(RK.LogSection.eTEST,'assign licenses','unable to fetch cached licenses',{},'Tests.DB.ObjectGraph.Setup');
            return false;
        }

        if (!this.idSOUnit1 || !this.idSOUnit2 || !this.idSOProject1 || !this.idSOSubject1 ||
            !this.idSOSubject2 || !this.idSOSubject4 || !this.idSOItem1 || !this.idSOItem2 ||
            !this.idSOCaptureData1 || !this.idSOCaptureData2 || !this.user1) {
            RK.logError(RK.LogSection.eTEST,'assign licenses','unable to fetch objects',{},'Tests.DB.ObjectGraph.Setup');
            return false;
        }

        const now: Date = new Date();
        const lastYear: Date = new Date(now.getFullYear() - 1, 1, 1);
        const nextYear: Date = new Date(now.getFullYear() + 1, 1, 1);

        await DBAPI.LicenseManager.setAssignment(this.idSOUnit1, this.licenseCC0);
        await DBAPI.LicenseManager.setAssignment(this.idSOUnit2, this.licenseCC0);
        await DBAPI.LicenseManager.setAssignment(this.idSOProject1, this.licenseRestricted, this.user1.idUser);
        await DBAPI.LicenseManager.setAssignment(this.idSOSubject1, this.licenseDownload, this.user1.idUser, null, null);
        await DBAPI.LicenseManager.setAssignment(this.idSOSubject2, this.licenseView, this.user1.idUser, lastYear, null);
        await DBAPI.LicenseManager.setAssignment(this.idSOItem2, this.licenseRestricted, this.user1.idUser, null, lastYear); // not active
        await DBAPI.LicenseManager.setAssignment(this.idSOCaptureData1, this.licenseCC0, this.user1.idUser, lastYear, nextYear);
        await DBAPI.LicenseManager.clearAssignment(this.idSOCaptureData1);
        await DBAPI.LicenseManager.clearAssignment(this.idSOCaptureData1, false);
        await DBAPI.LicenseManager.clearAssignment(this.idSOCaptureData1, true);
        await DBAPI.LicenseManager.setAssignment(this.idSOCaptureData1, this.licenseCC0, this.user1.idUser, lastYear, nextYear);
        return true;
    }

    private static async fetchSystemObjectID(SOBased: DBAPI.SystemObjectBased | null): Promise<number | null> {
        expect(SOBased).toBeTruthy();
        if (!SOBased)
            return null;
        const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
        expect(SO).toBeTruthy();
        return SO ? SO.idSystemObject : null;
    }

    static async testObjectGraphFetch(SOBased: DBAPI.SystemObjectBased | null, eMode: DBAPI.eObjectGraphMode,
        expectValidHierarchy: boolean = true, expectNoCycles: boolean = true, maxDepth: number = 32): Promise<DBAPI.ObjectGraph | null> {
        const SO: DBAPI.SystemObject | null = SOBased ? await SOBased.fetchSystemObject() : null;
        expect(SO).toBeTruthy();
        if (!SO)
            return null;

        const OA: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(SO.idSystemObject, eMode, maxDepth);
        const OAFetched: boolean = await OA.fetch();
        expect(OAFetched).toBeTruthy();
        if (!OAFetched)
            return null;
        expect(expectValidHierarchy ? OA.validHierarchy : !OA.validHierarchy).toBeTruthy();
        expect(expectNoCycles ? OA.noCycles : !OA.noCycles).toBeTruthy();
        return OA;
    }
}