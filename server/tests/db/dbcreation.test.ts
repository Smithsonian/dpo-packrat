import * as DBAPI from '../../db';
import * as DBC from '../../db/connection';
import * as LOG from '../../utils/logger';
import * as UTIL from './api';
import { VocabularyCache, eVocabularyID } from '../../cache';

afterAll(async done => {
    await DBC.DBConnection.disconnect();
    await DBC.DBConnection.disconnect(); // second time to test disconnecting after already being disconnected!
    LOG.getRequestLogger(); // added for full test coverage!
    done();
});

let accessAction: DBAPI.AccessAction | null;
let accessAction2: DBAPI.AccessAction | null;
let accessContext: DBAPI.AccessContext | null;
let accessRole: DBAPI.AccessRole | null;
let accessPolicy: DBAPI.AccessPolicy | null;
let accessContextObject: DBAPI.AccessContextObject | null;
let accessRoleAccessActionXref: DBAPI.AccessRoleAccessActionXref | null;
let accessRoleAccessActionXref2: DBAPI.AccessRoleAccessActionXref | null;
let actorWithUnit: DBAPI.Actor | null;
let actorWithOutUnit: DBAPI.Actor | null;
let assetGroup: DBAPI.AssetGroup | null;
let assetGroup2: DBAPI.AssetGroup | null;
let assetThumbnail: DBAPI.Asset | null;
let assetWithoutAG: DBAPI.Asset | null;
let assetBulkIngest: DBAPI.Asset | null;
let assetVersion: DBAPI.AssetVersion | null;
let assetVersion2: DBAPI.AssetVersion | null;
let assetVersionNotIngested: DBAPI.AssetVersion | null;
let captureData: DBAPI.CaptureData | null;
let captureDataNulls: DBAPI.CaptureData | null;
let captureDataFile: DBAPI.CaptureDataFile | null;
let captureDataGroup: DBAPI.CaptureDataGroup | null;
let captureDataGroupCaptureDataXref: DBAPI.CaptureDataGroupCaptureDataXref | null;
let captureDataGroupCaptureDataXref2: DBAPI.CaptureDataGroupCaptureDataXref | null;
let captureDataPhoto: DBAPI.CaptureDataPhoto | null;
let captureDataPhotoNulls: DBAPI.CaptureDataPhoto | null;
let geoLocation: DBAPI.GeoLocation | null;
const identifierValue: string = 'Test Identifier ' + UTIL.randomStorageKey('');
let identifier: DBAPI.Identifier | null;
let identifierNull: DBAPI.Identifier | null;
let identifierSubjectHookup: DBAPI.Identifier | null;
let intermediaryFile: DBAPI.IntermediaryFile | null;
let item: DBAPI.Item | null;
let itemNulls: DBAPI.Item | null;
let job: DBAPI.Job | null;
let jobTask: DBAPI.JobTask | null;
let jobTaskCook: DBAPI.JobTaskCook | null;
let metadata: DBAPI.Metadata | null;
let metadataNull: DBAPI.Metadata | null;
let model: DBAPI.Model | null;
let modelNulls: DBAPI.Model | null;
let modelGeometryFile: DBAPI.ModelGeometryFile | null;
let modelGeometryFileNulls: DBAPI.ModelGeometryFile | null;
let modelProcessingAction: DBAPI.ModelProcessingAction | null;
let modelProcessingActionStep: DBAPI.ModelProcessingActionStep | null;
let modelSceneXref: DBAPI.ModelSceneXref | null;
let modelSceneXrefNull: DBAPI.ModelSceneXref | null;
let modelUVMapChannel: DBAPI.ModelUVMapChannel | null;
let modelUVMapFile: DBAPI.ModelUVMapFile | null;
let license: DBAPI.License | null;
let licenseAssignment: DBAPI.LicenseAssignment | null;
let licenseAssignmentNull: DBAPI.LicenseAssignment | null;
let project: DBAPI.Project | null;
let project2: DBAPI.Project | null;
let projectDocumentation: DBAPI.ProjectDocumentation | null;
let scene: DBAPI.Scene | null;
let sceneNulls: DBAPI.Scene | null;
let stakeholder: DBAPI.Stakeholder | null;
let subject: DBAPI.Subject | null;
let subjectNulls: DBAPI.Subject | null;
let systemObjectAsset: DBAPI.SystemObject | null;
let systemObjectItem: DBAPI.SystemObject | null;
let systemObjectItemNulls: DBAPI.SystemObject | null;
let systemObjectScene: DBAPI.SystemObject | null;
let systemObjectSubject: DBAPI.SystemObject | null;
let systemObjectSubjectNulls: DBAPI.SystemObject | null;
let systemObjectVersion: DBAPI.SystemObjectVersion | null;
let systemObjectXref: DBAPI.SystemObjectXref | null;
let systemObjectXref2: DBAPI.SystemObjectXref | null;
let systemObjectXrefSubItem1: DBAPI.SystemObjectXref | null;
let systemObjectXrefSubItem2: DBAPI.SystemObjectXref | null;
let systemObjectXrefSubItem3: DBAPI.SystemObjectXref | null;
let systemObjectXrefSubItem4: DBAPI.SystemObjectXref | null;
let systemObjectXrefProjectSubject1: DBAPI.SystemObjectXref | null;
let systemObjectXrefProjectSubject2: DBAPI.SystemObjectXref | null;
let systemObjectXrefUnitProject1: DBAPI.SystemObjectXref | null;
let systemObjectXrefUnitProject2: DBAPI.SystemObjectXref | null;
let systemObjectXrefItemCaptureData1: DBAPI.SystemObjectXref | null;
let systemObjectXrefItemCaptureData2: DBAPI.SystemObjectXref | null;
let systemObjectXrefItemModel1: DBAPI.SystemObjectXref | null;
let systemObjectXrefItemModel2: DBAPI.SystemObjectXref | null;
let systemObjectXrefItemScene1: DBAPI.SystemObjectXref | null;
let systemObjectXrefItemScene2: DBAPI.SystemObjectXref | null;
let systemObjectXrefProjectStakeholder1: DBAPI.SystemObjectXref | null;
let systemObjectXrefProjectStakeholder2: DBAPI.SystemObjectXref | null;
let systemObjectXrefItemIntermediaryFile1: DBAPI.SystemObjectXref | null;
let systemObjectXrefItemIntermediaryFile2: DBAPI.SystemObjectXref | null;
let unit: DBAPI.Unit | null;
let unit2: DBAPI.Unit | null;
let unitEdan: DBAPI.UnitEdan | null;
let unitEdan2: DBAPI.UnitEdan | null;
let user: DBAPI.User | null;
let userPersonalizationSystemObject: DBAPI.UserPersonalizationSystemObject | null;
let userPersonalizationUrl: DBAPI.UserPersonalizationUrl | null;
let vocabulary: DBAPI.Vocabulary | null;
let vocabulary2: DBAPI.Vocabulary | null;
let vocabularySet: DBAPI.VocabularySet | null;
let workflow: DBAPI.Workflow | null;
let workflowNulls: DBAPI.Workflow | null;
let workflowStep: DBAPI.WorkflowStep | null;
let workflowStepSystemObjectXref: DBAPI.WorkflowStepSystemObjectXref | null;
let workflowStepSystemObjectXref2: DBAPI.WorkflowStepSystemObjectXref | null;
let workflowTemplate: DBAPI.WorkflowTemplate | null;

// *******************************************************************
// DB Creation Test Suite
// *******************************************************************
describe('DB Creation Test Suite', () => {
    test('DB Creation: VocabularySet', async () => {
        vocabularySet = new DBAPI.VocabularySet({
            Name: 'Test Vocabulary Set',
            SystemMaintained: false,
            idVocabularySet: 0
        });
        expect(vocabularySet).toBeTruthy();
        if (vocabularySet) {
            expect(await vocabularySet.create()).toBeTruthy();
            expect(vocabularySet.idVocabularySet).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Vocabulary', async () => {
        if (vocabularySet)
            vocabulary = new DBAPI.Vocabulary({
                idVocabularySet: vocabularySet.idVocabularySet,
                SortOrder: 0,
                Term: 'Test Vocabulary',
                idVocabulary: 0
            });
        expect(vocabulary).toBeTruthy();
        if (vocabulary) {
            expect(await vocabulary.create()).toBeTruthy();
            expect(vocabulary.idVocabulary).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Vocabulary 2', async () => {
        if (vocabularySet)
            vocabulary2 = new DBAPI.Vocabulary({
                idVocabularySet: vocabularySet.idVocabularySet,
                SortOrder: 0,
                Term: 'Test Vocabulary 2',
                idVocabulary: 0
            });
        expect(vocabulary2).toBeTruthy();
        if (vocabulary2) {
            expect(await vocabulary2.create()).toBeTruthy();
            expect(vocabulary2.idVocabulary).toBeGreaterThan(0);
        }
    });

    test('DB Creation: AssetGroup', async () => {
        assetGroup = new DBAPI.AssetGroup({ idAssetGroup: 0 });
        expect(assetGroup).toBeTruthy();
        if (assetGroup) {
            expect(await assetGroup.create()).toBeTruthy();
            expect(assetGroup.idAssetGroup).toBeGreaterThan(0);
        }

        assetGroup2 = new DBAPI.AssetGroup({ idAssetGroup: 0 });
        expect(assetGroup2).toBeTruthy();
        if (assetGroup2) {
            expect(await assetGroup2.create()).toBeTruthy();
            expect(assetGroup2.idAssetGroup).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Asset', async () => {
        if (assetGroup && vocabulary)
            assetThumbnail = await UTIL.createAssetTest({
                FileName: 'Test Asset Thumbnail',
                FilePath: '/test/asset/path',
                idAssetGroup: assetGroup.idAssetGroup,
                idVAssetType: vocabulary.idVocabulary,
                idSystemObject: null,
                StorageKey: UTIL.randomStorageKey('/test/asset/path/'),
                idAsset: 0
            });
        expect(assetThumbnail).toBeTruthy();
    });

    test('DB Creation: Asset', async () => {
        const vocabBulkIngest: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabularyID.eAssetAssetTypeBulkIngestion);
        expect(vocabBulkIngest).toBeTruthy();
        if (vocabBulkIngest)
            assetBulkIngest = await UTIL.createAssetTest({
                FileName: 'Test Asset Thumbnail',
                FilePath: '/test/asset/path',
                idAssetGroup: null,
                idVAssetType: vocabBulkIngest.idVocabulary,
                idSystemObject: null,
                StorageKey: UTIL.randomStorageKey('/test/asset/path/'),
                idAsset: 0
            });
        expect(assetBulkIngest).toBeTruthy();
    });

    test('DB Creation: GeoLocation', async () => {
        geoLocation = new DBAPI.GeoLocation({
            Latitude: 0,
            Longitude: 0,
            Altitude: 0,
            TS0: 0,
            TS1: 0,
            TS2: 0,
            R0: 0,
            R1: 0,
            R2: 0,
            R3: 0,
            idGeoLocation: 0
        });
        expect(geoLocation).toBeTruthy();
        if (geoLocation) {
            expect(await geoLocation.create()).toBeTruthy();
            expect(geoLocation.idGeoLocation).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Unit', async () => {
        unit = await UTIL.createUnitTest({
            Name: 'DPO',
            Abbreviation: 'DPO',
            ARKPrefix: 'http://abbadabbadoo/',
            idUnit: 0
        });

        unit2 = await UTIL.createUnitTest({
            Name: 'DPO2',
            Abbreviation: 'DPO2',
            ARKPrefix: 'http://abbadabbadoo2/',
            idUnit: 0
        });
    });

    test('DB Creation: UnitEdan', async () => {
        if (unit)
            unitEdan = await UTIL.createUnitEdanTest({
                idUnit: unit.idUnit,
                Abbreviation: UTIL.randomStorageKey(''),
                idUnitEdan: 0
            });
        expect(unitEdan).toBeTruthy();

        unitEdan2 = await UTIL.createUnitEdanTest({
            idUnit: null,
            Abbreviation: UTIL.randomStorageKey(''),
            idUnitEdan: 0
        });
    });

    test('DB Creation: User', async () => {
        user = await UTIL.createUserTest({
            Name: 'Test User',
            EmailAddress: 'test@si.edu',
            SecurityID: 'SECURITY_ID',
            Active: true,
            DateActivated: UTIL.nowCleansed(),
            DateDisabled: null,
            WorkflowNotificationTime: UTIL.nowCleansed(),
            EmailSettings: 0,
            idUser: 0
        });
        expect(user).toBeTruthy();
    });

    test('DB Creation: Identifier Subject Hookup', async () => {
        if (vocabulary)
            identifierSubjectHookup = new DBAPI.Identifier({
                IdentifierValue: 'Test Identifier Null 2',
                idVIdentifierType: vocabulary.idVocabulary,
                idSystemObject: null,
                idIdentifier: 0
            });
        expect(identifierSubjectHookup).toBeTruthy();
        if (identifierSubjectHookup) {
            expect(await identifierSubjectHookup.create()).toBeTruthy();
            expect(identifierSubjectHookup.idIdentifier).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Subject', async () => {
        if (unit && assetThumbnail && geoLocation && identifierSubjectHookup)
            subject = await UTIL.createSubjectTest({
                idUnit: unit.idUnit,
                idAssetThumbnail: assetThumbnail.idAsset,
                idGeoLocation: geoLocation.idGeoLocation,
                Name: 'Test Subject',
                idIdentifierPreferred: identifierSubjectHookup.idIdentifier,
                idSubject: 0
            });
        expect(subject).toBeTruthy();
    });

    test('DB Creation: Fetch System Object Subject', async() => {
        systemObjectSubject = subject ? await subject.fetchSystemObject() : null;
        expect(systemObjectSubject).toBeTruthy();
        expect(systemObjectSubject ? systemObjectSubject.idSubject : -1).toBe(subject ? subject.idSubject : -2);
    });

    test('DB Creation: Update Identifier with Subject', async() => {
        if (systemObjectSubject && identifierSubjectHookup) {
            identifierSubjectHookup.idSystemObject = systemObjectSubject.idSystemObject;
            expect(await identifierSubjectHookup.update()).toBeTruthy();

            const identifierFetch: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(identifierSubjectHookup.idIdentifier);
            expect(identifierFetch).toBeTruthy();
            if (identifierFetch)
                expect(identifierFetch.idSystemObject).toBe(systemObjectSubject.idSystemObject);
        }
    });

    test('DB Creation: Subject With Nulls', async () => {
        if (unit2)
            subjectNulls = await UTIL.createSubjectTest({
                idUnit: unit2.idUnit,
                idAssetThumbnail: null,
                idGeoLocation: null,
                Name: 'Test Subject Nulls',
                idIdentifierPreferred: null,
                idSubject: 0
            });
        expect(subjectNulls).toBeTruthy();
    });

    test('DB Creation: WorkflowTemplate', async () => {
        workflowTemplate = await UTIL.createWorkflowTemplateTest({
            Name: 'Test Workflow Template',
            idWorkflowTemplate: 0
        });
        expect(workflowTemplate).toBeTruthy();
    });

    test('DB Creation: Scene', async () => {
        if (assetThumbnail)
            scene = await UTIL.createSceneTest({
                Name: 'Test Scene',
                idAssetThumbnail: assetThumbnail.idAsset,
                IsOriented: true,
                HasBeenQCd: true,
                idScene: 0
            });
        expect(scene).toBeTruthy();
    });

    test('DB Creation: Scene With Nulls', async () => {
        sceneNulls = await UTIL.createSceneTest({
            Name: 'Test Scene',
            idAssetThumbnail: null,
            IsOriented: true,
            HasBeenQCd: true,
            idScene: 0
        });
        expect(sceneNulls).toBeTruthy();
    });

    test('DB Creation: Fetch System Object Subject 2', async() => {
        systemObjectSubjectNulls = subjectNulls ? await subjectNulls.fetchSystemObject() : null;
        expect(systemObjectSubjectNulls).toBeTruthy();
        expect(systemObjectSubjectNulls ? systemObjectSubjectNulls.idSubject : -1).toBe(subjectNulls ? subjectNulls.idSubject : -2);
    });

    test('DB Creation: Fetch System Object Scene', async() => {
        systemObjectScene = scene ? await scene.fetchSystemObject() : null;
        expect(systemObjectScene).toBeTruthy();
        expect(systemObjectScene ? systemObjectScene.idScene : -1).toBe(scene ? scene.idScene : -2);
    });

    test('DB Creation: Fetch System Object Asset', async() => {
        systemObjectAsset = assetThumbnail ? await assetThumbnail.fetchSystemObject() : null;
        expect(systemObjectAsset).toBeTruthy();
        expect(systemObjectAsset ? systemObjectAsset.idAsset : -1).toBe(assetThumbnail ? assetThumbnail.idAsset : -2);
    });

    // *************************************************************************
    // Makes use of objects created above
    // *************************************************************************
    test('DB Creation: AccessAction', async () => {
        accessAction = new DBAPI.AccessAction({
            Name: 'Test AccessAction',
            SortOrder: 0,
            idAccessAction: 0
        });

        expect(await accessAction.create()).toBeTruthy();
        expect(accessAction.idAccessAction).toBeGreaterThan(0);
    });

    test('DB Creation: AccessAction 2', async () => {
        accessAction2 = new DBAPI.AccessAction({
            Name: 'Test AccessAction 2',
            SortOrder: 0,
            idAccessAction: 0
        });

        expect(await accessAction2.create()).toBeTruthy();
        expect(accessAction2.idAccessAction).toBeGreaterThan(0);
    });

    test('DB Creation: AccessContext', async () => {
        accessContext = new DBAPI.AccessContext(
            { Global: false, Authoritative: false, CaptureData: false, Model: false, Scene: false, IntermediaryFile: false, idAccessContext: 0 }
        );
        expect(await accessContext.create()).toBeTruthy();
        expect(accessContext.idAccessContext).toBeGreaterThan(0);
    });

    test('DB Creation: AccessRole', async () => {
        accessRole = new DBAPI.AccessRole({
            Name: 'Test AccessRole',
            idAccessRole: 0
        });

        expect(await accessRole.create()).toBeTruthy();
        expect(accessRole.idAccessRole).toBeGreaterThan(0);
    });

    test('DB Creation: AccessPolicy', async () => {
        if (user && accessRole && accessContext) {
            accessPolicy = new DBAPI.AccessPolicy({
                idUser: user.idUser,
                idAccessRole: accessRole.idAccessRole,
                idAccessContext: accessContext.idAccessContext,
                idAccessPolicy: 0
            });
            expect(await accessPolicy.create()).toBeTruthy();
        }
        expect(accessPolicy).toBeTruthy();
        if (accessPolicy)
            expect(accessPolicy.idAccessPolicy).toBeGreaterThan(0);
    });

    test('DB Creation: AccessContextObject', async () => {
        if (systemObjectScene && accessContext)
            accessContextObject = new DBAPI.AccessContextObject({
                idAccessContext: accessContext.idAccessContext,
                idSystemObject: systemObjectScene.idSystemObject,
                idAccessContextObject: 0
            });
        expect(accessContextObject).toBeTruthy();
        if (accessContextObject) {
            expect(await accessContextObject.create()).toBeTruthy();
            expect(accessContextObject.idAccessContextObject).toBeGreaterThan(0);
        }
    });

    test('DB Creation: AccessRoleAccessActionXref', async () => {
        if (accessRole && accessAction)
            accessRoleAccessActionXref = new DBAPI.AccessRoleAccessActionXref({
                idAccessRole: accessRole.idAccessRole,
                idAccessAction: accessAction.idAccessAction,
                idAccessRoleAccessActionXref: 0
            });
        expect(accessRoleAccessActionXref).toBeTruthy();
        if (accessRoleAccessActionXref) {
            expect(await accessRoleAccessActionXref.create()).toBeTruthy();
            expect(accessRoleAccessActionXref.idAccessRoleAccessActionXref).toBeGreaterThan(0);
        }
    });

    test('DB Creation: AccessRoleAccessActionXref 2', async () => {
        if (accessRole && accessAction2)
            accessRoleAccessActionXref2 = new DBAPI.AccessRoleAccessActionXref({
                idAccessRole: accessRole.idAccessRole,
                idAccessAction: accessAction2.idAccessAction,
                idAccessRoleAccessActionXref: 0
            });
        expect(accessRoleAccessActionXref2).toBeTruthy();
        if (accessRoleAccessActionXref2) {
            expect(await accessRoleAccessActionXref2.create()).toBeTruthy();
            expect(accessRoleAccessActionXref2.idAccessRoleAccessActionXref).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Actor With Unit', async () => {
        if (unit)
            actorWithUnit = await UTIL.createActorTest({
                IndividualName: 'Test Actor Name',
                OrganizationName: 'Test Actor Org',
                idUnit:  unit.idUnit,
                idActor: 0
            });
        expect(actorWithUnit).toBeTruthy();
    });

    test('DB Creation: Actor Without Unit', async () => {
        actorWithOutUnit = await UTIL.createActorTest({
            IndividualName: 'Test Actor Name',
            OrganizationName: 'Test Actor Org',
            idUnit: null,
            idActor: 0
        });
        expect(actorWithOutUnit).toBeTruthy();
    });

    test('DB Creation: Asset Without Asset Group', async () => {
        if (vocabulary&& systemObjectSubject)
            assetWithoutAG = await UTIL.createAssetTest({
                FileName: 'Test Asset 2',
                FilePath: '/test/asset/path2',
                idAssetGroup: null,
                idVAssetType: vocabulary.idVocabulary,
                idSystemObject: systemObjectSubject.idSystemObject,
                StorageKey: UTIL.randomStorageKey('/test/asset/path/'),
                idAsset: 0
            });
        expect(assetWithoutAG).toBeTruthy();
    });

    test('DB Creation: AssetVersion', async () => {
        if (assetThumbnail && user)
            assetVersion = await UTIL.createAssetVersionTest({
                idAsset: assetThumbnail.idAsset,
                Version: 0,
                FileName: assetThumbnail.FilePath,
                idUserCreator: user.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum',
                StorageSize: 50,
                StorageKeyStaging: '',
                Ingested: true,
                idAssetVersion: 0
            });
        expect(assetVersion).toBeTruthy();
    });

    test('DB Creation: AssetVersion Not Ingested', async () => {
        if (assetThumbnail && user)
            assetVersionNotIngested = await UTIL.createAssetVersionTest({
                idAsset: assetThumbnail.idAsset,
                Version: 0,
                FileName: assetThumbnail.FilePath,
                idUserCreator: user.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum',
                StorageSize: 50,
                StorageKeyStaging: '',
                Ingested: false,
                idAssetVersion: 0
            });
        expect(assetVersionNotIngested).toBeTruthy();
    });

    test('DB Creation: CaptureData', async () => {
        if (vocabulary && assetThumbnail)
            captureData = await UTIL.createCaptureDataTest({
                idVCaptureMethod: vocabulary.idVocabulary,
                DateCaptured: UTIL.nowCleansed(),
                Description: 'Test Capture Data',
                idAssetThumbnail: assetThumbnail.idAsset,
                idCaptureData: 0
            });
        expect(captureData).toBeTruthy();
    });

    test('DB Creation: CaptureData With Nulls', async () => {
        if (vocabulary)
            captureDataNulls = await UTIL.createCaptureDataTest({
                idVCaptureMethod: vocabulary.idVocabulary,
                DateCaptured: UTIL.nowCleansed(),
                Description: 'Test Capture Data Nulls',
                idAssetThumbnail: null,
                idCaptureData: 0
            });
        expect(captureDataNulls).toBeTruthy();
    });

    test('DB Creation: CaptureDataFile', async () => {
        if (captureData && assetThumbnail && vocabulary)
            captureDataFile = new DBAPI.CaptureDataFile({
                idCaptureDataFile: 0,
                CompressedMultipleFiles: false,
                idAsset: assetThumbnail.idAsset,
                idCaptureData: captureData.idCaptureData,
                idVVariantType!: vocabulary.idVocabulary
            });
        expect(captureDataFile).toBeTruthy();
        if (captureDataFile) {
            expect(await captureDataFile.create()).toBeTruthy();
            expect(captureDataFile.idCaptureDataFile).toBeGreaterThan(0);
        }
    });

    test('DB Creation: CaptureDataGroup', async () => {
        captureDataGroup = new DBAPI.CaptureDataGroup({ idCaptureDataGroup: 0 });
        expect(captureDataGroup).toBeTruthy();
        if (captureDataGroup) {
            expect(await captureDataGroup.create()).toBeTruthy();
            expect(captureDataGroup.idCaptureDataGroup).toBeGreaterThan(0);
        }
    });

    test('DB Creation: CaptureDataGroupCaptureDataXref', async () => {
        if (captureDataGroup && captureData)
            captureDataGroupCaptureDataXref = new DBAPI.CaptureDataGroupCaptureDataXref({
                idCaptureDataGroup: captureDataGroup.idCaptureDataGroup,
                idCaptureData: captureData.idCaptureData,
                idCaptureDataGroupCaptureDataXref: 0
            });
        expect(captureDataGroupCaptureDataXref).toBeTruthy();
        if (captureDataGroupCaptureDataXref) {
            expect(await captureDataGroupCaptureDataXref.create()).toBeTruthy();
            expect(captureDataGroupCaptureDataXref.idCaptureDataGroupCaptureDataXref).toBeGreaterThan(0);
        }
    });

    test('DB Creation: CaptureDataGroupCaptureDataXref 2', async () => {
        if (captureDataGroup && captureDataNulls)
            captureDataGroupCaptureDataXref2 = new DBAPI.CaptureDataGroupCaptureDataXref({
                idCaptureDataGroup: captureDataGroup.idCaptureDataGroup,
                idCaptureData: captureDataNulls.idCaptureData,
                idCaptureDataGroupCaptureDataXref: 0
            });
        expect(captureDataGroupCaptureDataXref2).toBeTruthy();
        if (captureDataGroupCaptureDataXref2) {
            expect(await captureDataGroupCaptureDataXref2.create()).toBeTruthy();
            expect(captureDataGroupCaptureDataXref2.idCaptureDataGroupCaptureDataXref).toBeGreaterThan(0);
        }
    });

    test('DB Creation: CaptureDataPhoto', async () => {
        if (captureData && vocabulary)
            captureDataPhoto = new DBAPI.CaptureDataPhoto({
                idVCaptureDatasetType: vocabulary.idVocabulary,
                CaptureDatasetFieldID: 0,
                idVItemPositionType: vocabulary.idVocabulary,
                ItemPositionFieldID: 0,
                ItemArrangementFieldID: 0,
                idVFocusType: vocabulary.idVocabulary,
                idVLightSourceType: vocabulary.idVocabulary,
                idVBackgroundRemovalMethod: vocabulary.idVocabulary,
                idVClusterType: vocabulary.idVocabulary,
                ClusterGeometryFieldID: 0,
                CameraSettingsUniform: false,
                idCaptureData: captureData.idCaptureData,
                idCaptureDataPhoto: 0
            });
        expect(captureDataPhoto).toBeTruthy();
        if (captureDataPhoto) {
            expect(await captureDataPhoto.create()).toBeTruthy();
            expect(captureDataPhoto.idCaptureDataPhoto).toBeGreaterThan(0);
        }
    });

    test('DB Creation: CaptureDataPhoto Nulls', async () => {
        if (captureData && vocabulary)
            captureDataPhotoNulls = new DBAPI.CaptureDataPhoto({
                idVCaptureDatasetType: vocabulary.idVocabulary,
                CaptureDatasetFieldID: 0,
                idVItemPositionType: null,
                ItemPositionFieldID: 0,
                ItemArrangementFieldID: 0,
                idVFocusType: null,
                idVLightSourceType: null,
                idVBackgroundRemovalMethod: null,
                idVClusterType: null,
                ClusterGeometryFieldID: 0,
                CameraSettingsUniform: false,
                idCaptureData: captureData.idCaptureData,
                idCaptureDataPhoto: 0
            });
        expect(captureDataPhotoNulls).toBeTruthy();
        if (captureDataPhotoNulls) {
            expect(await captureDataPhotoNulls.create()).toBeTruthy();
            expect(captureDataPhotoNulls.idCaptureDataPhoto).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Identifier', async () => {
        if (systemObjectSubject && vocabulary)
            identifier = new DBAPI.Identifier({
                IdentifierValue: identifierValue,
                idVIdentifierType: vocabulary.idVocabulary,
                idSystemObject: systemObjectSubject.idSystemObject,
                idIdentifier: 0
            });
        expect(identifier).toBeTruthy();
        if (identifier) {
            expect(await identifier.create()).toBeTruthy();
            expect(identifier.idIdentifier).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Identifier With Nulls', async () => {
        if (vocabulary)
            identifierNull = new DBAPI.Identifier({
                IdentifierValue: 'Test Identifier Null',
                idVIdentifierType: vocabulary.idVocabulary,
                idSystemObject: null,
                idIdentifier: 0
            });
        expect(identifierNull).toBeTruthy();
        if (identifierNull) {
            expect(await identifierNull.create()).toBeTruthy();
            expect(identifierNull.idIdentifier).toBeGreaterThan(0);
        }
    });

    test('DB Creation: IntermediaryFile', async () => {
        if (assetThumbnail)
            intermediaryFile = await UTIL.createIntermediaryFileTest({
                idAsset: assetThumbnail.idAsset,
                DateCreated: UTIL.nowCleansed(),
                idIntermediaryFile: 0
            });
        expect(intermediaryFile).toBeTruthy();
    });

    test('DB Creation: Item', async () => {
        if (assetThumbnail && geoLocation)
            item = await UTIL.createItemTest({
                idAssetThumbnail: assetThumbnail.idAsset,
                idGeoLocation: geoLocation.idGeoLocation,
                Name: 'Test Item',
                EntireSubject: true,
                idItem: 0
            });
        expect(item).toBeTruthy();
    });

    test('DB Creation: Item With Nulls', async () => {
        itemNulls = await UTIL.createItemTest({
            idAssetThumbnail: null,
            idGeoLocation: null,
            Name: 'Test Item Nulls',
            EntireSubject: true,
            idItem: 0
        });
        expect(itemNulls).toBeTruthy();
    });

    test('DB Creation: Fetch System Object Item', async() => {
        systemObjectItem = item ? await item.fetchSystemObject() : null;
        expect(systemObjectItem).toBeTruthy();
        expect(systemObjectItem ? systemObjectItem.idItem : -1).toBe(item ? item.idItem : -2);
    });

    test('DB Creation: Fetch System Object Item Nulls', async() => {
        systemObjectItemNulls = itemNulls ? await itemNulls.fetchSystemObject() : null;
        expect(systemObjectItemNulls).toBeTruthy();
        expect(systemObjectItemNulls ? systemObjectItemNulls.idItem : -1).toBe(itemNulls ? itemNulls.idItem : -2);
    });

    test('DB Creation: Job', async () => {
        job = new DBAPI.Job({
            Name: 'Test Job',
            idJob: 0
        });
        expect(job).toBeTruthy();
        if (job) {
            expect(await job.create()).toBeTruthy();
            expect(job.idJob).toBeGreaterThan(0);
        }
    });

    test('DB Creation: JobTask', async () => {
        if (job && vocabulary)
            jobTask = new DBAPI.JobTask({
                idJob: job.idJob,
                idVJobType: vocabulary.idVocabulary,
                State: 'Test Job State',
                Step: 'Test Job State',
                Error: 'Test Job Error',
                Parameters: 'Test Job Parameters',
                Report: 'Test Job Report',
                idJobTask: 0
            });
        expect(jobTask).toBeTruthy();
        if (jobTask) {
            expect(await jobTask.create()).toBeTruthy();
            expect(jobTask.idJobTask).toBeGreaterThan(0);
        }
    });

    test('DB Creation: JobTaskCook', async () => {
        if (jobTask)
            jobTaskCook = new DBAPI.JobTaskCook({
                idJobTask: jobTask.idJobTask,
                JobID: 'Test JobID',
                RecipeID: 'Test Recipe ID',
                idJobTaskCook: 0
            });
        expect(jobTaskCook).toBeTruthy();
        if (jobTaskCook) {
            expect(await jobTaskCook.create()).toBeTruthy();
            expect(jobTaskCook.idJobTaskCook).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Metadata', async () => {
        if (assetThumbnail && user && vocabulary && systemObjectScene)
            metadata = new DBAPI.Metadata({
                Name: 'Test Metadata',
                ValueShort: 'Test Value Short',
                ValueExtended: 'Test Value Ext',
                idAssetValue: assetThumbnail.idAsset,
                idUser: user.idUser,
                idVMetadataSource: vocabulary.idVocabulary,
                idSystemObject: systemObjectScene.idSystemObject,
                idMetadata: 0,
            });
        expect(metadata).toBeTruthy();
        if (metadata) {
            expect(await metadata.create()).toBeTruthy();
            expect(metadata.idMetadata).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Metadata With Nulls', async () => {
        metadataNull = new DBAPI.Metadata({
            Name: 'Test Metadata',
            ValueShort: null,
            ValueExtended: null,
            idAssetValue: null,
            idUser: null,
            idVMetadataSource: null,
            idSystemObject: null,
            idMetadata: 0,
        });
        expect(metadataNull).toBeTruthy();
        if (metadataNull) {
            expect(await metadataNull.create()).toBeTruthy();
            expect(metadataNull.idMetadata).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Model', async () => {
        if (vocabulary && assetThumbnail)
            model = await UTIL.createModelTest({
                DateCreated: UTIL.nowCleansed(),
                idVCreationMethod: vocabulary.idVocabulary,
                Master: true,
                Authoritative: true,
                idVModality: vocabulary.idVocabulary,
                idVUnits: vocabulary.idVocabulary,
                idVPurpose: vocabulary.idVocabulary,
                idAssetThumbnail: assetThumbnail.idAsset,
                idModel: 0
            });
        expect(model).toBeTruthy();
    });

    test('DB Creation: Model With Nulls', async () => {
        if (vocabulary)
            modelNulls = await UTIL.createModelTest({
                DateCreated: UTIL.nowCleansed(),
                idVCreationMethod: vocabulary.idVocabulary,
                Master: true,
                Authoritative: true,
                idVModality: vocabulary.idVocabulary,
                idVUnits: vocabulary.idVocabulary,
                idVPurpose: vocabulary.idVocabulary,
                idAssetThumbnail: null,
                idModel: 0
            });
        expect(modelNulls).toBeTruthy();
    });

    test('DB Creation: ModelGeometryFile', async () => {
        if (model && assetThumbnail && vocabulary)
            modelGeometryFile = new DBAPI.ModelGeometryFile({
                idModel: model.idModel,
                idAsset: assetThumbnail.idAsset,
                idVModelFileType: vocabulary.idVocabulary,
                Roughness: 0, Metalness: 0, PointCount: 0, FaceCount: 0, IsWatertight: false, HasNormals: false, HasVertexColor: false, HasUVSpace: false,
                BoundingBoxP1X: 0, BoundingBoxP1Y: 0, BoundingBoxP1Z: 0, BoundingBoxP2X: 0, BoundingBoxP2Y: 0, BoundingBoxP2Z: 0,
                idModelGeometryFile: 0
            });
        expect(modelGeometryFile).toBeTruthy();
        if (modelGeometryFile) {
            expect(await modelGeometryFile.create()).toBeTruthy();
            expect(modelGeometryFile.idModelGeometryFile).toBeGreaterThan(0);
        }
    });

    test('DB Creation: ModelGeometryFile With Nulls', async () => {
        if (model && assetThumbnail && vocabulary)
            modelGeometryFileNulls = new DBAPI.ModelGeometryFile({
                idModel: model.idModel,
                idAsset: assetThumbnail.idAsset,
                idVModelFileType: vocabulary.idVocabulary,
                Roughness: null, Metalness: null, PointCount: null, FaceCount: null, IsWatertight: null, HasNormals: null, HasVertexColor: null, HasUVSpace: null,
                BoundingBoxP1X: null, BoundingBoxP1Y: null, BoundingBoxP1Z: null, BoundingBoxP2X: null, BoundingBoxP2Y: null, BoundingBoxP2Z: null,
                idModelGeometryFile: 0
            });
        expect(modelGeometryFileNulls).toBeTruthy();
        if (modelGeometryFileNulls) {
            expect(await modelGeometryFileNulls.create()).toBeTruthy();
            expect(modelGeometryFileNulls.idModelGeometryFile).toBeGreaterThan(0);
        }
    });

    test('DB Creation: ModelProcessingAction', async () => {
        if (model && actorWithUnit)
            modelProcessingAction = new DBAPI.ModelProcessingAction({
                idModel: model.idModel,
                idActor: actorWithUnit.idActor,
                DateProcessed: UTIL.nowCleansed(),
                ToolsUsed: 'Test Model Processing Action',
                Description: 'Test Model Processing Action Description',
                idModelProcessingAction: 0
            });
        expect(modelProcessingAction).toBeTruthy();
        if (modelProcessingAction) {
            expect(await modelProcessingAction.create()).toBeTruthy();
            expect(modelProcessingAction.idModelProcessingAction).toBeGreaterThan(0);
        }
    });

    test('DB Creation: ModelProcessingActionStep', async () => {
        if (modelProcessingAction && vocabulary)
            modelProcessingActionStep = new DBAPI.ModelProcessingActionStep({
                idModelProcessingAction: modelProcessingAction.idModelProcessingAction,
                idVActionMethod: vocabulary.idVocabulary,
                Description: 'Test Model Processing Action Step',
                idModelProcessingActionStep: 0
            });
        expect(modelProcessingActionStep).toBeTruthy();
        if (modelProcessingActionStep) {
            expect(await modelProcessingActionStep.create()).toBeTruthy();
            expect(modelProcessingActionStep.idModelProcessingActionStep).toBeGreaterThan(0);
        }
    });

    test('DB Creation: ModelSceneXref', async () => {
        if (model && scene)
            modelSceneXref = new DBAPI.ModelSceneXref({
                idModel: model.idModel,
                idScene: scene.idScene,
                TS0: 0, TS1: 0, TS2: 0, R0: 0, R1: 0, R2: 0, R3: 0,
                idModelSceneXref: 0
            });
        expect(modelSceneXref).toBeTruthy();
        if (modelSceneXref) {
            expect(await modelSceneXref.create()).toBeTruthy();
            expect(modelSceneXref.idModelSceneXref).toBeGreaterThan(0);
        }
    });

    test('DB Creation: ModelSceneXref With Nulls', async () => {
        if (model && sceneNulls)
            modelSceneXrefNull = new DBAPI.ModelSceneXref({
                idModel: model.idModel,
                idScene: sceneNulls.idScene,
                TS0: null, TS1: null, TS2: null, R0: null, R1: null, R2: null, R3: null,
                idModelSceneXref: 0
            });
        expect(modelSceneXrefNull).toBeTruthy();
        if (modelSceneXrefNull) {
            expect(await modelSceneXrefNull.create()).toBeTruthy();
            expect(modelSceneXrefNull.idModelSceneXref).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Project', async () => {
        project = await UTIL.createProjectTest({
            Name: 'Test Project',
            Description: 'Test',
            idProject: 0,
        });

        project2 = await UTIL.createProjectTest({
            Name: 'Test Project 2',
            Description: 'Test',
            idProject: 0,
        });
    });

    test('DB Creation: SystemObjectVersion', async () => {
        if (systemObjectScene) {
            systemObjectVersion = new DBAPI.SystemObjectVersion({
                idSystemObject: systemObjectScene.idSystemObject,
                PublishedState: 0,
                idSystemObjectVersion: 0
            });
        }
        expect(systemObjectVersion).toBeTruthy();
        if (systemObjectVersion) {
            expect(await systemObjectVersion.create()).toBeTruthy();
            expect(systemObjectVersion.idSystemObjectVersion).toBeGreaterThan(0);
        }
    });

    test('DB Creation: SystemObjectXref', async () => {
        if (systemObjectSubject && systemObjectScene) {
            systemObjectXref = new DBAPI.SystemObjectXref({
                idSystemObjectMaster: systemObjectSubject.idSystemObject,
                idSystemObjectDerived: systemObjectScene.idSystemObject,
                idSystemObjectXref: 0
            });
        }
        expect(systemObjectXref).toBeTruthy();
        if (systemObjectXref) {
            expect(await systemObjectXref.create()).toBeTruthy();
            expect(systemObjectXref.idSystemObjectXref).toBeGreaterThan(0);
        }
    });

    test('DB Creation: SystemObjectXref 2', async () => {
        if (systemObjectSubject && systemObjectAsset) {
            systemObjectXref2 = new DBAPI.SystemObjectXref({
                idSystemObjectMaster: systemObjectSubject.idSystemObject,
                idSystemObjectDerived: systemObjectAsset.idSystemObject,
                idSystemObjectXref: 0
            });
        }
        expect(systemObjectXref2).toBeTruthy();
        if (systemObjectXref2) {
            expect(await systemObjectXref2.create()).toBeTruthy();
            expect(systemObjectXref2.idSystemObjectXref).toBeGreaterThan(0);
        }
    });

    test('DB Creation: SystemObjectXref Subject-Item 1/3', async () => {
        if (subject && subjectNulls && item) {
            systemObjectXrefSubItem1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subject, item);
            systemObjectXrefSubItem3 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subjectNulls, item);
        }
        expect(systemObjectXrefSubItem1).toBeTruthy();
        if (systemObjectXrefSubItem1)
            expect(systemObjectXrefSubItem1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefSubItem3).toBeTruthy();
        if (systemObjectXrefSubItem3)
            expect(systemObjectXrefSubItem3.idSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectXref Subject-Item 1/3 Wire Second Time', async () => {
        if (subject && subjectNulls && item) {
            systemObjectXrefSubItem1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subject, item);
            systemObjectXrefSubItem3 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subjectNulls, item);
        }
        expect(systemObjectXrefSubItem1).toBeTruthy();
        if (systemObjectXrefSubItem1)
            expect(systemObjectXrefSubItem1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefSubItem3).toBeTruthy();
        if (systemObjectXrefSubItem3)
            expect(systemObjectXrefSubItem3.idSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectXref Subject-Item 2/4', async () => {
        if (subject && subjectNulls && itemNulls) {
            systemObjectXrefSubItem2 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subject, itemNulls);
            systemObjectXrefSubItem4 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subjectNulls, itemNulls);
        }
        expect(systemObjectXrefSubItem2).toBeTruthy();
        if (systemObjectXrefSubItem2)
            expect(systemObjectXrefSubItem2.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefSubItem4).toBeTruthy();
        if (systemObjectXrefSubItem4)
            expect(systemObjectXrefSubItem4.idSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectXref Project-Subject & Unit-Project', async () => {
        if (subject && subjectNulls && project && project2) {
            systemObjectXrefProjectSubject1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(project, subject);
            systemObjectXrefProjectSubject2 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(project2, subjectNulls);
        }

        if (project && project2 && unit && unit2) {
            systemObjectXrefUnitProject1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(unit, project);
            systemObjectXrefUnitProject2 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(unit2, project2);
        }

        expect(systemObjectXrefProjectSubject1).toBeTruthy();
        if (systemObjectXrefProjectSubject1)
            expect(systemObjectXrefProjectSubject1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefProjectSubject2).toBeTruthy();
        if (systemObjectXrefProjectSubject2)
            expect(systemObjectXrefProjectSubject2.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefUnitProject1).toBeTruthy();
        if (systemObjectXrefUnitProject1)
            expect(systemObjectXrefUnitProject1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefUnitProject2).toBeTruthy();
        if (systemObjectXrefUnitProject2)
            expect(systemObjectXrefUnitProject2.idSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: ModelUVMapFile', async () => {
        if (modelGeometryFile && assetThumbnail)
            modelUVMapFile = new DBAPI.ModelUVMapFile({
                idModelGeometryFile: modelGeometryFile.idModelGeometryFile,
                idAsset: assetThumbnail.idAsset,
                UVMapEdgeLength: 0,
                idModelUVMapFile: 0
            });
        expect(modelUVMapFile).toBeTruthy();
        if (modelUVMapFile) {
            expect(await modelUVMapFile.create()).toBeTruthy();
            expect(modelUVMapFile.idModelUVMapFile).toBeGreaterThan(0);
        }
    });

    test('DB Creation: ModelUVMapChannel', async () => {
        if (modelUVMapFile && vocabulary)
            modelUVMapChannel = new DBAPI.ModelUVMapChannel({
                idModelUVMapFile: modelUVMapFile.idModelUVMapFile,
                ChannelPosition: 0, ChannelWidth: 1,
                idVUVMapType: vocabulary.idVocabulary,
                idModelUVMapChannel: 0
            });
        expect(modelUVMapChannel).toBeTruthy();
        if (modelUVMapChannel) {
            expect(await modelUVMapChannel.create()).toBeTruthy();
            expect(modelUVMapChannel.idModelUVMapChannel).toBeGreaterThan(0);
        }
    });

    test('DB Creation: License', async () => {
        license = new DBAPI.License({
            Name: 'Test License',
            Description: 'Test License Description',
            idLicense: 0
        });
        expect(license).toBeTruthy();
        if (license) {
            expect(await license.create()).toBeTruthy();
            expect(license.idLicense).toBeGreaterThan(0);
        }
    });

    test('DB Creation: LicenseAssignment', async () => {
        if (license && user && systemObjectSubject)
            licenseAssignment = new DBAPI.LicenseAssignment({
                idLicense: license.idLicense,
                idUserCreator: user.idUser,
                DateStart: UTIL.nowCleansed(),
                DateEnd: UTIL.nowCleansed(),
                idSystemObject: systemObjectSubject.idSystemObject,
                idLicenseAssignment: 0
            });
        expect(licenseAssignment).toBeTruthy();
        if (licenseAssignment) {
            expect(await licenseAssignment.create()).toBeTruthy();
            expect(licenseAssignment.idLicenseAssignment).toBeGreaterThan(0);
        }
    });

    test('DB Creation: LicenseAssignment With Nulls', async () => {
        if (license)
            licenseAssignmentNull = new DBAPI.LicenseAssignment({
                idLicense: license.idLicense,
                idUserCreator: null,
                DateStart: null,
                DateEnd: null,
                idSystemObject: null,
                idLicenseAssignment: 0
            });
        expect(licenseAssignmentNull).toBeTruthy();
        if (licenseAssignmentNull) {
            expect(await licenseAssignmentNull.create()).toBeTruthy();
            expect(licenseAssignmentNull.idLicenseAssignment).toBeGreaterThan(0);
        }
    });

    test('DB Creation: ProjectDocumentation', async () => {
        if (project)
            projectDocumentation = await UTIL.createProjectDocumentationTest({
                idProject: project.idProject,
                Name: 'Test Project Documentation',
                Description: 'Test Description',
                idProjectDocumentation: 0
            });
        expect(projectDocumentation).toBeTruthy();
    });

    test('DB Creation: Stakeholder', async () => {
        stakeholder = await UTIL.createStakeholderTest({
            IndividualName: 'Test Stakeholder Name',
            OrganizationName: 'Test Stakeholder Org',
            EmailAddress: 'Test Email',
            PhoneNumberMobile: 'Test Phone Mobile',
            PhoneNumberOffice: 'Test Phone Office',
            MailingAddress: 'Test Mailing Address',
            idStakeholder: 0
        });
        expect(stakeholder).toBeTruthy();
        if (stakeholder) {
            expect(await stakeholder.create()).toBeTruthy();
            expect(stakeholder.idStakeholder).toBeGreaterThan(0);
        }
    });

    test('DB Creation: UserPersonalizationSystemObject', async () => {
        if (systemObjectSubject && user)
            userPersonalizationSystemObject = new DBAPI.UserPersonalizationSystemObject({
                idUser: user.idUser,
                idSystemObject: systemObjectSubject.idSystemObject,
                Personalization: 'Test Personalization',
                idUserPersonalizationSystemObject: 0
            });
        expect(userPersonalizationSystemObject).toBeTruthy();
        if (userPersonalizationSystemObject) {
            expect(await userPersonalizationSystemObject.create()).toBeTruthy();
            expect(userPersonalizationSystemObject.idUserPersonalizationSystemObject).toBeGreaterThan(0);
        }
    });

    test('DB Creation: UserPersonalizationUrl', async () => {
        if (user)
            userPersonalizationUrl = new DBAPI.UserPersonalizationUrl({
                idUser: user.idUser,
                URL: '/test/personalization/Url',
                Personalization: 'Test Personalization',
                idUserPersonalizationUrl: 0
            });
        expect(userPersonalizationUrl).toBeTruthy();
        if (userPersonalizationUrl) {
            expect(await userPersonalizationUrl.create()).toBeTruthy();
            expect(userPersonalizationUrl.idUserPersonalizationUrl).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Workflow', async () => {
        if (workflowTemplate && project && user)
            workflow = await UTIL.createWorkflowTest({
                idWorkflowTemplate: workflowTemplate.idWorkflowTemplate,
                idProject: project.idProject,
                idUserInitiator: user.idUser,
                DateInitiated: UTIL.nowCleansed(),
                DateUpdated: UTIL.nowCleansed(),
                idWorkflow: 0
            });
        expect(workflow).toBeTruthy();
        if (workflow) {
            expect(await workflow.create()).toBeTruthy();
            expect(workflow.idWorkflow).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Workflow With Nulls', async () => {
        if (workflowTemplate)
            workflowNulls = await UTIL.createWorkflowTest({
                idWorkflowTemplate: workflowTemplate.idWorkflowTemplate,
                idProject: null,
                idUserInitiator: null,
                DateInitiated: UTIL.nowCleansed(),
                DateUpdated: UTIL.nowCleansed(),
                idWorkflow: 0
            });
        expect(workflowNulls).toBeTruthy();
        if (workflowNulls) {
            expect(await workflowNulls.create()).toBeTruthy();
            expect(workflowNulls.idWorkflow).toBeGreaterThan(0);
        }
    });

    test('DB Creation: WorkflowStep', async () => {
        if (workflow && user && vocabulary)
            workflowStep = await UTIL.createWorkflowStepTest({
                idWorkflow: workflow.idWorkflow,
                idUserOwner: user.idUser,
                idVWorkflowStepType: vocabulary.idVocabulary,
                State: 0,
                DateCreated: UTIL.nowCleansed(),
                DateCompleted: UTIL.nowCleansed(),
                idWorkflowStep: 0
            });
        expect(workflowStep).toBeTruthy();
        if (workflowStep) {
            expect(await workflowStep.create()).toBeTruthy();
            expect(workflowStep.idWorkflowStep).toBeGreaterThan(0);
        }
    });

    test('DB Creation: WorkflowStepSystemObjectXref', async () => {
        if (systemObjectScene && workflowStep)
            workflowStepSystemObjectXref = new DBAPI.WorkflowStepSystemObjectXref({
                idWorkflowStep: workflowStep.idWorkflowStep,
                idSystemObject: systemObjectScene.idSystemObject,
                Input: false,
                idWorkflowStepSystemObjectXref: 0
            });
        expect(workflowStepSystemObjectXref).toBeTruthy();
        if (workflowStepSystemObjectXref) {
            expect(await workflowStepSystemObjectXref.create()).toBeTruthy();
            expect(workflowStepSystemObjectXref.idWorkflowStepSystemObjectXref).toBeGreaterThan(0);
        }

        if (systemObjectSubject && workflowStep)
            workflowStepSystemObjectXref2 = new DBAPI.WorkflowStepSystemObjectXref({
                idWorkflowStep: workflowStep.idWorkflowStep,
                idSystemObject: systemObjectSubject.idSystemObject,
                Input: false,
                idWorkflowStepSystemObjectXref: 0
            });
        expect(workflowStepSystemObjectXref2).toBeTruthy();
        if (workflowStepSystemObjectXref2) {
            expect(await workflowStepSystemObjectXref2.create()).toBeTruthy();
            expect(workflowStepSystemObjectXref2.idWorkflowStepSystemObjectXref).toBeGreaterThan(0);
        }
    });

    test('DB Creation: SystemObjectXref Item-CaptureData/Model/Scene/IntermediaryFile', async () => {
        if (item && itemNulls && captureData && captureDataNulls && model && modelNulls && scene && sceneNulls && intermediaryFile) {
            systemObjectXrefItemCaptureData1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(item, captureData);
            systemObjectXrefItemCaptureData2 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemNulls, captureDataNulls);
            systemObjectXrefItemModel1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(item, model);
            systemObjectXrefItemModel2 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemNulls, modelNulls);
            systemObjectXrefItemScene1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(item, scene);
            systemObjectXrefItemScene2 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemNulls, sceneNulls);
            systemObjectXrefItemIntermediaryFile1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(item, intermediaryFile);
            systemObjectXrefItemIntermediaryFile2 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(itemNulls, intermediaryFile);
        }
        expect(systemObjectXrefItemCaptureData1).toBeTruthy();
        if (systemObjectXrefItemCaptureData1)
            expect(systemObjectXrefItemCaptureData1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefItemCaptureData2).toBeTruthy();
        if (systemObjectXrefItemCaptureData2)
            expect(systemObjectXrefItemCaptureData2.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefItemModel1).toBeTruthy();
        if (systemObjectXrefItemModel1)
            expect(systemObjectXrefItemModel1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefItemModel2).toBeTruthy();
        if (systemObjectXrefItemModel2)
            expect(systemObjectXrefItemModel2.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefItemScene1).toBeTruthy();
        if (systemObjectXrefItemScene1)
            expect(systemObjectXrefItemScene1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefItemScene2).toBeTruthy();
        if (systemObjectXrefItemScene2)
            expect(systemObjectXrefItemScene2.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefItemIntermediaryFile1).toBeTruthy();
        if (systemObjectXrefItemIntermediaryFile1)
            expect(systemObjectXrefItemIntermediaryFile1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefItemIntermediaryFile2).toBeTruthy();
        if (systemObjectXrefItemIntermediaryFile2)
            expect(systemObjectXrefItemIntermediaryFile2.idSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectXref Project-Stakeholder', async () => {
        if (project && project2 && stakeholder) {
            systemObjectXrefProjectStakeholder1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(project, stakeholder);
            systemObjectXrefProjectStakeholder2 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(project2, stakeholder);
        }
        expect(systemObjectXrefProjectStakeholder1).toBeTruthy();
        if (systemObjectXrefProjectStakeholder1)
            expect(systemObjectXrefProjectStakeholder1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefProjectStakeholder2).toBeTruthy();
        if (systemObjectXrefProjectStakeholder2)
            expect(systemObjectXrefProjectStakeholder2.idSystemObjectXref).toBeGreaterThan(0);
    });
});

// *******************************************************************
// DB Fetch By ID Test Suite
// *******************************************************************
describe('DB Fetch By ID Test Suite', () => {
    test('DB Fetch By ID: AccessAction', async () => {
        let accessActionFetch: DBAPI.AccessAction | null = null;
        if (accessAction) {
            accessActionFetch = await DBAPI.AccessAction.fetch(accessAction.idAccessAction);
            if (accessActionFetch) {
                expect(accessActionFetch).toMatchObject(accessAction);
                expect(accessAction).toMatchObject(accessActionFetch);
            }
        }
        expect(accessActionFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AccessContext', async () => {
        let accessContextFetch: DBAPI.AccessContext | null = null;
        if (accessContext) {
            accessContextFetch = await DBAPI.AccessContext.fetch(accessContext.idAccessContext);
            if (accessContextFetch) {
                expect(accessContextFetch).toMatchObject(accessContext);
                expect(accessContext).toMatchObject(accessContextFetch);
            }
        }
        expect(accessContextFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AccessContextObject', async () => {
        let accessContextObjectFetch: DBAPI.AccessContextObject | null = null;
        if (accessContextObject) {
            accessContextObjectFetch = await DBAPI.AccessContextObject.fetch(accessContextObject.idAccessContextObject);
            if (accessContextObjectFetch) {
                expect(accessContextObjectFetch).toMatchObject(accessContextObject);
                expect(accessContextObject).toMatchObject(accessContextObjectFetch);
            }
        }
        expect(accessContextObjectFetch).toBeTruthy();
    });

    test('DB Fetch AccessContext: AccessContextObject.fetchFromAccessContext', async () => {
        let accessContextObjectFetch: DBAPI.AccessContextObject[] | null = null;
        if (accessContext) {
            accessContextObjectFetch = await DBAPI.AccessContextObject.fetchFromAccessContext(accessContext.idAccessContext);
            if (accessContextObjectFetch) {
                expect(accessContextObjectFetch).toEqual(expect.arrayContaining([accessContextObject]));
            }
        }
        expect(accessContextObjectFetch).toBeTruthy();
    });

    test('DB Fetch AccessContext: AccessContextObject.fetchFromSystemObject', async () => {
        let accessContextObjectFetch: DBAPI.AccessContextObject[] | null = null;
        if (systemObjectScene) {
            accessContextObjectFetch = await DBAPI.AccessContextObject.fetchFromSystemObject(systemObjectScene.idSystemObject);
            if (accessContextObjectFetch) {
                expect(accessContextObjectFetch).toEqual(expect.arrayContaining([accessContextObject]));
            }
        }
        expect(accessContextObjectFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AccessPolicy', async () => {
        let accessPolicyFetch: DBAPI.AccessPolicy | null = null;
        if (accessPolicy) {
            accessPolicyFetch = await DBAPI.AccessPolicy.fetch(accessPolicy.idAccessPolicy);
            if (accessPolicyFetch) {
                expect(accessPolicyFetch).toMatchObject(accessPolicy);
                expect(accessPolicy).toMatchObject(accessPolicyFetch);
            }
        }
        expect(accessPolicyFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AccessPolicy.fetchFromAccessContext', async () => {
        let accessPolicyFetch: DBAPI.AccessPolicy[] | null = null;
        if (accessContext) {
            accessPolicyFetch = await DBAPI.AccessPolicy.fetchFromAccessContext(accessContext.idAccessContext);
            if (accessPolicyFetch) {
                expect(accessPolicyFetch).toEqual(expect.arrayContaining([accessPolicy]));
            }
        }
        expect(accessPolicyFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AccessPolicy.fetchFromUser', async () => {
        let accessPolicyFetch: DBAPI.AccessPolicy[] | null = null;
        if (user) {
            accessPolicyFetch = await DBAPI.AccessPolicy.fetchFromUser(user.idUser);
            if (accessPolicyFetch) {
                expect(accessPolicyFetch).toEqual(expect.arrayContaining([accessPolicy]));
            }
        }
        expect(accessPolicyFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AccessRole', async () => {
        let accessRoleFetch: DBAPI.AccessRole | null = null;
        if (accessRole) {
            accessRoleFetch = await DBAPI.AccessRole.fetch(accessRole.idAccessRole);
            if (accessRoleFetch) {
                expect(accessRoleFetch).toMatchObject(accessRole);
                expect(accessRole).toMatchObject(accessRoleFetch);
            }
        }
        expect(accessRoleFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AccessRoleAccessActionXref', async () => {
        let accessRoleAccessActionXrefFetch: DBAPI.AccessRoleAccessActionXref | null = null;
        if (accessRoleAccessActionXref) {
            accessRoleAccessActionXrefFetch = await DBAPI.AccessRoleAccessActionXref.fetch(accessRoleAccessActionXref.idAccessRoleAccessActionXref);
            if (accessRoleAccessActionXrefFetch) {
                expect(accessRoleAccessActionXrefFetch).toMatchObject(accessRoleAccessActionXref);
                expect(accessRoleAccessActionXref).toMatchObject(accessRoleAccessActionXrefFetch);
            }
        }
        expect(accessRoleAccessActionXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Actor', async () => {
        let actorFetch: DBAPI.Actor | null = null;
        if (actorWithUnit) {
            actorFetch = await DBAPI.Actor.fetch(actorWithUnit.idActor);
            if (actorFetch) {
                expect(actorFetch).toMatchObject(actorWithUnit);
                expect(actorWithUnit).toMatchObject(actorFetch);
            }
        }
        expect(actorFetch).toBeTruthy();
    });

    test('DB Fetch Actor: Actor.fetchFromUnit', async () => {
        let actorFetch: DBAPI.Actor[] | null = null;
        if (unit) {
            actorFetch = await DBAPI.Actor.fetchFromUnit(unit.idUnit);
            if (actorFetch) {
                expect(actorFetch).toEqual(expect.arrayContaining([actorWithUnit]));
            }
        }
        expect(actorFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AssetGroup', async () => {
        let assetGroupFetch: DBAPI.AssetGroup | null = null;
        if (assetGroup) {
            assetGroupFetch = await DBAPI.AssetGroup.fetch(assetGroup.idAssetGroup);
            if (assetGroupFetch) {
                expect(assetGroupFetch).toMatchObject(assetGroup);
                expect(assetGroup).toMatchObject(assetGroupFetch);
            }
        }
        expect(assetGroupFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Asset', async () => {
        let assetFetch: DBAPI.Asset | null = null;
        if (assetThumbnail) {
            assetFetch = await DBAPI.Asset.fetch(assetThumbnail.idAsset);
            if (assetFetch) {
                expect(assetFetch).toMatchObject(assetThumbnail);
                expect(assetThumbnail).toMatchObject(assetFetch);
            }
        }
        expect(assetFetch).toBeTruthy();
    });

    test('DB Fetch Asset: Asset.fetchByStorageKey', async () => {
        let assetFetch: DBAPI.Asset | null = null;
        if (assetThumbnail && assetThumbnail.StorageKey) {
            assetFetch = await DBAPI.Asset.fetchByStorageKey(assetThumbnail.StorageKey);
            if (assetFetch)
                expect(assetFetch).toEqual(assetThumbnail);
        }
        expect(assetFetch).toBeTruthy();
    });

    test('DB Fetch Asset: Asset.fetchFromAssetGroup', async () => {
        let assetFetch: DBAPI.Asset[] | null = null;
        if (assetGroup) {
            assetFetch = await DBAPI.Asset.fetchFromAssetGroup(assetGroup.idAssetGroup);
            if (assetFetch) {
                expect(assetFetch).toEqual(expect.arrayContaining([assetThumbnail]));
            }
        }
        expect(assetFetch).toBeTruthy();
    });

    test('DB Creation: Asset.assignOwner', async () => {
        let assigned: boolean = false;
        if (assetThumbnail && subject)
            assigned = await assetThumbnail.assignOwner(subject);
        expect(assigned).toBeTruthy();
    });

    test('DB Fetch Asset: Asset.fetchFromSystemObject', async () => {
        let assetFetch: DBAPI.Asset[] | null = null;
        if (systemObjectSubject) {
            assetFetch = await DBAPI.Asset.fetchFromSystemObject(systemObjectSubject.idSystemObject);
            if (assetFetch && assetThumbnail && assetWithoutAG) {
                const IDs: number[] = [];
                for (const asset of assetFetch)
                    IDs.push(asset.idAsset);
                expect(IDs).toEqual(expect.arrayContaining([assetThumbnail.idAsset, assetWithoutAG.idAsset]));
            }
        }
        expect(assetFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AssetVersion', async () => {
        let assetVersionFetch: DBAPI.AssetVersion | null = null;
        if (assetVersion) {
            assetVersionFetch = await DBAPI.AssetVersion.fetch(assetVersion.idAssetVersion);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toMatchObject(assetVersion);
                expect(assetVersion).toMatchObject(assetVersionFetch);
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromAsset', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (assetThumbnail) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromAsset(assetThumbnail.idAsset);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion, assetVersionNotIngested]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchLatestFromAsset Not Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion | null = null;
        if (assetThumbnail) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchLatestFromAsset(assetThumbnail.idAsset);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(assetVersionNotIngested);
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Creation: AssetVersion 2', async () => {
        if (assetThumbnail && user)
            assetVersion2 = await UTIL.createAssetVersionTest({
                idAsset: assetThumbnail.idAsset,
                Version: 0,
                FileName: assetThumbnail.FileName,
                idUserCreator: user.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum',
                StorageSize: 50,
                StorageKeyStaging: '',
                Ingested: true,
                idAssetVersion: 0
            });
        expect(assetVersion2).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchLatestFromAsset Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion | null = null;
        if (assetThumbnail) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchLatestFromAsset(assetThumbnail.idAsset);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(assetVersion2);
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchByAssetAndVersion', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (assetThumbnail) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchByAssetAndVersion(assetThumbnail.idAsset, 1);
            if (assetVersionFetch)
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
            assetVersionFetch = await DBAPI.AssetVersion.fetchByAssetAndVersion(assetThumbnail.idAsset, 2);
            if (assetVersionFetch)
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersionNotIngested]));
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromUser', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (user) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromUser(user.idUser);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromUserByIngested Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (user) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromUserByIngested(user.idUser, true);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromUserByIngested Not Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (user) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromUserByIngested(user.idUser, false);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersionNotIngested]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchByIngested Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (user) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchByIngested(true);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchByIngested Not Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (user) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchByIngested(false);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersionNotIngested]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch By ID: CaptureData', async () => {
        let captureDataFetch: DBAPI.CaptureData | null = null;
        if (captureData) {
            captureDataFetch = await DBAPI.CaptureData.fetch(captureData.idCaptureData);
            if (captureDataFetch) {
                expect(captureDataFetch).toMatchObject(captureData);
                expect(captureData).toMatchObject(captureDataFetch);
            }
        }
        expect(captureDataFetch).toBeTruthy();
    });

    test('DB Fetch By ID: CaptureDataFile', async () => {
        let captureDataFileFetch: DBAPI.CaptureDataFile | null = null;
        if (captureDataFile) {
            captureDataFileFetch = await DBAPI.CaptureDataFile.fetch(captureDataFile.idCaptureDataFile);
            if (captureDataFileFetch) {
                expect(captureDataFileFetch).toMatchObject(captureDataFile);
                expect(captureDataFile).toMatchObject(captureDataFileFetch);
            }
        }
        expect(captureDataFile).toBeTruthy();
    });

    test('DB Fetch CaptureDataFile: CaptureDataFile.fetchFromCaptureData', async () => {
        let captureDataFileFetch: DBAPI.CaptureDataFile[] | null = null;
        if (captureData) {
            captureDataFileFetch = await DBAPI.CaptureDataFile.fetchFromCaptureData(captureData.idCaptureData);
            if (captureDataFileFetch) {
                expect(captureDataFileFetch).toEqual(expect.arrayContaining([captureDataFile]));
            }
        }
        expect(captureDataFile).toBeTruthy();
    });

    test('DB Fetch By ID: CaptureDataGroup', async () => {
        let captureDataGroupFetch: DBAPI.CaptureDataGroup | null = null;
        if (captureDataGroup) {
            captureDataGroupFetch = await DBAPI.CaptureDataGroup.fetch(captureDataGroup.idCaptureDataGroup);
            if (captureDataGroupFetch) {
                expect(captureDataGroupFetch).toMatchObject(captureDataGroup);
                expect(captureDataGroup).toMatchObject(captureDataGroupFetch);
            }
        }
        expect(captureDataGroupFetch).toBeTruthy();
    });

    test('DB Fetch By ID: CaptureDataGroupCaptureDataXref', async () => {
        let captureDataGroupCaptureDataXrefFetch: DBAPI.CaptureDataGroupCaptureDataXref | null = null;
        if (captureDataGroupCaptureDataXref) {
            captureDataGroupCaptureDataXrefFetch = await DBAPI.CaptureDataGroupCaptureDataXref.fetch(captureDataGroupCaptureDataXref.idCaptureDataGroupCaptureDataXref);
            if (captureDataGroupCaptureDataXrefFetch) {
                expect(captureDataGroupCaptureDataXrefFetch).toMatchObject(captureDataGroupCaptureDataXref);
                expect(captureDataGroupCaptureDataXref).toMatchObject(captureDataGroupCaptureDataXrefFetch);
            }
        }
        expect(captureDataGroupCaptureDataXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: GeoLocation', async () => {
        let geoLocationFetch: DBAPI.GeoLocation | null = null;
        if (geoLocation) {
            geoLocationFetch = await DBAPI.GeoLocation.fetch(geoLocation.idGeoLocation);
            if (geoLocationFetch) {
                expect(geoLocationFetch).toMatchObject(geoLocation);
                expect(geoLocation).toMatchObject(geoLocationFetch);
            }
        }
        expect(geoLocationFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Identifier', async () => {
        let identifierFetch: DBAPI.Identifier | null = null;
        if (identifier) {
            identifierFetch = await DBAPI.Identifier.fetch(identifier.idIdentifier);
            if (identifierFetch) {
                expect(identifierFetch).toMatchObject(identifier);
                expect(identifier).toMatchObject(identifierFetch);
            }
        }
        expect(identifierFetch).toBeTruthy();
    });

    test('DB Fetch Identifier: Identifier.fetchFromSystemObject', async () => {
        let identifierFetch: DBAPI.Identifier[] | null = null;
        if (systemObjectSubject) {
            identifierFetch = await DBAPI.Identifier.fetchFromSystemObject(systemObjectSubject.idSystemObject);
            if (identifierFetch) {
                expect(identifierFetch).toEqual(expect.arrayContaining([identifier]));
            }
        }
        expect(identifierFetch).toBeTruthy();
    });

    test('DB Fetch By ID: IntermediaryFile', async () => {
        let intermediaryFileFetch: DBAPI.IntermediaryFile | null = null;
        if (intermediaryFile) {
            intermediaryFileFetch = await DBAPI.IntermediaryFile.fetch(intermediaryFile.idIntermediaryFile);
            if (intermediaryFileFetch) {
                expect(intermediaryFileFetch).toMatchObject(intermediaryFile);
                expect(intermediaryFile).toMatchObject(intermediaryFileFetch);
            }
        }
        expect(intermediaryFileFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Item', async () => {
        let itemFetch: DBAPI.Item | null = null;
        if (item) {
            itemFetch = await DBAPI.Item.fetch(item.idItem);
            if (itemFetch) {
                expect(itemFetch).toMatchObject(item);
                expect(item).toMatchObject(itemFetch);
            }
        }
        expect(itemFetch).toBeTruthy();
    });

    test('DB Fetch Item: Item.fetchDerivedFromSubject', async () => {
        let itemFetch: DBAPI.Item[] | null = null;
        if (subject) {
            itemFetch = await DBAPI.Item.fetchDerivedFromSubject(subject.idSubject);
            if (itemFetch) {
                if (item) {
                    expect(itemFetch).toEqual(expect.arrayContaining([item, itemNulls]));
                }
            }
        }
        expect(itemFetch).toBeTruthy();
    });

    test('DB Fetch Item: Item.fetchDerivedFromSubjects', async () => {
        let itemFetch: DBAPI.Item[] | null = null;
        if (subject && subjectNulls) {
            itemFetch = await DBAPI.Item.fetchDerivedFromSubjects([subject.idSubject, subjectNulls.idSubject]);
            if (itemFetch) {
                const itemIDs: number[] = [];
                for (const item of itemFetch)
                    itemIDs.push(item.idItem);
                if (item && itemNulls)
                    expect(itemIDs).toEqual(expect.arrayContaining([item.idItem, itemNulls.idItem]));
            }
        }
        expect(itemFetch).toBeTruthy();
    });

    test('DB Fetch By ID: License', async () => {
        let licenseFetch: DBAPI.License | null = null;
        if (license) {
            licenseFetch = await DBAPI.License.fetch(license.idLicense);
            if (licenseFetch) {
                expect(licenseFetch).toMatchObject(license);
                expect(license).toMatchObject(licenseFetch);
            }
        }
        expect(licenseFetch).toBeTruthy();
    });

    test('DB Fetch By ID: LicenseAssignment', async () => {
        let licenseAssignmentFetch: DBAPI.LicenseAssignment | null = null;
        if (licenseAssignment) {
            licenseAssignmentFetch = await DBAPI.LicenseAssignment.fetch(licenseAssignment.idLicenseAssignment);
            if (licenseAssignmentFetch) {
                expect(licenseAssignmentFetch).toMatchObject(licenseAssignment);
                expect(licenseAssignment).toMatchObject(licenseAssignmentFetch);
            }
        }
        expect(licenseAssignmentFetch).toBeTruthy();
    });

    test('DB Fetch LicenseAssignment: LicenseAssignment.fetchFromLicense', async () => {
        let licenseAssignmentFetch: DBAPI.LicenseAssignment[] | null = null;
        if (license) {
            licenseAssignmentFetch = await DBAPI.LicenseAssignment.fetchFromLicense(license.idLicense);
            if (licenseAssignmentFetch) {
                if (licenseAssignment) {
                    expect(licenseAssignmentFetch).toEqual(expect.arrayContaining([licenseAssignment]));
                }
            }
        }
        expect(licenseAssignmentFetch).toBeTruthy();
    });

    test('DB Fetch LicenseAssignment: LicenseAssignment.fetchFromUser', async () => {
        let licenseAssignmentFetch: DBAPI.LicenseAssignment[] | null = null;
        if (user) {
            licenseAssignmentFetch = await DBAPI.LicenseAssignment.fetchFromUser(user.idUser);
            if (licenseAssignmentFetch) {
                expect(licenseAssignmentFetch).toEqual(expect.arrayContaining([licenseAssignment]));
            }
        }
        expect(licenseAssignmentFetch).toBeTruthy();
    });

    test('DB Fetch LicenseAssignment: LicenseAssignment.fetchFromSystemObject', async () => {
        let licenseAssignmentFetch: DBAPI.LicenseAssignment[] | null = null;
        if (systemObjectSubject) {
            licenseAssignmentFetch = await DBAPI.LicenseAssignment.fetchFromSystemObject(systemObjectSubject.idSystemObject);
            if (licenseAssignmentFetch) {
                expect(licenseAssignmentFetch).toEqual(expect.arrayContaining([licenseAssignment]));
            }
        }
        expect(licenseAssignmentFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Metadata', async () => {
        let metadataFetch: DBAPI.Metadata | null = null;
        if (metadata) {
            metadataFetch = await DBAPI.Metadata.fetch(metadata.idMetadata);
            if (metadataFetch) {
                expect(metadataFetch).toMatchObject(metadata);
                expect(metadata).toMatchObject(metadataFetch);
            }
        }
        expect(metadataFetch).toBeTruthy();
    });

    test('DB Fetch Metadata: Metadata.fetchFromUser', async () => {
        let metadataFetch: DBAPI.Metadata[] | null = null;
        if (user) {
            metadataFetch = await DBAPI.Metadata.fetchFromUser(user.idUser);
            if (metadataFetch) {
                expect(metadataFetch).toEqual(expect.arrayContaining([metadata]));
            }
        }
        expect(metadataFetch).toBeTruthy();
    });

    test('DB Fetch Metadata: Metadata.fetchFromSystemObject', async () => {
        let metadataFetch: DBAPI.Metadata[] | null = null;
        if (systemObjectScene) {
            metadataFetch = await DBAPI.Metadata.fetchFromSystemObject(systemObjectScene.idSystemObject);
            if (metadataFetch) {
                expect(metadataFetch).toEqual(expect.arrayContaining([metadata]));
            }
        }
        expect(metadataFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Model', async () => {
        let modelFetch: DBAPI.Model | null = null;
        if (model) {
            modelFetch = await DBAPI.Model.fetch(model.idModel);
            if (modelFetch) {
                expect(modelFetch).toMatchObject(model);
                expect(model).toMatchObject(modelFetch);
            }
        }
        expect(modelFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelGeometryFile', async () => {
        let modelGeometryFileFetch: DBAPI.ModelGeometryFile | null = null;
        if (modelGeometryFile) {
            modelGeometryFileFetch = await DBAPI.ModelGeometryFile.fetch(modelGeometryFile.idModelGeometryFile);
            if (modelGeometryFileFetch) {
                expect(modelGeometryFileFetch).toMatchObject(modelGeometryFile);
                expect(modelGeometryFile).toMatchObject(modelGeometryFileFetch);
            }
        }
        expect(modelGeometryFileFetch).toBeTruthy();
    });

    test('DB Fetch ModelGeometryFile: ModelGeometryFile.fetchFromModel', async () => {
        let modelGeometryFileFetch: DBAPI.ModelGeometryFile[] | null = null;
        if (model) {
            modelGeometryFileFetch = await DBAPI.ModelGeometryFile.fetchFromModel(model.idModel);
            if (modelGeometryFileFetch) {
                if (modelGeometryFile) {
                    expect(modelGeometryFileFetch).toEqual(expect.arrayContaining([modelGeometryFile]));
                }
            }
        }
        expect(modelGeometryFileFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelProcessingAction', async () => {
        let modelProcessingActionFetch: DBAPI.ModelProcessingAction | null = null;
        if (modelProcessingAction) {
            modelProcessingActionFetch = await DBAPI.ModelProcessingAction.fetch(modelProcessingAction.idModelProcessingAction);
            if (modelProcessingActionFetch) {
                expect(modelProcessingActionFetch).toMatchObject(modelProcessingAction);
                expect(modelProcessingAction).toMatchObject(modelProcessingActionFetch);
            }
        }
        expect(modelProcessingActionFetch).toBeTruthy();
    });

    test('DB Fetch ModelProcessingAction: ModelProcessingAction.fetchFromModel', async () => {
        let modelProcessingActionFetch: DBAPI.ModelProcessingAction[] | null = null;
        if (model) {
            modelProcessingActionFetch = await DBAPI.ModelProcessingAction.fetchFromModel(model.idModel);
            if (modelProcessingActionFetch) {
                expect(modelProcessingActionFetch).toEqual(expect.arrayContaining([modelProcessingAction]));
            }
        }
        expect(modelProcessingActionFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelProcessingActionStep', async () => {
        let modelProcessingActionStepFetch: DBAPI.ModelProcessingActionStep | null = null;
        if (modelProcessingActionStep) {
            modelProcessingActionStepFetch = await DBAPI.ModelProcessingActionStep.fetch(modelProcessingActionStep.idModelProcessingActionStep);
            if (modelProcessingActionStepFetch) {
                expect(modelProcessingActionStepFetch).toMatchObject(modelProcessingActionStep);
                expect(modelProcessingActionStep).toMatchObject(modelProcessingActionStepFetch);
            }
        }
        expect(modelProcessingActionStepFetch).toBeTruthy();
    });

    test('DB Fetch ModelProcessingActionStep: ModelProcessingActionStep.fetchFromModelProcessingAction', async () => {
        let modelProcessingActionStepFetch: DBAPI.ModelProcessingActionStep[] | null = null;
        if (modelProcessingAction) {
            modelProcessingActionStepFetch = await DBAPI.ModelProcessingActionStep.fetchFromModelProcessingAction(modelProcessingAction.idModelProcessingAction);
            if (modelProcessingActionStepFetch) {
                expect(modelProcessingActionStepFetch).toEqual(expect.arrayContaining([modelProcessingActionStep]));
            }
        }
        expect(modelProcessingActionStepFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelSceneXref', async () => {
        let modelSceneXrefFetch: DBAPI.ModelSceneXref | null = null;
        if (modelSceneXref) {
            modelSceneXrefFetch = await DBAPI.ModelSceneXref.fetch(modelSceneXref.idModelSceneXref);
            if (modelSceneXrefFetch) {
                expect(modelSceneXrefFetch).toMatchObject(modelSceneXref);
                expect(modelSceneXref).toMatchObject(modelSceneXrefFetch);
            }
        }
        expect(modelSceneXrefFetch).toBeTruthy();
    });

    test('DB Fetch ModelSceneXref: ModelSceneXref.fetchFromModel', async () => {
        let modelSceneXrefFetch: DBAPI.ModelSceneXref[] | null = null;
        if (model) {
            modelSceneXrefFetch = await DBAPI.ModelSceneXref.fetchFromModel(model.idModel);
            if (modelSceneXrefFetch) {
                if (modelSceneXref) {
                    expect(modelSceneXrefFetch).toEqual(expect.arrayContaining([modelSceneXref]));
                }
            }
        }
        expect(modelSceneXrefFetch).toBeTruthy();
    });

    test('DB Fetch ModelSceneXref: ModelSceneXref.fetchFromScene', async () => {
        let modelSceneXrefFetch: DBAPI.ModelSceneXref[] | null = null;
        if (scene) {
            modelSceneXrefFetch = await DBAPI.ModelSceneXref.fetchFromScene(scene.idScene);
            if (modelSceneXrefFetch) {
                expect(modelSceneXrefFetch).toEqual(expect.arrayContaining([modelSceneXref]));
            }
        }
        expect(modelSceneXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelUVMapChannel', async () => {
        let modelUVMapChannelFetch: DBAPI.ModelUVMapChannel | null = null;
        if (modelUVMapChannel) {
            modelUVMapChannelFetch = await DBAPI.ModelUVMapChannel.fetch(modelUVMapChannel.idModelUVMapChannel);
            if (modelUVMapChannelFetch) {
                expect(modelUVMapChannelFetch).toMatchObject(modelUVMapChannel);
                expect(modelUVMapChannel).toMatchObject(modelUVMapChannelFetch);
            }
        }
        expect(modelUVMapChannelFetch).toBeTruthy();
    });

    test('DB Fetch ModelUVMapChannel: ModelUVMapChannel.fetchFromModelUVMapFile', async () => {
        let modelUVMapChannelFetch: DBAPI.ModelUVMapChannel[] | null = null;
        if (modelUVMapFile) {
            modelUVMapChannelFetch = await DBAPI.ModelUVMapChannel.fetchFromModelUVMapFile(modelUVMapFile.idModelUVMapFile);
            if (modelUVMapChannelFetch) {
                expect(modelUVMapChannelFetch).toEqual(expect.arrayContaining([modelUVMapChannel]));
            }
        }
        expect(modelUVMapChannelFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelUVMapFile', async () => {
        let modelUVMapFileFetch: DBAPI.ModelUVMapFile | null = null;
        if (modelUVMapFile) {
            modelUVMapFileFetch = await DBAPI.ModelUVMapFile.fetch(modelUVMapFile.idModelUVMapFile);
            if (modelUVMapFileFetch) {
                expect(modelUVMapFileFetch).toMatchObject(modelUVMapFile);
                expect(modelUVMapFile).toMatchObject(modelUVMapFileFetch);
            }
        }
        expect(modelUVMapFileFetch).toBeTruthy();
    });

    test('DB Fetch ModelUVMapFile: ModelUVMapFile.fetchFromModelGeometryFile', async () => {
        let modelUVMapFileFetch: DBAPI.ModelUVMapFile[] | null = null;
        if (modelGeometryFile) {
            modelUVMapFileFetch = await DBAPI.ModelUVMapFile.fetchFromModelGeometryFile(modelGeometryFile.idModelGeometryFile);
            if (modelUVMapFileFetch) {
                expect(modelUVMapFileFetch).toEqual(expect.arrayContaining([modelUVMapFile]));
            }
        }
        expect(modelUVMapFileFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Project', async () => {
        let projectFetch: DBAPI.Project | null = null;
        if (project) {
            projectFetch = await DBAPI.Project.fetch(project.idProject);
            if (projectFetch) {
                expect(projectFetch).toMatchObject(project);
                expect(project).toMatchObject(projectFetch);
            }
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ProjectDocumentation', async () => {
        let projectDocumentationFetch: DBAPI.ProjectDocumentation | null = null;
        if (projectDocumentation) {
            projectDocumentationFetch = await DBAPI.ProjectDocumentation.fetch(projectDocumentation.idProjectDocumentation);
            if (projectDocumentationFetch) {
                expect(projectDocumentationFetch).toMatchObject(projectDocumentation);
                expect(projectDocumentation).toMatchObject(projectDocumentationFetch);
            }
        }
        expect(projectDocumentationFetch).toBeTruthy();
    });

    test('DB Fetch ProjectDocumentation: ProjectDocumentation.fetchFromProject', async () => {
        let projectDocumentationFetch: DBAPI.ProjectDocumentation[] | null = null;
        if (project) {
            projectDocumentationFetch = await DBAPI.ProjectDocumentation.fetchFromProject(project.idProject);
            if (projectDocumentationFetch) {
                expect(projectDocumentationFetch).toEqual(expect.arrayContaining([projectDocumentation]));
            }
        }
        expect(projectDocumentationFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Scene', async () => {
        let sceneFetch: DBAPI.Scene | null = null;
        if (scene) {
            sceneFetch = await DBAPI.Scene.fetch(scene.idScene);
            if (sceneFetch) {
                expect(sceneFetch).toMatchObject(scene);
                expect(scene).toMatchObject(sceneFetch);
            }
        }
        expect(sceneFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Stakeholder', async () => {
        let stakeholderFetch: DBAPI.Stakeholder | null = null;
        if (stakeholder) {
            stakeholderFetch = await DBAPI.Stakeholder.fetch(stakeholder.idStakeholder);
            if (stakeholderFetch) {
                expect(stakeholderFetch).toMatchObject(stakeholder);
                expect(stakeholder).toMatchObject(stakeholderFetch);
            }
        }
        expect(stakeholderFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Subject', async () => {
        let subjectFetch: DBAPI.Subject | null = null;
        if (subject) {
            subjectFetch = await DBAPI.Subject.fetch(subject.idSubject);
            if (subjectFetch) {
                expect(subjectFetch).toMatchObject(subject);
                expect(subject).toMatchObject(subjectFetch);
            }
        }
        expect(subjectFetch).toBeTruthy();
    });

    test('DB Fetch Subject: Subject.fetchFromUnit', async () => {
        let subjectFetch: DBAPI.Subject[] | null = null;
        if (unit) {
            subjectFetch = await DBAPI.Subject.fetchFromUnit(unit.idUnit);
            if (subjectFetch) {
                if (subject) {
                    expect(subjectFetch).toEqual(expect.arrayContaining([subject]));
                }
            }
        }
        expect(subjectFetch).toBeTruthy();
    });

    test('DB Fetch Subject: Subject.fetchMasterFromItems', async () => {
        let subjectFetch: DBAPI.Subject[] | null = null;
        if (item && itemNulls) {
            subjectFetch = await DBAPI.Subject.fetchMasterFromItems([item.idItem, itemNulls.idItem]);
            if (subjectFetch) {
                if (subject && subjectNulls)
                    expect(subjectFetch).toEqual(expect.arrayContaining([subject, subjectNulls]));
            }
        }
        expect(subjectFetch).toBeTruthy();
    });

    test('DB Fetch Subject: Subject.fetchDerivedFromProjects', async () => {
        let subjectFetch: DBAPI.Subject[] | null = null;
        if (project && project2) {
            subjectFetch = await DBAPI.Subject.fetchDerivedFromProjects([project.idProject, project2.idProject]);
            if (subjectFetch) {
                if (subject && subjectNulls)
                    expect(subjectFetch).toEqual(expect.arrayContaining([subject, subjectNulls]));
            }
        }
        expect(subjectFetch).toBeTruthy();
    });

    test('DB Fetch By ID: SystemObjectVersion', async () => {
        let systemObjectVersionFetch: DBAPI.SystemObjectVersion | null = null;
        if (systemObjectVersion) {
            systemObjectVersionFetch = await DBAPI.SystemObjectVersion.fetch(systemObjectVersion.idSystemObjectVersion);
            if (systemObjectVersionFetch) {
                expect(systemObjectVersionFetch).toMatchObject(systemObjectVersion);
                expect(systemObjectVersion).toMatchObject(systemObjectVersionFetch);
            }
        }
        expect(systemObjectVersionFetch).toBeTruthy();
    });

    test('DB Fetch SystemObjectVersion: SystemObjectVersion.fetchFromSystemObject', async () => {
        let systemObjectVersionFetch: DBAPI.SystemObjectVersion[] | null = null;
        if (systemObjectScene) {
            systemObjectVersionFetch = await DBAPI.SystemObjectVersion.fetchFromSystemObject(systemObjectScene.idSystemObject);
            if (systemObjectVersionFetch) {
                expect(systemObjectVersionFetch).toEqual(expect.arrayContaining([systemObjectVersion]));
            }
        }
        expect(systemObjectVersionFetch).toBeTruthy();
    });

    test('DB Fetch By ID: SystemObjectXref', async () => {
        let systemObjectXrefFetch: DBAPI.SystemObjectXref | null = null;
        if (systemObjectXref) {
            systemObjectXrefFetch = await DBAPI.SystemObjectXref.fetch(systemObjectXref.idSystemObjectXref);
            if (systemObjectXrefFetch) {
                expect(systemObjectXrefFetch).toMatchObject(systemObjectXref);
                expect(systemObjectXref).toMatchObject(systemObjectXrefFetch);
            }
        }
        expect(systemObjectXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Unit', async () => {
        let unitFetch: DBAPI.Unit | null = null;
        if (unit) {
            unitFetch = await DBAPI.Unit.fetch(unit.idUnit);
            if (unitFetch) {
                expect(unitFetch).toMatchObject(unit);
                expect(unit).toMatchObject(unitFetch);
            }
        }
        expect(unitFetch).toBeTruthy();
    });

    test('DB Fetch By ID: UnitEdan', async () => {
        let unitEdanFetch: DBAPI.UnitEdan | null = null;
        if (unitEdan) {
            unitEdanFetch = await DBAPI.UnitEdan.fetch(unitEdan.idUnitEdan);
            if (unitEdanFetch) {
                expect(unitEdanFetch).toMatchObject(unitEdan);
                expect(unitEdan).toMatchObject(unitEdanFetch);
            }
        }
        expect(unitEdanFetch).toBeTruthy();
    });

    test('DB Fetch By ID: User', async () => {
        let userFetch: DBAPI.User | null = null;
        if (user) {
            userFetch = await DBAPI.User.fetch(user.idUser);
            if (userFetch) {
                expect(userFetch).toMatchObject(user);
                expect(user).toMatchObject(userFetch);
            }
        }
        expect(userFetch).toBeTruthy();
    });

    test('DB Fetch By EmailAddress: User', async () => {
        let userFetchArray: DBAPI.User[] | null = null;
        if (user) {
            userFetchArray = await DBAPI.User.fetchByEmail(user.EmailAddress);
            if (userFetchArray)
                expect(userFetchArray).toEqual(expect.arrayContaining([user]));
        }
        expect(userFetchArray).toBeTruthy();
    });

    test('DB Fetch By ID: UserPersonalizationSystemObject', async () => {
        let userPersonalizationSystemObjectFetch: DBAPI.UserPersonalizationSystemObject | null = null;
        if (userPersonalizationSystemObject) {
            userPersonalizationSystemObjectFetch = await DBAPI.UserPersonalizationSystemObject.fetch(userPersonalizationSystemObject.idUserPersonalizationSystemObject);
            if (userPersonalizationSystemObjectFetch) {
                expect(userPersonalizationSystemObjectFetch).toMatchObject(userPersonalizationSystemObject);
                expect(userPersonalizationSystemObject).toMatchObject(userPersonalizationSystemObjectFetch);
            }
        }
        expect(userPersonalizationSystemObjectFetch).toBeTruthy();
    });

    test('DB Fetch UserPersonalizationSystemObject: UserPersonalizationSystemObject.fetchFromUser', async () => {
        let userPersonalizationSystemObjectFetch: DBAPI.UserPersonalizationSystemObject[] | null = null;
        if (user) {
            userPersonalizationSystemObjectFetch = await DBAPI.UserPersonalizationSystemObject.fetchFromUser(user.idUser);
            if (userPersonalizationSystemObjectFetch) {
                expect(userPersonalizationSystemObjectFetch).toEqual(expect.arrayContaining([userPersonalizationSystemObject]));
            }
        }
        expect(userPersonalizationSystemObjectFetch).toBeTruthy();
    });

    test('DB Fetch UserPersonalizationSystemObject: UserPersonalizationSystemObject.fetchFromSystemObject', async () => {
        let userPersonalizationSystemObjectFetch: DBAPI.UserPersonalizationSystemObject[] | null = null;
        if (systemObjectSubject) {
            userPersonalizationSystemObjectFetch = await DBAPI.UserPersonalizationSystemObject.fetchFromSystemObject(systemObjectSubject.idSystemObject);
            if (userPersonalizationSystemObjectFetch) {
                expect(userPersonalizationSystemObjectFetch).toEqual(expect.arrayContaining([userPersonalizationSystemObject]));
            }
        }
        expect(userPersonalizationSystemObjectFetch).toBeTruthy();
    });

    test('DB Fetch By ID: UserPersonalizationUrl', async () => {
        let userPersonalizationUrlFetch: DBAPI.UserPersonalizationUrl | null = null;
        if (userPersonalizationUrl) {
            userPersonalizationUrlFetch = await DBAPI.UserPersonalizationUrl.fetch(userPersonalizationUrl.idUserPersonalizationUrl);
            if (userPersonalizationUrlFetch) {
                expect(userPersonalizationUrlFetch).toMatchObject(userPersonalizationUrl);
                expect(userPersonalizationUrl).toMatchObject(userPersonalizationUrlFetch);
            }
        }
        expect(userPersonalizationUrlFetch).toBeTruthy();
    });

    test('DB Fetch UserPersonalizationUrl: UserPersonalizationUrl.fetchFromUser', async () => {
        let userPersonalizationUrlFetch: DBAPI.UserPersonalizationUrl[] | null = null;
        if (user) {
            userPersonalizationUrlFetch = await DBAPI.UserPersonalizationUrl.fetchFromUser(user.idUser);
            if (userPersonalizationUrlFetch) {
                expect(userPersonalizationUrlFetch).toEqual(expect.arrayContaining([userPersonalizationUrl]));
            }
        }
        expect(userPersonalizationUrlFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Vocabulary', async () => {
        let vocabularyFetch: DBAPI.Vocabulary | null = null;
        if (vocabulary) {
            vocabularyFetch = await DBAPI.Vocabulary.fetch(vocabulary.idVocabulary);
            if (vocabularyFetch) {
                expect(vocabularyFetch).toMatchObject(vocabulary);
                expect(vocabulary).toMatchObject(vocabularyFetch);
            }
        }
        expect(vocabularyFetch).toBeTruthy();
    });

    test('DB Fetch Vocabulary: Vocabulary.fetchFromVocabularySet', async () => {
        let vocabularyFetch: DBAPI.Vocabulary[] | null = null;
        if (vocabularySet) {
            vocabularyFetch = await DBAPI.Vocabulary.fetchFromVocabularySet(vocabularySet.idVocabularySet);
            if (vocabularyFetch) {
                expect(vocabularyFetch).toEqual(expect.arrayContaining([vocabulary]));
            }
        }
        expect(vocabularyFetch).toBeTruthy();
    });

    test('DB Fetch Vocabulary: Vocabulary.fetchAll', async () => {
        let vocabularyFetch: DBAPI.Vocabulary[] | null = null;
        if (vocabularySet) {
            vocabularyFetch = await DBAPI.Vocabulary.fetchAll();
            if (vocabularyFetch)
                expect(vocabularyFetch).toEqual(expect.arrayContaining([vocabulary, vocabulary2]));
        }
        expect(vocabularyFetch).toBeTruthy();
    });

    test('DB Fetch By ID: VocabularySet', async () => {
        let vocabularySetFetch: DBAPI.VocabularySet | null = null;
        if (vocabularySet) {
            vocabularySetFetch = await DBAPI.VocabularySet.fetch(vocabularySet.idVocabularySet);
            if (vocabularySetFetch) {
                expect(vocabularySetFetch).toMatchObject(vocabularySet);
                expect(vocabularySet).toMatchObject(vocabularySetFetch);
            }
        }
        expect(vocabularySetFetch).toBeTruthy();
    });

    test('DB Fetch VocabularySet: VocabularySet.fetchAll', async () => {
        let vocabularySetFetch: DBAPI.VocabularySet[] | null = null;
        if (vocabularySet) {
            vocabularySetFetch = await DBAPI.VocabularySet.fetchAll();
            if (vocabularySetFetch)
                expect(vocabularySetFetch).toEqual(expect.arrayContaining([vocabularySet]));
        }
        expect(vocabularySetFetch).toBeTruthy();
    });


    test('DB Fetch By ID: Workflow', async () => {
        let workflowFetch: DBAPI.Workflow | null = null;
        if (workflow) {
            workflowFetch = await DBAPI.Workflow.fetch(workflow.idWorkflow);
            if (workflowFetch) {
                expect(workflowFetch).toMatchObject(workflow);
                expect(workflow).toMatchObject(workflowFetch);
            }
        }
        expect(workflowFetch).toBeTruthy();
    });

    test('DB Fetch Workflow: Workflow.fetchFromProject', async () => {
        let workflowFetch: DBAPI.Workflow[] | null = null;
        if (project) {
            workflowFetch = await DBAPI.Workflow.fetchFromProject(project.idProject);
            if (workflowFetch) {
                expect(workflowFetch).toEqual(expect.arrayContaining([workflow]));
            }
        }
        expect(workflowFetch).toBeTruthy();
    });

    test('DB Fetch Workflow: Workflow.fetchFromUser', async () => {
        let workflowFetch: DBAPI.Workflow[] | null = null;
        if (user) {
            workflowFetch = await DBAPI.Workflow.fetchFromUser(user.idUser);
            if (workflowFetch) {
                expect(workflowFetch).toEqual(expect.arrayContaining([workflow]));
            }
        }
        expect(workflowFetch).toBeTruthy();
    });

    test('DB Fetch Workflow: Workflow.fetchFromWorkflowTemplate', async () => {
        let workflowFetch: DBAPI.Workflow[] | null = null;
        if (workflowTemplate) {
            workflowFetch = await DBAPI.Workflow.fetchFromWorkflowTemplate(workflowTemplate.idWorkflowTemplate);
            if (workflowFetch) {
                if (workflow) {
                    expect(workflowFetch).toEqual(expect.arrayContaining([workflow]));
                }
            }
        }
        expect(workflowFetch).toBeTruthy();
    });

    test('DB Fetch By ID: WorkflowStep', async () => {
        let workflowStepFetch: DBAPI.WorkflowStep | null = null;
        if (workflowStep) {
            workflowStepFetch = await DBAPI.WorkflowStep.fetch(workflowStep.idWorkflowStep);
            if (workflowStepFetch) {
                expect(workflowStepFetch).toMatchObject(workflowStep);
                expect(workflowStep).toMatchObject(workflowStepFetch);
            }
        }
        expect(workflowStepFetch).toBeTruthy();
    });

    test('DB Fetch WorkflowStep: WorkflowStep.fetchFromUser', async () => {
        let workflowStepFetch: DBAPI.WorkflowStep[] | null = null;
        if (user) {
            workflowStepFetch = await DBAPI.WorkflowStep.fetchFromUser(user.idUser);
            if (workflowStepFetch) {
                expect(workflowStepFetch).toEqual(expect.arrayContaining([workflowStep]));
            }
        }
        expect(workflowStepFetch).toBeTruthy();
    });

    test('DB Fetch WorkflowStep: WorkflowStep.fetchFromWorkflow', async () => {
        let workflowStepFetch: DBAPI.WorkflowStep[] | null = null;
        if (workflow) {
            workflowStepFetch = await DBAPI.WorkflowStep.fetchFromWorkflow(workflow.idWorkflow);
            if (workflowStepFetch) {
                expect(workflowStepFetch).toEqual(expect.arrayContaining([workflowStep]));
            }
        }
        expect(workflowStepFetch).toBeTruthy();
    });

    test('DB Fetch By ID: WorkflowStepSystemObjectXref', async () => {
        let workflowStepSystemObjectXrefFetch: DBAPI.WorkflowStepSystemObjectXref | null = null;
        if (workflowStepSystemObjectXref) {
            workflowStepSystemObjectXrefFetch = await DBAPI.WorkflowStepSystemObjectXref.fetch(workflowStepSystemObjectXref.idWorkflowStepSystemObjectXref);
            if (workflowStepSystemObjectXrefFetch) {
                expect(workflowStepSystemObjectXrefFetch).toMatchObject(workflowStepSystemObjectXref);
                expect(workflowStepSystemObjectXref).toMatchObject(workflowStepSystemObjectXrefFetch);
            }
        }
        expect(workflowStepSystemObjectXrefFetch).toBeTruthy();
    });

    test('DB Fetch WorkflowStepSystemObjectXref: WorkflowStepSystemObjectXref.fetchFromWorkflowStep', async () => {
        let workflowStepSystemObjectXrefFetch: DBAPI.WorkflowStepSystemObjectXref[] | null = null;
        if (workflowStep) {
            workflowStepSystemObjectXrefFetch = await DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflowStep(workflowStep.idWorkflowStep);
            if (workflowStepSystemObjectXrefFetch) {
                if (workflowStepSystemObjectXref) {
                    expect(workflowStepSystemObjectXrefFetch).toEqual(expect.arrayContaining([workflowStepSystemObjectXref]));
                }
            }
        }
        expect(workflowStepSystemObjectXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: WorkflowTemplate', async () => {
        let workflowTemplateFetch: DBAPI.WorkflowTemplate | null = null;
        if (workflowTemplate) {
            workflowTemplateFetch = await DBAPI.WorkflowTemplate.fetch(workflowTemplate.idWorkflowTemplate);
            if (workflowTemplateFetch) {
                expect(workflowTemplateFetch).toMatchObject(workflowTemplate);
                expect(workflowTemplate).toMatchObject(workflowTemplateFetch);
            }
        }
        expect(workflowTemplateFetch).toBeTruthy();
    });
});

// *******************************************************************
// DB Fetch SystemObject.fetch* Test Suite
// *******************************************************************
describe('DB Fetch SystemObject.fetch* Test Suite', () => {
    test('DB Fetch SystemObject: SystemObject.fetch', async () => {
        let SOActor: DBAPI.SystemObject | null = null;
        if (actorWithUnit) {
            SOActor = await DBAPI.SystemObject.fetchFromActorID(actorWithUnit.idActor);
            if (SOActor)
                expect(SOActor.idActor).toEqual(actorWithUnit.idActor);
        }
        expect(SOActor).toBeTruthy();

        let SO: DBAPI.SystemObject | null = null;
        if (SOActor) {
            SO = await DBAPI.SystemObject.fetch(SOActor.idSystemObject);
            if (SO && actorWithUnit)
                expect(SO.idActor).toEqual(actorWithUnit.idActor);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromActorID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (actorWithUnit) {
            SO = await DBAPI.SystemObject.fetchFromActorID(actorWithUnit.idActor);
            if (SO)
                expect(SO.idActor).toEqual(actorWithUnit.idActor);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromAssetID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (assetThumbnail) {
            SO = await DBAPI.SystemObject.fetchFromAssetID(assetThumbnail.idAsset);
            if (SO)
                expect(SO.idAsset).toEqual(assetThumbnail.idAsset);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromAssetVersionID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (assetVersion) {
            SO = await DBAPI.SystemObject.fetchFromAssetVersionID(assetVersion.idAssetVersion);
            if (SO)
                expect(SO.idAssetVersion).toEqual(assetVersion.idAssetVersion);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromCaptureDataID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (captureData) {
            SO = await DBAPI.SystemObject.fetchFromCaptureDataID(captureData.idCaptureData);
            if (SO)
                expect(SO.idCaptureData).toEqual(captureData.idCaptureData);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromIntermediaryFileID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (intermediaryFile) {
            SO = await DBAPI.SystemObject.fetchFromIntermediaryFileID(intermediaryFile.idIntermediaryFile);
            if (SO)
                expect(SO.idIntermediaryFile).toEqual(intermediaryFile.idIntermediaryFile);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromItemID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (item) {
            SO = await DBAPI.SystemObject.fetchFromItemID(item.idItem);
            if (SO)
                expect(SO.idItem).toEqual(item.idItem);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromModelID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (model) {
            SO = await DBAPI.SystemObject.fetchFromModelID(model.idModel);
            if (SO)
                expect(SO.idModel).toEqual(model.idModel);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromProjectID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (project) {
            SO = await DBAPI.SystemObject.fetchFromProjectID(project.idProject);
            if (SO)
                expect(SO.idProject).toEqual(project.idProject);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromProjectDocumentationID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (projectDocumentation) {
            SO = await DBAPI.SystemObject.fetchFromProjectDocumentationID(projectDocumentation.idProjectDocumentation);
            if (SO)
                expect(SO.idProjectDocumentation).toEqual(projectDocumentation.idProjectDocumentation);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromSceneID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (scene) {
            SO = await DBAPI.SystemObject.fetchFromSceneID(scene.idScene);
            if (SO)
                expect(SO.idScene).toEqual(scene.idScene);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromStakeholderID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (stakeholder) {
            SO = await DBAPI.SystemObject.fetchFromStakeholderID(stakeholder.idStakeholder);
            if (SO)
                expect(SO.idStakeholder).toEqual(stakeholder.idStakeholder);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromSubjectID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (subject) {
            SO = await DBAPI.SystemObject.fetchFromSubjectID(subject.idSubject);
            if (SO)
                expect(SO.idSubject).toEqual(subject.idSubject);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObject.fetchFromUnitID', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (unit) {
            SO = await DBAPI.SystemObject.fetchFromUnitID(unit.idUnit);
            if (SO)
                expect(SO.idUnit).toEqual(unit.idUnit);
        }
        expect(SO).toBeTruthy();
    });
});

// *******************************************************************
// DB Fetch SystemObject*.fetch Test Suite
// *******************************************************************
describe('DB Fetch SystemObject*.fetch Test Suite', () => {
    test('DB Fetch SystemObjectActor.fetch', async () => {
        let SO: DBAPI.SystemObjectActor | null = null;
        if (actorWithUnit) {
            SO = await DBAPI.SystemObjectActor.fetch(actorWithUnit.idActor);
            if (SO) {
                expect(SO.idActor).toEqual(actorWithUnit.idActor);
                expect(SO.Actor).toBeTruthy();
                if (SO.Actor) {
                    expect(SO.Actor).toMatchObject(actorWithUnit);
                    expect(actorWithUnit).toMatchObject(SO.Actor);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectAsset.fetch', async () => {
        let SO: DBAPI.SystemObjectAsset | null = null;
        if (assetThumbnail) {
            SO = await DBAPI.SystemObjectAsset.fetch(assetThumbnail.idAsset);
            if (SO) {
                expect(SO.idAsset).toEqual(assetThumbnail.idAsset);
                expect(SO.Asset).toBeTruthy();
                if (SO.Asset)
                    expect(SO.Asset.idAsset).toEqual(assetThumbnail.idAsset);
                SO.Asset = assetThumbnail;
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectAssetVersion.fetch', async () => {
        let SO: DBAPI.SystemObjectAssetVersion | null = null;
        if (assetVersion) {
            SO = await DBAPI.SystemObjectAssetVersion.fetch(assetVersion.idAssetVersion);
            if (SO) {
                expect(SO.idAssetVersion).toEqual(assetVersion.idAssetVersion);
                expect(SO.AssetVersion).toBeTruthy();
                if (SO.AssetVersion) {
                    expect(SO.AssetVersion).toMatchObject(assetVersion);
                    expect(assetVersion).toMatchObject(SO.AssetVersion);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectCaptureData.fetch', async () => {
        let SO: DBAPI.SystemObjectCaptureData | null = null;
        if (captureData) {
            SO = await DBAPI.SystemObjectCaptureData.fetch(captureData.idCaptureData);
            if (SO) {
                expect(SO.idCaptureData).toEqual(captureData.idCaptureData);
                expect(SO.CaptureData).toBeTruthy();
                if (SO.CaptureData) {
                    expect(SO.CaptureData).toMatchObject(captureData);
                    expect(captureData).toMatchObject(SO.CaptureData);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectIntermediaryFile.fetch', async () => {
        let SO: DBAPI.SystemObjectIntermediaryFile | null = null;
        if (intermediaryFile) {
            SO = await DBAPI.SystemObjectIntermediaryFile.fetch(intermediaryFile.idIntermediaryFile);
            if (SO) {
                expect(SO.idIntermediaryFile).toEqual(intermediaryFile.idIntermediaryFile);
                expect(SO.IntermediaryFile).toBeTruthy();
                if (SO.IntermediaryFile) {
                    expect(SO.IntermediaryFile).toMatchObject(intermediaryFile);
                    expect(intermediaryFile).toMatchObject(SO.IntermediaryFile);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectItem.fetch', async () => {
        let SO: DBAPI.SystemObjectItem | null = null;
        if (item) {
            SO = await DBAPI.SystemObjectItem.fetch(item.idItem);
            if (SO) {
                expect(SO.idItem).toEqual(item.idItem);
                expect(SO.Item).toBeTruthy();
                if (SO.Item) {
                    expect(SO.Item).toMatchObject(item);
                    expect(item).toMatchObject(SO.Item);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectModel.fetch', async () => {
        let SO: DBAPI.SystemObjectModel | null = null;
        if (model) {
            SO = await DBAPI.SystemObjectModel.fetch(model.idModel);
            if (SO) {
                expect(SO.idModel).toEqual(model.idModel);
                expect(SO.Model).toBeTruthy();
                if (SO.Model) {
                    expect(SO.Model).toMatchObject(model);
                    expect(model).toMatchObject(SO.Model);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectProject.fetch', async () => {
        let SO: DBAPI.SystemObjectProject | null = null;
        if (project) {
            SO = await DBAPI.SystemObjectProject.fetch(project.idProject);
            if (SO) {
                expect(SO.idProject).toEqual(project.idProject);
                expect(SO.Project).toBeTruthy();
                if (SO.Project) {
                    expect(SO.Project).toMatchObject(project);
                    expect(project).toMatchObject(SO.Project);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectProjectDocumentation.fetch', async () => {
        let SO: DBAPI.SystemObjectProjectDocumentation | null = null;
        if (projectDocumentation) {
            SO = await DBAPI.SystemObjectProjectDocumentation.fetch(projectDocumentation.idProjectDocumentation);
            if (SO) {
                expect(SO.idProjectDocumentation).toEqual(projectDocumentation.idProjectDocumentation);
                expect(SO.ProjectDocumentation).toBeTruthy();
                if (SO.ProjectDocumentation) {
                    expect(SO.ProjectDocumentation).toMatchObject(projectDocumentation);
                    expect(projectDocumentation).toMatchObject(SO.ProjectDocumentation);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectScene.fetch', async () => {
        let SO: DBAPI.SystemObjectScene | null = null;
        if (scene) {
            SO = await DBAPI.SystemObjectScene.fetch(scene.idScene);
            if (SO) {
                expect(SO.idScene).toEqual(scene.idScene);
                expect(SO.Scene).toBeTruthy();
                if (SO.Scene) {
                    expect(SO.Scene).toMatchObject(scene);
                    expect(scene).toMatchObject(SO.Scene);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectStakeholder.fetch', async () => {
        let SO: DBAPI.SystemObjectStakeholder | null = null;
        if (stakeholder) {
            SO = await DBAPI.SystemObjectStakeholder.fetch(stakeholder.idStakeholder);
            if (SO) {
                expect(SO.idStakeholder).toEqual(stakeholder.idStakeholder);
                expect(SO.Stakeholder).toBeTruthy();
                if (SO.Stakeholder) {
                    expect(SO.Stakeholder).toMatchObject(stakeholder);
                    expect(stakeholder).toMatchObject(SO.Stakeholder);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectSubject.fetch', async () => {
        let SO: DBAPI.SystemObjectSubject | null = null;
        if (subject) {
            SO = await DBAPI.SystemObjectSubject.fetch(subject.idSubject);
            if (SO) {
                expect(SO.idSubject).toEqual(subject.idSubject);
                expect(SO.Subject).toBeTruthy();
                if (SO.Subject) {
                    expect(SO.Subject).toMatchObject(subject);
                    expect(subject).toMatchObject(SO.Subject);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObjectUnit.fetch', async () => {
        let SO: DBAPI.SystemObjectUnit | null = null;
        if (unit) {
            SO = await DBAPI.SystemObjectUnit.fetch(unit.idUnit);
            if (SO) {
                expect(SO.idUnit).toEqual(unit.idUnit);
                expect(SO.Unit).toBeTruthy();
                if (SO.Unit) {
                    expect(SO.Unit).toMatchObject(unit);
                    expect(unit).toMatchObject(SO.Unit);
                }
            }
        }
        expect(SO).toBeTruthy();
    });
});

// *******************************************************************
// DB Fetch *.fetchSystemObject Test Suite
// *******************************************************************
describe('DB Fetch *.fetchSystemObject Test Suite', () => {
    test('DB Fetch Actor.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (actorWithUnit) {
            SO = await actorWithUnit.fetchSystemObject();
            if (SO)
                expect(SO.idActor).toEqual(actorWithUnit.idActor);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Asset.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (assetThumbnail) {
            SO = await assetThumbnail.fetchSystemObject();
            if (SO)
                expect(SO.idAsset).toEqual(assetThumbnail.idAsset);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch AssetVersion.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (assetVersion) {
            SO = await assetVersion.fetchSystemObject();
            if (SO)
                expect(SO.idAssetVersion).toEqual(assetVersion.idAssetVersion);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch CaptureData.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (captureData) {
            SO = await captureData.fetchSystemObject();
            if (SO)
                expect(SO.idCaptureData).toEqual(captureData.idCaptureData);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch IntermediaryFile.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (intermediaryFile) {
            SO = await intermediaryFile.fetchSystemObject();
            if (SO)
                expect(SO.idIntermediaryFile).toEqual(intermediaryFile.idIntermediaryFile);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Item.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (item) {
            SO = await item.fetchSystemObject();
            if (SO)
                expect(SO.idItem).toEqual(item.idItem);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Model.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (model) {
            SO = await model.fetchSystemObject();
            if (SO)
                expect(SO.idModel).toEqual(model.idModel);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Project.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (project) {
            SO = await project.fetchSystemObject();
            if (SO)
                expect(SO.idProject).toEqual(project.idProject);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Project: Project.fetchAll', async () => {
        let projectFetch: DBAPI.Project[] | null = null;
        if (project && project2) {
            projectFetch = await DBAPI.Project.fetchAll();
            if (projectFetch)
                expect(projectFetch).toEqual(expect.arrayContaining([project, project2]));
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch ProjectDocumentation.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (projectDocumentation) {
            SO = await projectDocumentation.fetchSystemObject();
            if (SO)
                expect(SO.idProjectDocumentation).toEqual(projectDocumentation.idProjectDocumentation);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Scene.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (scene) {
            SO = await scene.fetchSystemObject();
            if (SO)
                expect(SO.idScene).toEqual(scene.idScene);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Stakeholder.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (stakeholder) {
            SO = await stakeholder.fetchSystemObject();
            if (SO)
                expect(SO.idStakeholder).toEqual(stakeholder.idStakeholder);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Subject.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (subject) {
            SO = await subject.fetchSystemObject();
            if (SO)
                expect(SO.idSubject).toEqual(subject.idSubject);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Unit.fetchSystemObject', async () => {
        let SO: DBAPI.SystemObject | null = null;
        if (unit) {
            SO = await unit.fetchSystemObject();
            if (SO)
                expect(SO.idUnit).toEqual(unit.idUnit);
        }
        expect(SO).toBeTruthy();
    });
});

// *******************************************************************
// DB Fetch SystemObject Pair Test Suite
// *******************************************************************
describe('DB Fetch SystemObject Fetch Pair Test Suite', () => {
    let SOActor: DBAPI.SystemObject | null = null;
    let SOAsset: DBAPI.SystemObject | null = null;
    let SOAssetVersion: DBAPI.SystemObject | null = null;
    let SOCaptureData: DBAPI.SystemObject | null = null;
    let SOIntermediaryFile: DBAPI.SystemObject | null = null;
    let SOItem: DBAPI.SystemObject | null = null;
    let SOModel: DBAPI.SystemObject | null = null;
    let SOProject: DBAPI.SystemObject | null = null;
    let SOProjectDocumentation: DBAPI.SystemObject | null = null;
    let SOScene: DBAPI.SystemObject | null = null;
    let SOStakeholder: DBAPI.SystemObject | null = null;
    let SOSubject: DBAPI.SystemObject | null = null;
    let SOUnit: DBAPI.SystemObject | null = null;

    test('DB Fetch SystemObject: fetchSystemObjectFor * setup', async() => {
        SOActor = actorWithUnit ? await actorWithUnit.fetchSystemObject() : null;
        SOAsset = assetThumbnail ? await assetThumbnail.fetchSystemObject() : null;
        SOAssetVersion = assetVersion ? await assetVersion.fetchSystemObject() : null;
        SOCaptureData = captureData ? await captureData.fetchSystemObject() : null;
        SOIntermediaryFile = intermediaryFile ? await intermediaryFile.fetchSystemObject() : null;
        SOItem = item ? await item.fetchSystemObject() : null;
        SOModel = model ? await model.fetchSystemObject() : null;
        SOProject = project ? await project.fetchSystemObject() : null;
        SOProjectDocumentation = projectDocumentation ? await projectDocumentation.fetchSystemObject() : null;
        SOScene = scene ? await scene.fetchSystemObject() : null;
        SOStakeholder = stakeholder ? await stakeholder.fetchSystemObject() : null;
        SOSubject = subject ? await subject.fetchSystemObject() : null;
        SOUnit = unit ? await unit.fetchSystemObject() : null;

        expect(SOActor).toBeTruthy();
        expect(SOAsset).toBeTruthy();
        expect(SOAssetVersion).toBeTruthy();
        expect(SOCaptureData).toBeTruthy();
        expect(SOIntermediaryFile).toBeTruthy();
        expect(SOItem).toBeTruthy();
        expect(SOModel).toBeTruthy();
        expect(SOProject).toBeTruthy();
        expect(SOProjectDocumentation).toBeTruthy();
        expect(SOScene).toBeTruthy();
        expect(SOStakeholder).toBeTruthy();
        expect(SOSubject).toBeTruthy();
        expect(SOUnit).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch with Invalid SystemObject ID', async () => {
        const SYOP: DBAPI.SystemObjectPairs | null = await DBAPI.SystemObjectPairs.fetch(-1);
        expect(SYOP).toBeNull();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for Actor', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOActor && actorWithUnit) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOActor.idSystemObject);
            if (SYOP) {
                expect(SYOP.Actor).toBeTruthy();
                expect(SYOP.Actor).toMatchObject(actorWithUnit);
                if (SYOP.Actor)
                    expect(actorWithUnit).toMatchObject(SYOP.Actor);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for Asset', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOAsset && assetThumbnail) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOAsset.idSystemObject);
            if (SYOP) {
                expect(SYOP.Asset).toBeTruthy();
                if (SYOP.Asset)
                    expect(assetThumbnail.idAsset).toEqual(SYOP.Asset.idAsset);
                SYOP.Asset = assetThumbnail;
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for AssetVersion', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOAssetVersion && assetVersion) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOAssetVersion.idSystemObject);
            if (SYOP) {
                expect(SYOP.AssetVersion).toBeTruthy();
                expect(SYOP.AssetVersion).toMatchObject(assetVersion);
                if (SYOP.AssetVersion)
                    expect(assetVersion).toMatchObject(SYOP.AssetVersion);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for CaptureData', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOCaptureData && captureData) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOCaptureData.idSystemObject);
            if (SYOP) {
                expect(SYOP.CaptureData).toBeTruthy();
                expect(SYOP.CaptureData).toMatchObject(captureData);
                if (SYOP.CaptureData)
                    expect(captureData).toMatchObject(SYOP.CaptureData);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for IntermediaryFile', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOIntermediaryFile && intermediaryFile) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOIntermediaryFile.idSystemObject);
            if (SYOP) {
                expect(SYOP.IntermediaryFile).toBeTruthy();
                expect(SYOP.IntermediaryFile).toMatchObject(intermediaryFile);
                if (SYOP.IntermediaryFile)
                    expect(intermediaryFile).toMatchObject(SYOP.IntermediaryFile);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for Item', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOItem && item) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOItem.idSystemObject);
            if (SYOP) {
                expect(SYOP.Item).toBeTruthy();
                expect(SYOP.Item).toMatchObject(item);
                if (SYOP.Item)
                    expect(item).toMatchObject(SYOP.Item);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for Model', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOModel && model) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOModel.idSystemObject);
            if (SYOP) {
                expect(SYOP.Model).toBeTruthy();
                expect(SYOP.Model).toMatchObject(model);
                if (SYOP.Model)
                    expect(model).toMatchObject(SYOP.Model);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for Project', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOProject && project) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOProject.idSystemObject);
            if (SYOP) {
                expect(SYOP.Project).toBeTruthy();
                expect(SYOP.Project).toMatchObject(project);
                if (SYOP.Project)
                    expect(project).toMatchObject(SYOP.Project);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for ProjectDocumentation', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOProjectDocumentation && projectDocumentation) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOProjectDocumentation.idSystemObject);
            if (SYOP) {
                expect(SYOP.ProjectDocumentation).toBeTruthy();
                expect(SYOP.ProjectDocumentation).toMatchObject(projectDocumentation);
                if (SYOP.ProjectDocumentation)
                    expect(projectDocumentation).toMatchObject(SYOP.ProjectDocumentation);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for Scene', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOScene && scene) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOScene.idSystemObject);
            if (SYOP) {
                expect(SYOP.Scene).toBeTruthy();
                expect(SYOP.Scene).toMatchObject(scene);
                if (SYOP.Scene)
                    expect(scene).toMatchObject(SYOP.Scene);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for Stakeholder', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOStakeholder && stakeholder) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOStakeholder.idSystemObject);
            if (SYOP) {
                expect(SYOP.Stakeholder).toBeTruthy();
                expect(SYOP.Stakeholder).toMatchObject(stakeholder);
                if (SYOP.Stakeholder)
                    expect(stakeholder).toMatchObject(SYOP.Stakeholder);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for Subject', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOSubject && subject) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOSubject.idSystemObject);
            if (SYOP) {
                expect(SYOP.Subject).toBeTruthy();
                expect(SYOP.Subject).toMatchObject(subject);
                if (SYOP.Subject)
                    expect(subject).toMatchObject(SYOP.Subject);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: SystemObjectPairs.fetch for Unit', async () => {
        let SYOP: DBAPI.SystemObjectPairs | null = null;

        if (SOUnit && unit) {
            SYOP = await DBAPI.SystemObjectPairs.fetch(SOUnit.idSystemObject);
            if (SYOP) {
                expect(SYOP.Unit).toBeTruthy();
                expect(SYOP.Unit).toMatchObject(unit);
                if (SYOP.Unit)
                    expect(unit).toMatchObject(SYOP.Unit);
            }
        }
        expect(SYOP).toBeTruthy();
    });
});

describe('DB Fetch Xref Test Suite', () => {
    test('DB Fetch Xref: AccessRole.fetchFromXref', async () => {
        let AR: DBAPI.AccessRole[] | null = null;
        if (accessAction && accessRole) {
            AR = await DBAPI.AccessRole.fetchFromXref(accessAction.idAccessAction);
            if (AR) {
                expect(AR.length).toBe(1);
                if (AR.length == 1)
                    expect(AR[0].idAccessRole).toBe(accessRole.idAccessRole);
            }
        }
        expect(AR).toBeTruthy();
    });

    test('DB Fetch Xref: AccessAction.fetchFromXref', async () => {
        let AA: DBAPI.AccessAction[] | null = null;
        if (accessAction && accessAction2 && accessRole) {
            AA = await DBAPI.AccessAction.fetchFromXref(accessRole.idAccessRole);
            if (AA) {
                expect(AA.length).toBe(2);
                if (AA.length == 2)
                    expect(AA[0].idAccessAction + AA[1].idAccessAction).toBe(accessAction.idAccessAction + accessAction2?.idAccessAction);
            }
        }
        expect(AA).toBeTruthy();
    });

    test('DB Fetch Xref: fetchCaptureDataGroupFromXref', async () => {
        let CDG: DBAPI.CaptureDataGroup[] | null = null;
        if (captureData && captureDataGroup) {
            CDG = await DBAPI.CaptureDataGroup.fetchFromXref(captureData.idCaptureData);
            if (CDG) {
                expect(CDG.length).toBe(1);
                if (CDG.length == 1)
                    expect(CDG[0].idCaptureDataGroup).toBe(captureDataGroup.idCaptureDataGroup);
            }
        }
        expect(CDG).toBeTruthy();
    });

    test('DB Fetch Xref: fetchCaptureDataFromXref', async () => {
        let CD: DBAPI.CaptureData[] | null = null;
        if (captureData && captureDataNulls && captureDataGroup) {
            CD = await DBAPI.CaptureData.fetchFromXref(captureDataGroup.idCaptureDataGroup);
            if (CD) {
                expect(CD.length).toBe(2);
                if (CD.length == 2) {
                    expect(CD[0].idCaptureData + CD[1].idCaptureData).toBe(captureData.idCaptureData + captureDataNulls.idCaptureData);
                }
            }
        }
        expect(CD).toBeTruthy();
    });

    test('DB Fetch Xref: Model.fetchFromXref', async () => {
        let MO: DBAPI.Model[] | null = null;
        if (scene && model) {
            MO = await DBAPI.Model.fetchFromXref(scene.idScene);
            if (MO) {
                expect(MO.length).toBe(1);
                if (MO.length == 1)
                    expect(MO[0].idModel).toBe(model.idModel);
            }
        }
        expect(MO).toBeTruthy();
    });

    test('DB Fetch Xref: Scene.fetchFromXref', async () => {
        let SC: DBAPI.Scene[] | null = null;
        if (scene && sceneNulls && model) {
            SC = await DBAPI.Scene.fetchFromXref(model.idModel);
            if (SC) {
                expect(SC.length).toBe(2);
                if (SC.length == 2)
                    expect(SC[0].idScene + SC[1].idScene).toBe(scene.idScene + sceneNulls.idScene);
            }
        }
        expect(SC).toBeTruthy();
    });

    test('DB Fetch Xref: fetchWorkflowStepFromXref', async () => {
        let WFS: DBAPI.WorkflowStep[] | null = null;
        if (systemObjectScene && workflowStep) {
            WFS = await DBAPI.SystemObject.fetchWorkflowStepFromXref(systemObjectScene.idSystemObject);
            if (WFS) {
                expect(WFS.length).toBe(1);
                if (WFS.length == 1)
                    expect(WFS[0].idWorkflowStep).toBe(workflowStep.idWorkflowStep);
            }
        }
        expect(WFS).toBeTruthy();
    });

    test('DB Fetch Xref: WorkflowStep.fetchSystemObjectFromXref', async () => {
        let SO: DBAPI.SystemObject[] | null = null;
        if (workflowStep && systemObjectScene && systemObjectSubject) {
            SO = await workflowStep.fetchSystemObjectFromXref();
            if (SO) {
                expect(SO.length).toBe(2);
                if (SO.length == 2)
                    expect(SO[0].idSystemObject + SO[1].idSystemObject).toBe(systemObjectScene.idSystemObject + systemObjectSubject.idSystemObject);
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Xref: SystemObject.fetchMasterFromXref', async () => {
        let SO: DBAPI.SystemObject[] | null = null;
        if (systemObjectSubject && systemObjectScene) {
            SO = await DBAPI.SystemObject.fetchMasterFromXref(systemObjectScene.idSystemObject);
            if (SO)
                expect(SO.length).toBeGreaterThan(0);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Xref: SystemObject.fetchDerivedFromXref', async () => {
        let SO: DBAPI.SystemObject[] | null = null;
        if (systemObjectAsset && systemObjectScene && systemObjectSubject && systemObjectItem && systemObjectItemNulls) {
            SO = await DBAPI.SystemObject.fetchDerivedFromXref(systemObjectSubject.idSystemObject);
            if (SO) {
                expect(SO.length).toBe(4);
                if (SO.length == 4) {
                    const idChecksumTot: number = systemObjectScene.idSystemObject + systemObjectAsset.idSystemObject
                        + systemObjectItem.idSystemObject + systemObjectItemNulls.idSystemObject;
                    let idChecksum: number = 0;
                    for (let arrayOffset: number = 0; arrayOffset < 4; arrayOffset++)
                        idChecksum += SO[arrayOffset].idSystemObject;
                    expect(idChecksum).toBe(idChecksumTot);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Xref: SystemObjectPairs.fetchMasterFromXref', async () => {
        let SO: DBAPI.SystemObjectPairs[] | null = null;
        if (systemObjectSubject && systemObjectScene) {
            SO = await DBAPI.SystemObjectPairs.fetchMasterFromXref(systemObjectScene.idSystemObject);
            if (SO)
                expect(SO.length).toBeGreaterThan(0);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Xref: SystemObjectPairs.fetchDerivedFromXref', async () => {
        let SO: DBAPI.SystemObjectPairs[] | null = null;
        if (systemObjectAsset && systemObjectScene && systemObjectSubject && systemObjectItem && systemObjectItemNulls &&
            scene && assetThumbnail && item && itemNulls) {
            SO = await DBAPI.SystemObjectPairs.fetchDerivedFromXref(systemObjectSubject.idSystemObject);
            if (SO) {
                expect(SO.length).toBe(4);
                if (SO.length == 4) {
                    let idSceneTot: number = 0;
                    let idAssetTot: number = 0;
                    let idItemTot: number = 0;
                    let idChecksum: number = 0;
                    const idChecksumTot: number = systemObjectAsset.idSystemObject + systemObjectScene.idSystemObject
                        + systemObjectItem.idSystemObject + systemObjectItemNulls.idSystemObject;
                    for (let arrayOffset: number = 0; arrayOffset < 4; arrayOffset++) {
                        const SOO: DBAPI.SystemObjectPairs = SO[arrayOffset];
                        if (SOO.Scene)
                            idSceneTot += SOO.Scene.idScene;
                        if (SOO.Asset)
                            idAssetTot += SOO.Asset.idAsset;
                        if (SOO.Item)
                            idItemTot += SOO.Item.idItem;
                        idChecksum += SO[arrayOffset].idSystemObject;
                    }

                    expect(idChecksum).toEqual(idChecksumTot);
                    expect(idSceneTot).toEqual(scene.idScene);
                    expect(idAssetTot).toEqual(assetThumbnail.idAsset);
                    expect(idItemTot).toEqual(item.idItem + itemNulls.idItem);
                }
            }
        }
        expect(SO).toBeTruthy();
    });
});

// *******************************************************************
// DB Fetch Special Test Suite
// *******************************************************************
describe('DB Fetch Special Test Suite', () => {
    test('DB FetchSpecial: Asset.assetType undefined', async() => {
        let eVocabID: eVocabularyID | undefined = undefined;
        if (assetThumbnail)
            eVocabID = await assetThumbnail.assetType();
        expect(eVocabID).toBeUndefined();
        expect(eVocabID).toBeFalsy();
    });

    test('DB FetchSpecial: Asset.assetType defined', async() => {
        let eVocabID: eVocabularyID | undefined = undefined;
        if (assetBulkIngest)
            eVocabID = await assetBulkIngest.assetType();
        expect(eVocabID).toBeDefined();
        expect(eVocabID).toBeTruthy();
        expect(eVocabID).toEqual(eVocabularyID.eAssetAssetTypeBulkIngestion);
    });

    test('DB FetchSpecial: Asset.setAssetType', async() => {
        expect(assetThumbnail).toBeTruthy();
        if (assetThumbnail) {
            expect(await assetThumbnail.setAssetType(eVocabularyID.eNone)).toBeFalsy();

            const eVocabID: eVocabularyID = eVocabularyID.eAssetAssetTypeOther;
            expect(await assetThumbnail.setAssetType(eVocabID)).toBeTruthy();
            expect(await assetThumbnail.update()).toBeTruthy();

            const assetFetch: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetThumbnail.idAsset);
            expect(assetFetch).toBeTruthy();
            if (assetFetch)
                expect(await assetFetch.assetType()).toEqual(eVocabID);
        }
    });


    test('DB FetchSpecial: Asset.fetchSourceSystemObject 1', async() => {
        let SOAsset: DBAPI.SystemObject | null = null;
        if (assetBulkIngest)
            SOAsset = await assetBulkIngest.fetchSourceSystemObject();
        expect(SOAsset).toBeFalsy();
    });

    test('DB FetchSpecial: Asset.fetchSourceSystemObject 2', async() => {
        let SOAssetSource: DBAPI.SystemObject | null = null;
        if (assetWithoutAG)
            SOAssetSource = await assetWithoutAG.fetchSourceSystemObject();
        expect(SOAssetSource).toBeTruthy();
        expect(SOAssetSource).toEqual(systemObjectSubject);
    });

    test('DB Fetch Special: CaptureData.fetchFromCaptureDataPhoto', async () => {
        let captureDataFetch: DBAPI.CaptureData | null = null;
        if (captureDataPhoto)
            captureDataFetch = await DBAPI.CaptureData.fetchFromCaptureDataPhoto(captureDataPhoto.idCaptureDataPhoto);

        expect(captureDataFetch).toBeTruthy();
        if (captureData)
            expect(captureDataFetch).toMatchObject(captureData);
    });

    test('DB Fetch Special: CaptureData.fetchDerivedFromItems', async () => {
        let captureDataFetch: DBAPI.CaptureData[] | null = null;
        if (item && itemNulls) {
            captureDataFetch = await DBAPI.CaptureData.fetchDerivedFromItems([item.idItem, itemNulls.idItem]);
            if (captureDataFetch && captureData && captureDataNulls) {
                const IDs: number[] = [];
                for (const CD of captureDataFetch)
                    IDs.push(CD.idCaptureData);
                expect(IDs).toEqual(expect.arrayContaining([captureData.idCaptureData, captureDataNulls.idCaptureData]));
            }
        }
        expect(captureDataFetch).toBeTruthy();
    });

    test('DB Fetch Special: Identifier.fetchFromIdentifierValue', async () => {
        const identifierFetch: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromIdentifierValue(identifierValue);
        expect(identifierFetch).toBeTruthy();
        if (identifierFetch && identifier)
            expect(identifierFetch).toMatchObject([identifier]);
    });

    test('DB Fetch Special: Identifier.fetchFromSubjectPreferred', async () => {
        let identifierFetch: DBAPI.Identifier | null = null;
        if (subject) {
            identifierFetch = await DBAPI.Identifier.fetchFromSubjectPreferred(subject.idSubject);
            if (identifierFetch && identifierSubjectHookup)
                expect(identifierFetch).toMatchObject(identifierSubjectHookup);
        }
        expect(identifierFetch).toBeTruthy();
    });

    test('DB Fetch Special: IntermediaryFile.fetchDerivedFromItems', async () => {
        let intermediaryFileFetch: DBAPI.IntermediaryFile[] | null = null;
        if (item && itemNulls) {
            intermediaryFileFetch = await DBAPI.IntermediaryFile.fetchDerivedFromItems([item.idItem, itemNulls.idItem]);
            if (intermediaryFileFetch && intermediaryFile) {
                const IDs: number[] = [];
                for (const IF of intermediaryFileFetch)
                    IDs.push(IF.idIntermediaryFile);
                expect(IDs).toEqual(expect.arrayContaining([intermediaryFile.idIntermediaryFile]));
            }
        }
        expect(intermediaryFileFetch).toBeTruthy();
    });

    test('DB Fetch Special: Item.fetchDerivedFromSubject', async () => {
        let items: DBAPI.Item[] | null = null;
        if (subject && item && itemNulls) {
            items = await DBAPI.Item.fetchDerivedFromSubject(subject.idSubject);
            if (items) {
                expect(items.length).toEqual(2);
                if (items.length == 2)
                    expect(items[0].idItem + items[1].idItem).toEqual(item.idItem + itemNulls.idItem);
            }
        }
        expect(items).toBeTruthy();
    });

    test('DB Fetch Special: Item.fetchMasterFromCaptureDatas', async () => {
        let itemFetch: DBAPI.Item[] | null = null;
        if (captureData && captureDataNulls) {
            itemFetch = await DBAPI.Item.fetchMasterFromCaptureDatas([captureData.idCaptureData, captureDataNulls.idCaptureData]);
            if (itemFetch && item && itemNulls) {
                const itemIDs: number[] = [];
                for (const item of itemFetch)
                    itemIDs.push(item.idItem);
                expect(itemIDs).toEqual(expect.arrayContaining([item.idItem, itemNulls.idItem]));
            }
        }
        expect(itemFetch).toBeTruthy();
    });

    test('DB Fetch Special: Item.fetchMasterFromModels', async () => {
        let itemFetch: DBAPI.Item[] | null = null;
        if (model && modelNulls) {
            itemFetch = await DBAPI.Item.fetchMasterFromModels([model.idModel, modelNulls.idModel]);
            if (itemFetch && item && itemNulls) {
                const itemIDs: number[] = [];
                for (const item of itemFetch)
                    itemIDs.push(item.idItem);
                expect(itemIDs).toEqual(expect.arrayContaining([item.idItem, itemNulls.idItem]));
            }
        }
        expect(itemFetch).toBeTruthy();
    });

    test('DB Fetch Special: Item.fetchMasterFromIntermediaryFiles', async () => {
        let itemFetch: DBAPI.Item[] | null = null;
        if (intermediaryFile) {
            itemFetch = await DBAPI.Item.fetchMasterFromIntermediaryFiles([intermediaryFile.idIntermediaryFile]);
            if (itemFetch && item && itemNulls) {
                const itemIDs: number[] = [];
                for (const item of itemFetch)
                    itemIDs.push(item.idItem);
                expect(itemIDs).toEqual(expect.arrayContaining([item.idItem, itemNulls.idItem]));
            }
        }
        expect(itemFetch).toBeTruthy();
    });

    test('DB Fetch Special: Item.fetchMasterFromScenes', async () => {
        let itemFetch: DBAPI.Item[] | null = null;
        if (scene && sceneNulls) {
            itemFetch = await DBAPI.Item.fetchMasterFromScenes([scene.idScene, sceneNulls.idScene]);
            if (itemFetch && item && itemNulls) {
                const itemIDs: number[] = [];
                for (const item of itemFetch)
                    itemIDs.push(item.idItem);
                expect(itemIDs).toEqual(expect.arrayContaining([item.idItem, itemNulls.idItem]));
            }
        }
        expect(itemFetch).toBeTruthy();
    });

    test('DB Fetch Special: Model.fetchDerivedFromItems', async () => {
        let modelFetch: DBAPI.Model[] | null = null;
        if (item && itemNulls) {
            modelFetch = await DBAPI.Model.fetchDerivedFromItems([item.idItem, itemNulls.idItem]);
            if (modelFetch && model && modelNulls) {
                const IDs: number[] = [];
                for (const M of modelFetch)
                    IDs.push(M.idModel);
                expect(IDs).toEqual(expect.arrayContaining([model.idModel, modelNulls.idModel]));
            }
        }
        expect(modelFetch).toBeTruthy();
    });

    test('DB Fetch Special: Project.fetchMasterFromSubjects', async () => {
        let projectFetch: DBAPI.Project[] | null = null;
        if (subject && subjectNulls) {
            projectFetch = await DBAPI.Project.fetchMasterFromSubjects([subject.idSubject, subjectNulls.idSubject]);
            if (projectFetch && project && project2)
                expect(projectFetch).toEqual(expect.arrayContaining([project, project2]));
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch Special: Project.fetchMasterFromStakeholders', async () => {
        let projectFetch: DBAPI.Project[] | null = null;
        if (stakeholder) {
            projectFetch = await DBAPI.Project.fetchMasterFromStakeholders([stakeholder.idStakeholder]);
            if (projectFetch && project && project2)
                expect(projectFetch).toEqual(expect.arrayContaining([project, project2]));
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch Special: Project.fetchMasterFromProjectDocumentations', async () => {
        let projectFetch: DBAPI.Project[] | null = null;
        if (projectDocumentation) {
            projectFetch = await DBAPI.Project.fetchMasterFromProjectDocumentations([projectDocumentation.idProjectDocumentation]);
            if (projectFetch && project && project2)
                expect(projectFetch).toEqual(expect.arrayContaining([project]));
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch Special: Project.fetchDerivedFromUnits', async () => {
        let projectFetch: DBAPI.Project[] | null = null;
        if (unit && unit2) {
            projectFetch = await DBAPI.Project.fetchDerivedFromUnits([unit.idUnit, unit2.idUnit]);
            if (projectFetch && project && project2)
                expect(projectFetch).toEqual(expect.arrayContaining([project, project2]));
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch Project: Project.fetchFromSubjectsUnits', async () => {
        let projectFetch: DBAPI.Project[] | null = null;
        if (subject && subjectNulls) {
            projectFetch = await DBAPI.Project.fetchDerivedFromSubjectsUnits([subject.idSubject, subjectNulls.idSubject]);
            if (projectFetch && project && project2)
                expect(projectFetch).toEqual(expect.arrayContaining([project, project2]));
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch Special: ProjectDocumentation.fetchDerivedFromProjects', async () => {
        let projectDocumentationFetch: DBAPI.ProjectDocumentation[] | null = null;
        if (project && project2) {
            projectDocumentationFetch = await DBAPI.ProjectDocumentation.fetchDerivedFromProjects([project.idProject, project2.idProject]);
            if (projectDocumentationFetch && projectDocumentation)
                expect(projectDocumentationFetch).toEqual(expect.arrayContaining([projectDocumentation]));
        }
        expect(projectDocumentationFetch).toBeTruthy();
    });

    test('DB Fetch Special: Scene.fetchDerivedFromItems', async () => {
        let sceneFetch: DBAPI.Scene[] | null = null;
        if (item && itemNulls) {
            sceneFetch = await DBAPI.Scene.fetchDerivedFromItems([item.idItem, itemNulls.idItem]);
            if (sceneFetch && scene && sceneNulls) {
                const IDs: number[] = [];
                for (const S of sceneFetch)
                    IDs.push(S.idScene);
                expect(IDs).toEqual(expect.arrayContaining([scene.idScene, sceneNulls.idScene]));
            }
        }
        expect(sceneFetch).toBeTruthy();
    });

    test('DB Fetch Special: Stakeholder.fetchDerivedFromProjects', async () => {
        let stakeholderFetch: DBAPI.Stakeholder[] | null = null;
        if (project && project2) {
            stakeholderFetch = await DBAPI.Stakeholder.fetchDerivedFromProjects([project.idProject, project2.idProject]);
            if (stakeholderFetch && stakeholder)
                expect(stakeholderFetch).toEqual(expect.arrayContaining([stakeholder]));
        }
        expect(stakeholderFetch).toBeTruthy();
    });

    test('DB Fetch Special: SystemObjectXref.fetchXref', async () => {
        let xrefFetch: DBAPI.SystemObjectXref[] | null = null;
        if (systemObjectSubject && systemObjectScene) {
            xrefFetch = await DBAPI.SystemObjectXref.fetchXref(systemObjectSubject.idSystemObject, systemObjectScene.idSystemObject);
            if (xrefFetch && systemObjectXref)
                expect(xrefFetch).toEqual(expect.arrayContaining([systemObjectXref]));
        }
        expect(xrefFetch).toBeTruthy();
    });

    test('DB Fetch Special: Unit.fetchMasterFromProjects', async () => {
        let unitFetch: DBAPI.Unit[] | null = null;
        if (project && project2) {
            unitFetch = await DBAPI.Unit.fetchMasterFromProjects([project.idProject, project2.idProject]);
            if (unitFetch && unit && unit2)
                expect(unitFetch).toEqual(expect.arrayContaining([unit, unit2]));
        }
        expect(unitFetch).toBeTruthy();
    });

    test('DB Fetch Special: Unit.fetchFromUnitEdanAbbreviation', async () => {
        let unitFetch: DBAPI.Unit[] | null = null;
        if (unitEdan) {
            unitFetch = await DBAPI.Unit.fetchFromUnitEdanAbbreviation(unitEdan.Abbreviation);
            if (unitFetch && unit)
                expect(unitFetch).toEqual(expect.arrayContaining([unit]));
        }
        expect(unitFetch).toBeTruthy();
    });

    test('DB Fetch Special: Unit.fetchFromNameSearch', async () => {
        let unitFetch: DBAPI.Unit[] | null = null;
        if (unitEdan) {
            unitFetch = await DBAPI.Unit.fetchFromNameSearch(unitEdan.Abbreviation);
            if (unitFetch && unit)
                expect(unitFetch).toEqual(expect.arrayContaining([unit]));
        }
        expect(unitFetch).toBeTruthy();
    });

    test('DB Fetch Special: UnitEdan.fetchFromUnit', async () => {
        let unitEdanFetch: DBAPI.UnitEdan[] | null = null;
        if (unit) {
            unitEdanFetch = await DBAPI.UnitEdan.fetchFromUnit(unit.idUnit);
            if (unitEdanFetch && unitEdan)
                expect(unitEdanFetch).toEqual(expect.arrayContaining([unitEdan]));
        }
        expect(unitEdanFetch).toBeTruthy();
    });

    test('DB Fetch Special: UnitEdan.fetchFromAbbreviation', async () => {
        let unitEdanFetch: DBAPI.UnitEdan | null = null;
        if (unitEdan) {
            unitEdanFetch = await DBAPI.UnitEdan.fetchFromAbbreviation(unitEdan.Abbreviation);
            if (unitEdanFetch)
                expect(unitEdanFetch).toEqual(unitEdan);
        }
        expect(unitEdanFetch).toBeTruthy();
    });
});

// *******************************************************************
// DB Update Test Suite
// *******************************************************************
describe('DB Update Test Suite', () => {
    test('DB Update: AccessAction.update', async () => {
        let bUpdated: boolean = false;
        if (accessAction) {
            const updatedName: string = 'Updated Test Access Action';
            accessAction.Name   = updatedName;
            bUpdated            = await accessAction.update();

            const accessActionFetch: DBAPI.AccessAction | null = await DBAPI.AccessAction.fetch(accessAction.idAccessAction);
            expect(accessActionFetch).toBeTruthy();
            if (accessActionFetch)
                expect(accessActionFetch.Name).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: AccessContext.update', async () => {
        let bUpdated: boolean = false;
        if (accessContext) {
            const updatedGlobal: boolean = true;
            accessContext.Global = updatedGlobal;
            bUpdated = await accessContext.update();

            const accessContextFetch: DBAPI.AccessContext | null = await DBAPI.AccessContext.fetch(accessContext.idAccessContext);
            expect(accessContextFetch).toBeTruthy();
            if (accessContextFetch)
                expect(accessContextFetch.Global).toBe(updatedGlobal);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: AccessContextObject.update', async () => {
        let bUpdated: boolean = false;
        if (accessContextObject) {
            const accessContext2: DBAPI.AccessContext | null = new DBAPI.AccessContext(
                { Global: false, Authoritative: false, CaptureData: false, Model: false, Scene: false, IntermediaryFile: false, idAccessContext: 0 }
            );

            expect(await accessContext2.create()).toBeTruthy();
            expect(accessContext2.idAccessContext).toBeGreaterThan(0);
            expect(accessContext2.idAccessContext).toBeGreaterThan(accessContextObject.idAccessContext);

            accessContextObject.idAccessContext = accessContext2.idAccessContext;
            bUpdated = await accessContextObject.update();

            const accessContextObjectFetch: DBAPI.AccessContextObject | null = await DBAPI.AccessContextObject.fetch(accessContextObject.idAccessContextObject);
            expect(accessContextObjectFetch).toBeTruthy();
            if (accessContextObjectFetch)
                expect(accessContextObjectFetch.idAccessContext).toBe(accessContext2.idAccessContext);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: AccessPolicy.update', async () => {
        let bUpdated: boolean = false;
        if (accessPolicy && accessRole) {
            const accessRole2: DBAPI.AccessRole | null =new DBAPI.AccessRole({ Name: 'Test AccessRole 2', idAccessRole: 0 });
            expect(await accessRole2.create()).toBeTruthy();
            expect(accessRole2.idAccessRole).toBeGreaterThan(0);
            expect(accessRole2.idAccessRole).toBeGreaterThan(accessRole.idAccessRole);

            accessPolicy.idAccessRole = accessRole2.idAccessRole;
            bUpdated = await accessPolicy.update();

            const accessPolicyFetch: DBAPI.AccessPolicy | null = await DBAPI.AccessPolicy.fetch(accessPolicy.idAccessPolicy);
            expect(accessPolicyFetch).toBeTruthy();
            if (accessPolicyFetch)
                expect(accessPolicyFetch.idAccessRole).toBe(accessRole2.idAccessRole);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: AccessRole.update', async () => {
        let bUpdated: boolean = false;
        if (accessRole) {
            const updatedName: string = 'Updated Test Access Role';
            accessRole.Name   = updatedName;
            bUpdated          = await accessRole.update();

            const accessRoleFetch: DBAPI.AccessRole | null = await DBAPI.AccessRole.fetch(accessRole.idAccessRole);
            expect(accessRoleFetch).toBeTruthy();
            if (accessRoleFetch)
                expect(accessRoleFetch.Name).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: AccessRoleAccessActionXref.update', async () => {
        let bUpdated: boolean = false;
        if (accessRoleAccessActionXref && accessAction2) {
            accessRoleAccessActionXref.idAccessAction = accessAction2.idAccessAction;
            bUpdated = await accessRoleAccessActionXref.update();

            const accessRoleAccessActionXrefFetch: DBAPI.AccessRoleAccessActionXref | null =
                await DBAPI.AccessRoleAccessActionXref.fetch(accessRoleAccessActionXref.idAccessRoleAccessActionXref);
            expect(accessRoleAccessActionXrefFetch).toBeTruthy();
            if (accessRoleAccessActionXrefFetch)
                expect(accessRoleAccessActionXrefFetch.idAccessAction).toBe(accessAction2.idAccessAction);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Actor.update', async () => {
        let bUpdated: boolean = false;
        if (actorWithOutUnit && unit2) {
            const SOOld: DBAPI.SystemObject | null = await actorWithOutUnit.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            const updatedName: string = 'Updated Test ActorName';
            actorWithOutUnit.IndividualName = updatedName;
            actorWithOutUnit.idUnit = unit2.idUnit;
            bUpdated = await actorWithOutUnit.update();

            const actorFetch: DBAPI.Actor | null = await DBAPI.Actor.fetch(actorWithOutUnit.idActor);
            expect(actorFetch).toBeTruthy();
            if (actorFetch) {
                expect(actorFetch.IndividualName).toBe(updatedName);
                expect(actorFetch.idUnit).toBe(unit2.idUnit);

                const SONew: DBAPI.SystemObject | null = await actorFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Actor.update disconnect', async () => {
        let bUpdated: boolean = false;
        if (actorWithOutUnit) {
            actorWithOutUnit.idUnit = null;
            bUpdated = await actorWithOutUnit.update();

            const actorFetch: DBAPI.Actor | null = await DBAPI.Actor.fetch(actorWithOutUnit.idActor);
            expect(actorFetch).toBeTruthy();
            if (actorFetch)
                expect(actorFetch.idUnit).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Actor.update disconnect already null', async () => {
        let bUpdated: boolean = false;
        if (actorWithOutUnit) {
            expect(actorWithOutUnit.idUnit).toBeNull();
            actorWithOutUnit.idUnit = null;
            bUpdated = await actorWithOutUnit.update();

            const actorFetch: DBAPI.Actor | null = await DBAPI.Actor.fetch(actorWithOutUnit.idActor);
            expect(actorFetch).toBeTruthy();
            if (actorFetch)
                expect(actorFetch.idUnit).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Asset.update', async () => {
        let bUpdated: boolean = false;
        if (assetThumbnail && assetGroup2 && vocabulary2 && systemObjectSubject) {
            const SOOld: DBAPI.SystemObject | null = await assetThumbnail.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            assetThumbnail.idAssetGroup = assetGroup2.idAssetGroup;
            assetThumbnail.idVAssetType = vocabulary2.idVocabulary;
            assetThumbnail.idSystemObject = systemObjectSubject.idSystemObject;
            bUpdated = await assetThumbnail.update();

            const assetFetch: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetThumbnail.idAsset);
            expect(assetFetch).toBeTruthy();
            if (assetFetch) {
                expect(assetFetch.idAssetGroup).toBe(assetGroup2.idAssetGroup);
                expect(assetFetch.idVAssetType).toBe(vocabulary2.idVocabulary);
                expect(assetFetch.idSystemObject).toBe(systemObjectSubject.idSystemObject);

                const SONew: DBAPI.SystemObject | null = await assetFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }

        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Asset.update disconnect', async () => {
        let bUpdated: boolean = false;
        if (assetThumbnail) {
            assetThumbnail.idAssetGroup = null;
            assetThumbnail.idSystemObject = null;
            bUpdated = await assetThumbnail.update();

            const assetFetch: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetThumbnail.idAsset);
            expect(assetFetch).toBeTruthy();
            if (assetFetch)
                expect(assetFetch.idAssetGroup).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Asset.update disconnect already null', async () => {
        let bUpdated: boolean = false;
        if (assetThumbnail) {
            expect(assetThumbnail.idAssetGroup).toBeNull();
            bUpdated = await assetThumbnail.update();

            const assetFetch: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetThumbnail.idAsset);
            expect(assetFetch).toBeTruthy();
            if (assetFetch)
                expect(assetFetch.idAssetGroup).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: AssetGroup.update', async () => {
        let bUpdated: boolean = false;
        if (assetGroup) {
            bUpdated            = await assetGroup.update();

            const assetGroupFetch: DBAPI.AssetGroup | null = await DBAPI.AssetGroup.fetch(assetGroup.idAssetGroup);
            expect(assetGroupFetch).toBeTruthy();
            if (assetGroupFetch)
                expect(assetGroupFetch.idAssetGroup).toBe(assetGroup.idAssetGroup);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: AssetVersion.update', async () => {
        let bUpdated: boolean = false;
        if (assetVersion && assetWithoutAG) {
            const SOOld: DBAPI.SystemObject | null = await assetVersion.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            assetVersion.idAsset = assetWithoutAG.idAsset;
            bUpdated            = await assetVersion.update();

            const assetVersionFetch: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(assetVersion.idAssetVersion);
            expect(assetVersionFetch).toBeTruthy();
            if (assetVersionFetch) {
                expect(assetVersionFetch.idAsset).toBe(assetWithoutAG.idAsset);

                const SONew: DBAPI.SystemObject | null = await assetVersionFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Creation: AssetVersion.delete', async () => {
        let assetVersion3: DBAPI.AssetVersion | null = null;
        if (assetThumbnail && user) {
            assetVersion3 = await UTIL.createAssetVersionTest({
                idAsset: assetThumbnail.idAsset,
                Version: 0,
                FileName: assetThumbnail.FileName,
                idUserCreator: user.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum',
                StorageSize: 50,
                StorageKeyStaging: '',
                Ingested: true,
                idAssetVersion: 0
            });

            const idAssetVersion: number = assetVersion3.idAssetVersion;
            expect(idAssetVersion).toBeTruthy();

            // First delete should work
            expect(await assetVersion3.delete()).toBeTruthy();

            // Fetch of deleted object should find nothing
            const assetVersionFetch: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(idAssetVersion);
            expect(assetVersionFetch).toBeFalsy();

            // Second delete should fail
            LOG.logger.info('IGNORE the next error from prisma! It is expected');
            expect(await assetVersion3.delete()).toBeFalsy();

            // Final delete with empty ID should fail
            assetVersion3.idAssetVersion = 0;
            expect(await assetVersion3.delete()).toBeFalsy();
        }
        expect(assetVersion3).toBeTruthy();
    });


    test('DB Update: CaptureData.update', async () => {
        let bUpdated: boolean = false;
        if (captureData && assetWithoutAG) {
            const SOOld: DBAPI.SystemObject | null = await captureData.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            captureData.idAssetThumbnail = assetWithoutAG.idAsset;
            bUpdated = await captureData.update();

            const captureDataFetch: DBAPI.CaptureData | null = await DBAPI.CaptureData.fetch(captureData.idCaptureData);
            expect(captureDataFetch).toBeTruthy();
            if (captureDataFetch) {
                expect(captureDataFetch.idAssetThumbnail).toBe(assetWithoutAG.idAsset);

                const SONew: DBAPI.SystemObject | null = await captureDataFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureData.update full disconnect', async () => {
        let bUpdated: boolean = false;
        if (captureData) {
            captureData.idAssetThumbnail = null;
            bUpdated = await captureData.update();

            const captureDataFetch: DBAPI.CaptureData | null = await DBAPI.CaptureData.fetch(captureData.idCaptureData);
            expect(captureDataFetch).toBeTruthy();
            if (captureDataFetch)
                expect(captureDataFetch.idAssetThumbnail).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureData.update when null', async () => {
        let bUpdated: boolean = false;
        if (captureData) {
            const updated: string = 'Updated CaptureData Description 2';
            captureData.Description = updated;
            bUpdated = await captureData.update();

            const captureDataFetch: DBAPI.CaptureData | null = await DBAPI.CaptureData.fetch(captureData.idCaptureData);
            expect(captureDataFetch).toBeTruthy();
            if (captureDataFetch)
                expect(captureDataFetch.Description).toEqual(updated);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureDataFile.update', async () => {
        let bUpdated: boolean = false;
        if (captureDataFile && assetWithoutAG) {
            captureDataFile.idAsset = assetWithoutAG.idAsset;
            bUpdated = await captureDataFile.update();

            const captureDataFileFetch: DBAPI.CaptureDataFile | null = await DBAPI.CaptureDataFile.fetch(captureDataFile.idCaptureDataFile);
            expect(captureDataFileFetch).toBeTruthy();
            if (captureDataFileFetch)
                expect(captureDataFileFetch.idAsset).toBe(assetWithoutAG.idAsset);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureDataGroup.update', async () => {
        let bUpdated: boolean = false;
        if (captureDataGroup) {
            bUpdated = await captureDataGroup.update();

            const captureDataGroupFetch: DBAPI.CaptureDataGroup | null = await DBAPI.CaptureDataGroup.fetch(captureDataGroup.idCaptureDataGroup);
            expect(captureDataGroupFetch).toBeTruthy();
            if (captureDataGroupFetch)
                expect(captureDataGroupFetch.idCaptureDataGroup).toBe(captureDataGroup.idCaptureDataGroup);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureDataGroupCaptureDataXref.update', async () => {
        let bUpdated: boolean = false;
        if (captureDataGroupCaptureDataXref && captureDataNulls) {
            captureDataGroupCaptureDataXref.idCaptureData = captureDataNulls.idCaptureData;
            bUpdated = await captureDataGroupCaptureDataXref.update();

            const captureDataGroupCaptureDataXrefFetch: DBAPI.CaptureDataGroupCaptureDataXref | null = await DBAPI.CaptureDataGroupCaptureDataXref.fetch(captureDataGroupCaptureDataXref.idCaptureDataGroupCaptureDataXref);
            expect(captureDataGroupCaptureDataXrefFetch).toBeTruthy();
            if (captureDataGroupCaptureDataXrefFetch)
                expect(captureDataGroupCaptureDataXrefFetch.idCaptureData).toBe(captureDataNulls.idCaptureData);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureDataPhoto.update', async () => {
        let bUpdated: boolean = false;
        if (captureDataPhoto) {
            captureDataPhoto.CameraSettingsUniform = true;
            bUpdated = await captureDataPhoto.update();

            const captureDataPhotoFetch: DBAPI.CaptureDataPhoto | null = await DBAPI.CaptureDataPhoto.fetch(captureDataPhoto.idCaptureDataPhoto);
            expect(captureDataPhotoFetch).toBeTruthy();
            if (captureDataPhotoFetch)
                expect(captureDataPhotoFetch.CameraSettingsUniform).toBe(true);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureDataPhoto.update partial disconnect', async () => {
        let bUpdated: boolean = false;
        if (captureDataPhoto) {
            captureDataPhoto.idVBackgroundRemovalMethod = null;
            bUpdated = await captureDataPhoto.update();

            const captureDataPhotoFetch: DBAPI.CaptureDataPhoto | null = await DBAPI.CaptureDataPhoto.fetch(captureDataPhoto.idCaptureDataPhoto);
            expect(captureDataPhotoFetch).toBeTruthy();
            if (captureDataPhotoFetch) {
                expect(captureDataPhotoFetch.idVBackgroundRemovalMethod).toBeNull();
                expect(captureDataPhotoFetch.idVClusterType).not.toBeNull();
                expect(captureDataPhotoFetch.idVFocusType).not.toBeNull();
                expect(captureDataPhotoFetch.idVItemPositionType).not.toBeNull();
                expect(captureDataPhotoFetch.idVLightSourceType).not.toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureDataPhoto.update full disconnect', async () => {
        let bUpdated: boolean = false;
        if (captureDataPhoto) {
            captureDataPhoto.idVBackgroundRemovalMethod = null;
            captureDataPhoto.idVClusterType = null;
            captureDataPhoto.idVFocusType = null;
            captureDataPhoto.idVItemPositionType = null;
            captureDataPhoto.idVLightSourceType = null;
            bUpdated = await captureDataPhoto.update();

            const captureDataPhotoFetch: DBAPI.CaptureDataPhoto | null = await DBAPI.CaptureDataPhoto.fetch(captureDataPhoto.idCaptureDataPhoto);
            expect(captureDataPhotoFetch).toBeTruthy();
            if (captureDataPhotoFetch) {
                expect(captureDataPhotoFetch.idVBackgroundRemovalMethod).toBeNull();
                expect(captureDataPhotoFetch.idVClusterType).toBeNull();
                expect(captureDataPhotoFetch.idVFocusType).toBeNull();
                expect(captureDataPhotoFetch.idVItemPositionType).toBeNull();
                expect(captureDataPhotoFetch.idVLightSourceType).toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureDataPhoto.update when null', async () => {
        let bUpdated: boolean = false;
        if (captureDataPhoto) {
            captureDataPhoto.CameraSettingsUniform = false;
            bUpdated = await captureDataPhoto.update();

            const captureDataPhotoFetch: DBAPI.CaptureDataPhoto | null = await DBAPI.CaptureDataPhoto.fetch(captureDataPhoto.idCaptureDataPhoto);
            expect(captureDataPhotoFetch).toBeTruthy();
            if (captureDataPhotoFetch)
                expect(captureDataPhotoFetch.CameraSettingsUniform).toEqual(false);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: GeoLocation.update', async () => {
        let bUpdated: boolean = false;
        if (geoLocation) {
            geoLocation.R0 = -1;
            bUpdated = await geoLocation.update();

            const geoLocationFetch: DBAPI.GeoLocation | null = await DBAPI.GeoLocation.fetch(geoLocation.idGeoLocation);
            expect(geoLocationFetch).toBeTruthy();
            if (geoLocationFetch)
                expect(geoLocationFetch.R0).toBe(-1);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Identifier.update', async () => {
        let bUpdated: boolean = false;
        if (identifier) {
            const updatedValue: string = 'Updated Identifier';
            identifier.IdentifierValue = updatedValue;
            bUpdated = await identifier.update();

            const identifierFetch: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(identifier.idIdentifier);
            expect(identifierFetch).toBeTruthy();
            if (identifierFetch)
                expect(identifierFetch.IdentifierValue).toBe(updatedValue);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Identifier.update disconnect', async () => {
        let bUpdated: boolean = false;
        if (identifier) {
            identifier.idSystemObject = null;
            bUpdated = await identifier.update();

            const identifierFetch: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(identifier.idIdentifier);
            expect(identifierFetch).toBeTruthy();
            if (identifierFetch)
                expect(identifierFetch.idSystemObject).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Identifier.update disconnect already null', async () => {
        let bUpdated: boolean = false;
        if (identifier) {
            expect(identifier.idSystemObject).toBeNull();
            bUpdated = await identifier.update();

            const identifierFetch: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(identifier.idIdentifier);
            expect(identifierFetch).toBeTruthy();
            if (identifierFetch)
                expect(identifierFetch.idSystemObject).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: IntermediaryFile.update', async () => {
        let bUpdated: boolean = false;
        if (intermediaryFile && assetWithoutAG) {
            const SOOld: DBAPI.SystemObject | null = await intermediaryFile.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            intermediaryFile.idAsset = assetWithoutAG.idAsset;
            bUpdated = await intermediaryFile.update();

            const intermediaryFileFetch: DBAPI.IntermediaryFile | null = await DBAPI.IntermediaryFile.fetch(intermediaryFile.idIntermediaryFile);
            expect(intermediaryFileFetch).toBeTruthy();
            if (intermediaryFileFetch) {
                expect(intermediaryFileFetch.idAsset).toBe(assetWithoutAG.idAsset);

                const SONew: DBAPI.SystemObject | null = await intermediaryFileFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Item.update', async () => {
        let bUpdated: boolean = false;
        if (item && assetWithoutAG) {
            const SOOld: DBAPI.SystemObject | null = await item.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            const updatedName: string = 'Updated Test Item';
            item.Name = updatedName;
            item.idAssetThumbnail = assetWithoutAG.idAsset;
            bUpdated = await item.update();

            const itemFetch: DBAPI.Item | null = await DBAPI.Item.fetch(item.idItem);
            expect(itemFetch).toBeTruthy();
            if (itemFetch) {
                expect(itemFetch.Name).toBe(updatedName);
                expect(itemFetch.idAssetThumbnail).toBe(assetWithoutAG.idAsset);

                const SONew: DBAPI.SystemObject | null = await itemFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Item.update partial disconnect', async () => {
        let bUpdated: boolean = false;
        if (item) {
            item.idAssetThumbnail = null;
            bUpdated = await item.update();

            const itemFetch: DBAPI.Item | null = await DBAPI.Item.fetch(item.idItem);
            expect(itemFetch).toBeTruthy();
            if (itemFetch)
                expect(itemFetch.idAssetThumbnail).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Item.update full disconnect', async () => {
        let bUpdated: boolean = false;
        if (item) {
            expect(item.idAssetThumbnail).toBeNull();
            item.idGeoLocation = null;
            bUpdated = await item.update();

            const itemFetch: DBAPI.Item | null = await DBAPI.Item.fetch(item.idItem);
            expect(itemFetch).toBeTruthy();
            if (itemFetch) {
                expect(itemFetch.idAssetThumbnail).toBeNull();
                expect(itemFetch.idGeoLocation).toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Item.update when null', async () => {
        let bUpdated: boolean = false;
        if (item) {
            expect(item.idAssetThumbnail).toBeNull();
            const updated: string = 'Updated Item Name 2';
            item.Name = updated;
            bUpdated = await item.update();

            const itemFetch: DBAPI.Item | null = await DBAPI.Item.fetch(item.idItem);
            expect(itemFetch).toBeTruthy();
            if (itemFetch)
                expect(itemFetch.Name).toEqual(updated);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Job.update', async () => {
        let bUpdated: boolean = false;
        if (job) {
            const updated: string = 'Updated Job Name';
            job.Name = updated;
            bUpdated = await job.update();

            const jobFetch: DBAPI.Job | null = await DBAPI.Job.fetch(job.idJob);
            expect(jobFetch).toBeTruthy();
            if (jobFetch)
                expect(jobFetch.Name).toBe(updated);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: JobTask.update', async () => {
        let bUpdated: boolean = false;
        if (jobTask && vocabulary2) {
            const updated: string = 'Updated Job State';
            jobTask.State = updated;
            jobTask.idVJobType = vocabulary2.idVocabulary;
            bUpdated = await jobTask.update();

            const jobTaskFetch: DBAPI.JobTask | null = await DBAPI.JobTask.fetch(jobTask.idJobTask);
            expect(jobTaskFetch).toBeTruthy();
            if (jobTaskFetch) {
                expect(jobTaskFetch.State).toBe(updated);
                expect(jobTaskFetch.idVJobType).toBe(vocabulary2.idVocabulary);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: JobTaskCook.update', async () => {
        let bUpdated: boolean = false;
        if (jobTaskCook) {
            const updated: string = 'Updated Job ID';
            jobTaskCook.JobID = updated;
            bUpdated = await jobTaskCook.update();

            const jobTaskCookFetch: DBAPI.JobTaskCook | null = await DBAPI.JobTaskCook.fetch(jobTaskCook.idJobTaskCook);
            expect(jobTaskCookFetch).toBeTruthy();
            if (jobTaskCookFetch)
                expect(jobTaskCookFetch.JobID).toBe(updated);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: License.update', async () => {
        let bUpdated: boolean = false;
        if (license) {
            const updatedName: string = 'Updated Test License';
            license.Name   = updatedName;
            bUpdated = await license.update();

            const licenseFetch: DBAPI.License | null = await DBAPI.License.fetch(license.idLicense);
            expect(licenseFetch).toBeTruthy();
            if (licenseFetch)
                expect(licenseFetch.Name).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: LicenseAssignment.update', async () => {
        let bUpdated: boolean = false;
        if (licenseAssignmentNull && user) {
            licenseAssignmentNull.idUserCreator = user.idUser;
            bUpdated = await licenseAssignmentNull.update();

            const licenseAssignmentFetch: DBAPI.LicenseAssignment | null = await DBAPI.LicenseAssignment.fetch(licenseAssignmentNull.idLicenseAssignment);
            expect(licenseAssignmentFetch).toBeTruthy();
            if (licenseAssignmentFetch)
                expect(licenseAssignmentFetch.idUserCreator).toBe(user.idUser);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: LicenseAssignment.update partial disconnect', async () => {
        let bUpdated: boolean = false;
        if (licenseAssignment) {
            licenseAssignment.idUserCreator = null;
            bUpdated = await licenseAssignment.update();

            const licenseAssignmentFetch: DBAPI.LicenseAssignment | null = await DBAPI.LicenseAssignment.fetch(licenseAssignment.idLicenseAssignment);
            expect(licenseAssignmentFetch).toBeTruthy();
            if (licenseAssignmentFetch)
                expect(licenseAssignmentFetch.idUserCreator).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: LicenseAssignment.update full disconnect', async () => {
        let bUpdated: boolean = false;
        if (licenseAssignment) {
            expect(licenseAssignment.idUserCreator).toBeNull();
            licenseAssignment.idSystemObject = null;
            bUpdated = await licenseAssignment.update();

            const licenseAssignmentFetch: DBAPI.LicenseAssignment | null = await DBAPI.LicenseAssignment.fetch(licenseAssignment.idLicenseAssignment);
            expect(licenseAssignmentFetch).toBeTruthy();
            if (licenseAssignmentFetch)
                expect(licenseAssignmentFetch.idSystemObject).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Metadata.update', async () => {
        let bUpdated: boolean = false;
        if (metadataNull && assetThumbnail && user) {
            metadataNull.idAssetValue = assetThumbnail.idAsset;
            metadataNull.idUser = user.idUser;
            bUpdated = await metadataNull.update();

            const metadataFetch: DBAPI.Metadata | null = await DBAPI.Metadata.fetch(metadataNull.idMetadata);
            expect(metadataFetch).toBeTruthy();
            if (metadataFetch) {
                expect(metadataFetch.idAssetValue).toBe(assetThumbnail.idAsset);
                expect(metadataFetch.idUser).toEqual(user.idUser);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Metadata.update disconnect partial', async () => {
        let bUpdated: boolean = false;
        if (metadata) {
            metadata.idAssetValue = null;
            metadata.idUser = null;
            bUpdated = await metadata.update();

            const metadataFetch: DBAPI.Metadata | null = await DBAPI.Metadata.fetch(metadata.idMetadata);
            expect(metadataFetch).toBeTruthy();
            if (metadataFetch) {
                expect(metadataFetch.idAssetValue).toBeNull();
                expect(metadataFetch.idUser).toBeNull();
                expect(metadataFetch.idVMetadataSource).not.toBeNull();
                expect(metadataFetch.idSystemObject).not.toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Metadata.update disconnect full', async () => {
        let bUpdated: boolean = false;
        if (metadata) {
            metadata.idAssetValue = null;
            metadata.idUser = null;
            metadata.idVMetadataSource = null;
            metadata.idSystemObject = null;
            bUpdated = await metadata.update();

            const metadataFetch: DBAPI.Metadata | null = await DBAPI.Metadata.fetch(metadata.idMetadata);
            expect(metadataFetch).toBeTruthy();
            if (metadataFetch) {
                expect(metadataFetch.idAssetValue).toBeNull();
                expect(metadataFetch.idUser).toBeNull();
                expect(metadataFetch.idVMetadataSource).toBeNull();
                expect(metadataFetch.idSystemObject).toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Metadata.update when null', async () => {
        let bUpdated: boolean = false;
        if (metadata) {
            const updated: string = 'Test Metadata Name Update';
            metadata.Name = updated;
            bUpdated = await metadata.update();

            const metadataFetch: DBAPI.Metadata | null = await DBAPI.Metadata.fetch(metadata.idMetadata);
            expect(metadataFetch).toBeTruthy();
            if (metadataFetch)
                expect(metadataFetch.Name).toEqual(updated);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Model.update', async () => {
        let bUpdated: boolean = false;
        if (modelNulls && assetThumbnail) {
            const SOOld: DBAPI.SystemObject | null = await modelNulls.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            modelNulls.idAssetThumbnail = assetThumbnail.idAsset;
            bUpdated = await modelNulls.update();

            const modelFetch: DBAPI.Model | null = await DBAPI.Model.fetch(modelNulls.idModel);
            expect(modelFetch).toBeTruthy();
            if (modelFetch) {
                expect(modelFetch.idAssetThumbnail).toBe(assetThumbnail.idAsset);

                const SONew: DBAPI.SystemObject | null = await modelFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Model.update disconnect', async () => {
        let bUpdated: boolean = false;
        if (modelNulls) {
            modelNulls.idAssetThumbnail = null;
            bUpdated = await modelNulls.update();

            const modelFetch: DBAPI.Model | null = await DBAPI.Model.fetch(modelNulls.idModel);
            expect(modelFetch).toBeTruthy();
            if (modelFetch)
                expect(modelFetch.idAssetThumbnail).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Model.update disconnect null', async () => {
        let bUpdated: boolean = false;
        if (modelNulls) {
            expect(modelNulls.idAssetThumbnail).toBeNull();
            bUpdated = await modelNulls.update();

            const modelFetch: DBAPI.Model | null = await DBAPI.Model.fetch(modelNulls.idModel);
            expect(modelFetch).toBeTruthy();
            if (modelFetch)
                expect(modelFetch.idAssetThumbnail).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelGeometryFile.update', async () => {
        let bUpdated: boolean = false;
        if (modelGeometryFileNulls) {
            const roughness: number = 2.0;
            modelGeometryFileNulls.Roughness = roughness;
            bUpdated = await modelGeometryFileNulls.update();

            const modelGeometryFileFetch: DBAPI.ModelGeometryFile | null = await DBAPI.ModelGeometryFile.fetch(modelGeometryFileNulls.idModelGeometryFile);
            expect(modelGeometryFileFetch).toBeTruthy();
            if (modelGeometryFileFetch)
                expect(modelGeometryFileFetch.Roughness).toBe(roughness);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelProcessingAction.update', async () => {
        let bUpdated: boolean = false;
        if (modelProcessingAction) {
            const toolsUsed: string = 'Updated Tools Used';
            modelProcessingAction.ToolsUsed = toolsUsed;
            bUpdated            = await modelProcessingAction.update();

            const modelProcessingActionFetch: DBAPI.ModelProcessingAction | null = await DBAPI.ModelProcessingAction.fetch(modelProcessingAction.idModelProcessingAction);
            expect(modelProcessingActionFetch).toBeTruthy();
            if (modelProcessingActionFetch)
                expect(modelProcessingActionFetch.ToolsUsed).toBe(toolsUsed);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelProcessingActionStep.update', async () => {
        let bUpdated: boolean = false;
        if (modelProcessingActionStep) {
            const updatedDesc: string = 'Updated Test Description';
            modelProcessingActionStep.Description = updatedDesc;
            bUpdated = await modelProcessingActionStep.update();

            const modelProcessingActionStepFetch: DBAPI.ModelProcessingActionStep | null = await DBAPI.ModelProcessingActionStep.fetch(modelProcessingActionStep.idModelProcessingActionStep);
            expect(modelProcessingActionStepFetch).toBeTruthy();
            if (modelProcessingActionStepFetch)
                expect(modelProcessingActionStepFetch.Description).toBe(updatedDesc);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelSceneXref.update', async () => {
        let bUpdated: boolean = false;
        if (modelSceneXref) {
            const r0: number = 3.0;
            modelSceneXref.R0 = r0;
            bUpdated = await modelSceneXref.update();

            const modelSceneXrefFetch: DBAPI.ModelSceneXref | null = await DBAPI.ModelSceneXref.fetch(modelSceneXref.idModelSceneXref);
            expect(modelSceneXrefFetch).toBeTruthy();
            if (modelSceneXrefFetch)
                expect(modelSceneXrefFetch.R0).toBe(r0);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelUVMapChannel.update', async () => {
        let bUpdated: boolean = false;
        if (modelUVMapChannel) {
            const updatedWidth: number = 2;
            modelUVMapChannel.ChannelWidth = updatedWidth;
            bUpdated            = await modelUVMapChannel.update();

            const modelUVMapChannelFetch: DBAPI.ModelUVMapChannel | null = await DBAPI.ModelUVMapChannel.fetch(modelUVMapChannel.idModelUVMapChannel);
            expect(modelUVMapChannelFetch).toBeTruthy();
            if (modelUVMapChannelFetch)
                expect(modelUVMapChannelFetch.ChannelWidth).toBe(updatedWidth);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelUVMapFile.update', async () => {
        let bUpdated: boolean = false;
        if (modelUVMapFile) {
            const updatedEdgeLen: number = 3;
            modelUVMapFile.UVMapEdgeLength = updatedEdgeLen;
            bUpdated = await modelUVMapFile.update();

            const modelUVMapFileFetch: DBAPI.ModelUVMapFile | null = await DBAPI.ModelUVMapFile.fetch(modelUVMapFile.idModelUVMapFile);
            expect(modelUVMapFileFetch).toBeTruthy();
            if (modelUVMapFileFetch)
                expect(modelUVMapFileFetch.UVMapEdgeLength).toBe(updatedEdgeLen);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Project.update', async () => {
        let bUpdated: boolean = false;
        if (project) {
            const SOOld: DBAPI.SystemObject | null = await project.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            const updatedName: string = 'Updated Test Project Name';
            project.Name = updatedName;
            bUpdated = await project.update();

            const projectFetch: DBAPI.Project | null = await DBAPI.Project.fetch(project.idProject);
            expect(projectFetch).toBeTruthy();
            if (projectFetch) {
                expect(projectFetch.Name).toBe(updatedName);

                const SONew: DBAPI.SystemObject | null = await projectFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ProjectDocumentation.update', async () => {
        let bUpdated: boolean = false;
        if (projectDocumentation) {
            const SOOld: DBAPI.SystemObject | null = await projectDocumentation.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            const updatedName: string = 'Updated Test Access Action';
            projectDocumentation.Name   = updatedName;
            bUpdated            = await projectDocumentation.update();

            const projectDocumentationFetch: DBAPI.ProjectDocumentation | null = await DBAPI.ProjectDocumentation.fetch(projectDocumentation.idProjectDocumentation);
            expect(projectDocumentationFetch).toBeTruthy();
            if (projectDocumentationFetch) {
                expect(projectDocumentationFetch.Name).toBe(updatedName);

                const SONew: DBAPI.SystemObject | null = await projectDocumentationFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Scene.update', async () => {
        let bUpdated: boolean = false;
        if (sceneNulls && assetThumbnail) {
            const SOOld: DBAPI.SystemObject | null = await sceneNulls.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            sceneNulls.idAssetThumbnail = assetThumbnail.idAsset;
            bUpdated = await sceneNulls.update();

            const sceneFetch: DBAPI.Scene | null = await DBAPI.Scene.fetch(sceneNulls.idScene);
            expect(sceneFetch).toBeTruthy();
            if (sceneFetch) {
                expect(sceneFetch.idAssetThumbnail).toBe(assetThumbnail.idAsset);

                const SONew: DBAPI.SystemObject | null = await sceneFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);

            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Scene.update disconnect', async () => {
        let bUpdated: boolean = false;
        if (sceneNulls) {
            sceneNulls.idAssetThumbnail = null;
            bUpdated = await sceneNulls.update();

            const sceneFetch: DBAPI.Scene | null = await DBAPI.Scene.fetch(sceneNulls.idScene);
            expect(sceneFetch).toBeTruthy();
            if (sceneFetch)
                expect(sceneFetch.idAssetThumbnail).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Scene.update disconnect null', async () => {
        let bUpdated: boolean = false;
        if (sceneNulls) {
            expect(sceneNulls.idAssetThumbnail).toBeNull();
            bUpdated = await sceneNulls.update();

            const sceneFetch: DBAPI.Scene | null = await DBAPI.Scene.fetch(sceneNulls.idScene);
            expect(sceneFetch).toBeTruthy();
            if (sceneFetch)
                expect(sceneFetch.idAssetThumbnail).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Stakeholder.update', async () => {
        let bUpdated: boolean = false;
        if (stakeholder) {
            const SOOld: DBAPI.SystemObject | null = await stakeholder.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            const updatedEmail: string = 'abba@dabbadoo.com';
            stakeholder.EmailAddress = updatedEmail;
            bUpdated = await stakeholder.update();

            const stakeholderFetch: DBAPI.Stakeholder | null = await DBAPI.Stakeholder.fetch(stakeholder.idStakeholder);
            expect(stakeholderFetch).toBeTruthy();
            if (stakeholderFetch) {
                expect(stakeholderFetch.EmailAddress).toBe(updatedEmail);

                const SONew: DBAPI.SystemObject | null = await stakeholderFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Subject.update', async () => {
        let bUpdated: boolean = false;
        if (subjectNulls && assetThumbnail) {
            const SOOld: DBAPI.SystemObject | null = await subjectNulls.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            subjectNulls.idAssetThumbnail = assetThumbnail.idAsset;
            bUpdated = await subjectNulls.update();

            const subjectFetch: DBAPI.Subject | null = await DBAPI.Subject.fetch(subjectNulls.idSubject);
            expect(subjectFetch).toBeTruthy();
            if (subjectFetch) {
                expect(subjectFetch.idAssetThumbnail).toBe(assetThumbnail.idAsset);

                const SONew: DBAPI.SystemObject | null = await subjectFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Subject.update partial disconnect', async () => {
        let bUpdated: boolean = false;
        if (subject) {
            subject.idAssetThumbnail = null;
            bUpdated = await subject.update();

            const subjectFetch: DBAPI.Subject | null = await DBAPI.Subject.fetch(subject.idSubject);
            expect(subjectFetch).toBeTruthy();
            if (subjectFetch)
                expect(subjectFetch.idAssetThumbnail).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Subject.update full disconnect', async () => {
        let bUpdated: boolean = false;
        if (subject) {
            expect(subject.idAssetThumbnail).toBeNull();
            subject.idGeoLocation = null;
            subject.idIdentifierPreferred = null;
            bUpdated = await subject.update();

            const subjectFetch: DBAPI.Subject | null = await DBAPI.Subject.fetch(subject.idSubject);
            expect(subjectFetch).toBeTruthy();
            if (subjectFetch) {
                expect(subjectFetch.idGeoLocation).toBeNull();
                expect(subjectFetch.idIdentifierPreferred).toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: SystemObject.retireObject', async () => {
        if (systemObjectItem) {
            expect(systemObjectItem.Retired).toBeFalsy();
            expect(await systemObjectItem.retireObject()).toBeTruthy();
            expect(systemObjectItem.Retired).toBeTruthy();
            expect(await systemObjectItem.retireObject()).toBeTruthy(); // one more time
            expect(systemObjectItem.Retired).toBeTruthy();

            const systemObjectFetch: DBAPI.SystemObject | null = item ? await item.fetchSystemObject() : null;
            expect(systemObjectFetch).toBeTruthy();
            if (systemObjectFetch)
                expect(systemObjectFetch.Retired).toBeTruthy();
        }
    });

    test('DB Update: SystemObject.reinstateObject', async () => {
        if (systemObjectItem) {
            expect(systemObjectItem.Retired).toBeTruthy();
            expect(await systemObjectItem.reinstateObject()).toBeTruthy();
            expect(systemObjectItem.Retired).toBeFalsy();
            expect(await systemObjectItem.reinstateObject()).toBeTruthy(); // one more time
            expect(systemObjectItem.Retired).toBeFalsy();

            const systemObjectFetch: DBAPI.SystemObject | null = item ? await item.fetchSystemObject() : null;
            expect(systemObjectFetch).toBeTruthy();
            if (systemObjectFetch)
                expect(systemObjectFetch.Retired).toBeFalsy();
        }
    });

    test('DB Update: SystemObjectVersion.update', async () => {
        let bUpdated: boolean = false;
        if (systemObjectVersion) {
            const updatedPubState: number = 2;
            systemObjectVersion.PublishedState = updatedPubState;
            bUpdated = await systemObjectVersion.update();

            const systemObjectVersionFetch: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetch(systemObjectVersion.idSystemObjectVersion);
            expect(systemObjectVersionFetch).toBeTruthy();
            if (systemObjectVersionFetch)
                expect(systemObjectVersionFetch.PublishedState).toBe(updatedPubState);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: SystemObjectXref.update', async () => {
        let bUpdated: boolean = false;
        if (systemObjectXref && systemObjectAsset) {
            systemObjectXref.idSystemObjectDerived = systemObjectAsset.idSystemObject;
            bUpdated = await systemObjectXref.update();

            const systemObjectXrefFetch: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.fetch(systemObjectXref.idSystemObjectXref);
            expect(systemObjectXrefFetch).toBeTruthy();
            if (systemObjectXrefFetch)
                expect(systemObjectXrefFetch.idSystemObjectDerived).toBe(systemObjectAsset.idSystemObject);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Unit.update', async () => {
        let bUpdated: boolean = false;
        if (unit) {
            const SOOld: DBAPI.SystemObject | null = await unit.fetchSystemObject();
            expect(SOOld).toBeTruthy();

            const updatedName: string = 'Updated Test Unit';
            unit.Name = updatedName;
            bUpdated  = await unit.update();

            const unitFetch: DBAPI.Unit | null = await DBAPI.Unit.fetch(unit.idUnit);
            expect(unitFetch).toBeTruthy();
            if (unitFetch) {
                expect(unitFetch.Name).toBe(updatedName);

                const SONew: DBAPI.SystemObject | null = await unitFetch.fetchSystemObject();
                expect(SONew).toBeTruthy();
                if (SOOld && SONew)
                    expect(SOOld).toMatchObject(SONew);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: UnitEdan.update', async () => {
        let bUpdated: boolean = false;
        if (unitEdan) {
            const updatedAbbr: string = UTIL.randomStorageKey('');
            unitEdan.Abbreviation = updatedAbbr;
            bUpdated  = await unitEdan.update();

            const unitEdanFetch: DBAPI.UnitEdan | null = await DBAPI.UnitEdan.fetch(unitEdan.idUnitEdan);
            expect(unitEdanFetch).toBeTruthy();
            if (unitEdanFetch)
                expect(unitEdanFetch.Abbreviation).toBe(updatedAbbr);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: UnitEdan.update disconnected', async () => {
        let bUpdated: boolean = false;
        if (unitEdan2) {
            const updatedAbbr: string = UTIL.randomStorageKey('');
            unitEdan2.Abbreviation = updatedAbbr;
            bUpdated  = await unitEdan2.update();

            const unitEdanFetch: DBAPI.UnitEdan | null = await DBAPI.UnitEdan.fetch(unitEdan2.idUnitEdan);
            expect(unitEdanFetch).toBeTruthy();
            if (unitEdanFetch)
                expect(unitEdanFetch.Abbreviation).toBe(updatedAbbr);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: UnitEdan.update fully disconnect', async () => {
        let bUpdated: boolean = false;
        if (unitEdan) {
            unitEdan.idUnit = null;
            bUpdated = await unitEdan.update();

            const unitEdanFetch: DBAPI.UnitEdan | null = await DBAPI.UnitEdan.fetch(unitEdan.idUnitEdan);
            expect(unitEdanFetch).toBeTruthy();
            if (unitEdanFetch)
                expect(unitEdanFetch.idUnit).toBeFalsy();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: UnitEdan.update reconnect', async () => {
        let bUpdated: boolean = false;
        if (unitEdan && unit) {
            unitEdan.idUnit = unit.idUnit;
            bUpdated = await unitEdan.update();

            const unitEdanFetch: DBAPI.UnitEdan | null = await DBAPI.UnitEdan.fetch(unitEdan.idUnitEdan);
            expect(unitEdanFetch).toBeTruthy();
            if (unitEdanFetch)
                expect(unitEdanFetch.idUnit).toEqual(unit.idUnit);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: User.update', async () => {
        let bUpdated: boolean = false;
        if (user) {
            const updatedName: string = 'Updated Test User';
            user.Name   = updatedName;
            bUpdated = await user.update();

            const userFetch: DBAPI.User | null = await DBAPI.User.fetch(user.idUser);
            expect(userFetch).toBeTruthy();
            if (userFetch)
                expect(userFetch.Name).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: UserPersonalizationSystemObject.update', async () => {
        let bUpdated: boolean = false;
        if (userPersonalizationSystemObject) {
            const updatedPersonalization: string = 'Updated Test User Personalization';
            userPersonalizationSystemObject.Personalization = updatedPersonalization;
            bUpdated = await userPersonalizationSystemObject.update();

            const userPersonalizationSystemObjectFetch: DBAPI.UserPersonalizationSystemObject | null = await DBAPI.UserPersonalizationSystemObject.fetch(userPersonalizationSystemObject.idUserPersonalizationSystemObject);
            expect(userPersonalizationSystemObjectFetch).toBeTruthy();
            if (userPersonalizationSystemObjectFetch)
                expect(userPersonalizationSystemObjectFetch.Personalization).toBe(updatedPersonalization);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: UserPersonalizationUrl.update', async () => {
        let bUpdated: boolean = false;
        if (userPersonalizationUrl) {
            const updatedPersonalization: string = 'Updated Test Access Action';
            userPersonalizationUrl.Personalization   = updatedPersonalization;
            bUpdated            = await userPersonalizationUrl.update();

            const userPersonalizationUrlFetch: DBAPI.UserPersonalizationUrl | null = await DBAPI.UserPersonalizationUrl.fetch(userPersonalizationUrl.idUserPersonalizationUrl);
            expect(userPersonalizationUrlFetch).toBeTruthy();
            if (userPersonalizationUrlFetch)
                expect(userPersonalizationUrlFetch.Personalization).toBe(updatedPersonalization);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Vocabulary.update', async () => {
        let bUpdated: boolean = false;
        if (vocabulary) {
            const updatedSort: number = 3;
            vocabulary.SortOrder = updatedSort;
            bUpdated = await vocabulary.update();

            const vocabularyFetch: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(vocabulary.idVocabulary);
            expect(vocabularyFetch).toBeTruthy();
            if (vocabularyFetch)
                expect(vocabularyFetch.SortOrder).toBe(updatedSort);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: VocabularySet.update', async () => {
        let bUpdated: boolean = false;
        if (vocabularySet) {
            const updatedName: string = 'Updated Test Vocabulary Set';
            vocabularySet.Name = updatedName;
            bUpdated = await vocabularySet.update();

            const vocabularySetFetch: DBAPI.VocabularySet | null = await DBAPI.VocabularySet.fetch(vocabularySet.idVocabularySet);
            expect(vocabularySetFetch).toBeTruthy();
            if (vocabularySetFetch)
                expect(vocabularySetFetch.Name).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Workflow.update', async () => {
        let bUpdated: boolean = false;
        if (workflow && project2) {
            workflow.idProject = project2.idProject;
            bUpdated = await workflow.update();

            const workflowFetch: DBAPI.Workflow | null = await DBAPI.Workflow.fetch(workflow.idWorkflow);
            expect(workflowFetch).toBeTruthy();
            if (workflowFetch)
                expect(workflowFetch.idProject).toBe(project2.idProject);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Workflow.update partial disconnect', async () => {
        let bUpdated: boolean = false;
        if (workflow) {
            workflow.idProject = null;
            bUpdated = await workflow.update();

            const workflowFetch: DBAPI.Workflow | null = await DBAPI.Workflow.fetch(workflow.idWorkflow);
            expect(workflowFetch).toBeTruthy();
            if (workflowFetch)
                expect(workflowFetch.idProject).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Workflow.update full disconnect', async () => {
        let bUpdated: boolean = false;
        if (workflow) {
            expect(workflow.idProject).toBeNull();
            workflow.idUserInitiator = null;
            bUpdated = await workflow.update();

            const workflowFetch: DBAPI.Workflow | null = await DBAPI.Workflow.fetch(workflow.idWorkflow);
            expect(workflowFetch).toBeTruthy();
            if (workflowFetch)
                expect(workflowFetch.idUserInitiator).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Workflow.update when null', async () => {
        let bUpdated: boolean = false;
        if (workflow) {
            expect(workflow.idProject).toBeNull();
            const updated: Date = new Date();
            updated.setMilliseconds(0); // remove this component, which is not stored in the DB
            workflow.DateUpdated = updated;
            bUpdated = await workflow.update();

            const workflowFetch: DBAPI.Workflow | null = await DBAPI.Workflow.fetch(workflow.idWorkflow);
            expect(workflowFetch).toBeTruthy();
            if (workflowFetch)
                expect(workflowFetch.DateUpdated).toEqual(updated);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: WorkflowStep.update', async () => {
        let bUpdated: boolean = false;
        if (workflowStep && workflowNulls) {
            workflowStep.idWorkflow = workflowNulls.idWorkflow;
            bUpdated = await workflowStep.update();

            const workflowStepFetch: DBAPI.WorkflowStep | null = await DBAPI.WorkflowStep.fetch(workflowStep.idWorkflowStep);
            expect(workflowStepFetch).toBeTruthy();
            if (workflowStepFetch)
                expect(workflowStepFetch.idWorkflow).toBe(workflowNulls.idWorkflow);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: WorkflowStepSystemObjectXref.update', async () => {
        let bUpdated: boolean = false;
        if (workflowStepSystemObjectXref) {
            const updatedInput: boolean = true;
            workflowStepSystemObjectXref.Input = updatedInput;
            bUpdated            = await workflowStepSystemObjectXref.update();

            const workflowStepSystemObjectXrefFetch: DBAPI.WorkflowStepSystemObjectXref | null = await DBAPI.WorkflowStepSystemObjectXref.fetch(workflowStepSystemObjectXref.idWorkflowStepSystemObjectXref);
            expect(workflowStepSystemObjectXrefFetch).toBeTruthy();
            if (workflowStepSystemObjectXrefFetch)
                expect(workflowStepSystemObjectXrefFetch.Input).toBe(updatedInput);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: WorkflowTemplate.update', async () => {
        let bUpdated: boolean = false;
        if (workflowTemplate) {
            const updatedName: string = 'Updated Test Workflow Template Name';
            workflowTemplate.Name   = updatedName;
            bUpdated = await workflowTemplate.update();

            const workflowTemplateFetch: DBAPI.WorkflowTemplate | null = await DBAPI.WorkflowTemplate.fetch(workflowTemplate.idWorkflowTemplate);
            expect(workflowTemplateFetch).toBeTruthy();
            if (workflowTemplateFetch)
                expect(workflowTemplateFetch.Name).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });

    /*
    // This test code shows a potential issue with how Prisma handles updating of optional foreign key relationships
    // To use prisma correctly, we need to know the state of the object in the database so that the DB API method calls
    // passes either "{ disconnect: true, }" or "undefined".  This is a problem.  I'm seeking help from the Prisma team on this.
    test('DB Update: Two object disconnect', async () => {
        if (unit) {
            const actorSource: DBAPI.Actor | null = new DBAPI.Actor({
                IndividualName: 'Test Actor Name',
                OrganizationName: 'Test Actor Org',
                idUnit:  unit.idUnit,
                idActor: 0
            });
            expect(await actorSource.create()).toBeTruthy();

            const actorCopy1: DBAPI.Actor | null = await DBAPI.Actor.fetch(actorSource.idActor);
            const actorCopy2: DBAPI.Actor | null = await DBAPI.Actor.fetch(actorSource.idActor);

            if (actorCopy1) {
                actorCopy1.idUnit = null;
                expect(await actorCopy1.update()).toBeTruthy();
                const actorFetch: DBAPI.Actor | null = await DBAPI.Actor.fetch(actorCopy1.idActor);
                expect(actorFetch).not.toBeNull();
                if (actorFetch)
                    expect(actorFetch.idUnit).toBeNull();
            }
            if (actorCopy2) {
                actorCopy2.idUnit = null;
                expect(await actorCopy2.update()).not.toBeTruthy(); // actorCopy1.update() above disconnected the actor from the unit; this call fails
                // const actorFetch: DBAPI.Actor | null = await DBAPI.Actor.fetch(actorCopy2.idActor);
                // expect(actorFetch).not.toBeNull();
                // if (actorFetch)
                //     expect(actorFetch.idUnit).toBeNull();
            }
        }
    });
    */
});


describe('DB Null/Zero ID Test', () => {
    test('DB Null/Zero ID Test', async () => {
        expect(await DBAPI.AccessAction.fetch(0)).toBeNull();
        expect(await DBAPI.AccessAction.fetchFromXref(0)).toBeNull();
        expect(await DBAPI.AccessContext.fetch(0)).toBeNull();
        expect(await DBAPI.AccessContextObject.fetch(0)).toBeNull();
        expect(await DBAPI.AccessContextObject.fetchFromAccessContext(0)).toBeNull();
        expect(await DBAPI.AccessContextObject.fetchFromSystemObject(0)).toBeNull();
        expect(await DBAPI.AccessPolicy.fetch(0)).toBeNull();
        expect(await DBAPI.AccessPolicy.fetchFromAccessContext(0)).toBeNull();
        expect(await DBAPI.AccessPolicy.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.AccessRole.fetch(0)).toBeNull();
        expect(await DBAPI.AccessRole.fetchFromXref(0)).toBeNull();
        expect(await DBAPI.AccessRoleAccessActionXref.fetch(0)).toBeNull();
        expect(await DBAPI.Actor.fetch(0)).toBeNull();
        expect(await DBAPI.Actor.fetchFromUnit(0)).toBeNull();
        expect(await DBAPI.Asset.fetch(0)).toBeNull();
        expect(await DBAPI.Asset.fetchByStorageKey('')).toBeNull();
        expect(await DBAPI.Asset.fetchFromAssetGroup(0)).toBeNull();
        expect(await DBAPI.Asset.fetchFromSystemObject(0)).toBeNull();
        expect(await DBAPI.AssetGroup.fetch(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetch(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchFromAsset(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchLatestFromAsset(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.AssetVersion.computeNextVersionNumber(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchFromUserByIngested(0, true)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchByAssetAndVersion(0, 1)).toBeNull();
        expect(await DBAPI.CaptureData.fetch(0)).toBeNull();
        expect(await DBAPI.CaptureData.fetchFromXref(0)).toBeNull();
        expect(await DBAPI.CaptureData.fetchFromCaptureDataPhoto(0)).toBeNull();
        expect(await DBAPI.CaptureData.fetchDerivedFromItems([])).toBeNull();
        expect(await DBAPI.CaptureDataFile.fetch(0)).toBeNull();
        expect(await DBAPI.CaptureDataFile.fetchFromCaptureData(0)).toBeNull();
        expect(await DBAPI.CaptureDataGroup.fetch(0)).toBeNull();
        expect(await DBAPI.CaptureDataGroup.fetchFromXref(0)).toBeNull();
        expect(await DBAPI.CaptureDataGroupCaptureDataXref.fetch(0)).toBeNull();
        expect(await DBAPI.CaptureDataPhoto.fetch(0)).toBeNull();
        expect(await DBC.CopyArray<DBAPI.SystemObject, DBAPI.SystemObject>(null, DBAPI.SystemObject)).toBeNull();
        expect(await DBC.CopyObject<DBAPI.SystemObject, DBAPI.SystemObject>(null, DBAPI.SystemObject)).toBeNull();
        expect(await DBAPI.GeoLocation.fetch(0)).toBeNull();
        expect(await DBAPI.Identifier.fetch(0)).toBeNull();
        expect(await DBAPI.Identifier.fetchFromIdentifierValue('')).toBeNull();
        expect(await DBAPI.Identifier.fetchFromSubjectPreferred(0)).toBeNull();
        expect(await DBAPI.Identifier.fetchFromSystemObject(0)).toBeNull();
        expect(await DBAPI.IntermediaryFile.fetch(0)).toBeNull();
        expect(await DBAPI.IntermediaryFile.fetchDerivedFromItems([])).toBeNull();
        expect(await DBAPI.Item.fetch(0)).toBeNull();
        expect(await DBAPI.Item.fetchDerivedFromSubject(0)).toBeNull();
        expect(await DBAPI.Item.fetchDerivedFromSubject(-1)).toBeNull();
        expect(await DBAPI.Item.fetchDerivedFromSubjects([])).toBeNull();
        expect(await DBAPI.Item.fetchMasterFromCaptureDatas([])).toBeNull();
        expect(await DBAPI.Item.fetchMasterFromModels([])).toBeNull();
        expect(await DBAPI.Item.fetchMasterFromScenes([])).toBeNull();
        expect(await DBAPI.Item.fetchMasterFromIntermediaryFiles([])).toBeNull();
        expect(await DBAPI.Job.fetch(0)).toBeNull();
        expect(await DBAPI.JobTask.fetch(0)).toBeNull();
        expect(await DBAPI.JobTaskCook.fetch(0)).toBeNull();
        expect(await DBAPI.License.fetch(0)).toBeNull();
        expect(await DBAPI.LicenseAssignment.fetch(0)).toBeNull();
        expect(await DBAPI.LicenseAssignment.fetchFromLicense(0)).toBeNull();
        expect(await DBAPI.LicenseAssignment.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.LicenseAssignment.fetchFromSystemObject(0)).toBeNull();
        expect(await DBAPI.Metadata.fetch(0)).toBeNull();
        expect(await DBAPI.Metadata.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.Metadata.fetchFromSystemObject(0)).toBeNull();
        expect(await DBAPI.Model.fetch(0)).toBeNull();
        expect(await DBAPI.Model.fetchFromXref(0)).toBeNull();
        expect(await DBAPI.Model.fetchDerivedFromItems([])).toBeNull();
        expect(await DBAPI.ModelGeometryFile.fetch(0)).toBeNull();
        expect(await DBAPI.ModelGeometryFile.fetchFromModel(0)).toBeNull();
        expect(await DBAPI.ModelProcessingAction.fetch(0)).toBeNull();
        expect(await DBAPI.ModelProcessingAction.fetchFromModel(0)).toBeNull();
        expect(await DBAPI.ModelProcessingActionStep.fetch(0)).toBeNull();
        expect(await DBAPI.ModelProcessingActionStep.fetchFromModelProcessingAction(0)).toBeNull();
        expect(await DBAPI.ModelSceneXref.fetch(0)).toBeNull();
        expect(await DBAPI.ModelSceneXref.fetchFromScene(0)).toBeNull();
        expect(await DBAPI.ModelSceneXref.fetchFromModel(0)).toBeNull();
        expect(await DBAPI.ModelUVMapChannel.fetch(0)).toBeNull();
        expect(await DBAPI.ModelUVMapChannel.fetchFromModelUVMapFile(0)).toBeNull();
        expect(await DBAPI.ModelUVMapFile.fetch(0)).toBeNull();
        expect(await DBAPI.ModelUVMapFile.fetchFromModelGeometryFile(0)).toBeNull();
        expect(await DBAPI.Project.fetch(0)).toBeNull();
        expect(await DBAPI.Project.fetchDerivedFromUnits([])).toBeNull();
        expect(await DBAPI.Project.fetchMasterFromSubjects([])).toBeNull();
        expect(await DBAPI.Project.fetchMasterFromStakeholders([])).toBeNull();
        expect(await DBAPI.Project.fetchMasterFromProjectDocumentations([])).toBeNull();
        expect(await DBAPI.Project.fetchDerivedFromSubjectsUnits([])).toBeNull();
        expect(await DBAPI.Project.fetchMasterFromStakeholders([])).toBeNull();
        expect(await DBAPI.Project.fetchMasterFromProjectDocumentations([])).toBeNull();
        expect(await DBAPI.ProjectDocumentation.fetch(0)).toBeNull();
        expect(await DBAPI.ProjectDocumentation.fetchFromProject(0)).toBeNull();
        expect(await DBAPI.ProjectDocumentation.fetchDerivedFromProjects([])).toBeNull();
        expect(await DBAPI.Scene.fetch(0)).toBeNull();
        expect(await DBAPI.Scene.fetchFromXref(0)).toBeNull();
        expect(await DBAPI.Scene.fetchDerivedFromItems([])).toBeNull();
        expect(await DBAPI.Stakeholder.fetch(0)).toBeNull();
        expect(await DBAPI.Stakeholder.fetchDerivedFromProjects([])).toBeNull();
        expect(await DBAPI.Subject.fetch(0)).toBeNull();
        expect(await DBAPI.Subject.fetchFromUnit(0)).toBeNull();
        expect(await DBAPI.Subject.fetchMasterFromItems([])).toBeNull();
        expect(await DBAPI.Subject.fetchDerivedFromProjects([])).toBeNull();
        expect(await DBAPI.SystemObject.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchDerivedFromXref(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchMasterFromXref(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchWorkflowStepFromXref(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromActorID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromAssetID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromAssetVersionID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromCaptureDataID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromIntermediaryFileID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromItemID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromModelID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromProjectID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromProjectDocumentationID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromSceneID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromStakeholderID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromSubjectID(0)).toBeNull();
        expect(await DBAPI.SystemObject.fetchFromUnitID(0)).toBeNull();

        expect(await DBAPI.SystemObjectActor.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectAsset.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectAssetVersion.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectCaptureData.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectIntermediaryFile.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectItem.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectModel.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectProject.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectProjectDocumentation.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectScene.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectStakeholder.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectSubject.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectUnit.fetch(0)).toBeNull();

        expect(await DBAPI.SystemObjectActor.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectAsset.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectAssetVersion.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectCaptureData.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectIntermediaryFile.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectItem.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectModel.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectProject.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectProjectDocumentation.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectScene.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectStakeholder.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectSubject.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectUnit.fetch(-1)).toBeNull();
        expect(await DBAPI.SystemObjectPairs.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectPairs.fetchDerivedFromXref(0)).toBeNull();
        expect(await DBAPI.SystemObjectPairs.fetchMasterFromXref(0)).toBeNull();
        expect(await DBAPI.SystemObjectVersion.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectVersion.fetchFromSystemObject(0)).toBeNull();
        expect(await DBAPI.SystemObjectXref.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectXref.fetchXref(0, 1)).toBeNull();
        expect(await DBAPI.SystemObjectXref.fetchXref(1, 0)).toBeNull();
        expect(await DBAPI.Unit.fetch(0)).toBeNull();
        expect(await DBAPI.Unit.fetchMasterFromProjects([])).toBeNull();
        expect(await DBAPI.Unit.fetchFromUnitEdanAbbreviation('')).toBeNull();
        expect(await DBAPI.Unit.fetchFromNameSearch('')).toBeNull();
        expect(await DBAPI.UnitEdan.fetch(0)).toBeNull();
        expect(await DBAPI.UnitEdan.fetchFromUnit(0)).toBeNull();
        expect(await DBAPI.UnitEdan.fetchFromAbbreviation('')).toBeNull();
        expect(await DBAPI.User.fetch(0)).toBeNull();
        expect(await DBAPI.UserPersonalizationSystemObject.fetch(0)).toBeNull();
        expect(await DBAPI.UserPersonalizationSystemObject.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.UserPersonalizationSystemObject.fetchFromSystemObject(0)).toBeNull();
        expect(await DBAPI.UserPersonalizationUrl.fetch(0)).toBeNull();
        expect(await DBAPI.UserPersonalizationUrl.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.Vocabulary.fetch(0)).toBeNull();
        expect(await DBAPI.Vocabulary.fetchFromVocabularySet(0)).toBeNull();
        expect(await DBAPI.VocabularySet.fetch(0)).toBeNull();
        expect(await DBAPI.Workflow.fetch(0)).toBeNull();
        expect(await DBAPI.Workflow.fetchFromProject(0)).toBeNull();
        expect(await DBAPI.Workflow.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.Workflow.fetchFromWorkflowTemplate(0)).toBeNull();
        expect(await DBAPI.WorkflowStep.fetch(0)).toBeNull();
        expect(await DBAPI.WorkflowStep.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.WorkflowStep.fetchFromWorkflow(0)).toBeNull();
        expect(await DBAPI.WorkflowStepSystemObjectXref.fetch(0)).toBeNull();
        expect(await DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflowStep(0)).toBeNull();
        expect(await DBAPI.WorkflowTemplate.fetch(0)).toBeNull();

        const SO: DBAPI.SystemObject = new DBAPI.SystemObject({
            idActor: 0,
            idAsset: 0,
            idAssetVersion: 0,
            idCaptureData: 0,
            idIntermediaryFile: 0,
            idItem: 0,
            idModel: 0,
            idProject: 0,
            idProjectDocumentation: 0,
            idScene: 0,
            idStakeholder: 0,
            idSubject: 0,
            idSystemObject: 0,
            idUnit: 0,
            Retired: false,
        });

        await expect(SO.create()).rejects.toThrow('DBAPI.SystemObject.create() should never be called');
        await expect(SO.update()).rejects.toThrow('DBAPI.SystemObject.update() should never be called');
    });
});
