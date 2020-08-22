import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as UTIL from '../api';
// import * as LOG from '../../utils/logger';

afterAll(async done => {
    done();
});

let user1: DBAPI.User;
let unit1: DBAPI.Unit;
let unit2: DBAPI.Unit;
let project1: DBAPI.Project;
let subject1: DBAPI.Subject;
let subject2: DBAPI.Subject;
let subject3: DBAPI.Subject;
let subject4: DBAPI.Subject;
let item1: DBAPI.Item;
let item2: DBAPI.Item;
let item3: DBAPI.Item;
let item4: DBAPI.Item;
let captureData1: DBAPI.CaptureData;
let model1: DBAPI.Model;
let model2: DBAPI.Model;
let model3: DBAPI.Model;
let model4: DBAPI.Model;
let scene1: DBAPI.Scene;
let asset1: DBAPI.Asset;
let asset2: DBAPI.Asset;
let asset3: DBAPI.Asset;
let asset4: DBAPI.Asset;
let asset5: DBAPI.Asset;
let asset6: DBAPI.Asset;
let asset7: DBAPI.Asset;
let asset8: DBAPI.Asset;
let assetVersion1: DBAPI.AssetVersion;
let assetVersion2: DBAPI.AssetVersion;
let assetVersion3a: DBAPI.AssetVersion;
let assetVersion3b: DBAPI.AssetVersion;
let assetVersion3c: DBAPI.AssetVersion;
let assetVersion4: DBAPI.AssetVersion;
let assetVersion5: DBAPI.AssetVersion;
let assetVersion6: DBAPI.AssetVersion;
let assetVersion7: DBAPI.AssetVersion;
let assetVersion8: DBAPI.AssetVersion;
let projectDocumentation1: DBAPI.ProjectDocumentation;
let v1: DBAPI.Vocabulary | undefined;

// *******************************************************************
// DB Composite ObjectAncestry
// *******************************************************************
describe('DB Composite ObjectAncestry Setup', () => {
    test('DB Composite DB Object Creation', async () => {
        v1 = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eIdentifierIdentifierTypeARK);
        expect(v1).toBeTruthy();
        if (!v1)
            return;

        user1 = await UTIL.createUserTest({ Name: 'OA Test', EmailAddress: 'oatest@si.edu', SecurityID: 'OA Test', Active: true, DateActivated: UTIL.nowCleansed(), DateDisabled: null, WorkflowNotificationTime: UTIL.nowCleansed(), EmailSettings: 0, idUser: 0 });

        unit1 = await UTIL.createUnitTest({ Name: 'DPO', Abbreviation: 'DPO', ARKPrefix: 'http://dpo/', idUnit: 0 });
        unit2 = await UTIL.createUnitTest({ Name: 'NMNH', Abbreviation: 'NMNH', ARKPrefix: 'http://nmnh/', idUnit: 0 });
        project1 = await UTIL.createProjectTest({ Name: 'OA Test', Description: 'OA Test', idProject: 0 });

        asset1 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion1 = await UTIL.createAssetVersionTest({ idAsset: asset1.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        subject1 = await UTIL.createSubjectTest({ idUnit: unit1.idUnit, idAssetThumbnail: asset1.idAsset, idGeoLocation: null, Name: 'OA Test', idIdentifierPreferred: null, idSubject: 0 });
        subject2 = await UTIL.createSubjectTest({ idUnit: unit1.idUnit, idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', idIdentifierPreferred: null, idSubject: 0 });
        subject3 = await UTIL.createSubjectTest({ idUnit: unit2.idUnit, idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', idIdentifierPreferred: null, idSubject: 0 });
        subject4 = await UTIL.createSubjectTest({ idUnit: unit2.idUnit, idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', idIdentifierPreferred: null, idSubject: 0 });

        asset2 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion2 = await UTIL.createAssetVersionTest({ idAsset: asset2.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        item1 = await UTIL.createItemTest({ idAssetThumbnail: asset2.idAsset, idGeoLocation: null, Name: 'OA Test', EntireSubject: true, idItem: 0 });
        item2 = await UTIL.createItemTest({ idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', EntireSubject: true, idItem: 0 });
        item3 = await UTIL.createItemTest({ idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', EntireSubject: true, idItem: 0 });
        item4 = await UTIL.createItemTest({ idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', EntireSubject: true, idItem: 0 });

        asset3 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion3a = await UTIL.createAssetVersionTest({ idAsset: asset3.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        assetVersion3b = await UTIL.createAssetVersionTest({ idAsset: asset3.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        assetVersion3c = await UTIL.createAssetVersionTest({ idAsset: asset3.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        captureData1 = await UTIL.createCaptureDataTest({ idVCaptureMethod: v1.idVocabulary, DateCaptured: UTIL.nowCleansed(), Description: 'OA Test', idAssetThumbnail: null, idCaptureData: 0 });

        asset4 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion4 = await UTIL.createAssetVersionTest({ idAsset: asset4.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        model1 = await UTIL.createModelTest({ DateCreated: UTIL.nowCleansed(), idVCreationMethod: v1.idVocabulary, Master: true, Authoritative: true, idVModality: v1.idVocabulary,  idVUnits: v1.idVocabulary, idVPurpose: v1.idVocabulary, idAssetThumbnail: null, idModel: 0 });

        asset5 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion5 = await UTIL.createAssetVersionTest({ idAsset: asset5.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        model2 = await UTIL.createModelTest({ DateCreated: UTIL.nowCleansed(), idVCreationMethod: v1.idVocabulary, Master: true, Authoritative: true, idVModality: v1.idVocabulary,  idVUnits: v1.idVocabulary, idVPurpose: v1.idVocabulary, idAssetThumbnail: null, idModel: 0 });

        asset6 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion6 = await UTIL.createAssetVersionTest({ idAsset: asset6.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        model3 = await UTIL.createModelTest({ DateCreated: UTIL.nowCleansed(), idVCreationMethod: v1.idVocabulary, Master: true, Authoritative: true, idVModality: v1.idVocabulary,  idVUnits: v1.idVocabulary, idVPurpose: v1.idVocabulary, idAssetThumbnail: null, idModel: 0 });

        asset7 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion7 = await UTIL.createAssetVersionTest({ idAsset: asset7.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        model4 = await UTIL.createModelTest({ DateCreated: UTIL.nowCleansed(), idVCreationMethod: v1.idVocabulary, Master: true, Authoritative: true, idVModality: v1.idVocabulary,  idVUnits: v1.idVocabulary, idVPurpose: v1.idVocabulary, idAssetThumbnail: null, idModel: 0 });

        asset8 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion8 = await UTIL.createAssetVersionTest({ idAsset: asset8.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        scene1 = await UTIL.createSceneTest({ Name: 'OA Test', idAssetThumbnail: null, IsOriented: true, HasBeenQCd: true, idScene: 0 });

        projectDocumentation1 = await UTIL.createProjectDocumentationTest({ idProject: project1.idProject, Name: 'OA Test', Description: 'OA Test', idProjectDocumentation: 0 });
    });

    test('DB Composite DB Object Wiring', async () => {
        await UTIL.createXrefUnitProject(unit1, project1);
        await UTIL.createXrefUnitProject(unit2, project1);
        // Unit-Subject is defined via Subject.idUnit
        await UTIL.createXrefProjectSubject(project1, subject2);
        await UTIL.createXrefProjectSubject(project1, subject3);
        await UTIL.createXrefProjectSubject(project1, subject4);
        await UTIL.createXrefSubjectItem(subject1, item1);
        await UTIL.createXrefSubjectItem(subject1, item2);
        await UTIL.createXrefSubjectItem(subject2, item3);
        await UTIL.createXrefSubjectItem(subject2, item4);
        await UTIL.createXrefSubjectItem(subject4, item4);
        await UTIL.createXrefItemCaptureData(item1, captureData1);
        await UTIL.createXrefItemModel(item1, model1);
        await UTIL.createXrefItemScene(item1, scene1);
        await UTIL.createXrefCaptureDataModel(captureData1, model1);
        await UTIL.createXrefModelModel(model1, model2);
        await UTIL.createXrefModelModel(model1, model3);
        await UTIL.createXrefModelModel(model1, model4);
        await UTIL.createXrefSceneModel(scene1, model2);
        await UTIL.createXrefSceneModel(scene1, model3);
        await UTIL.createXrefSceneModel(scene1, model4);

        // asset1; Thumbnail for subject1
        // asset2; Thumbnail for item1
        await UTIL.createXrefCaptureDataAsset(captureData1, asset3);
        await UTIL.createXrefModelAsset(model1, asset4);
        await UTIL.createXrefModelAsset(model2, asset5);
        await UTIL.createXrefModelAsset(model3, asset6);
        await UTIL.createXrefModelAsset(model4, asset7);
        await UTIL.createXrefSceneAsset(scene1, asset8);

        // Asset-AssetVersion is defined via AssetVersion.idAsset
        assetVersion1;
        assetVersion2;
        assetVersion3a;
        assetVersion3b;
        assetVersion3c;
        assetVersion4;
        assetVersion5;
        assetVersion6;
        assetVersion7;
        assetVersion8;

        // Project-ProjectDocumentation is defined via ProjectDocumentation.idProject
        projectDocumentation1;
    });

    test('DB Composite ObjectAncestry', async () => {
        
    });

});
