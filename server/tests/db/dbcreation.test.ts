import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as DBC from '../../db/connection';
import * as LOG from '../../utils/logger';
import * as H from '../../utils/helpers';
import * as UTIL from './api';
import { VocabularyCache, eVocabularyID, eVocabularySetID } from '../../cache';

afterAll(async done => {
    // await H.Helpers.sleep(4000);
    await DBC.DBConnection.disconnect();
    await DBC.DBConnection.disconnect(); // second time to test disconnecting after already being disconnected!
    done();
});

// #region Variables
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
let assetModel: DBAPI.Asset | null;
let assetThumbnail: DBAPI.Asset | null;
let assetWithoutAG: DBAPI.Asset | null;
let assetBulkIngest: DBAPI.Asset | null;
let assetVersion: DBAPI.AssetVersion | null;
let assetVersion2: DBAPI.AssetVersion | null;
let assetVersionModel: DBAPI.AssetVersion | null;
let assetVersionNotIngested: DBAPI.AssetVersion | null;
let assetVersionNotIngested2: DBAPI.AssetVersion | null;
let assetVersionNotProcessed: DBAPI.AssetVersion | null;
let audit: DBAPI.Audit | null;
let auditNulls: DBAPI.Audit | null;
let captureData: DBAPI.CaptureData | null;
let captureDataNulls: DBAPI.CaptureData | null;
let captureDataFile: DBAPI.CaptureDataFile | null;
let captureDataFileNulls: DBAPI.CaptureDataFile | null;
let captureDataGroup: DBAPI.CaptureDataGroup | null;
let captureDataGroupCaptureDataXref: DBAPI.CaptureDataGroupCaptureDataXref | null;
let captureDataGroupCaptureDataXref2: DBAPI.CaptureDataGroupCaptureDataXref | null;
let captureDataPhoto: DBAPI.CaptureDataPhoto | null;
let captureDataPhotoNulls: DBAPI.CaptureDataPhoto | null;
let geoLocation: DBAPI.GeoLocation | null;
const identifierValue: string = 'Test Identifier ' + UTIL.randomStorageKey('');
let identifier: DBAPI.Identifier | null;
let identifier2: DBAPI.Identifier | null;
let identifierNull: DBAPI.Identifier | null;
let identifierSubjectHookup: DBAPI.Identifier | null;
let intermediaryFile: DBAPI.IntermediaryFile | null;
let item: DBAPI.Item | null;
let itemNulls: DBAPI.Item | null;
let job: DBAPI.Job | null;
let jobSIPackratInspect: DBAPI.Job | null = null;
let jobRun: DBAPI.JobRun | null;
let metadata: DBAPI.Metadata | null;
let metadataNull: DBAPI.Metadata | null;
let model: DBAPI.Model | null;
let modelNulls: DBAPI.Model | null;
let modelMaterial: DBAPI.ModelMaterial | null;
let modelMaterialChannel: DBAPI.ModelMaterialChannel | null;
let modelMaterialChannelNulls: DBAPI.ModelMaterialChannel | null;
let modelMaterialUVMap: DBAPI.ModelMaterialUVMap | null;
let modelObject: DBAPI.ModelObject | null;
let modelObject2: DBAPI.ModelObject | null;
let modelObject3: DBAPI.ModelObject | null;
let modelObjectModelMaterialXref1: DBAPI.ModelObjectModelMaterialXref | null;
let modelObjectModelMaterialXref2: DBAPI.ModelObjectModelMaterialXref | null;
let modelProcessingAction: DBAPI.ModelProcessingAction | null;
let modelProcessingActionStep: DBAPI.ModelProcessingActionStep | null;
let modelSceneXref: DBAPI.ModelSceneXref | null;
let modelSceneXrefNull: DBAPI.ModelSceneXref | null;
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
let subjectWithPreferredID: DBAPI.Subject | null;
let subjectNulls: DBAPI.Subject | null;
let systemObjectAsset: DBAPI.SystemObject | null;
let systemObjectAssetVersion: DBAPI.SystemObject | null;
let systemObjectItem: DBAPI.SystemObject | null;
let systemObjectItemNulls: DBAPI.SystemObject | null;
let systemObjectModel: DBAPI.SystemObject | null;
let systemObjectScene: DBAPI.SystemObject | null;
let systemObjectSubject: DBAPI.SystemObject | null;
let systemObjectSubjectNulls: DBAPI.SystemObject | null;
let systemObjectVersion: DBAPI.SystemObjectVersion | null;
let systemObjectVersionAssetVersionXref: DBAPI.SystemObjectVersionAssetVersionXref | null;
let systemObjectXref: DBAPI.SystemObjectXref | null;
let systemObjectXref2: DBAPI.SystemObjectXref | null;
let systemObjectXrefSubItem1: DBAPI.SystemObjectXref | null;
let systemObjectXrefSubItem2: DBAPI.SystemObjectXref | null;
let systemObjectXrefSubItem3: DBAPI.SystemObjectXref | null;
let systemObjectXrefSubItem4: DBAPI.SystemObjectXref | null;
let systemObjectXrefProjectItem1: DBAPI.SystemObjectXref | null;
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
let userActive: DBAPI.User | null;
let userInactive: DBAPI.User | null;
let userPersonalizationSystemObject: DBAPI.UserPersonalizationSystemObject | null;
let userPersonalizationUrl: DBAPI.UserPersonalizationUrl | null;
let vocabulary: DBAPI.Vocabulary | null;
let vocabulary2: DBAPI.Vocabulary | null;
let vocabJobSIPackratInspect: DBAPI.Vocabulary | null;
let vocabularyWorkflowType: DBAPI.Vocabulary | null;
let vocabularySet: DBAPI.VocabularySet | null;
let workflow: DBAPI.Workflow | null;
let workflowNulls: DBAPI.Workflow | null;
let workflowStep: DBAPI.WorkflowStep | null;
let workflowStepNulls: DBAPI.WorkflowStep | null;
let workflowStepSystemObjectXref: DBAPI.WorkflowStepSystemObjectXref | null;
let workflowStepSystemObjectXref2: DBAPI.WorkflowStepSystemObjectXref | null;

// #endregion

// *******************************************************************
// #region DB Creation Test Suite
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

    test('DB Fetch/Creation: Vocabulary WorkflowType', async () => {
        const idVocabularySet: number | undefined = await VocabularyCache.vocabularySetEnumToId(eVocabularySetID.eWorkflowType);
        const vocabularyEntries: DBAPI.Vocabulary[] | undefined = idVocabularySet ? await VocabularyCache.vocabularySetEntries(idVocabularySet) : undefined;
        let createVocab: boolean = false;
        if (vocabularyEntries && vocabularyEntries.length > 0)
            vocabularyWorkflowType = vocabularyEntries[0];
        else if (idVocabularySet) {
            vocabularyWorkflowType = new DBAPI.Vocabulary({
                idVocabularySet,
                SortOrder: 0,
                Term: 'Test Vocabulary Workflow Type',
                idVocabulary: 0
            });
            createVocab = true;
        }
        expect(vocabularyWorkflowType).toBeTruthy();
        if (vocabularyWorkflowType) {
            if (createVocab)
                expect(await vocabularyWorkflowType.create()).toBeTruthy();
            expect(vocabularyWorkflowType.idVocabulary).toBeGreaterThan(0);
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
        userActive = await UTIL.createUserTest({
            Name: 'Test User 1',
            EmailAddress: UTIL.randomStorageKey('test') + '@si.edu',
            SecurityID: 'SECURITY_ID',
            Active: true,
            DateActivated: UTIL.nowCleansed(),
            DateDisabled: null,
            WorkflowNotificationTime: UTIL.nowCleansed(),
            EmailSettings: 0,
            idUser: 0
        });
        expect(userActive).toBeTruthy();
        expect(userActive.DateDisabled).toBeFalsy();

        userInactive = await UTIL.createUserTest({
            Name: 'Test User 2',
            EmailAddress: UTIL.randomStorageKey('test') + '@si.edu',
            SecurityID: 'SECURITY_ID',
            Active: false,
            DateActivated: UTIL.nowCleansed(),
            DateDisabled: null,
            WorkflowNotificationTime: UTIL.nowCleansed(),
            EmailSettings: 0,
            idUser: 0
        });
        expect(userInactive).toBeTruthy();
        expect(userInactive.DateDisabled).toBeTruthy();
        expect(userInactive.DateDisabled).toEqual(userInactive.DateActivated);
    });

    test('DB Creation: Identifier Subject Hookup', async () => {
        if (vocabulary)
            identifierSubjectHookup = await UTIL.createIdentifierTest({
                IdentifierValue: 'Test Identifier Null 2',
                idVIdentifierType: vocabulary.idVocabulary,
                idSystemObject: null,
                idIdentifier: 0
            });
        expect(identifierSubjectHookup).toBeTruthy();
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

    test('DB Creation: Subject', async () => {
        if (unit && assetThumbnail && geoLocation && identifierSubjectHookup)
            subjectWithPreferredID = await UTIL.createSubjectTest({
                idUnit: unit.idUnit,
                idAssetThumbnail: assetThumbnail.idAsset,
                idGeoLocation: geoLocation.idGeoLocation,
                Name: 'Test Subject With Preferred Identifier',
                idIdentifierPreferred: identifierSubjectHookup.idIdentifier,
                idSubject: 0
            });
        expect(subjectWithPreferredID).toBeTruthy();
    });

    test('DB Creation: Fetch System Object Subject', async() => {
        systemObjectSubject = subject ? await subject.fetchSystemObject() : null;
        expect(systemObjectSubject).toBeTruthy();
        expect(systemObjectSubject ? systemObjectSubject.idSubject : -1).toBe(subject ? subject.idSubject : -2);

        if (systemObjectSubject) {
            expect(systemObjectSubject.fetchTableName()).toEqual('SystemObject');
            expect(systemObjectSubject.fetchID()).toEqual(systemObjectSubject.idSystemObject);
            expect(await systemObjectSubject.delete()).toBeFalsy();
        }
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

    test('DB Creation: Scene', async () => {
        if (assetThumbnail)
            scene = await UTIL.createSceneTest({
                Name: 'Test Scene',
                idAssetThumbnail: assetThumbnail.idAsset,
                IsOriented: true,
                HasBeenQCd: true,
                CountScene: 0,
                CountNode: 0,
                CountCamera: 0,
                CountLight: 0,
                CountModel: 0,
                CountMeta: 0,
                CountSetup: 0,
                CountTour: 0,
                idScene: 0
            });
        expect(scene).toBeTruthy();
    });

    test('DB Creation: Scene With Nulls', async () => {
        sceneNulls = await UTIL.createSceneTest({
            Name: 'Test Scene',
            idAssetThumbnail: null,
            IsOriented: true,
            HasBeenQCd: false,
            CountScene: 0,
            CountNode: 0,
            CountCamera: 0,
            CountLight: 0,
            CountModel: 0,
            CountMeta: 0,
            CountSetup: 0,
            CountTour: 0,
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
        if (userActive && accessRole && accessContext) {
            accessPolicy = new DBAPI.AccessPolicy({
                idUser: userActive.idUser,
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
        if (assetThumbnail && userActive)
            assetVersion = await UTIL.createAssetVersionTest({
                idAsset: assetThumbnail.idAsset,
                Version: 0,
                FileName: assetThumbnail.FilePath,
                idUserCreator: userActive.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum',
                StorageSize: BigInt(50),
                StorageKeyStaging: UTIL.randomStorageKey('/test/asset/path/'),
                Ingested: true,
                BulkIngest: false,
                idAssetVersion: 0
            });
        expect(assetVersion).toBeTruthy();
    });

    test('DB Creation: Fetch System Object AssetVersion', async() => {
        systemObjectAssetVersion = assetVersion ? await assetVersion.fetchSystemObject() : null;
        expect(systemObjectAssetVersion).toBeTruthy();
        expect(systemObjectAssetVersion ? systemObjectAssetVersion.idAssetVersion : -1).toBe(assetVersion ? assetVersion.idAssetVersion : -2);
    });

    test('DB Creation: AssetVersion Uploaded, Processed', async () => {
        if (assetThumbnail && userActive) {
            assetVersionNotIngested = await UTIL.createAssetVersionTest({
                idAsset: assetThumbnail.idAsset,
                Version: 0,
                FileName: assetThumbnail.FilePath,
                idUserCreator: userActive.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum Not Ingested',
                StorageSize: BigInt(50),
                StorageKeyStaging: '',
                Ingested: false,
                BulkIngest: true,
                idAssetVersion: 0
            });
            assetVersionNotIngested2 = await UTIL.createAssetVersionTest({
                idAsset: assetThumbnail.idAsset,
                Version: 0,
                FileName: assetThumbnail.FilePath,
                idUserCreator: userActive.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum Not Ingested 2',
                StorageSize: BigInt(50),
                StorageKeyStaging: '',
                Ingested: false,
                BulkIngest: true,
                idAssetVersion: 0
            });
        }
        expect(assetVersionNotIngested).toBeTruthy();
        expect(assetVersionNotIngested2).toBeTruthy();
    });

    test('DB Creation: AssetVersion Uploaded, Not Processed', async () => {
        if (assetThumbnail && userActive)
            assetVersionNotProcessed = await UTIL.createAssetVersionTest({
                idAsset: assetThumbnail.idAsset,
                Version: 0,
                FileName: assetThumbnail.FilePath,
                idUserCreator: userActive.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum Not Processed',
                StorageSize: BigInt(50),
                StorageKeyStaging: '',
                Ingested: null,
                BulkIngest: true,
                idAssetVersion: 0
            });
        expect(assetVersionNotProcessed).toBeTruthy();
    });

    test('DB Creation: Audit', async () => {
        if (userActive && subject && systemObjectSubject)
            audit = await UTIL.createAuditTest({
                idUser: userActive.idUser,
                AuditDate: UTIL.nowCleansed(),
                AuditType: DBAPI.eAuditType.eDBUpdate,
                DBObjectType: DBAPI.eSystemObjectType.eSubject,
                idDBObject: subject.idSubject,
                idSystemObject: systemObjectSubject.idSystemObject,
                Data: JSON.stringify(subject, H.Helpers.stringifyDatabaseRow),
                idAudit: 0
            });
        expect(audit).toBeTruthy();
    });

    test('DB Creation: Audit with Nulls', async () => {
        if (userActive && subject && systemObjectSubject)
            auditNulls = await UTIL.createAuditTest({
                idUser: null,
                AuditDate: UTIL.nowCleansed(),
                AuditType: DBAPI.eAuditType.eDBUpdate,
                DBObjectType: null,
                idDBObject: null,
                idSystemObject: null,
                Data: '',
                idAudit: 0
            });
        expect(auditNulls).toBeTruthy();
    });

    test('DB Creation: CaptureData', async () => {
        if (vocabulary && assetThumbnail)
            captureData = await UTIL.createCaptureDataTest({
                Name: 'Test Capture Data',
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
                Name: 'Test Capture Data Nulls',
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
                idVVariantType: vocabulary.idVocabulary
            });
        expect(captureDataFile).toBeTruthy();
        if (captureDataFile) {
            expect(await captureDataFile.create()).toBeTruthy();
            expect(captureDataFile.idCaptureDataFile).toBeGreaterThan(0);
        }
    });

    test('DB Creation: CaptureDataFile Nulls', async () => {
        if (captureData && assetThumbnail && vocabulary)
            captureDataFileNulls = new DBAPI.CaptureDataFile({
                idCaptureDataFile: 0,
                CompressedMultipleFiles: false,
                idAsset: assetThumbnail.idAsset,
                idCaptureData: captureData.idCaptureData,
                idVVariantType: null
            });
        expect(captureDataFileNulls).toBeTruthy();
        if (captureDataFileNulls) {
            expect(await captureDataFileNulls.create()).toBeTruthy();
            expect(captureDataFileNulls.idCaptureDataFile).toBeGreaterThan(0);
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
            identifier = await UTIL.createIdentifierTest({
                IdentifierValue: identifierValue,
                idVIdentifierType: vocabulary.idVocabulary,
                idSystemObject: systemObjectSubject.idSystemObject,
                idIdentifier: 0
            });
        expect(identifier).toBeTruthy();
    });

    test('DB Creation: Identifier With Nulls', async () => {
        if (vocabulary)
            identifierNull = await UTIL.createIdentifierTest({
                IdentifierValue: 'Test Identifier Null',
                idVIdentifierType: vocabulary.idVocabulary,
                idSystemObject: null,
                idIdentifier: 0
            });
        expect(identifierNull).toBeTruthy();
    });

    test('DB Creation: Identifier2', async () => {
        if (vocabulary)
            identifier2 = await UTIL.createIdentifierTest({
                IdentifierValue: 'Test Identifier Null 2',
                idVIdentifierType: vocabulary.idVocabulary,
                idSystemObject: null,
                idIdentifier: 0
            });
        expect(identifier2).toBeTruthy();
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
        if (vocabulary)
            job = await UTIL.createJobTest({
                idVJobType: vocabulary.idVocabulary,
                Name: 'Test Job',
                Status: 0,
                Frequency: '100',
                idJob: 0
            });
        expect(job).toBeTruthy();
    });

    test('DB Creation: Job Packrat Inspect', async () => {
        vocabJobSIPackratInspect = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eJobJobTypeCookSIPackratInspect) || null;
        expect(vocabJobSIPackratInspect).toBeTruthy();
        const jobSIPackratInspects: DBAPI.Job[] | null = vocabJobSIPackratInspect ? await DBAPI.Job.fetchByType(vocabJobSIPackratInspect.idVocabulary) : null;
        jobSIPackratInspect = jobSIPackratInspects && jobSIPackratInspects.length > 0 ? jobSIPackratInspects[0] : null;
        expect(jobSIPackratInspect).toBeTruthy();
    });

    test('DB Creation: JobRun', async () => {
        if (jobSIPackratInspect)
            jobRun = await UTIL.createJobRunTest({
                idJob: jobSIPackratInspect.idJob,
                Status: DBAPI.eJobRunStatus.eDone,
                Result: true,
                DateStart: UTIL.nowCleansed(),
                DateEnd: null,
                Configuration: null,
                Parameters: null,
                Output: null,
                Error: null,
                idJobRun: 0
            });
        expect(jobRun).toBeTruthy();

        if (jobSIPackratInspect) {
            const jobRunTemp: DBAPI.JobRun = DBAPI.JobRun.constructFromPrisma({
                idJob: jobSIPackratInspect.idJob,
                Status: DBAPI.eJobRunStatus.eDone,
                Result: true,
                DateStart: UTIL.nowCleansed(),
                DateEnd: null,
                Configuration: null,
                Parameters: null,
                Output: null,
                Error: null,
                idJobRun: 0
            });
            expect(await UTIL.createJobRunTest(jobRunTemp)).toBeTruthy();
        }
    });

    test('DB Creation: Metadata', async () => {
        if (assetThumbnail && userActive && vocabulary && systemObjectScene)
            metadata = new DBAPI.Metadata({
                Name: 'Test Metadata',
                ValueShort: 'Test Value Short',
                ValueExtended: 'Test Value Ext',
                idAssetValue: assetThumbnail.idAsset,
                idUser: userActive.idUser,
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
                Name: 'Test Model',
                DateCreated: UTIL.nowCleansed(),
                idVCreationMethod: vocabulary.idVocabulary,
                idVModality: vocabulary.idVocabulary,
                idVUnits: vocabulary.idVocabulary,
                idVPurpose: vocabulary.idVocabulary,
                idVFileType: vocabulary.idVocabulary,
                idAssetThumbnail: assetThumbnail.idAsset,
                CountAnimations: 0, CountCameras: 0, CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0,
                CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY', IsDracoCompressed: false,
                idModel: 0
            });
        expect(model).toBeTruthy();
    });

    test('DB Creation: Model With Nulls', async () => {
        if (vocabulary)
            modelNulls = await UTIL.createModelTest({
                Name: 'Test Model with Nulls',
                DateCreated: UTIL.nowCleansed(),
                idVCreationMethod: null,
                idVModality: null,
                idVUnits: null,
                idVPurpose: null,
                idVFileType: null,
                idAssetThumbnail: null,
                CountAnimations: 0, CountCameras: 0, CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0,
                CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY', IsDracoCompressed: false,
                idModel: 0
            });
        expect(modelNulls).toBeTruthy();
    });

    test('DB Creation: Fetch System Object Asset', async() => {
        systemObjectModel = model ? await model.fetchSystemObject() : null;
        expect(systemObjectModel).toBeTruthy();
        expect(systemObjectModel ? systemObjectModel.idModel : -1).toBe(model ? model.idModel : -2);
    });

    test('DB Creation: Asset For Model', async () => {
        if (vocabulary&& systemObjectModel)
            assetModel = await UTIL.createAssetTest({
                FileName: 'Test Asset 2',
                FilePath: '/test/asset/path2',
                idAssetGroup: null,
                idVAssetType: vocabulary.idVocabulary,
                idSystemObject: systemObjectModel.idSystemObject,
                StorageKey: UTIL.randomStorageKey('/test/asset/path/'),
                idAsset: 0
            });
        expect(assetModel).toBeTruthy();
    });

    test('DB Creation: AssetVersion For Model', async () => {
        if (assetModel && userActive)
            assetVersionModel = await UTIL.createAssetVersionTest({
                idAsset: assetModel.idAsset,
                Version: 0,
                FileName: assetModel.FilePath,
                idUserCreator: userActive.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum',
                StorageSize: BigInt(50),
                StorageKeyStaging: UTIL.randomStorageKey('/test/asset/path/'),
                Ingested: true,
                BulkIngest: false,
                idAssetVersion: 0
            });
        expect(assetVersionModel).toBeTruthy();
    });

    test('DB Creation: ModelObject', async () => {
        if (model)
            modelObject = await UTIL.createModelObjectTest({
                idModel: model.idModel,
                BoundingBoxP1X: 0, BoundingBoxP1Y: 0, BoundingBoxP1Z: 0, BoundingBoxP2X: 1, BoundingBoxP2Y: 1, BoundingBoxP2Z: 1,
                CountVertices: 100, CountFaces: 50, CountColorChannels: 0, CountTextureCoordinateChannels: 0, HasBones: true, HasFaceNormals: false,
                HasTangents: true, HasTextureCoordinates: false, HasVertexNormals: true, HasVertexColor: false, IsTwoManifoldUnbounded: true,
                IsTwoManifoldBounded: false, IsWatertight: false, SelfIntersecting: false,
                idModelObject: 0
            });
        expect(modelObject).toBeTruthy();

        if (model)
            modelObject2 = await UTIL.createModelObjectTest({
                idModel: model.idModel,
                BoundingBoxP1X: 0, BoundingBoxP1Y: 0, BoundingBoxP1Z: 0, BoundingBoxP2X: 2, BoundingBoxP2Y: 2, BoundingBoxP2Z: 2,
                CountVertices: null, CountFaces: null, CountColorChannels: 0, CountTextureCoordinateChannels: 0, HasBones: false, HasFaceNormals: false,
                HasTangents: null, HasTextureCoordinates: null, HasVertexNormals: false, HasVertexColor: true, IsTwoManifoldUnbounded: false,
                IsTwoManifoldBounded: false, IsWatertight: false, SelfIntersecting: false,
                idModelObject: 0
            });
        expect(modelObject2).toBeTruthy();

        if (model)
            modelObject3 = await UTIL.createModelObjectTest({
                idModel: model.idModel,
                BoundingBoxP1X: null, BoundingBoxP1Y: null, BoundingBoxP1Z: null, BoundingBoxP2X: null, BoundingBoxP2Y: null, BoundingBoxP2Z: null,
                CountVertices: null, CountFaces: null, CountColorChannels: null, CountTextureCoordinateChannels: null, HasBones: null, HasFaceNormals: null,
                HasTangents: null, HasTextureCoordinates: null, HasVertexNormals: null, HasVertexColor: null, IsTwoManifoldUnbounded: null,
                IsTwoManifoldBounded: null, IsWatertight: null, SelfIntersecting: null,
                idModelObject: 0
            });
        expect(modelObject3).toBeTruthy();

    });

    test('DB Creation: ModelMaterial', async () => {
        modelMaterial = await UTIL.createModelMaterialTest({
            Name: 'Test ModelMaterial',
            idModelMaterial: 0
        });
        expect(modelMaterial).toBeTruthy();
    });

    test('DB Creation: ModelObjectModelMaterialXref', async () => {
        if (modelMaterial) {
            if (modelObject)
                modelObjectModelMaterialXref1 = await UTIL.createModelObjectModelMaterialXrefTest({
                    idModelObject: modelObject.idModelObject,
                    idModelMaterial: modelMaterial.idModelMaterial,
                    idModelObjectModelMaterialXref: 0
                });
            if (modelObject2)
                modelObjectModelMaterialXref2 = await UTIL.createModelObjectModelMaterialXrefTest({
                    idModelObject: modelObject2.idModelObject,
                    idModelMaterial: modelMaterial.idModelMaterial,
                    idModelObjectModelMaterialXref: 0
                });
        }
        expect(modelObjectModelMaterialXref1).toBeTruthy();
        expect(modelObjectModelMaterialXref2).toBeTruthy();
    });

    test('DB Creation: ModelMaterialUVMap', async () => {
        if (model && assetThumbnail)
            modelMaterialUVMap = await UTIL.createModelMaterialUVMapTest({
                idModel: model.idModel,
                idAsset: assetThumbnail.idAsset,
                UVMapEdgeLength: 1000,
                idModelMaterialUVMap: 0
            });
        expect(modelMaterialUVMap).toBeTruthy();
    });

    test('DB Creation: ModelMaterialChannel', async () => {
        if (modelMaterial && modelMaterialUVMap && vocabulary)
            modelMaterialChannel = await UTIL.createModelMaterialChannelTest({
                idModelMaterial: modelMaterial.idModelMaterial,
                idVMaterialType: vocabulary.idVocabulary,
                MaterialTypeOther: 'Model Material Type',
                idModelMaterialUVMap: modelMaterialUVMap.idModelMaterialUVMap,
                UVMapEmbedded: false,
                ChannelPosition: 0,
                ChannelWidth: 1,
                Scalar1: null,
                Scalar2: null,
                Scalar3: null,
                Scalar4: null,
                AdditionalAttributes: null,
                idModelMaterialChannel: 0
            });
        expect(modelMaterialChannel).toBeTruthy();

        if (modelMaterial && modelMaterialUVMap && vocabulary)
            modelMaterialChannelNulls = await UTIL.createModelMaterialChannelTest({
                idModelMaterial: modelMaterial.idModelMaterial,
                idVMaterialType: null,
                MaterialTypeOther: 'Model Material Type',
                idModelMaterialUVMap: null,
                UVMapEmbedded: false,
                ChannelPosition: 0,
                ChannelWidth: 1,
                Scalar1: null,
                Scalar2: null,
                Scalar3: null,
                Scalar4: null,
                AdditionalAttributes: null,
                idModelMaterialChannel: 0
            });
        expect(modelMaterialChannelNulls).toBeTruthy();
    });

    test('DB Creation: ModelAsset', async () => {
        if (assetThumbnail && assetVersion) {
            expect(new DBAPI.ModelAsset(assetThumbnail, assetVersion, true, null)).toBeTruthy();
            expect(new DBAPI.ModelAsset(assetThumbnail, assetVersion, false, ['diffuse', 'emmisive'])).toBeTruthy();
            expect(new DBAPI.ModelAsset(assetThumbnail, assetVersion, false, null)).toBeTruthy();
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
                Name: 'Test 1', Usage: 'Web3D', Quality: 'High', FileSize: BigInt(1000000), UVResolution: 1000,
                TS0: 0, TS1: 0, TS2: 0, R0: 0, R1: 0, R2: 0, R3: 0,
                BoundingBoxP1X: 0, BoundingBoxP1Y: 0, BoundingBoxP1Z: 0, BoundingBoxP2X: 1, BoundingBoxP2Y: 1, BoundingBoxP2Z: 1,
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
                Name: null, Usage: null, Quality: null, FileSize: null, UVResolution: null,
                TS0: null, TS1: null, TS2: null, R0: null, R1: null, R2: null, R3: null,
                BoundingBoxP1X: null, BoundingBoxP1Y: null, BoundingBoxP1Z: null, BoundingBoxP2X: null, BoundingBoxP2Y: null, BoundingBoxP2Z: null,
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
                DateCreated: UTIL.nowCleansed(),
                idSystemObjectVersion: 0
            });
        }
        expect(systemObjectVersion).toBeTruthy();
        if (systemObjectVersion) {
            expect(await systemObjectVersion.create()).toBeTruthy();
            expect(systemObjectVersion.idSystemObjectVersion).toBeGreaterThan(0);
        }
    });

    test('DB Creation: SystemObjectVersionAssetVersionXref', async () => {
        if (systemObjectVersion && assetVersion) {
            systemObjectVersionAssetVersionXref = new DBAPI.SystemObjectVersionAssetVersionXref({
                idSystemObjectVersion: systemObjectVersion.idSystemObjectVersion,
                idAssetVersion: assetVersion.idAssetVersion,
                idSystemObjectVersionAssetVersionXref: 0
            });
        }
        expect(systemObjectVersionAssetVersionXref).toBeTruthy();
        if (systemObjectVersionAssetVersionXref) {
            expect(await systemObjectVersionAssetVersionXref.create()).toBeTruthy();
            expect(systemObjectVersionAssetVersionXref.idSystemObjectVersionAssetVersionXref).toBeGreaterThan(0);
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

    test('DB Creation: SystemObjectXref Subject-Item 1/3 Wire Third Time', async () => {
        if (systemObjectSubject && systemObjectSubjectNulls && systemObjectItem) {
            systemObjectXrefSubItem1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(systemObjectSubject.idSystemObject, systemObjectItem.idSystemObject);
            systemObjectXrefSubItem3 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(systemObjectSubjectNulls.idSystemObject, systemObjectItem.idSystemObject);
        }
        expect(systemObjectXrefSubItem1).toBeTruthy();
        if (systemObjectXrefSubItem1)
            expect(systemObjectXrefSubItem1.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefSubItem3).toBeTruthy();
        if (systemObjectXrefSubItem3)
            expect(systemObjectXrefSubItem3.idSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectXref Subject-Item 2/4', async () => {
        if (subject && subjectNulls && itemNulls && project) {
            systemObjectXrefSubItem2 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subject, itemNulls);
            systemObjectXrefSubItem4 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(subjectNulls, itemNulls);
            systemObjectXrefProjectItem1 = await DBAPI.SystemObjectXref.wireObjectsIfNeeded(project, itemNulls);
        }
        expect(systemObjectXrefSubItem2).toBeTruthy();
        if (systemObjectXrefSubItem2)
            expect(systemObjectXrefSubItem2.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefSubItem4).toBeTruthy();
        if (systemObjectXrefSubItem4)
            expect(systemObjectXrefSubItem4.idSystemObjectXref).toBeGreaterThan(0);

        expect(systemObjectXrefProjectItem1).toBeTruthy();
        if (systemObjectXrefProjectItem1)
            expect(systemObjectXrefProjectItem1.idSystemObjectXref).toBeGreaterThan(0);
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
        if (license && userActive && systemObjectSubject)
            licenseAssignment = new DBAPI.LicenseAssignment({
                idLicense: license.idLicense,
                idUserCreator: userActive.idUser,
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
        if (systemObjectSubject && userActive)
            userPersonalizationSystemObject = new DBAPI.UserPersonalizationSystemObject({
                idUser: userActive.idUser,
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
        if (userActive)
            userPersonalizationUrl = new DBAPI.UserPersonalizationUrl({
                idUser: userActive.idUser,
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
        if (vocabularyWorkflowType && project && userActive)
            workflow = await UTIL.createWorkflowTest({
                idVWorkflowType: vocabularyWorkflowType.idVocabulary,
                idProject: project.idProject,
                idUserInitiator: userActive.idUser,
                DateInitiated: UTIL.nowCleansed(),
                DateUpdated: UTIL.nowCleansed(),
                Parameters: null,
                idWorkflow: 0
            });
        expect(workflow).toBeTruthy();
        if (workflow) {
            expect(await workflow.create()).toBeTruthy();
            expect(workflow.idWorkflow).toBeGreaterThan(0);
        }
    });

    test('DB Creation: Workflow With Nulls', async () => {
        if (vocabularyWorkflowType)
            workflowNulls = await UTIL.createWorkflowTest({
                idVWorkflowType: vocabularyWorkflowType.idVocabulary,
                idProject: null,
                idUserInitiator: null,
                DateInitiated: UTIL.nowCleansed(),
                DateUpdated: UTIL.nowCleansed(),
                Parameters: null,
                idWorkflow: 0
            });
        expect(workflowNulls).toBeTruthy();
        if (workflowNulls) {
            expect(await workflowNulls.create()).toBeTruthy();
            expect(workflowNulls.idWorkflow).toBeGreaterThan(0);
        }
    });

    test('DB Creation: WorkflowStep', async () => {
        if (workflow && userActive && vocabulary && jobRun)
            workflowStep = await UTIL.createWorkflowStepTest({
                idWorkflow: workflow.idWorkflow,
                idJobRun: jobRun.idJobRun,
                idUserOwner: userActive.idUser,
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

        if (workflow && vocabulary)
            workflowStepNulls = await UTIL.createWorkflowStepTest({
                idWorkflow: workflow.idWorkflow,
                idJobRun: null,
                idUserOwner: null,
                idVWorkflowStepType: vocabulary.idVocabulary,
                State: 0,
                DateCreated: UTIL.nowCleansed(),
                DateCompleted: UTIL.nowCleansed(),
                idWorkflowStep: 0
            });
        expect(workflowStepNulls).toBeTruthy();
        if (workflowStepNulls) {
            expect(await workflowStepNulls.create()).toBeTruthy();
            expect(workflowStepNulls.idWorkflowStep).toBeGreaterThan(0);
        }
    });

    test('DB Creation: WorkflowStepSystemObjectXref', async () => {
        if (systemObjectAssetVersion && workflowStep)
            workflowStepSystemObjectXref = new DBAPI.WorkflowStepSystemObjectXref({
                idWorkflowStep: workflowStep.idWorkflowStep,
                idSystemObject: systemObjectAssetVersion.idSystemObject,
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
                Input: true,
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
// #endregion

// *******************************************************************
// #region DB Fetch By ID Test Suite
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
        if (userActive) {
            accessPolicyFetch = await DBAPI.AccessPolicy.fetchFromUser(userActive.idUser);
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

    test('DB Fetch Asset: Asset.computeVersionCountMap', async () => {
        let versionCountMap: Map<number, number> | null = null;
        if (assetThumbnail) {
            versionCountMap = await DBAPI.Asset.computeVersionCountMap([assetThumbnail.idAsset]);
            if (versionCountMap) {
                expect(versionCountMap.has(assetThumbnail.idAsset)).toBeTruthy();
                expect(versionCountMap.get(assetThumbnail.idAsset)).toEqual(4);
            }
        }
        expect(versionCountMap).toBeTruthy();
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
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion, assetVersionNotIngested, assetVersionNotIngested2, assetVersionNotProcessed]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromAsset Not Retired', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (assetThumbnail) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromAsset(assetThumbnail.idAsset, false);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion, assetVersionNotIngested, assetVersionNotIngested2, assetVersionNotProcessed]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromAsset Retired', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (assetThumbnail) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromAsset(assetThumbnail.idAsset, true);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual([]);
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromSystemObject', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (systemObjectSubject) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromSystemObject(systemObjectSubject.idSystemObject);
            if (assetVersionFetch)
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromSystemObjectVersion', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (systemObjectVersion) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromSystemObjectVersion(systemObjectVersion.idSystemObjectVersion);
            if (assetVersionFetch)
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchLatestFromSystemObject (from SystemObjectVersion)', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (systemObjectScene) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchLatestFromSystemObject(systemObjectScene.idSystemObject);
            if (assetVersionFetch)
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchLatestFromSystemObject (from SystemObject)', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (systemObjectSubject) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchLatestFromSystemObject(systemObjectSubject.idSystemObject);
            if (assetVersionFetch)
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchLatestFromAsset Not Ingested, Bulk Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion | null = null;
        if (assetThumbnail) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchLatestFromAsset(assetThumbnail.idAsset);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(assetVersion);
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Creation: AssetVersion 2', async () => {
        if (assetThumbnail && userActive)
            assetVersion2 = await UTIL.createAssetVersionTest({
                idAsset: assetThumbnail.idAsset,
                Version: 0,
                FileName: assetThumbnail.FileName,
                idUserCreator: userActive.idUser,
                DateCreated: UTIL.nowCleansed(),
                StorageHash: 'Asset Checksum',
                StorageSize: BigInt(50),
                StorageKeyStaging: '',
                Ingested: true,
                BulkIngest: false,
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
            expect(assetVersionFetch).toBeTruthy();

            assetVersionFetch = await DBAPI.AssetVersion.fetchByAssetAndVersion(assetThumbnail.idAsset, 2);
            if (assetVersionFetch)
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion2]));
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromUser', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (userActive) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromUser(userActive.idUser);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromUserByIngested Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (userActive) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromUserByIngested(userActive.idUser, true);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchFromUserByIngested Not Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (userActive) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchFromUserByIngested(userActive.idUser, false, false);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersionNotIngested, assetVersionNotIngested2]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchByIngested Ingested', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (userActive) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchByIngested(true);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchByIngested Not Ingested, Processed', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (userActive) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchByIngested(false);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersionNotIngested, assetVersionNotIngested2]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchByIngested Not Ingested, Not Processed', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (userActive) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchByIngested(null);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersionNotProcessed]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.fetchByStorageKeyStaging', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        if (assetVersion) {
            assetVersionFetch = await DBAPI.AssetVersion.fetchByStorageKeyStaging(assetVersion.StorageKeyStaging);
            if (assetVersionFetch) {
                expect(assetVersionFetch.length).toEqual(1);
                expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion]));
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.countStorageKeyStaging Ingested, Not Retired', async () => {
        let assetVersionCount: number | null = null;
        if (assetVersion) {
            assetVersionCount = await DBAPI.AssetVersion.countStorageKeyStaging(assetVersion.StorageKeyStaging, true, false);
            if (assetVersionCount)
                expect(assetVersionCount).toEqual(1);
        }
        expect(assetVersionCount).toBeTruthy();
    });

    test('DB Fetch AssetVersion: AssetVersion.countStorageKeyStaging Defaults', async () => {
        let assetVersionCount: number | null = null;
        if (assetVersion) {
            assetVersionCount = await DBAPI.AssetVersion.countStorageKeyStaging(assetVersion.StorageKeyStaging);
            if (assetVersionCount)
                expect(assetVersionCount).toEqual(0);
        }
        expect(assetVersionCount).not.toBeNull();
    });

    test('DB Fetch By ID: Audit', async () => {
        let auditFetch: DBAPI.Audit | null = null;
        if (audit) {
            auditFetch = await DBAPI.Audit.fetch(audit.idAudit);
            if (auditFetch) {
                expect(auditFetch).toMatchObject(audit);
                expect(audit).toMatchObject(auditFetch);
            }

            audit.setAuditType(DBAPI.eAuditType.eUnknown);
            expect(audit.getAuditType()).toEqual(DBAPI.eAuditType.eUnknown);
            audit.setAuditType(DBAPI.eAuditType.eAuthLogin);
            expect(audit.getAuditType()).toEqual(DBAPI.eAuditType.eAuthLogin);
            audit.setAuditType(DBAPI.eAuditType.eSceneQCd);
            expect(audit.getAuditType()).toEqual(DBAPI.eAuditType.eSceneQCd);
            audit.setAuditType(DBAPI.eAuditType.eDBCreate);
            expect(audit.getAuditType()).toEqual(DBAPI.eAuditType.eDBCreate);
            audit.setAuditType(DBAPI.eAuditType.eDBUpdate);
            expect(audit.getAuditType()).toEqual(DBAPI.eAuditType.eDBUpdate);
            audit.setAuditType(DBAPI.eAuditType.eDBDelete);
            expect(audit.getAuditType()).toEqual(DBAPI.eAuditType.eDBDelete);

            audit.setDBObjectType(null);
            expect(audit.getDBObjectType()).toEqual(DBAPI.eSystemObjectType.eUnknown);
            audit.setDBObjectType(DBAPI.eSystemObjectType.eUnit);
            expect(audit.getDBObjectType()).toEqual(DBAPI.eSystemObjectType.eUnit);
            audit.setDBObjectType(DBAPI.eNonSystemObjectType.eUnitEdan);
            expect(audit.getDBObjectType()).toEqual(DBAPI.eNonSystemObjectType.eUnitEdan);
        }
        expect(auditFetch).toBeTruthy();
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

    test('DB Fetch By ID: Job', async () => {
        let jobFetch: DBAPI.Job | null = null;
        if (job) {
            jobFetch = await DBAPI.Job.fetch(job.idJob);
            if (jobFetch) {
                expect(jobFetch).toMatchObject(job);
                expect(job).toMatchObject(jobFetch);
            }
        }
        expect(jobFetch).toBeTruthy();
    });

    test('DB Fetch: Job.fetchByType', async () => {
        let jobFetch: DBAPI.Job[] | null = [];
        if (job) {
            jobFetch = await DBAPI.Job.fetchByType(job.idVJobType);
            if (jobFetch)
                expect(jobFetch).toEqual(expect.arrayContaining([job]));
        }
        expect(jobFetch).toBeTruthy();
    });

    test('DB Fetch By ID: JobRun', async () => {
        let jobRunFetch: DBAPI.JobRun | null = null;
        if (jobRun) {
            jobRunFetch = await DBAPI.JobRun.fetch(jobRun.idJobRun);
            if (jobRunFetch) {
                expect(jobRunFetch).toMatchObject(jobRun);
                expect(jobRun).toMatchObject(jobRunFetch);
            }
        }
        expect(jobRunFetch).toBeTruthy();
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
        if (userActive) {
            licenseAssignmentFetch = await DBAPI.LicenseAssignment.fetchFromUser(userActive.idUser);
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
        if (userActive) {
            metadataFetch = await DBAPI.Metadata.fetchFromUser(userActive.idUser);
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

    test('DB Fetch By ID: ModelMaterial', async () => {
        let modelMaterialFetch: DBAPI.ModelMaterial | null = null;
        if (modelMaterial) {
            modelMaterialFetch = await DBAPI.ModelMaterial.fetch(modelMaterial.idModelMaterial);
            if (modelMaterialFetch) {
                expect(modelMaterialFetch).toMatchObject(modelMaterial);
                expect(modelMaterial).toMatchObject(modelMaterialFetch);
            }
        }
        expect(modelMaterialFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelMaterialChannel', async () => {
        let modelMaterialChannelFetch: DBAPI.ModelMaterialChannel | null = null;
        if (modelMaterialChannel) {
            modelMaterialChannelFetch = await DBAPI.ModelMaterialChannel.fetch(modelMaterialChannel.idModelMaterialChannel);
            if (modelMaterialChannelFetch) {
                expect(modelMaterialChannelFetch).toMatchObject(modelMaterialChannel);
                expect(modelMaterialChannel).toMatchObject(modelMaterialChannelFetch);
            }
        }
        expect(modelMaterialChannelFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelMaterialUVMap', async () => {
        let modelMaterialUVMapFetch: DBAPI.ModelMaterialUVMap | null = null;
        if (modelMaterialUVMap) {
            modelMaterialUVMapFetch = await DBAPI.ModelMaterialUVMap.fetch(modelMaterialUVMap.idModelMaterialUVMap);
            if (modelMaterialUVMapFetch) {
                expect(modelMaterialUVMapFetch).toMatchObject(modelMaterialUVMap);
                expect(modelMaterialUVMap).toMatchObject(modelMaterialUVMapFetch);
            }
        }
        expect(modelMaterialUVMapFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelObject', async () => {
        let modelObjectFetch: DBAPI.ModelObject | null = null;
        if (modelObject) {
            modelObjectFetch = await DBAPI.ModelObject.fetch(modelObject.idModelObject);
            if (modelObjectFetch) {
                expect(modelObjectFetch).toMatchObject(modelObject);
                expect(modelObject).toMatchObject(modelObjectFetch);
            }
        }
        expect(modelObjectFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelObjectModelMaterialXref', async () => {
        let modelObjectModelMaterialXrefFetch: DBAPI.ModelObjectModelMaterialXref | null = null;
        if (modelObjectModelMaterialXref1) {
            modelObjectModelMaterialXrefFetch = await DBAPI.ModelObjectModelMaterialXref.fetch(modelObjectModelMaterialXref1.idModelObjectModelMaterialXref);
            if (modelObjectModelMaterialXrefFetch) {
                expect(modelObjectModelMaterialXrefFetch).toMatchObject(modelObjectModelMaterialXref1);
                expect(modelObjectModelMaterialXref1).toMatchObject(modelObjectModelMaterialXrefFetch);
            }
        }
        expect(modelObjectModelMaterialXrefFetch).toBeTruthy();
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

    test('DB Fetch SystemObjectVersion: SystemObjectVersion.fetchLatestFromSystemObject', async () => {
        let systemObjectVersionFetch: DBAPI.SystemObjectVersion | null = null;
        if (systemObjectScene) {
            systemObjectVersionFetch = await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(systemObjectScene.idSystemObject);
            expect(systemObjectVersion).toBeTruthy();
            if (systemObjectVersionFetch && systemObjectVersion) {
                expect(systemObjectVersionFetch.idSystemObjectVersion).toEqual(systemObjectVersion.idSystemObjectVersion);
                expect(systemObjectVersionFetch.idSystemObject).toEqual(systemObjectVersion.idSystemObject);
                expect(systemObjectVersionFetch.PublishedState).toEqual(systemObjectVersion.PublishedState);
            }
        }
        expect(systemObjectVersionFetch).toBeTruthy();
    });

    test('DB Fetch SystemObjectVersion: SystemObjectVersion.clone latest', async () => {
        let systemObjectVersionFetch: DBAPI.SystemObjectVersion | null = null;
        if (systemObjectScene) {
            systemObjectVersionFetch = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(systemObjectScene.idSystemObject, null);
            if (systemObjectVersionFetch && systemObjectVersion)
                expect(systemObjectVersionFetch.idSystemObjectVersion).toBeGreaterThan(systemObjectVersion.idSystemObjectVersion);
        }
        expect(systemObjectVersionFetch).toBeTruthy();
    });

    test('DB Fetch SystemObjectVersion: SystemObjectVersion.clone specific', async () => {
        let systemObjectVersionFetch: DBAPI.SystemObjectVersion | null = null;
        if (systemObjectScene && systemObjectVersion && assetVersion) {
            systemObjectVersionFetch = await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(systemObjectScene.idSystemObject, systemObjectVersion.idSystemObjectVersion, new Map<number, number>([[assetVersion.idAsset, assetVersion.idAssetVersion]]));
            if (systemObjectVersionFetch && systemObjectVersion)
                expect(systemObjectVersionFetch.idSystemObjectVersion).toBeGreaterThan(systemObjectVersion.idSystemObjectVersion);
        }
        expect(systemObjectVersionFetch).toBeTruthy();
    });

    test('DB Fetch By ID: SystemObjectVersionAssetVersionXref', async () => {
        let systemObjectVersionAssetVersionXrefFetch: DBAPI.SystemObjectVersionAssetVersionXref | null = null;
        if (systemObjectVersionAssetVersionXref) {
            systemObjectVersionAssetVersionXrefFetch = await DBAPI.SystemObjectVersionAssetVersionXref.fetch(systemObjectVersionAssetVersionXref.idSystemObjectVersionAssetVersionXref);
            if (systemObjectVersionAssetVersionXrefFetch) {
                expect(systemObjectVersionAssetVersionXrefFetch).toMatchObject(systemObjectVersionAssetVersionXref);
                expect(systemObjectVersionAssetVersionXref).toMatchObject(systemObjectVersionAssetVersionXrefFetch);
            }
        }
        expect(systemObjectVersionAssetVersionXrefFetch).toBeTruthy();
    });

    test('DB Fetch SystemObjectVersionAssetVersionXref: SystemObjectVersionAssetVersionXref.fetchFromSystemObjectVersion', async () => {
        let systemObjectVersionAssetVersionXrefFetch: DBAPI.SystemObjectVersionAssetVersionXref[] | null = null;
        if (systemObjectVersion) {
            systemObjectVersionAssetVersionXrefFetch = await DBAPI.SystemObjectVersionAssetVersionXref.fetchFromSystemObjectVersion(systemObjectVersion.idSystemObjectVersion);
            if (systemObjectVersionAssetVersionXrefFetch) {
                expect(systemObjectVersionAssetVersionXrefFetch).toEqual(expect.arrayContaining([systemObjectVersionAssetVersionXref]));
            }
        }
        expect(systemObjectVersionAssetVersionXrefFetch).toBeTruthy();
    });

    test('DB Fetch SystemObjectVersionAssetVersionXref: SystemObjectVersionAssetVersionXref.fetchFromAssetVersion', async () => {
        let systemObjectVersionAssetVersionXrefFetch: DBAPI.SystemObjectVersionAssetVersionXref[] | null = null;
        if (assetVersion) {
            systemObjectVersionAssetVersionXrefFetch = await DBAPI.SystemObjectVersionAssetVersionXref.fetchFromAssetVersion(assetVersion.idAssetVersion);
            if (systemObjectVersionAssetVersionXrefFetch) {
                expect(systemObjectVersionAssetVersionXrefFetch).toEqual(expect.arrayContaining([systemObjectVersionAssetVersionXref]));
            }
        }
        expect(systemObjectVersionAssetVersionXrefFetch).toBeTruthy();
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
        if (userActive) {
            userFetch = await DBAPI.User.fetch(userActive.idUser);
            if (userFetch) {
                expect(userFetch).toMatchObject(userActive);
                expect(userActive).toMatchObject(userFetch);
            }
        }
        expect(userFetch).toBeTruthy();
    });

    test('DB Fetch By EmailAddress: User', async () => {
        let userFetchArray: DBAPI.User[] | null = null;
        if (userActive) {
            userFetchArray = await DBAPI.User.fetchByEmail(userActive.EmailAddress);
            if (userFetchArray)
                expect(userFetchArray).toEqual(expect.arrayContaining([userActive]));
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
        if (userActive) {
            userPersonalizationSystemObjectFetch = await DBAPI.UserPersonalizationSystemObject.fetchFromUser(userActive.idUser);
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
        if (userActive) {
            userPersonalizationUrlFetch = await DBAPI.UserPersonalizationUrl.fetchFromUser(userActive.idUser);
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
        if (userActive) {
            workflowFetch = await DBAPI.Workflow.fetchFromUser(userActive.idUser);
            if (workflowFetch) {
                expect(workflowFetch).toEqual(expect.arrayContaining([workflow]));
            }
        }
        expect(workflowFetch).toBeTruthy();
    });

    test('DB Fetch Workflow: Workflow.fetchFromWorkflowType', async () => {
        let workflowFetch: DBAPI.Workflow[] | null = null;
        if (vocabularyWorkflowType) {
            LOG.info(`DB Fetch Workflow fetching from workflow vocab ${JSON.stringify(vocabularyWorkflowType)}`, LOG.LS.eTEST);
            const eVocabEnum: eVocabularyID | undefined = await VocabularyCache.vocabularyIdToEnum(vocabularyWorkflowType.idVocabulary);
            expect(eVocabEnum).toBeTruthy();

            if (eVocabEnum) {
                workflowFetch = await DBAPI.Workflow.fetchFromWorkflowType(eVocabEnum);
                if (workflowFetch) {
                    if (workflow && workflowNulls)
                        expect(workflowFetch).toEqual(expect.arrayContaining([workflow, workflowNulls]));
                }
            }
        }
        expect(workflowFetch).toBeTruthy();

        workflowFetch = await DBAPI.Workflow.fetchFromWorkflowType(eVocabularyID.eAssetAssetTypeModel);
        expect(workflowFetch).toBeFalsy();
        workflowFetch = await DBAPI.Workflow.fetchFromWorkflowType(eVocabularyID.eNone);
        expect(workflowFetch).toBeFalsy();
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
        if (userActive) {
            workflowStepFetch = await DBAPI.WorkflowStep.fetchFromUser(userActive.idUser);
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

    test('DB Fetch WorkflowStep: WorkflowStep.fetchFromJobRun', async () => {
        let workflowStepFetch: DBAPI.WorkflowStep[] | null = null;
        if (jobRun) {
            workflowStepFetch = await DBAPI.WorkflowStep.fetchFromJobRun(jobRun.idJobRun);
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

    test('DB Fetch WorkflowStepSystemObjectXref: WorkflowStepSystemObjectXref.fetchFromWorkflow', async () => {
        let workflowStepSystemObjectXrefFetch: DBAPI.WorkflowStepSystemObjectXref[] | null = null;
        if (workflowStep) {
            workflowStepSystemObjectXrefFetch = await DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflow(workflowStep.idWorkflow);
            if (workflowStepSystemObjectXrefFetch) {
                if (workflowStepSystemObjectXref) {
                    expect(workflowStepSystemObjectXrefFetch).toEqual(expect.arrayContaining([workflowStepSystemObjectXref, workflowStepSystemObjectXref2]));
                }
            }
        }
        expect(workflowStepSystemObjectXrefFetch).toBeTruthy();
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

    test('DB Fetch SystemObject: SystemObjectPairs.SystemObjectBased for empty SystemObjectPairs', async () => {
        const SYOP: DBAPI.SystemObjectPairs = new DBAPI.SystemObjectPairs({
            idSystemObject: 0, idUnit: null, idProject: null, idSubject: null, idItem: null, idCaptureData: null,
            idModel: null, idScene: null, idIntermediaryFile: null, idAsset: null, idAssetVersion: null,
            idProjectDocumentation: null, idActor: null, idStakeholder: null, Retired: false,
            Actor: null, Asset_AssetToSystemObject_idAsset: null, AssetVersion: null, CaptureData: null, // eslint-disable-line camelcase
            IntermediaryFile: null, Item: null, Model: null, Project: null, ProjectDocumentation: null,
            Scene: null, Stakeholder: null, Subject: null, Unit: null
        });
        expect(SYOP.SystemObjectBased).toBeNull();
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

                expect(SYOP.SystemObjectBased).toMatchObject(actorWithUnit);
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
                expect(SYOP.Asset).toMatchObject(assetThumbnail);
                if (SYOP.Asset)
                    expect(assetThumbnail).toEqual(SYOP.Asset);
                expect(SYOP.SystemObjectBased).toMatchObject(assetThumbnail);

                SYOP.Asset = assetThumbnail; // for 100% test coverage ...
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
                expect(SYOP.SystemObjectBased).toMatchObject(assetVersion);
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
                expect(SYOP.SystemObjectBased).toMatchObject(captureData);
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
                expect(SYOP.SystemObjectBased).toMatchObject(intermediaryFile);
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
                expect(SYOP.SystemObjectBased).toMatchObject(item);
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
                expect(SYOP.SystemObjectBased).toMatchObject(model);
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
                expect(SYOP.SystemObjectBased).toMatchObject(project);
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
                expect(SYOP.SystemObjectBased).toMatchObject(projectDocumentation);
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
                expect(SYOP.SystemObjectBased).toMatchObject(scene);
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
                expect(SYOP.SystemObjectBased).toMatchObject(stakeholder);
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
                expect(SYOP.SystemObjectBased).toMatchObject(subject);
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
                expect(SYOP.SystemObjectBased).toMatchObject(unit);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: PublishedStateEnumToString', async () => {
        expect(DBAPI.PublishedStateEnumToString(-1)).toEqual('Not Published');
        expect(DBAPI.PublishedStateEnumToString(DBAPI.ePublishedState.eNotPublished)).toEqual('Not Published');
        expect(DBAPI.PublishedStateEnumToString(DBAPI.ePublishedState.eRestricted)).toEqual('Restricted');
        expect(DBAPI.PublishedStateEnumToString(DBAPI.ePublishedState.eViewOnly)).toEqual('View Only');
        expect(DBAPI.PublishedStateEnumToString(DBAPI.ePublishedState.eViewDownloadRestriction)).toEqual('View and Download with usage restrictions');
        expect(DBAPI.PublishedStateEnumToString(DBAPI.ePublishedState.eViewDownloadCC0)).toEqual('View and Download CC0');
    });

    test('DB Fetch SystemObject: SystemObjectTypeToName', async () => {
        expect(DBAPI.SystemObjectTypeToName(null)).toEqual('Unknown');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eUnit)).toEqual('Unit');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eProject)).toEqual('Project');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eSubject)).toEqual('Subject');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eItem)).toEqual('Item');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eCaptureData)).toEqual('Capture Data');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eModel)).toEqual('Model');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eScene)).toEqual('Scene');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eIntermediaryFile)).toEqual('Intermediary File');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eProjectDocumentation)).toEqual('Project Documentation');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eAsset)).toEqual('Asset');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eAssetVersion)).toEqual('Asset Version');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eActor)).toEqual('Actor');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eStakeholder)).toEqual('Stakeholder');
        expect(DBAPI.SystemObjectTypeToName(DBAPI.eSystemObjectType.eUnknown)).toEqual('Unknown');
    });

    test('DB Fetch SystemObject: SystemObjectNameToType', async () => {
        expect(DBAPI.SystemObjectNameToType(null)).toEqual(DBAPI.eSystemObjectType.eUnknown);
        expect(DBAPI.SystemObjectNameToType('Unit')).toEqual(DBAPI.eSystemObjectType.eUnit);
        expect(DBAPI.SystemObjectNameToType('Project')).toEqual(DBAPI.eSystemObjectType.eProject);
        expect(DBAPI.SystemObjectNameToType('Subject')).toEqual(DBAPI.eSystemObjectType.eSubject);
        expect(DBAPI.SystemObjectNameToType('Item')).toEqual(DBAPI.eSystemObjectType.eItem);
        expect(DBAPI.SystemObjectNameToType('Capture Data')).toEqual(DBAPI.eSystemObjectType.eCaptureData);
        expect(DBAPI.SystemObjectNameToType('Model')).toEqual(DBAPI.eSystemObjectType.eModel);
        expect(DBAPI.SystemObjectNameToType('Scene')).toEqual(DBAPI.eSystemObjectType.eScene);
        expect(DBAPI.SystemObjectNameToType('Intermediary File')).toEqual(DBAPI.eSystemObjectType.eIntermediaryFile);
        expect(DBAPI.SystemObjectNameToType('Project Documentation')).toEqual(DBAPI.eSystemObjectType.eProjectDocumentation);
        expect(DBAPI.SystemObjectNameToType('Asset')).toEqual(DBAPI.eSystemObjectType.eAsset);
        expect(DBAPI.SystemObjectNameToType('Asset Version')).toEqual(DBAPI.eSystemObjectType.eAssetVersion);
        expect(DBAPI.SystemObjectNameToType('Actor')).toEqual(DBAPI.eSystemObjectType.eActor);
        expect(DBAPI.SystemObjectNameToType('Stakeholder')).toEqual(DBAPI.eSystemObjectType.eStakeholder);
        expect(DBAPI.SystemObjectNameToType('Unknown')).toEqual(DBAPI.eSystemObjectType.eUnknown);
    });

    test('DB Fetch SystemObject: DBObjectTypeToName', async () => {
        expect(DBAPI.DBObjectTypeToName(null)).toEqual('Unknown');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eUnit)).toEqual('Unit');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eProject)).toEqual('Project');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eSubject)).toEqual('Subject');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eItem)).toEqual('Item');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eCaptureData)).toEqual('Capture Data');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eModel)).toEqual('Model');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eScene)).toEqual('Scene');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eIntermediaryFile)).toEqual('Intermediary File');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eProjectDocumentation)).toEqual('Project Documentation');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eAsset)).toEqual('Asset');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eAssetVersion)).toEqual('Asset Version');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eActor)).toEqual('Actor');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eStakeholder)).toEqual('Stakeholder');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eSystemObjectType.eUnknown)).toEqual('Unknown');

        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eAccessAction)).toEqual('AccessAction');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eAccessContext)).toEqual('AccessContext');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eAccessContextObject)).toEqual('AccessContextObject');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eAccessPolicy)).toEqual('AccessPolicy');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eAccessRole)).toEqual('AccessRole');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eAccessRoleAccessActionXref)).toEqual('AccessRoleAccessActionXref');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eAssetGroup)).toEqual('AssetGroup');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eAudit)).toEqual('Audit');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eCaptureDataFile)).toEqual('CaptureDataFile');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eCaptureDataGroup)).toEqual('CaptureDataGroup');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eCaptureDataGroupCaptureDataXref)).toEqual('CaptureDataGroupCaptureDataXref');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eCaptureDataPhoto)).toEqual('CaptureDataPhoto');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eGeoLocation)).toEqual('GeoLocation');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eIdentifier)).toEqual('Identifier');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eJob)).toEqual('Job');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eJobRun)).toEqual('JobRun');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eLicense)).toEqual('License');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eLicenseAssignment)).toEqual('LicenseAssignment');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eMetadata)).toEqual('Metadata');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eModelMaterial)).toEqual('ModelMaterial');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eModelMaterialChannel)).toEqual('ModelMaterialChannel');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eModelMaterialUVMap)).toEqual('ModelMaterialUVMap');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eModelObject)).toEqual('ModelObject');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eModelObjectModelMaterialXref)).toEqual('ModelObjectModelMaterialXref');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eModelProcessingAction)).toEqual('ModelProcessingAction');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eModelProcessingActionStep)).toEqual('ModelProessingActionStep');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eModelSceneXref)).toEqual('ModelSceneXref');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eSystemObject)).toEqual('SystemObject');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eSystemObjectVersion)).toEqual('SystemObjectVersion');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eSystemObjectXref)).toEqual('SystemObjectXref');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eUnitEdan)).toEqual('UnitEdan');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eUser)).toEqual('User');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eUserPersonalizationSystemObject)).toEqual('UserPersonalizationSystemObject');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eUserPersonalizationUrl)).toEqual('UserPersonalizationUrl');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eVocabulary)).toEqual('Vocabulary');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eVocabularySet)).toEqual('VocabularySet');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eWorkflow)).toEqual('Workflow');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eWorkflowStep)).toEqual('WorkflowStep');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eWorkflowStepSystemObjectXref)).toEqual('WorkflowStepSystemObjectXref');
        expect(DBAPI.DBObjectTypeToName(DBAPI.eNonSystemObjectType.eUnknown)).toEqual('Unknown');
    });

    test('DB Fetch SystemObject: DBObjectNameToType', async () => {
        expect(DBAPI.DBObjectNameToType(null)).toEqual(DBAPI.eSystemObjectType.eUnknown);
        expect(DBAPI.DBObjectNameToType('Unit')).toEqual(DBAPI.eSystemObjectType.eUnit);
        expect(DBAPI.DBObjectNameToType('Project')).toEqual(DBAPI.eSystemObjectType.eProject);
        expect(DBAPI.DBObjectNameToType('Subject')).toEqual(DBAPI.eSystemObjectType.eSubject);
        expect(DBAPI.DBObjectNameToType('Item')).toEqual(DBAPI.eSystemObjectType.eItem);
        expect(DBAPI.DBObjectNameToType('Capture Data')).toEqual(DBAPI.eSystemObjectType.eCaptureData);
        expect(DBAPI.DBObjectNameToType('Model')).toEqual(DBAPI.eSystemObjectType.eModel);
        expect(DBAPI.DBObjectNameToType('Scene')).toEqual(DBAPI.eSystemObjectType.eScene);
        expect(DBAPI.DBObjectNameToType('Intermediary File')).toEqual(DBAPI.eSystemObjectType.eIntermediaryFile);
        expect(DBAPI.DBObjectNameToType('Project Documentation')).toEqual(DBAPI.eSystemObjectType.eProjectDocumentation);
        expect(DBAPI.DBObjectNameToType('Asset')).toEqual(DBAPI.eSystemObjectType.eAsset);
        expect(DBAPI.DBObjectNameToType('Asset Version')).toEqual(DBAPI.eSystemObjectType.eAssetVersion);
        expect(DBAPI.DBObjectNameToType('Actor')).toEqual(DBAPI.eSystemObjectType.eActor);
        expect(DBAPI.DBObjectNameToType('Stakeholder')).toEqual(DBAPI.eSystemObjectType.eStakeholder);
        expect(DBAPI.DBObjectNameToType('Unknown')).toEqual(DBAPI.eSystemObjectType.eUnknown);

        expect(DBAPI.DBObjectNameToType('AccessAction')).toEqual(DBAPI.eNonSystemObjectType.eAccessAction);
        expect(DBAPI.DBObjectNameToType('Access Action')).toEqual(DBAPI.eNonSystemObjectType.eAccessAction);
        expect(DBAPI.DBObjectNameToType('AccessContext')).toEqual(DBAPI.eNonSystemObjectType.eAccessContext);
        expect(DBAPI.DBObjectNameToType('Access Context')).toEqual(DBAPI.eNonSystemObjectType.eAccessContext);
        expect(DBAPI.DBObjectNameToType('AccessContextObject')).toEqual(DBAPI.eNonSystemObjectType.eAccessContextObject);
        expect(DBAPI.DBObjectNameToType('Access Context Object')).toEqual(DBAPI.eNonSystemObjectType.eAccessContextObject);
        expect(DBAPI.DBObjectNameToType('AccessPolicy')).toEqual(DBAPI.eNonSystemObjectType.eAccessPolicy);
        expect(DBAPI.DBObjectNameToType('Access Policy')).toEqual(DBAPI.eNonSystemObjectType.eAccessPolicy);
        expect(DBAPI.DBObjectNameToType('AccessRole')).toEqual(DBAPI.eNonSystemObjectType.eAccessRole);
        expect(DBAPI.DBObjectNameToType('Access Role')).toEqual(DBAPI.eNonSystemObjectType.eAccessRole);
        expect(DBAPI.DBObjectNameToType('AccessRoleAccessActionXref')).toEqual(DBAPI.eNonSystemObjectType.eAccessRoleAccessActionXref);
        expect(DBAPI.DBObjectNameToType('Access Role Access Action Xref')).toEqual(DBAPI.eNonSystemObjectType.eAccessRoleAccessActionXref);
        expect(DBAPI.DBObjectNameToType('AssetGroup')).toEqual(DBAPI.eNonSystemObjectType.eAssetGroup);
        expect(DBAPI.DBObjectNameToType('Asset Group')).toEqual(DBAPI.eNonSystemObjectType.eAssetGroup);
        expect(DBAPI.DBObjectNameToType('Audit')).toEqual(DBAPI.eNonSystemObjectType.eAudit);
        expect(DBAPI.DBObjectNameToType('CaptureDataFile')).toEqual(DBAPI.eNonSystemObjectType.eCaptureDataFile);
        expect(DBAPI.DBObjectNameToType('Capture Data File')).toEqual(DBAPI.eNonSystemObjectType.eCaptureDataFile);
        expect(DBAPI.DBObjectNameToType('CaptureDataGroup')).toEqual(DBAPI.eNonSystemObjectType.eCaptureDataGroup);
        expect(DBAPI.DBObjectNameToType('Capture Data Group')).toEqual(DBAPI.eNonSystemObjectType.eCaptureDataGroup);
        expect(DBAPI.DBObjectNameToType('CaptureDataGroupCaptureDataXref')).toEqual(DBAPI.eNonSystemObjectType.eCaptureDataGroupCaptureDataXref);
        expect(DBAPI.DBObjectNameToType('Capture Data Group Capture Data Xref')).toEqual(DBAPI.eNonSystemObjectType.eCaptureDataGroupCaptureDataXref);
        expect(DBAPI.DBObjectNameToType('CaptureDataPhoto')).toEqual(DBAPI.eNonSystemObjectType.eCaptureDataPhoto);
        expect(DBAPI.DBObjectNameToType('Capture Data Photo')).toEqual(DBAPI.eNonSystemObjectType.eCaptureDataPhoto);
        expect(DBAPI.DBObjectNameToType('GeoLocation')).toEqual(DBAPI.eNonSystemObjectType.eGeoLocation);
        expect(DBAPI.DBObjectNameToType('Identifier')).toEqual(DBAPI.eNonSystemObjectType.eIdentifier);
        expect(DBAPI.DBObjectNameToType('Job')).toEqual(DBAPI.eNonSystemObjectType.eJob);
        expect(DBAPI.DBObjectNameToType('JobRun')).toEqual(DBAPI.eNonSystemObjectType.eJobRun);
        expect(DBAPI.DBObjectNameToType('Job Run')).toEqual(DBAPI.eNonSystemObjectType.eJobRun);
        expect(DBAPI.DBObjectNameToType('License')).toEqual(DBAPI.eNonSystemObjectType.eLicense);
        expect(DBAPI.DBObjectNameToType('LicenseAssignment')).toEqual(DBAPI.eNonSystemObjectType.eLicenseAssignment);
        expect(DBAPI.DBObjectNameToType('License Assignment')).toEqual(DBAPI.eNonSystemObjectType.eLicenseAssignment);
        expect(DBAPI.DBObjectNameToType('Metadata')).toEqual(DBAPI.eNonSystemObjectType.eMetadata);
        expect(DBAPI.DBObjectNameToType('ModelMaterial')).toEqual(DBAPI.eNonSystemObjectType.eModelMaterial);
        expect(DBAPI.DBObjectNameToType('Model Material')).toEqual(DBAPI.eNonSystemObjectType.eModelMaterial);
        expect(DBAPI.DBObjectNameToType('ModelMaterialChannel')).toEqual(DBAPI.eNonSystemObjectType.eModelMaterialChannel);
        expect(DBAPI.DBObjectNameToType('Model Material Channel')).toEqual(DBAPI.eNonSystemObjectType.eModelMaterialChannel);
        expect(DBAPI.DBObjectNameToType('ModelMaterialUVMap')).toEqual(DBAPI.eNonSystemObjectType.eModelMaterialUVMap);
        expect(DBAPI.DBObjectNameToType('Model Material UV Map')).toEqual(DBAPI.eNonSystemObjectType.eModelMaterialUVMap);
        expect(DBAPI.DBObjectNameToType('ModelObject')).toEqual(DBAPI.eNonSystemObjectType.eModelObject);
        expect(DBAPI.DBObjectNameToType('Model Object')).toEqual(DBAPI.eNonSystemObjectType.eModelObject);
        expect(DBAPI.DBObjectNameToType('ModelObjectModelMaterialXref')).toEqual(DBAPI.eNonSystemObjectType.eModelObjectModelMaterialXref);
        expect(DBAPI.DBObjectNameToType('Model Object Model Material Xref')).toEqual(DBAPI.eNonSystemObjectType.eModelObjectModelMaterialXref);
        expect(DBAPI.DBObjectNameToType('ModelProcessingAction')).toEqual(DBAPI.eNonSystemObjectType.eModelProcessingAction);
        expect(DBAPI.DBObjectNameToType('Model Processing Action')).toEqual(DBAPI.eNonSystemObjectType.eModelProcessingAction);
        expect(DBAPI.DBObjectNameToType('ModelProessingActionStep')).toEqual(DBAPI.eNonSystemObjectType.eModelProcessingActionStep);
        expect(DBAPI.DBObjectNameToType('Model Proessing Action Step')).toEqual(DBAPI.eNonSystemObjectType.eModelProcessingActionStep);
        expect(DBAPI.DBObjectNameToType('ModelSceneXref')).toEqual(DBAPI.eNonSystemObjectType.eModelSceneXref);
        expect(DBAPI.DBObjectNameToType('Model Scene Xref')).toEqual(DBAPI.eNonSystemObjectType.eModelSceneXref);
        expect(DBAPI.DBObjectNameToType('SystemObject')).toEqual(DBAPI.eNonSystemObjectType.eSystemObject);
        expect(DBAPI.DBObjectNameToType('System Object')).toEqual(DBAPI.eNonSystemObjectType.eSystemObject);
        expect(DBAPI.DBObjectNameToType('SystemObjectVersion')).toEqual(DBAPI.eNonSystemObjectType.eSystemObjectVersion);
        expect(DBAPI.DBObjectNameToType('System Object Version')).toEqual(DBAPI.eNonSystemObjectType.eSystemObjectVersion);
        expect(DBAPI.DBObjectNameToType('SystemObjectXref')).toEqual(DBAPI.eNonSystemObjectType.eSystemObjectXref);
        expect(DBAPI.DBObjectNameToType('System Object Xref')).toEqual(DBAPI.eNonSystemObjectType.eSystemObjectXref);
        expect(DBAPI.DBObjectNameToType('UnitEdan')).toEqual(DBAPI.eNonSystemObjectType.eUnitEdan);
        expect(DBAPI.DBObjectNameToType('Unit Edan')).toEqual(DBAPI.eNonSystemObjectType.eUnitEdan);
        expect(DBAPI.DBObjectNameToType('User')).toEqual(DBAPI.eNonSystemObjectType.eUser);
        expect(DBAPI.DBObjectNameToType('UserPersonalizationSystemObject')).toEqual(DBAPI.eNonSystemObjectType.eUserPersonalizationSystemObject);
        expect(DBAPI.DBObjectNameToType('User Personalization System Object')).toEqual(DBAPI.eNonSystemObjectType.eUserPersonalizationSystemObject);
        expect(DBAPI.DBObjectNameToType('UserPersonalizationUrl')).toEqual(DBAPI.eNonSystemObjectType.eUserPersonalizationUrl);
        expect(DBAPI.DBObjectNameToType('User Personalization Url')).toEqual(DBAPI.eNonSystemObjectType.eUserPersonalizationUrl);
        expect(DBAPI.DBObjectNameToType('Vocabulary')).toEqual(DBAPI.eNonSystemObjectType.eVocabulary);
        expect(DBAPI.DBObjectNameToType('VocabularySet')).toEqual(DBAPI.eNonSystemObjectType.eVocabularySet);
        expect(DBAPI.DBObjectNameToType('Vocabulary Set')).toEqual(DBAPI.eNonSystemObjectType.eVocabularySet);
        expect(DBAPI.DBObjectNameToType('Workflow')).toEqual(DBAPI.eNonSystemObjectType.eWorkflow);
        expect(DBAPI.DBObjectNameToType('WorkflowStep')).toEqual(DBAPI.eNonSystemObjectType.eWorkflowStep);
        expect(DBAPI.DBObjectNameToType('Workflow Step')).toEqual(DBAPI.eNonSystemObjectType.eWorkflowStep);
        expect(DBAPI.DBObjectNameToType('WorkflowStepSystemObjectXref')).toEqual(DBAPI.eNonSystemObjectType.eWorkflowStepSystemObjectXref);
        expect(DBAPI.DBObjectNameToType('Workflow Step System Object Xref')).toEqual(DBAPI.eNonSystemObjectType.eWorkflowStepSystemObjectXref);
        expect(DBAPI.DBObjectNameToType('Unknown')).toEqual(DBAPI.eNonSystemObjectType.eUnknown);
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
        if (systemObjectAssetVersion && workflowStep) {
            WFS = await DBAPI.SystemObject.fetchWorkflowStepFromXref(systemObjectAssetVersion.idSystemObject);
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
        if (workflowStep && systemObjectAssetVersion && systemObjectSubject) {
            SO = await workflowStep.fetchSystemObjectFromXref();
            if (SO) {
                expect(SO.length).toBe(2);
                if (SO.length == 2)
                    expect(SO[0].idSystemObject + SO[1].idSystemObject).toBe(systemObjectAssetVersion.idSystemObject + systemObjectSubject.idSystemObject);
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
// #endregion

// *******************************************************************
// #region DB Fetch Special Test Suite
// *******************************************************************
describe('DB Fetch Special Test Suite', () => {
    test('DB Fetch Special: Actor.fetchAll', async () => {
        let actorFetch: DBAPI.Actor[] | null = null;
        if (actorWithUnit && actorWithOutUnit) {
            actorFetch = await DBAPI.Actor.fetchAll();
            if (actorFetch)
                expect(actorFetch).toEqual(expect.arrayContaining([actorWithUnit, actorWithOutUnit]));
        }
        expect(actorFetch).toBeTruthy();
    });

    test('DB Fetch Special: Asset.assetType undefined', async() => {
        let eVocabID: eVocabularyID | undefined = undefined;
        if (assetThumbnail)
            eVocabID = await assetThumbnail.assetType();
        expect(eVocabID).toBeUndefined();
        expect(eVocabID).toBeFalsy();
    });

    test('DB Fetch Special: Asset.assetType defined', async() => {
        let eVocabID: eVocabularyID | undefined = undefined;
        if (assetBulkIngest)
            eVocabID = await assetBulkIngest.assetType();
        expect(eVocabID).toBeDefined();
        expect(eVocabID).toBeTruthy();
        expect(eVocabID).toEqual(eVocabularyID.eAssetAssetTypeBulkIngestion);
    });

    test('DB Fetch Special: Asset.setAssetType', async() => {
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

    test('DB Fetch Special: Asset.fetchAll', async () => {
        let assetFetch: DBAPI.Asset[] | null = null;
        if (assetThumbnail && assetWithoutAG && assetBulkIngest) {
            assetFetch = await DBAPI.Asset.fetchAll();
            if (assetFetch)
                expect(assetFetch).toEqual(expect.arrayContaining([assetThumbnail, assetWithoutAG, assetBulkIngest]));
        }
        expect(assetFetch).toBeTruthy();
    });

    test('DB Fetch Special: Asset.fetchSourceSystemObject 1', async() => {
        let SOAsset: DBAPI.SystemObject | null = null;
        if (assetBulkIngest)
            SOAsset = await assetBulkIngest.fetchSourceSystemObject();
        expect(SOAsset).toBeFalsy();
    });

    test('DB Fetch Special: Asset.fetchSourceSystemObject 2', async() => {
        let SOAssetSource: DBAPI.SystemObject | null = null;
        if (assetWithoutAG)
            SOAssetSource = await assetWithoutAG.fetchSourceSystemObject();
        expect(SOAssetSource).toBeTruthy();
        expect(SOAssetSource).toEqual(systemObjectSubject);
    });

    test('DB Fetch Special: AssetVersion.fetchAll', async () => {
        let assetVersionFetch: DBAPI.AssetVersion[] | null = null;
        assetVersionFetch = await DBAPI.AssetVersion.fetchAll();
        if (assetVersionFetch)
            expect(assetVersionFetch).toEqual(expect.arrayContaining([assetVersion, assetVersion2, assetVersionNotIngested, assetVersionNotIngested2, assetVersionNotProcessed]));
        expect(assetVersionFetch).toBeTruthy();
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

    test('DB Fetch Special: CaptureData.fetchAll', async () => {
        let captureDataFetch: DBAPI.CaptureData[] | null = null;
        if (captureData && captureDataNulls) {
            captureDataFetch = await DBAPI.CaptureData.fetchAll();
            if (captureDataFetch)
                expect(captureDataFetch).toEqual(expect.arrayContaining([captureData, captureDataNulls]));
        }
        expect(captureDataFetch).toBeTruthy();
    });

    test('DB Fetch Special: CaptureDataPhoto.fetchAll', async () => {
        let captureDataPhotoFetch: DBAPI.CaptureDataPhoto[] | null = null;
        if (captureDataPhoto && captureDataPhotoNulls) {
            captureDataPhotoFetch = await DBAPI.CaptureDataPhoto.fetchAll();
            if (captureDataPhotoFetch)
                expect(captureDataPhotoFetch).toEqual(expect.arrayContaining([captureDataPhoto, captureDataPhotoNulls]));
        }
        expect(captureDataPhotoFetch).toBeTruthy();
    });

    test('DB Fetch Special: CaptureDataPhoto.fetchFromCaptureData', async () => {
        let captureDataPhotoFetch: DBAPI.CaptureDataPhoto[] | null = null;
        if (captureData && captureDataPhoto && captureDataPhotoNulls) {
            captureDataPhotoFetch = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(captureData.idCaptureData);
            if (captureDataPhotoFetch)
                expect(captureDataPhotoFetch).toEqual(expect.arrayContaining([captureDataPhoto, captureDataPhotoNulls]));
        }
        expect(captureDataPhotoFetch).toBeTruthy();
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

    test('DB Fetch Special: IntermediaryFile.fetchAll', async () => {
        let ifFetch: DBAPI.IntermediaryFile[] | null = null;
        if (intermediaryFile) {
            ifFetch = await DBAPI.IntermediaryFile.fetchAll();
            if (ifFetch)
                expect(ifFetch).toEqual(expect.arrayContaining([intermediaryFile]));
        }
        expect(ifFetch).toBeTruthy();
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

    test('DB Fetch Special: Item.fetchAll', async () => {
        let itemFetch: DBAPI.Item[] | null = null;
        if (item && itemNulls) {
            itemFetch = await DBAPI.Item.fetchAll();
            if (itemFetch)
                expect(itemFetch).toEqual(expect.arrayContaining([item, itemNulls]));
        }
        expect(itemFetch).toBeTruthy();
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

    test('DB Fetch Special: Job.convertJobStatusToEnum', async () => {
        expect(DBAPI.Job.convertJobStatusToEnum(-1)).toEqual(DBAPI.eJobStatus.eInactive);
        expect(DBAPI.Job.convertJobStatusToEnum(0)).toEqual(DBAPI.eJobStatus.eInactive);
        expect(DBAPI.Job.convertJobStatusToEnum(1)).toEqual(DBAPI.eJobStatus.eActive);
        expect(DBAPI.Job.convertJobStatusToEnum(2)).toEqual(DBAPI.eJobStatus.eTest);

        expect(job).toBeTruthy();
        if (job) {
            expect(job.getStatus()).toEqual(DBAPI.eJobStatus.eInactive);
            job.setStatus(DBAPI.eJobStatus.eActive);
            expect(job.getStatus()).toEqual(DBAPI.eJobStatus.eActive);
            expect(job.Status).toEqual(1);
            job.setStatus(DBAPI.eJobStatus.eInactive);
        }
    });

    test('DB Fetch Special: JobRun.convertJobRunStatusToEnum', async () => {
        expect(DBAPI.JobRun.convertJobRunStatusToEnum(-1)).toEqual(DBAPI.eJobRunStatus.eUnitialized);
        expect(DBAPI.JobRun.convertJobRunStatusToEnum(0)).toEqual(DBAPI.eJobRunStatus.eUnitialized);
        expect(DBAPI.JobRun.convertJobRunStatusToEnum(1)).toEqual(DBAPI.eJobRunStatus.eCreated);
        expect(DBAPI.JobRun.convertJobRunStatusToEnum(2)).toEqual(DBAPI.eJobRunStatus.eRunning);
        expect(DBAPI.JobRun.convertJobRunStatusToEnum(3)).toEqual(DBAPI.eJobRunStatus.eWaiting);
        expect(DBAPI.JobRun.convertJobRunStatusToEnum(4)).toEqual(DBAPI.eJobRunStatus.eDone);
        expect(DBAPI.JobRun.convertJobRunStatusToEnum(5)).toEqual(DBAPI.eJobRunStatus.eError);
        expect(DBAPI.JobRun.convertJobRunStatusToEnum(6)).toEqual(DBAPI.eJobRunStatus.eCancelled);

        expect(jobRun).toBeTruthy();
        if (jobRun) {
            jobRun.setStatus(DBAPI.eJobRunStatus.eCreated);
            expect(jobRun.getStatus()).toEqual(DBAPI.eJobRunStatus.eCreated);
            expect(jobRun.Status).toEqual(1);
            jobRun.setStatus(DBAPI.eJobRunStatus.eUnitialized);
        }
    });

    test('DB Fetch Special: JobRun.fetchMatching', async () => {
        const jobRuns1: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchMatching(1, -1, DBAPI.eJobRunStatus.eDone, true, [0]);
        expect(jobRuns1).toBeTruthy();
        if (jobRuns1)
            expect(jobRuns1.length).toBeFalsy();
        const jobRuns2: DBAPI.JobRun[] | null = await DBAPI.JobRun.fetchMatching(1, -1, DBAPI.eJobRunStatus.eDone, true, null);
        expect(jobRuns2).toBeTruthy();
        if (jobRuns2)
            expect(jobRuns2.length).toBeFalsy();

        // find JobCook results
        expect(vocabJobSIPackratInspect).toBeTruthy();
        if (vocabJobSIPackratInspect) {
            // The following will return a row if the JobNS test has run and successfully completed testing of packrat-cook integration.
            // We cannot rely on this test having been run, so for now, we don't validate the result
            await DBAPI.JobRun.fetchMatching(1, vocabJobSIPackratInspect.idVocabulary, DBAPI.eJobRunStatus.eDone, true, null);
        }
    });

    test('DB Fetch Special: Model.fetchAll', async () => {
        let modelFetch: DBAPI.Model[] | null = null;
        if (model && modelNulls) {
            modelFetch = await DBAPI.Model.fetchAll();
            if (modelFetch)
                expect(modelFetch).toEqual(expect.arrayContaining([model, modelNulls]));
        }
        expect(modelFetch).toBeTruthy();
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

    test('DB Fetch Special: Model.fetchByFileNameSizeAndAssetType', async () => {
        const modelFetch: DBAPI.Model[] | null = await DBAPI.Model.fetchByFileNameSizeAndAssetType('zzzOBVIOUSLY_INVALID_NAMEzzz', BigInt(100), [0]);
        expect(modelFetch).toBeTruthy();
        if (modelFetch)
            expect(modelFetch.length).toEqual(0);
    });

    test('DB Fetch Special: ModelConstellation', async () => {
        let modelConstellation1: DBAPI.ModelConstellation | null = null;
        let modelConstellation2: DBAPI.ModelConstellation | null = null;

        if (model) {
            modelConstellation1 = await DBAPI.ModelConstellation.fetch(model.idModel);
            if (modelConstellation1) {
                expect(modelConstellation1.Model).toEqual(model);
                expect(modelConstellation1.ModelObjects).toEqual(expect.arrayContaining([modelObject]));
                expect(modelConstellation1.ModelMaterials).toEqual(expect.arrayContaining([modelMaterial]));
                expect(modelConstellation1.ModelMaterialChannels).toEqual(expect.arrayContaining([modelMaterialChannel]));
                expect(modelConstellation1.ModelMaterialUVMaps).toEqual(expect.arrayContaining([modelMaterialUVMap]));
                expect(modelConstellation1.ModelObjectModelMaterialXref).toEqual(expect.arrayContaining([modelObjectModelMaterialXref1, modelObjectModelMaterialXref2]));
                expect(modelConstellation1.ModelAssets).toBeTruthy();
                if (modelConstellation1.ModelAssets) {
                    expect(modelConstellation1.ModelAssets.length).toEqual(1);
                    if (modelConstellation1.ModelAssets.length == 1) {
                        if (assetModel)
                            expect(modelConstellation1.ModelAssets[0].Asset).toMatchObject(assetModel);
                        if (assetVersionModel)
                            expect(modelConstellation1.ModelAssets[0].AssetVersion).toMatchObject(assetVersionModel);
                    }
                }
            }
        }
        expect(modelConstellation1).toBeTruthy();

        if (modelNulls) {
            modelConstellation2 = await DBAPI.ModelConstellation.fetch(modelNulls.idModel);
            if (modelConstellation2) {
                expect(modelConstellation2.Model).toEqual(modelNulls);
                expect(modelConstellation2.ModelObjects).toEqual([]);
                expect(modelConstellation2.ModelMaterials).toBeFalsy();
                expect(modelConstellation2.ModelMaterialChannels).toBeFalsy();
                expect(modelConstellation2.ModelMaterialUVMaps).toEqual([]);
                expect(modelConstellation2.ModelObjectModelMaterialXref).toBeFalsy();
                expect(modelConstellation2.ModelAssets).toBeFalsy();
            }
        }
        expect(modelConstellation2).toBeTruthy();
    });

    test('DB Fetch Special: ModelAsset', async () => {
        let modelAsset: DBAPI.ModelAsset | null = null;
        if (assetVersion)
            modelAsset = await DBAPI.ModelAsset.fetch(assetVersion);
        expect(modelAsset).toBeTruthy();
        if (modelAsset) {
            expect(modelAsset.Asset).toBeTruthy();
            if (assetThumbnail)
                expect(modelAsset.Asset).toMatchObject(assetThumbnail);
            expect(modelAsset.AssetVersion).toBeTruthy();
            if (assetVersion)
                expect(modelAsset.AssetVersion).toMatchObject(assetVersion);
        }
    });

    test('DB Fetch Special: ModelMaterial.fetchFromModelObjects', async () => {
        let modelMaterials: DBAPI.ModelMaterial[] | null = null;
        if (modelObject) {
            modelMaterials = await DBAPI.ModelMaterial.fetchFromModelObjects([modelObject]);
            if (modelMaterials) {
                expect(modelMaterials.length).toEqual(1);
                expect(modelMaterials).toEqual(expect.arrayContaining([modelMaterial]));
            }
        }
        expect(modelMaterials).toBeTruthy();
    });

    test('DB Fetch Special: ModelMaterialChannel.fetchFromModelMaterial', async () => {
        let modelMaterialChannels: DBAPI.ModelMaterialChannel[] | null = null;
        if (modelMaterial) {
            modelMaterialChannels = await DBAPI.ModelMaterialChannel.fetchFromModelMaterial(modelMaterial.idModelMaterial);
            if (modelMaterialChannels) {
                expect(modelMaterialChannels.length).toEqual(2);
                expect(modelMaterialChannels).toEqual(expect.arrayContaining([modelMaterialChannel, modelMaterialChannelNulls]));
            }
        }
        expect(modelMaterialChannels).toBeTruthy();
    });

    test('DB Fetch Special: ModelMaterialChannel.fetchFromModelMaterialUVMap', async () => {
        let modelMaterialChannels: DBAPI.ModelMaterialChannel[] | null = null;
        if (modelMaterialUVMap) {
            modelMaterialChannels = await DBAPI.ModelMaterialChannel.fetchFromModelMaterialUVMap(modelMaterialUVMap.idModelMaterialUVMap);
            if (modelMaterialChannels) {
                expect(modelMaterialChannels.length).toEqual(1);
                expect(modelMaterialChannels).toEqual(expect.arrayContaining([modelMaterialChannel]));
            }
        }
        expect(modelMaterialChannels).toBeTruthy();
    });

    test('DB Fetch Special: ModelMaterialChannel.fetchFromModelMaterials', async () => {
        let modelMaterialChannels: DBAPI.ModelMaterialChannel[] | null = null;
        if (modelMaterial) {
            modelMaterialChannels = await DBAPI.ModelMaterialChannel.fetchFromModelMaterials([modelMaterial]);
            if (modelMaterialChannels) {
                expect(modelMaterialChannels.length).toEqual(2);
                expect(modelMaterialChannels).toEqual(expect.arrayContaining([modelMaterialChannel, modelMaterialChannelNulls]));
            }
        }
        expect(modelMaterialChannels).toBeTruthy();
    });

    test('DB Fetch Special: ModelMaterialUVMap.fetchFromAsset', async () => {
        let modelMaterialUVMaps: DBAPI.ModelMaterialUVMap[] | null = null;
        if (assetThumbnail) {
            modelMaterialUVMaps = await DBAPI.ModelMaterialUVMap.fetchFromAsset(assetThumbnail.idAsset);
            if (modelMaterialUVMaps) {
                expect(modelMaterialUVMaps.length).toEqual(1);
                expect(modelMaterialUVMaps).toEqual(expect.arrayContaining([modelMaterialUVMap]));
            }
        }
        expect(modelMaterialUVMaps).toBeTruthy();
    });

    test('DB Fetch Special: ModelMaterialUVMap.fetchFromModel', async () => {
        let modelMaterialUVMaps: DBAPI.ModelMaterialUVMap[] | null = null;
        if (model) {
            modelMaterialUVMaps = await DBAPI.ModelMaterialUVMap.fetchFromModel(model.idModel);
            if (modelMaterialUVMaps) {
                expect(modelMaterialUVMaps.length).toEqual(1);
                expect(modelMaterialUVMaps).toEqual(expect.arrayContaining([modelMaterialUVMap]));
            }
        }
        expect(modelMaterialUVMaps).toBeTruthy();
    });

    test('DB Fetch Special: ModelMaterialUVMap.fetchFromModels', async () => {
        let modelMaterialUVMaps: DBAPI.ModelMaterialUVMap[] | null = null;
        if (model) {
            modelMaterialUVMaps = await DBAPI.ModelMaterialUVMap.fetchFromModels([model]);
            if (modelMaterialUVMaps) {
                expect(modelMaterialUVMaps.length).toEqual(1);
                expect(modelMaterialUVMaps).toEqual(expect.arrayContaining([modelMaterialUVMap]));
            }
        }
        expect(modelMaterialUVMaps).toBeTruthy();
    });

    test('DB Fetch Special: ModelObject.fetchFromModel', async () => {
        let modelObjects: DBAPI.ModelObject[] | null = null;
        if (model) {
            modelObjects = await DBAPI.ModelObject.fetchFromModel(model.idModel);
            if (modelObjects) {
                expect(modelObjects.length).toEqual(3);
                expect(modelObjects).toEqual(expect.arrayContaining([modelObject, modelObject2, modelObject3]));
            }
        }
        expect(modelObjects).toBeTruthy();
    });

    test('DB Fetch Special: ModelObjectModelMaterialXref.fetchFromModelObject', async () => {
        let modelObjectModelMaterialXrefs: DBAPI.ModelObjectModelMaterialXref[] | null = null;
        if (modelObject) {
            modelObjectModelMaterialXrefs = await DBAPI.ModelObjectModelMaterialXref.fetchFromModelObject(modelObject.idModelObject);
            if (modelObjectModelMaterialXrefs) {
                expect(modelObjectModelMaterialXrefs.length).toEqual(1);
                expect(modelObjectModelMaterialXrefs).toEqual(expect.arrayContaining([modelObjectModelMaterialXref1]));
            }
        }
        expect(modelObjectModelMaterialXrefs).toBeTruthy();
    });

    test('DB Fetch Special: ModelObjectModelMaterialXref.fetchFromModelObjects', async () => {
        let modelObjectModelMaterialXrefs: DBAPI.ModelObjectModelMaterialXref[] | null = null;
        if (modelObject) {
            modelObjectModelMaterialXrefs = await DBAPI.ModelObjectModelMaterialXref.fetchFromModelObjects([modelObject]);
            if (modelObjectModelMaterialXrefs) {
                expect(modelObjectModelMaterialXrefs.length).toEqual(1);
                expect(modelObjectModelMaterialXrefs).toEqual(expect.arrayContaining([modelObjectModelMaterialXref1]));
            }
        }
        expect(modelObjectModelMaterialXrefs).toBeTruthy();
    });

    test('DB Fetch Special: ModelObjectModelMaterialXref.fetchFromModelMaterial', async () => {
        let modelObjectModelMaterialXrefs: DBAPI.ModelObjectModelMaterialXref[] | null = null;
        if (modelMaterial) {
            modelObjectModelMaterialXrefs = await DBAPI.ModelObjectModelMaterialXref.fetchFromModelMaterial(modelMaterial.idModelMaterial);
            if (modelObjectModelMaterialXrefs) {
                expect(modelObjectModelMaterialXrefs.length).toEqual(2);
                expect(modelObjectModelMaterialXrefs).toEqual(expect.arrayContaining([modelObjectModelMaterialXref1, modelObjectModelMaterialXref2]));
            }
        }
        expect(modelObjectModelMaterialXrefs).toBeTruthy();
    });

    test('DB Fetch Special: ModelObjectModelMaterialXref.fetchFromModelMaterials', async () => {
        let modelObjectModelMaterialXrefs: DBAPI.ModelObjectModelMaterialXref[] | null = null;
        if (modelMaterial) {
            modelObjectModelMaterialXrefs = await DBAPI.ModelObjectModelMaterialXref.fetchFromModelMaterials([modelMaterial]);
            if (modelObjectModelMaterialXrefs) {
                expect(modelObjectModelMaterialXrefs.length).toEqual(2);
                expect(modelObjectModelMaterialXrefs).toEqual(expect.arrayContaining([modelObjectModelMaterialXref1, modelObjectModelMaterialXref2]));
            }
        }
        expect(modelObjectModelMaterialXrefs).toBeTruthy();
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

    test('DB Fetch Special: Project.fetchFromSubjectsUnits', async () => {
        let projectFetch: DBAPI.Project[] | null = null;
        if (subject && subjectNulls) {
            projectFetch = await DBAPI.Project.fetchDerivedFromSubjectsUnits([subject.idSubject, subjectNulls.idSubject]);
            if (projectFetch && project && project2)
                expect(projectFetch).toEqual(expect.arrayContaining([project, project2]));
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch Special: Project.fetchProjectList', async () => {
        let projectFetch: DBAPI.Project[] | null = null;
        if (project) {
            projectFetch = await DBAPI.Project.fetchProjectList('Test Project');
            if (projectFetch)
                expect(projectFetch).toEqual(expect.arrayContaining([project, project2]));
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch Special: Project.fetchProjectList with empty string', async () => {
        let projectFetch: DBAPI.Project[] | null = null;
        if (project) {
            projectFetch = await DBAPI.Project.fetchProjectList('');
            if (projectFetch)
                expect(projectFetch).toEqual(expect.arrayContaining([project, project2]));
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch Special: ProjectDocumentation.fetchAll', async () => {
        let pdFetch: DBAPI.ProjectDocumentation[] | null = null;
        if (projectDocumentation) {
            pdFetch = await DBAPI.ProjectDocumentation.fetchAll();
            if (pdFetch)
                expect(pdFetch).toEqual(expect.arrayContaining([projectDocumentation]));
        }
        expect(pdFetch).toBeTruthy();
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

    test('DB Fetch Special: Scene.fetchAll', async () => {
        let sceneFetch: DBAPI.Scene[] | null = null;
        if (scene && sceneNulls) {
            sceneFetch = await DBAPI.Scene.fetchAll();
            if (sceneFetch)
                expect(sceneFetch).toEqual(expect.arrayContaining([scene, sceneNulls]));
        }
        expect(sceneFetch).toBeTruthy();
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

    test('DB Fetch Special: Stakeholder.fetchAll', async () => {
        let stakeholderFetch: DBAPI.Stakeholder[] | null = null;
        if (stakeholder) {
            stakeholderFetch = await DBAPI.Stakeholder.fetchAll();
            if (stakeholderFetch)
                expect(stakeholderFetch).toEqual(expect.arrayContaining([stakeholder]));
        }
        expect(stakeholderFetch).toBeTruthy();
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

    test('DB Fetch Special: Subject.fetchAll', async () => {
        let subjectFetch: DBAPI.Subject[] | null = null;
        if (subject && subjectNulls) {
            subjectFetch = await DBAPI.Subject.fetchAll();
            if (subjectFetch)
                expect(subjectFetch).toEqual(expect.arrayContaining([subject, subjectNulls]));
        }
        expect(subjectFetch).toBeTruthy();
    });

    test('DB Fetch Special: SystemObject.fetchAll', async () => {
        const SOFetch: DBAPI.SystemObject[] | null = await DBAPI.SystemObject.fetchAll();
        expect(SOFetch).toBeTruthy();
        if (SOFetch) {
            expect(SOFetch.length).toBeGreaterThan(0);
            if (systemObjectAsset && systemObjectItem && systemObjectItemNulls && systemObjectScene && systemObjectSubject && systemObjectSubjectNulls)
                expect(SOFetch).toEqual(expect.arrayContaining([ systemObjectAsset, systemObjectItem, systemObjectItemNulls, systemObjectScene, systemObjectSubject, systemObjectSubjectNulls ]));
        }
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

    test('DB Fetch Special: Unit.fetchFromNameSearch with empty string', async () => {
        let unitFetch: DBAPI.Unit[] | null = null;
        if (unitEdan) {
            unitFetch = await DBAPI.Unit.fetchFromNameSearch('');
            if (unitFetch && unit)
                expect(unitFetch).toEqual(expect.arrayContaining([unit]));
        }
        expect(unitFetch).toBeTruthy();
    });

    test('DB Fetch Special: Unit.fetchAll', async () => {
        const unitFetch: DBAPI.Unit[] | null = await DBAPI.Unit.fetchAll();
        expect(unitFetch).toBeTruthy();
        if (unitFetch) {
            expect(unitFetch.length).toBeGreaterThan(0);
            if (unit && unit2)
                expect(unitFetch).toEqual(expect.arrayContaining([unit, unit2]));
        }
    });

    test('DB Fetch Special: Unit.fetchAllWithSubjects', async () => {
        const unitFetch: DBAPI.Unit[] | null = await DBAPI.Unit.fetchAllWithSubjects();
        expect(unitFetch).toBeTruthy();
        if (unitFetch) {
            expect(unitFetch.length).toBeGreaterThan(0);
            if (unit && unit2)
                expect(unitFetch).toEqual(expect.arrayContaining([unit, unit2]));
        }
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

    test('DB Fetch Special: User.fetchUserList', async () => {
        let userFetchArray: DBAPI.User[] | null = null;
        if (userActive && userInactive) {
            userFetchArray = await DBAPI.User.fetchUserList('test', DBAPI.eUserStatus.eAll);
            expect(userFetchArray).toBeTruthy();
            if (userFetchArray)
                expect(userFetchArray).toEqual(expect.arrayContaining([userActive, userInactive]));

            userFetchArray = await DBAPI.User.fetchUserList('test', DBAPI.eUserStatus.eActive);
            expect(userFetchArray).toBeTruthy();
            if (userFetchArray)
                expect(userFetchArray).toEqual(expect.arrayContaining([userActive]));

            userFetchArray = await DBAPI.User.fetchUserList('test', DBAPI.eUserStatus.eInactive);
            expect(userFetchArray).toBeTruthy();
            if (userFetchArray)
                expect(userFetchArray).toEqual(expect.arrayContaining([userInactive]));

            userFetchArray = await DBAPI.User.fetchUserList('NOMATCH', DBAPI.eUserStatus.eAll);
            expect(userFetchArray).toBeTruthy();
            if (userFetchArray)
                expect(userFetchArray.length).toEqual(0);
        }
    });

    test('DB Fetch Special: WorkflowConstellation', async () => {
        let WFC: DBAPI.WorkflowConstellation | null = null;
        if (workflow) {
            WFC = await DBAPI.WorkflowConstellation.fetch(workflow.idWorkflow);
            if (WFC) {
                expect(WFC.workflow).toEqual(workflow);
                expect(WFC.workflowStep).toEqual(expect.arrayContaining([workflowStep, workflowStepNulls]));
                expect(WFC.workflowStepXref).toEqual(expect.arrayContaining([workflowStepSystemObjectXref, workflowStepSystemObjectXref2]));
            }
        }
        expect(WFC).toBeTruthy();
    });
});
// #endregion

// *******************************************************************
// #region DB Update Test Suite
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

    test('DB Update: AssetVersion.update not ingested -> ingested', async () => {
        let bUpdated: boolean = false;
        if (assetVersionNotIngested2) {
            const versionOrig: number = assetVersionNotIngested2.Version;
            assetVersionNotIngested2.Ingested = true;
            bUpdated            = await assetVersionNotIngested2.update();
            expect(assetVersionNotIngested2.Version).toBeGreaterThan(versionOrig); // object's version should be updated by this

            const assetVersionFetch: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetch(assetVersionNotIngested2.idAssetVersion);
            expect(assetVersionFetch).toBeTruthy();
            if (assetVersionFetch)
                expect(assetVersionFetch.Version).toBeGreaterThan(versionOrig);
        }
        expect(bUpdated).toBeTruthy();
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

    test('DB Update: Audit.update', async () => {
        let bUpdated: boolean = false;
        if (audit) {
            const updated: Date = UTIL.nowCleansed();
            audit.AuditDate = updated;
            bUpdated = await audit.update();

            const auditFetch: DBAPI.Audit | null = await DBAPI.Audit.fetch(audit.idAudit);
            expect(auditFetch).toBeTruthy();
            if (auditFetch) {
                expect(auditFetch.AuditDate).toEqual(updated);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Audit.update full disconnect', async () => {
        let bUpdated: boolean = false;
        if (audit) {
            audit.idUser = null;
            audit.idSystemObject = null;
            bUpdated = await audit.update();

            const auditFetch: DBAPI.Audit | null = await DBAPI.Audit.fetch(audit.idAudit);
            expect(auditFetch).toBeTruthy();
            if (auditFetch) {
                expect(auditFetch.idUser).toBeNull();
                expect(auditFetch.idSystemObject).toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Audit.update when null', async () => {
        let bUpdated: boolean = false;
        if (audit) {
            const updated: Date = UTIL.nowCleansed();
            audit.AuditDate = updated;
            bUpdated = await audit.update();

            const auditFetch: DBAPI.Audit | null = await DBAPI.Audit.fetch(audit.idAudit);
            expect(auditFetch).toBeTruthy();
            if (auditFetch) {
                expect(auditFetch.AuditDate).toEqual(updated);
            }
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

    test('DB Update: CaptureDataFile.update full disconnect', async () => {
        let bUpdated: boolean = false;
        if (captureDataFile) {
            captureDataFile.idVVariantType = null;
            bUpdated = await captureDataFile.update();

            const captureDataFileFetch: DBAPI.CaptureDataFile | null = await DBAPI.CaptureDataFile.fetch(captureDataFile.idCaptureDataFile);
            expect(captureDataFileFetch).toBeTruthy();
            if (captureDataFileFetch)
                expect(captureDataFileFetch.idVVariantType).toBeNull();
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: CaptureDataFile.update when null', async () => {
        let bUpdated: boolean = false;
        if (captureDataFile) {
            captureDataFile.CompressedMultipleFiles = true;
            bUpdated = await captureDataFile.update();

            const captureDataFileFetch: DBAPI.CaptureDataFile | null = await DBAPI.CaptureDataFile.fetch(captureDataFile.idCaptureDataFile);
            expect(captureDataFileFetch).toBeTruthy();
            if (captureDataFileFetch)
                expect(captureDataFileFetch.CompressedMultipleFiles).toEqual(true);
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

    test('DB Update: JobRun.update', async () => {
        let bUpdated: boolean = false;
        if (jobRun) {
            const updated: string = 'Updated JobRun Error';
            jobRun.Error = updated;
            bUpdated = await jobRun.update();

            const jobRunFetch: DBAPI.JobRun | null = await DBAPI.JobRun.fetch(jobRun.idJobRun);
            expect(jobRunFetch).toBeTruthy();
            if (jobRunFetch)
                expect(jobRunFetch.Error).toBe(updated);
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
        if (licenseAssignmentNull && userActive) {
            licenseAssignmentNull.idUserCreator = userActive.idUser;
            bUpdated = await licenseAssignmentNull.update();

            const licenseAssignmentFetch: DBAPI.LicenseAssignment | null = await DBAPI.LicenseAssignment.fetch(licenseAssignmentNull.idLicenseAssignment);
            expect(licenseAssignmentFetch).toBeTruthy();
            if (licenseAssignmentFetch)
                expect(licenseAssignmentFetch.idUserCreator).toBe(userActive.idUser);
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
        if (metadataNull && assetThumbnail && userActive) {
            metadataNull.idAssetValue = assetThumbnail.idAsset;
            metadataNull.idUser = userActive.idUser;
            bUpdated = await metadataNull.update();

            const metadataFetch: DBAPI.Metadata | null = await DBAPI.Metadata.fetch(metadataNull.idMetadata);
            expect(metadataFetch).toBeTruthy();
            if (metadataFetch) {
                expect(metadataFetch.idAssetValue).toBe(assetThumbnail.idAsset);
                expect(metadataFetch.idUser).toEqual(userActive.idUser);
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

    test('DB Update: Model.update connect disconnected', async () => {
        let bUpdated: boolean = false;
        if (modelNulls && vocabulary) {
            modelNulls.idVCreationMethod = vocabulary.idVocabulary;
            modelNulls.idVFileType = vocabulary.idVocabulary;
            modelNulls.idVModality = vocabulary.idVocabulary;
            modelNulls.idVPurpose = vocabulary.idVocabulary;
            modelNulls.idVUnits = vocabulary.idVocabulary;
            bUpdated = await modelNulls.update();

            const modelFetch: DBAPI.Model | null = await DBAPI.Model.fetch(modelNulls.idModel);
            expect(modelFetch).toBeTruthy();
            if (modelFetch) {
                expect(modelFetch.idVCreationMethod).toEqual(vocabulary.idVocabulary);
                expect(modelFetch.idVFileType).toEqual(vocabulary.idVocabulary);
                expect(modelFetch.idVModality).toEqual(vocabulary.idVocabulary);
                expect(modelFetch.idVPurpose).toEqual(vocabulary.idVocabulary);
                expect(modelFetch.idVUnits).toEqual(vocabulary.idVocabulary);
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: Model.update disconnect', async () => {
        let bUpdated: boolean = false;
        if (modelNulls) {
            modelNulls.idAssetThumbnail = null;
            modelNulls.idVCreationMethod = null;
            modelNulls.idVFileType = null;
            modelNulls.idVModality = null;
            modelNulls.idVPurpose = null;
            modelNulls.idVUnits = null;

            bUpdated = await modelNulls.update();

            const modelFetch: DBAPI.Model | null = await DBAPI.Model.fetch(modelNulls.idModel);
            expect(modelFetch).toBeTruthy();
            if (modelFetch) {
                expect(modelFetch.idAssetThumbnail).toBeNull();
                expect(modelFetch.idVCreationMethod).toBeNull();
                expect(modelFetch.idVFileType).toBeNull();
                expect(modelFetch.idVModality).toBeNull();
                expect(modelFetch.idVPurpose).toBeNull();
                expect(modelFetch.idVUnits).toBeNull();
            }
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

    test('DB Update: ModelMaterial.update', async () => {
        let bUpdated: boolean = false;
        if (modelMaterial) {
            const updatedName: string = 'Updated ModelMaterial Name';
            modelMaterial.Name = updatedName;
            bUpdated = await modelMaterial.update();

            const modelMaterialFetch: DBAPI.ModelMaterial | null = await DBAPI.ModelMaterial.fetch(modelMaterial.idModelMaterial);
            expect(modelMaterialFetch).toBeTruthy();
            if (modelMaterialFetch)
                expect(modelMaterialFetch.Name).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelMaterialChannel.update', async () => {
        let bUpdated: boolean = false;
        if (modelMaterialChannel) {
            const updatedName: string = 'Updated ModelMaterialChannel Material Type';
            modelMaterialChannel.MaterialTypeOther = updatedName;
            bUpdated = await modelMaterialChannel.update();

            const modelMaterialChannelFetch: DBAPI.ModelMaterialChannel | null = await DBAPI.ModelMaterialChannel.fetch(modelMaterialChannel.idModelMaterialChannel);
            expect(modelMaterialChannelFetch).toBeTruthy();
            if (modelMaterialChannelFetch)
                expect(modelMaterialChannelFetch.MaterialTypeOther).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelMaterialChannel.update disconnect', async () => {
        let bUpdated: boolean = false;
        if (modelMaterialChannel) {
            modelMaterialChannel.idVMaterialType = null;
            modelMaterialChannel.idModelMaterialUVMap = null;
            bUpdated = await modelMaterialChannel.update();

            const modelMaterialChannelFetch: DBAPI.ModelMaterialChannel | null = await DBAPI.ModelMaterialChannel.fetch(modelMaterialChannel.idModelMaterialChannel);
            expect(modelMaterialChannelFetch).toBeTruthy();
            if (modelMaterialChannelFetch) {
                expect(modelMaterialChannelFetch.idVMaterialType).toBeNull();
                expect(modelMaterialChannelFetch.idModelMaterialUVMap).toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelMaterialChannel.update disconnect null', async () => {
        let bUpdated: boolean = false;
        if (modelMaterialChannel) {
            expect(modelMaterialChannel.idVMaterialType).toBeNull();
            expect(modelMaterialChannel.idModelMaterialUVMap).toBeNull();
            bUpdated = await modelMaterialChannel.update();

            const modelMaterialChannelFetch: DBAPI.ModelMaterialChannel | null = await DBAPI.ModelMaterialChannel.fetch(modelMaterialChannel.idModelMaterialChannel);
            expect(modelMaterialChannelFetch).toBeTruthy();
            if (modelMaterialChannelFetch) {
                expect(modelMaterialChannelFetch.idVMaterialType).toBeNull();
                expect(modelMaterialChannelFetch.idModelMaterialUVMap).toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelMaterialUVMap.update', async () => {
        let bUpdated: boolean = false;
        if (modelMaterialUVMap) {
            const updated: number = 369;
            modelMaterialUVMap.UVMapEdgeLength = updated;
            bUpdated = await modelMaterialUVMap.update();

            const modelMaterialUVMapFetch: DBAPI.ModelMaterialUVMap | null = await DBAPI.ModelMaterialUVMap.fetch(modelMaterialUVMap.idModelMaterialUVMap);
            expect(modelMaterialUVMapFetch).toBeTruthy();
            if (modelMaterialUVMapFetch)
                expect(modelMaterialUVMapFetch.UVMapEdgeLength).toBe(updated);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelObject.update', async () => {
        let bUpdated: boolean = false;
        if (modelObject) {
            const updated: number = 369;
            modelObject.CountFaces = updated;

            bUpdated = await modelObject.update();

            const modelObjectFetch: DBAPI.ModelObject | null = await DBAPI.ModelObject.fetch(modelObject.idModelObject);
            expect(modelObjectFetch).toBeTruthy();
            if (modelObjectFetch)
                expect(modelObjectFetch.CountFaces).toEqual(updated);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: ModelObjectModelMaterialXref.update', async () => {
        let bUpdated: boolean = false;
        if (modelObjectModelMaterialXref1 && modelObject2) {
            modelObjectModelMaterialXref1.idModelObject = modelObject2.idModelObject;
            bUpdated = await modelObjectModelMaterialXref1.update();

            const modelObjectModelMaterialXrefFetch: DBAPI.ModelObjectModelMaterialXref | null =
                await DBAPI.ModelObjectModelMaterialXref.fetch(modelObjectModelMaterialXref1.idModelObjectModelMaterialXref);
            expect(modelObjectModelMaterialXrefFetch).toBeTruthy();
            if (modelObjectModelMaterialXrefFetch)
                expect(modelObjectModelMaterialXrefFetch.idModelObject).toBe(modelObject2.idModelObject);
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

            sceneNulls.HasBeenQCd = true;
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

    test('DB Update: SystemObject.retireSystemObject', async () => {
        if (systemObjectItem && item) {
            expect(systemObjectItem.Retired).toBeFalsy();
            expect(await DBAPI.SystemObject.retireSystemObject(item)).toBeTruthy();
            const systemObjectFetch: DBAPI.SystemObject | null = await item.fetchSystemObject();
            expect(systemObjectFetch).toBeTruthy();
            if (systemObjectFetch) {
                systemObjectItem = systemObjectFetch;
                expect(systemObjectItem.Retired).toBeTruthy();
            }
        }
    });

    test('DB Update: SystemObject.reinstateSystemObject', async () => {
        if (systemObjectItem && item) {
            expect(systemObjectItem.Retired).toBeTruthy();
            expect(await DBAPI.SystemObject.reinstateSystemObject(item)).toBeTruthy();
            const systemObjectFetch: DBAPI.SystemObject | null = await item.fetchSystemObject();
            expect(systemObjectFetch).toBeTruthy();
            if (systemObjectFetch) {
                systemObjectItem = systemObjectFetch;
                expect(systemObjectItem.Retired).toBeFalsy();
            }
        }
    });

    test('DB Update: SystemObjectVersion.update', async () => {
        let bUpdated: boolean = false;
        if (systemObjectVersion) {
            systemObjectVersion.setPublishedState(DBAPI.ePublishedState.eNotPublished);
            expect(systemObjectVersion.publishedStateEnum()).toEqual(DBAPI.ePublishedState.eNotPublished);
            systemObjectVersion.setPublishedState(DBAPI.ePublishedState.eRestricted);
            expect(systemObjectVersion.publishedStateEnum()).toEqual(DBAPI.ePublishedState.eRestricted);
            systemObjectVersion.setPublishedState(DBAPI.ePublishedState.eViewOnly);
            expect(systemObjectVersion.publishedStateEnum()).toEqual(DBAPI.ePublishedState.eViewOnly);
            systemObjectVersion.setPublishedState(DBAPI.ePublishedState.eViewDownloadRestriction);
            expect(systemObjectVersion.publishedStateEnum()).toEqual(DBAPI.ePublishedState.eViewDownloadRestriction);
            systemObjectVersion.setPublishedState(DBAPI.ePublishedState.eViewDownloadCC0);
            expect(systemObjectVersion.publishedStateEnum()).toEqual(DBAPI.ePublishedState.eViewDownloadCC0);
            bUpdated = await systemObjectVersion.update();

            const systemObjectVersionFetch: DBAPI.SystemObjectVersion | null = await DBAPI.SystemObjectVersion.fetch(systemObjectVersion.idSystemObjectVersion);
            expect(systemObjectVersionFetch).toBeTruthy();
            if (systemObjectVersionFetch)
                expect(systemObjectVersionFetch.publishedStateEnum()).toEqual(DBAPI.ePublishedState.eViewDownloadCC0);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: SystemObjectVersionAssetVersionXref.update', async () => {
        let bUpdated: boolean = false;
        if (systemObjectVersionAssetVersionXref && assetVersion2) {
            systemObjectVersionAssetVersionXref.idAssetVersion = assetVersion2.idAssetVersion;
            bUpdated = await systemObjectVersionAssetVersionXref.update();

            const systemObjectVersionAssetVersionXrefFetch: DBAPI.SystemObjectVersionAssetVersionXref | null =
                await DBAPI.SystemObjectVersionAssetVersionXref.fetch(systemObjectVersionAssetVersionXref.idSystemObjectVersionAssetVersionXref);
            expect(systemObjectVersionAssetVersionXrefFetch).toBeTruthy();
            if (systemObjectVersionAssetVersionXrefFetch)
                expect(systemObjectVersionAssetVersionXrefFetch.idAssetVersion).toEqual(assetVersion2.idAssetVersion);
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
        if (userActive) {
            const updatedName: string = 'Updated Test User';
            userActive.Name   = updatedName;
            bUpdated = await userActive.update();

            const userFetch: DBAPI.User | null = await DBAPI.User.fetch(userActive.idUser);
            expect(userFetch).toBeTruthy();
            if (userFetch)
                expect(userFetch.Name).toBe(updatedName);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: User.update make inactive', async () => {
        let bUpdated: boolean = false;
        if (userActive) {
            const now = UTIL.nowCleansed();
            userActive.Active = false;
            bUpdated = await userActive.update();

            const userFetch: DBAPI.User | null = await DBAPI.User.fetch(userActive.idUser);
            expect(userFetch).toBeTruthy();
            if (userFetch) {
                expect(userFetch.Active).toBe(false);
                expect(userFetch.DateDisabled).toBeTruthy();
                if (userFetch.DateDisabled)
                    expect(userFetch.DateDisabled.getTime()).toBeGreaterThanOrEqual(now.getTime());
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: User.update make active', async () => {
        let bUpdated: boolean = false;
        if (userActive) {
            const now = UTIL.nowCleansed();
            userActive.Active = true;
            bUpdated = await userActive.update();

            const userFetch: DBAPI.User | null = await DBAPI.User.fetch(userActive.idUser);
            expect(userFetch).toBeTruthy();
            if (userFetch) {
                expect(userFetch.Active).toBe(true);
                expect(userFetch.DateDisabled).toBeNull();
                expect(userFetch.DateActivated.getTime()).toBeGreaterThanOrEqual(now.getTime());
            }
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

            workflowStep.setState(DBAPI.eWorkflowStepState.eCreated);
            expect(workflowStep.getState()).toEqual(DBAPI.eWorkflowStepState.eCreated);

            workflowStep.setState(DBAPI.eWorkflowStepState.eStarted);
            expect(workflowStep.getState()).toEqual(DBAPI.eWorkflowStepState.eStarted);

            workflowStep.setState(DBAPI.eWorkflowStepState.eFinished);
            expect(workflowStep.getState()).toEqual(DBAPI.eWorkflowStepState.eFinished);

            bUpdated = await workflowStep.update();

            const workflowStepFetch: DBAPI.WorkflowStep | null = await DBAPI.WorkflowStep.fetch(workflowStep.idWorkflowStep);
            expect(workflowStepFetch).toBeTruthy();
            if (workflowStepFetch)
                expect(workflowStepFetch.idWorkflow).toBe(workflowNulls.idWorkflow);

            expect(DBAPI.WorkflowStep.stateValueToEnum(-1)).toEqual(DBAPI.eWorkflowStepState.eCreated);
            expect(DBAPI.WorkflowStep.stateValueToEnum(0)).toEqual(DBAPI.eWorkflowStepState.eCreated);
            expect(DBAPI.WorkflowStep.stateValueToEnum(1)).toEqual(DBAPI.eWorkflowStepState.eStarted);
            expect(DBAPI.WorkflowStep.stateValueToEnum(2)).toEqual(DBAPI.eWorkflowStepState.eFinished);
            expect(DBAPI.WorkflowStep.stateEnumToValue(DBAPI.eWorkflowStepState.eCreated)).toEqual(0);
            expect(DBAPI.WorkflowStep.stateEnumToValue(DBAPI.eWorkflowStepState.eStarted)).toEqual(1);
            expect(DBAPI.WorkflowStep.stateEnumToValue(DBAPI.eWorkflowStepState.eFinished)).toEqual(2);
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: WorkflowStep.update full disconnect', async () => {
        let bUpdated: boolean = false;
        if (workflowStep) {
            workflowStep.idJobRun = null;
            workflowStep.idUserOwner = null;
            bUpdated = await workflowStep.update();

            const workflowStepFetch: DBAPI.WorkflowStep | null = await DBAPI.WorkflowStep.fetch(workflowStep.idWorkflowStep);
            expect(workflowStepFetch).toBeTruthy();
            if (workflowStepFetch) {
                expect(workflowStepFetch.idJobRun).toBeNull();
                expect(workflowStepFetch.idUserOwner).toBeNull();
            }
        }
        expect(bUpdated).toBeTruthy();
    });

    test('DB Update: WorkflowStep.update when null', async () => {
        let bUpdated: boolean = false;
        if (workflowStep) {
            const dateUpdated: Date = UTIL.nowCleansed();
            workflowStep.DateCompleted = dateUpdated;
            bUpdated = await workflowStep.update();

            const workflowStepFetch: DBAPI.WorkflowStep | null = await DBAPI.WorkflowStep.fetch(workflowStep.idWorkflowStep);
            expect(workflowStepFetch).toBeTruthy();
            if (workflowStepFetch)
                expect(workflowStepFetch.DateCompleted).toEqual(dateUpdated);
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
// #endregion

// #region DB Deletes
describe('DB Delete Test', () => {
    test('DB Delete: Identifier.delete', async () => {
        if (identifierNull) {
            expect(await identifierNull.delete()).toBeTruthy();

            // try to fetch; should not be found
            const idFetch: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(identifierNull.idIdentifier);
            expect(idFetch).toBeFalsy();
        }

        if (identifierSubjectHookup) {
            expect(await identifierSubjectHookup.delete()).toBeTruthy();

            // try to fetch; should not be found
            const idFetch: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(identifierSubjectHookup.idIdentifier);
            expect(idFetch).toBeFalsy();
        }

        if (identifier2) {
            expect(await identifier2.delete()).toBeTruthy();

            // try to fetch; should not be found
            const idFetch: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(identifier2.idIdentifier);
            expect(idFetch).toBeFalsy();
        }
    });

    test('DB Delete: ModelConstellation.deleteSupportObjects 1', async () => {
        let modelConstellation: DBAPI.ModelConstellation | null = null;
        if (model) {
            modelConstellation = await DBAPI.ModelConstellation.fetch(model.idModel);
            if (modelConstellation) {
                expect(await modelConstellation.deleteSupportObjects()).toBeTruthy();
                expect(modelConstellation.ModelMaterialChannels).toBeNull();
                expect(modelConstellation.ModelMaterialUVMaps).toBeNull();
                expect(modelConstellation.ModelMaterials).toBeNull();
                expect(modelConstellation.ModelObjectModelMaterialXref).toBeNull();
                expect(modelConstellation.ModelObjects).toBeNull();
            }
        }
        expect(modelConstellation).toBeTruthy();
    });

    test('DB Delete: ModelConstellation.deleteSupportObjects 2', async () => {
        let modelConstellation: DBAPI.ModelConstellation | null = null;
        if (model) {
            modelConstellation = await DBAPI.ModelConstellation.fetch(model.idModel);
            if (modelConstellation) {
                expect(await modelConstellation.deleteSupportObjects()).toBeTruthy();
                expect(modelConstellation.ModelMaterialChannels).toBeNull();
                expect(modelConstellation.ModelMaterialUVMaps).toBeNull();
                expect(modelConstellation.ModelMaterials).toBeNull();
                expect(modelConstellation.ModelObjectModelMaterialXref).toBeNull();
                expect(modelConstellation.ModelObjects).toBeNull();
            }
        }
        expect(modelConstellation).toBeTruthy();
    });

    test('DB Delete: ModelSceneXref', async () => {
        if (modelSceneXrefNull) {
            expect(await modelSceneXrefNull.delete()).toBeTruthy();

            // try to fetch; should not be found
            const fetcher: DBAPI.ModelSceneXref | null = await DBAPI.ModelSceneXref.fetch(modelSceneXrefNull.idModelSceneXref);
            expect(fetcher).toBeFalsy();
        }
    });

    test('DB Delete: SystemObjectXref.delete and deleteIfAllowed', async () => {
        if (systemObjectXrefSubItem4) {
            const res: H.IOResults = await systemObjectXrefSubItem4.deleteIfAllowed();
            if (!res.success)
                LOG.error(`DB Delete failed: ${res.error}`, LOG.LS.eTEST);
            else
                LOG.info(`DB Delete suceeded: ${JSON.stringify(systemObjectXrefSubItem4)}`, LOG.LS.eTEST);
            expect(res.success).toBeTruthy();

            // try to fetch; should not be found
            const soxFetch: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.fetch(systemObjectXrefSubItem4.idSystemObjectXref);
            expect(soxFetch).toBeFalsy();
        }
        if (systemObjectXrefSubItem2) {
            const res: H.IOResults = await DBAPI.SystemObjectXref.deleteIfAllowed(systemObjectXrefSubItem2.idSystemObjectXref);
            if (!res.success)
                LOG.info(`DB Delete failed, as expected: ${res.error}`, LOG.LS.eTEST);
            else
                LOG.error(`DB Delete suceeded unexpectedly: ${JSON.stringify(systemObjectXrefSubItem2)}`, LOG.LS.eTEST);
            expect(res.success).toBeFalsy();

            // try to fetch; should be found
            const soxFetch: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.fetch(systemObjectXrefSubItem2.idSystemObjectXref);
            expect(soxFetch).toBeTruthy();
        }

        // delete link between project and itemNulls, which has just one subject attached
        if (systemObjectXrefProjectItem1) {
            const res: H.IOResults = await DBAPI.SystemObjectXref.deleteIfAllowed(systemObjectXrefProjectItem1.idSystemObjectXref);
            if (!res.success)
                LOG.error(`DB Delete failed: ${res.error}`, LOG.LS.eTEST);
            else
                LOG.info(`DB Delete suceeded: ${JSON.stringify(systemObjectXrefSubItem4)}`, LOG.LS.eTEST);
            expect(res.success).toBeTruthy();

            // try to fetch; should not be found
            const soxFetch: DBAPI.SystemObjectXref | null = await DBAPI.SystemObjectXref.fetch(systemObjectXrefProjectItem1.idSystemObjectXref);
            expect(soxFetch).toBeFalsy();
        }
        expect((await DBAPI.SystemObjectXref.deleteIfAllowed(1000000000)).success).toBeFalsy();
    });
});
// #endregion

// #region Null tests
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
        expect(await DBAPI.AssetVersion.fetchFromAsset(0, false)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchFromSystemObject(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchFromSystemObjectVersion(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchLatestFromSystemObject(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchLatestFromAsset(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.AssetVersion.computeNextVersionNumber(0)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchFromUserByIngested(0, true, true)).toBeNull();
        expect(await DBAPI.AssetVersion.fetchByAssetAndVersion(0, 1)).toBeNull();
        expect(await DBAPI.Audit.fetch(0)).toBeNull();
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
        expect(await DBAPI.CaptureDataPhoto.fetchFromCaptureData(0)).toBeNull();
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
        expect(await DBAPI.Job.fetchByType(0)).toBeNull();
        expect(await DBAPI.JobRun.fetch(0)).toBeNull();
        expect(await DBAPI.JobRun.fetchMatching(0, 0, 0, true, null)).toBeNull();
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
        expect(await DBAPI.ModelConstellation.fetch(0)).toBeNull();
        expect(await DBAPI.ModelMaterial.fetch(0)).toBeNull();
        expect(await DBAPI.ModelMaterial.fetchFromModelObjects([])).toBeNull();
        expect(await DBAPI.ModelMaterialChannel.fetch(0)).toBeNull();
        expect(await DBAPI.ModelMaterialChannel.fetchFromModelMaterial(0)).toBeNull();
        expect(await DBAPI.ModelMaterialChannel.fetchFromModelMaterials([])).toBeNull();
        expect(await DBAPI.ModelMaterialChannel.fetchFromModelMaterialUVMap(0)).toBeNull();
        expect(await DBAPI.ModelMaterialUVMap.fetch(0)).toBeNull();
        expect(await DBAPI.ModelMaterialUVMap.fetchFromAsset(0)).toBeNull();
        expect(await DBAPI.ModelMaterialUVMap.fetchFromModel(0)).toBeNull();
        expect(await DBAPI.ModelMaterialUVMap.fetchFromModels([])).toBeNull();
        expect(await DBAPI.ModelObject.fetch(0)).toBeNull();
        expect(await DBAPI.ModelObject.fetchFromModel(0)).toBeNull();
        expect(await DBAPI.ModelObjectModelMaterialXref.fetch(0)).toBeNull();
        expect(await DBAPI.ModelObjectModelMaterialXref.fetchFromModelObject(0)).toBeNull();
        expect(await DBAPI.ModelObjectModelMaterialXref.fetchFromModelObjects([])).toBeNull();
        expect(await DBAPI.ModelObjectModelMaterialXref.fetchFromModelMaterial(0)).toBeNull();
        expect(await DBAPI.ModelObjectModelMaterialXref.fetchFromModelMaterials([])).toBeNull();
        expect(await DBAPI.ModelProcessingAction.fetch(0)).toBeNull();
        expect(await DBAPI.ModelProcessingAction.fetchFromModel(0)).toBeNull();
        expect(await DBAPI.ModelProcessingActionStep.fetch(0)).toBeNull();
        expect(await DBAPI.ModelProcessingActionStep.fetchFromModelProcessingAction(0)).toBeNull();
        expect(await DBAPI.ModelSceneXref.fetch(0)).toBeNull();
        expect(await DBAPI.ModelSceneXref.fetchFromScene(0)).toBeNull();
        expect(await DBAPI.ModelSceneXref.fetchFromModel(0)).toBeNull();
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
        expect(await DBAPI.Subject.clearPreferredIdentifier(0)).toBeFalsy();
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
        expect(await DBAPI.SystemObjectVersion.fetchLatestFromSystemObject(0)).toBeNull();
        expect(await DBAPI.SystemObjectVersion.cloneObjectAndXrefs(0, null, undefined)).toBeNull();
        expect(await DBAPI.SystemObjectVersionAssetVersionXref.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectVersionAssetVersionXref.fetchFromSystemObjectVersion(0)).toBeNull();
        expect(await DBAPI.SystemObjectVersionAssetVersionXref.fetchFromAssetVersion(0)).toBeNull();
        expect(await DBAPI.SystemObjectVersionAssetVersionXref.fetchAssetVersionMap(0)).toBeNull();
        expect(await DBAPI.SystemObjectVersionAssetVersionXref.fetchLatestAssetVersionMap(0)).toBeNull();
        expect(await DBAPI.SystemObjectXref.fetch(0)).toBeNull();
        expect(await DBAPI.SystemObjectXref.fetchXref(0, 1)).toBeNull();
        expect(await DBAPI.SystemObjectXref.fetchXref(1, 0)).toBeNull();
        expect(await DBAPI.Unit.fetch(0)).toBeNull();
        expect(await DBAPI.Unit.fetchMasterFromProjects([])).toBeNull();
        expect(await DBAPI.Unit.fetchFromUnitEdanAbbreviation('')).toBeNull();
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
        expect(await DBAPI.Workflow.fetchFromWorkflowType(0)).toBeNull();
        expect(await DBAPI.WorkflowConstellation.fetch(0)).toBeNull();
        expect(await DBAPI.WorkflowStep.fetch(0)).toBeNull();
        expect(await DBAPI.WorkflowStep.fetchFromUser(0)).toBeNull();
        expect(await DBAPI.WorkflowStep.fetchFromWorkflow(0)).toBeNull();
        expect(await DBAPI.WorkflowStep.fetchFromJobRun(0)).toBeNull();
        expect(await DBAPI.WorkflowStepSystemObjectXref.fetch(0)).toBeNull();
        expect(await DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflowStep(0)).toBeNull();
        expect(await DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflow(0)).toBeNull();
        expect(await DBAPI.WorkflowStepSystemObjectXref.fetchFromWorkflow(-1)).toEqual([]);

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
// #endregion
