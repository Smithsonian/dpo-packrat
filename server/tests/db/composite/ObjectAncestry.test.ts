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
let projectDocumentation1: DBAPI.ProjectDocumentation;
let asset1: DBAPI.Asset;
let asset2: DBAPI.Asset;
let asset3: DBAPI.Asset;
let asset4: DBAPI.Asset;
let asset5: DBAPI.Asset;
let asset6: DBAPI.Asset;
let asset7: DBAPI.Asset;
let asset8: DBAPI.Asset;
let asset9: DBAPI.Asset;
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
let assetVersion9: DBAPI.AssetVersion;
let v1: DBAPI.Vocabulary | undefined;

// *******************************************************************
// DB Composite ObjectAncestry
// *******************************************************************
describe('DB Composite ObjectAncestry Setup', () => {
    test('DB Composite DB Object Creation', async () => {
        let assigned: boolean = true;
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
        assigned = await asset1.assignOwner(subject1); expect(assigned).toBeTruthy();
        subject2 = await UTIL.createSubjectTest({ idUnit: unit1.idUnit, idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', idIdentifierPreferred: null, idSubject: 0 });
        subject3 = await UTIL.createSubjectTest({ idUnit: unit2.idUnit, idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', idIdentifierPreferred: null, idSubject: 0 });
        subject4 = await UTIL.createSubjectTest({ idUnit: unit2.idUnit, idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', idIdentifierPreferred: null, idSubject: 0 });

        asset2 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion2 = await UTIL.createAssetVersionTest({ idAsset: asset2.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        item1 = await UTIL.createItemTest({ idAssetThumbnail: asset2.idAsset, idGeoLocation: null, Name: 'OA Test', EntireSubject: true, idItem: 0 });
        assigned = await asset2.assignOwner(item1); expect(assigned).toBeTruthy();
        item2 = await UTIL.createItemTest({ idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', EntireSubject: true, idItem: 0 });
        item3 = await UTIL.createItemTest({ idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', EntireSubject: true, idItem: 0 });
        item4 = await UTIL.createItemTest({ idAssetThumbnail: null, idGeoLocation: null, Name: 'OA Test', EntireSubject: true, idItem: 0 });

        asset3 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion3a = await UTIL.createAssetVersionTest({ idAsset: asset3.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        assetVersion3b = await UTIL.createAssetVersionTest({ idAsset: asset3.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        assetVersion3c = await UTIL.createAssetVersionTest({ idAsset: asset3.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        captureData1 = await UTIL.createCaptureDataTest({ idVCaptureMethod: v1.idVocabulary, DateCaptured: UTIL.nowCleansed(), Description: 'OA Test', idAssetThumbnail: null, idCaptureData: 0 });
        assigned = await asset3.assignOwner(captureData1); expect(assigned).toBeTruthy();

        asset4 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion4 = await UTIL.createAssetVersionTest({ idAsset: asset4.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        model1 = await UTIL.createModelTest({ DateCreated: UTIL.nowCleansed(), idVCreationMethod: v1.idVocabulary, Master: true, Authoritative: true, idVModality: v1.idVocabulary,  idVUnits: v1.idVocabulary, idVPurpose: v1.idVocabulary, idAssetThumbnail: null, idModel: 0 });
        assigned = await asset4.assignOwner(model1); expect(assigned).toBeTruthy();

        asset5 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion5 = await UTIL.createAssetVersionTest({ idAsset: asset5.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        model2 = await UTIL.createModelTest({ DateCreated: UTIL.nowCleansed(), idVCreationMethod: v1.idVocabulary, Master: true, Authoritative: true, idVModality: v1.idVocabulary,  idVUnits: v1.idVocabulary, idVPurpose: v1.idVocabulary, idAssetThumbnail: null, idModel: 0 });
        assigned = await asset5.assignOwner(model2); expect(assigned).toBeTruthy();

        asset6 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion6 = await UTIL.createAssetVersionTest({ idAsset: asset6.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        model3 = await UTIL.createModelTest({ DateCreated: UTIL.nowCleansed(), idVCreationMethod: v1.idVocabulary, Master: true, Authoritative: true, idVModality: v1.idVocabulary,  idVUnits: v1.idVocabulary, idVPurpose: v1.idVocabulary, idAssetThumbnail: null, idModel: 0 });
        assigned = await asset6.assignOwner(model3); expect(assigned).toBeTruthy();

        asset7 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion7 = await UTIL.createAssetVersionTest({ idAsset: asset7.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        model4 = await UTIL.createModelTest({ DateCreated: UTIL.nowCleansed(), idVCreationMethod: v1.idVocabulary, Master: true, Authoritative: true, idVModality: v1.idVocabulary,  idVUnits: v1.idVocabulary, idVPurpose: v1.idVocabulary, idAssetThumbnail: null, idModel: 0 });
        assigned = await asset7.assignOwner(model4); expect(assigned).toBeTruthy();

        asset8 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion8 = await UTIL.createAssetVersionTest({ idAsset: asset8.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        scene1 = await UTIL.createSceneTest({ Name: 'OA Test', idAssetThumbnail: null, IsOriented: true, HasBeenQCd: true, idScene: 0 });
        assigned = await asset8.assignOwner(scene1); expect(assigned).toBeTruthy();

        asset9 = await UTIL.createAssetTest({ FileName: 'OA Test', FilePath: '/OA Test', idAssetGroup: null, idVAssetType: v1.idVocabulary, idSystemObject: null, StorageKey: UTIL.randomStorageKey('/'), idAsset: 0 });
        assetVersion9 = await UTIL.createAssetVersionTest({ idAsset: asset9.idAsset, idUserCreator: user1.idUser, DateCreated: UTIL.nowCleansed(), StorageChecksum: 'OA Test', StorageSize: 500, idAssetVersion: 0, Ingested: true, Version: 0 });
        projectDocumentation1 = await UTIL.createProjectDocumentationTest({ idProject: project1.idProject, Name: 'OA Test', Description: 'OA Test', idProjectDocumentation: 0 });
        assigned = await asset9.assignOwner(projectDocumentation1); expect(assigned).toBeTruthy();
    });

    test('DB Composite DB Object Wiring', async () => {
        await UTIL.createXref(unit1, project1);
        await UTIL.createXref(unit2, project1);
        // Unit-Subject is defined via Subject.idUnit
        await UTIL.createXref(project1, subject2);
        await UTIL.createXref(project1, subject3);
        await UTIL.createXref(project1, subject4);
        await UTIL.createXref(subject1, item1);
        await UTIL.createXref(subject1, item2);
        await UTIL.createXref(subject2, item3);
        await UTIL.createXref(subject2, item4);
        await UTIL.createXref(subject4, item4);
        await UTIL.createXref(item1, captureData1);
        await UTIL.createXref(item1, model1);
        await UTIL.createXref(item1, scene1);
        await UTIL.createXref(captureData1, model1);
        await UTIL.createXref(model1, model2);
        await UTIL.createXref(model1, model3);
        await UTIL.createXref(model1, model4);
        await UTIL.createXref(scene1, model2);
        await UTIL.createXref(scene1, model3);
        await UTIL.createXref(scene1, model4);

        // XXX-asset relationships defined via Asset.idSystemObject
        // asset1; Thumbnail for subject1
        // asset2; Thumbnail for item1
        // await UTIL.createXref(captureData1, asset3);
        // await UTIL.createXref(model1, asset4);
        // await UTIL.createXref(model2, asset5);
        // await UTIL.createXref(model3, asset6);
        // await UTIL.createXref(model4, asset7);
        // await UTIL.createXref(scene1, asset8);

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
        assetVersion9;

        // Project-ProjectDocumentation is defined via ProjectDocumentation.idProject
    });

    test('DB Composite ObjectAncestry ProjectDocumentation', async () => {
        const OA: DBAPI.ObjectAncestry | null = await testObjectAncestryFetch(projectDocumentation1);
        if (OA) {
            expect(OA.projectDocumentation).toBeTruthy();
            if (OA.projectDocumentation)
                expect(OA.projectDocumentation).toEqual(expect.arrayContaining([projectDocumentation1]));
            expect(OA.project).toBeTruthy();
            if (OA.project)
                expect(OA.project).toEqual(expect.arrayContaining([project1]));
            expect(OA.unit).toBeTruthy();
            if (OA.unit)
                expect(OA.unit).toEqual(expect.arrayContaining([unit1, unit2]));
            expect(OA.subject).toBeFalsy();
            expect(OA.item).toBeFalsy();
            expect(OA.captureData).toBeFalsy();
            expect(OA.model).toBeFalsy();
            expect(OA.scene).toBeFalsy();
            expect(OA.intermediaryFile).toBeFalsy();
            expect(OA.asset).toBeFalsy();
            expect(OA.assetVersion).toBeFalsy();
            expect(OA.actor).toBeFalsy();
            expect(OA.stakeholder).toBeFalsy();
            expect(OA.workflow).toBeFalsy();
            expect(OA.workflowStep).toBeFalsy();

            /*
            expect(OA.unit).toBeFalsy();
            expect(OA.project).toBeFalsy();
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
            expect(OA.stakeholder).toBeFalsy();
            expect(OA.workflow).toBeFalsy();
            expect(OA.workflowStep).toBeFalsy();
            */
        }
    });
});

async function testObjectAncestryFetch(SOBased: DBAPI.SystemObjectBased): Promise<DBAPI.ObjectAncestry | null> {
    const SO: DBAPI.SystemObject | null = await SOBased.fetchSystemObject();
    expect(SO).toBeTruthy();
    if (!SO)
        return null;

    const OA: DBAPI.ObjectAncestry = new DBAPI.ObjectAncestry(SO.idSystemObject);
    const OAFetched: boolean = await OA.fetch();
    expect(OAFetched).toBeTruthy();
    if (!OAFetched)
        return null;
    expect(OA.validHierarchy).toBeTruthy();
    expect(OA.noCycles).toBeTruthy();
    return OA;
}