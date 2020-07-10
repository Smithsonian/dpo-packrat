import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import * as path from 'path';
import {
    AccessAction as PAccessAction, AccessRole as PAccessRole, AccessRoleAccessActionXref,
    Actor, Asset, AssetGroup, AssetVersion, CaptureData, CaptureDataGroup, CaptureDataGroupCaptureDataXref,
    GeoLocation, Identifier, IntermediaryFile, Item, License, LicenseAssignment, Metadata,
    Model, ModelGeometryFile, ModelProcessingAction, ModelProcessingActionStep,
    ModelSceneXref, ModelUVMapChannel, ModelUVMapFile, Project, ProjectDocumentation, Scene, Stakeholder,
    Subject, SystemObject, SystemObjectVersion, SystemObjectXref,
    Unit, User, UserPersonalizationSystemObject, UserPersonalizationUrl, Vocabulary, VocabularySet,
    Workflow, WorkflowStep, WorkflowStepSystemObjectXref, WorkflowTemplate } from '@prisma/client';

let prisma;

beforeAll(() => {
    const logPath: string = './logs';
    LOG.configureLogger(logPath);
    LOG.logger.info('**************************');
    LOG.logger.info('DB Creation Tests');
    LOG.logger.info(`DB Creation Tests writing logs to ${path.resolve(logPath)}`);
    prisma = DBAPI.DBConnectionFactory.prisma;
});

afterAll(async done => {
    LOG.logger.info('DB Creation Tests afterAll()');
    await DBAPI.DBConnectionFactory.disconnect();
    done();
});

let assetGroup: AssetGroup | null;
let assetThumbnail: Asset | null;
let geoLocation: GeoLocation | null;
let unit: Unit | null;
let user: User | null;
let subject: Subject | null;
let vocabularySet: VocabularySet | null;
let vocabulary: Vocabulary | null;
let workflowTemplate: WorkflowTemplate | null;
let scene: Scene | null;
let sceneNulls: Scene | null;
let systemObjectAsset: SystemObject | null;
let systemObjectSubject: SystemObject | null;
let systemObjectScene: SystemObject | null;
let accessAction: DBAPI.AccessAction | null;
let accessAction2: DBAPI.AccessAction | null;
let accessContext: DBAPI.AccessContext | null;
let accessRole: DBAPI.AccessRole | null;
let accessPolicy: DBAPI.AccessPolicy | null;
let accessContextObject: DBAPI.AccessContextObject | null;
let accessRoleAccessActionXref: AccessRoleAccessActionXref | null;
let accessRoleAccessActionXref2: AccessRoleAccessActionXref | null;
let actorWithUnit: Actor | null;
let actorWithOutUnit: Actor | null;
let assetWithoutAG: Asset | null;
let assetVersion: AssetVersion | null;
let captureData: CaptureData | null;
let captureDataNulls: CaptureData | null;
let captureDataGroup: CaptureDataGroup | null;
let captureDataGroupCaptureDataXref: CaptureDataGroupCaptureDataXref | null;
let captureDataGroupCaptureDataXref2: CaptureDataGroupCaptureDataXref | null;
let identifier: Identifier | null;
let identifierNull: Identifier | null;
let intermediaryFile: IntermediaryFile | null;
let item: Item | null;
let itemNulls: Item | null;
let metadata: Metadata | null;
let metadataNull: Metadata | null;
let model: Model | null;
let modelNulls: Model | null;
let modelGeometryFile: ModelGeometryFile | null;
let modelGeometryFileNulls: ModelGeometryFile | null;
let modelProcessingAction: ModelProcessingAction | null;
let modelProcessingActionStep: ModelProcessingActionStep | null;
let modelSceneXref: ModelSceneXref | null;
let modelSceneXrefNull: ModelSceneXref | null;
let systemObjectVersion: SystemObjectVersion | null;
let systemObjectXref: SystemObjectXref | null;
let systemObjectXref2: SystemObjectXref | null;
let modelUVMapFile: ModelUVMapFile | null;
let modelUVMapChannel: ModelUVMapChannel | null;
let license: License | null;
let licenseAssignment: LicenseAssignment | null;
let licenseAssignmentNull: LicenseAssignment | null;
let project: Project | null;
let projectDocumentation: ProjectDocumentation | null;
let subjectNulls: Subject | null;
let stakeholder: Stakeholder | null;
let userPersonalizationSystemObject: UserPersonalizationSystemObject | null;
let userPersonalizationUrl: UserPersonalizationUrl | null;
let workflow: Workflow | null;
let workflowNulls: Workflow | null;
let workflowStep: WorkflowStep | null;
let workflowStepSystemObjectXref: WorkflowStepSystemObjectXref | null;
let workflowStepSystemObjectXref2: WorkflowStepSystemObjectXref | null;

// *******************************************************************
// DB Creation Test Suite
// *******************************************************************
describe('DB Creation Test Suite', () => {
    test('DB Creation: AssetGroup', async () => {
        assetGroup = await DBAPI.createAssetGroup(prisma, { idAssetGroup: 0 });
        expect(assetGroup).toBeTruthy();
        if (assetGroup)
            expect(assetGroup.idAssetGroup).toBeGreaterThan(0);
    });

    test('DB Creation: Asset', async () => {
        if (assetGroup)
            assetThumbnail = await DBAPI.createAsset(prisma, {
                FileName: 'Test Asset Thumbnail',
                FilePath: '/test/asset/path',
                idAssetGroup:  assetGroup.idAssetGroup,
                idAsset: 0
            });
        expect(assetThumbnail).toBeTruthy();
        if (assetThumbnail)
            expect(assetThumbnail.idAsset).toBeGreaterThan(0);
    });

    test('DB Creation: GeoLocation', async () => {
        geoLocation = await DBAPI.createGeoLocation(prisma, {
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
        if (geoLocation)
            expect(geoLocation.idGeoLocation).toBeGreaterThan(0);
    });

    test('DB Creation: Unit', async () => {
        unit = await DBAPI.createUnit(prisma, {
            Name: 'DPO',
            Abbreviation: 'DPO',
            ARKPrefix: 'http://abbadabbadoo/',
            idUnit: 0
        });
        expect(unit).toBeTruthy();
        if (unit)
            expect(unit.idUnit).toBeGreaterThan(0);
    });

    test('DB Creation: User', async () => {
        user = await DBAPI.createUser(prisma, {
            Name: 'Test User',
            EmailAddress: 'test@si.edu',
            SecurityID: 'SECURITY_ID',
            Active: true,
            DateActivated: new Date(),
            DateDisabled: null,
            WorkflowNotificationTime: new Date(),
            EmailSettings: 0,
            idUser: 0
        });
        expect(user).toBeTruthy();
        if (user)
            expect(user.idUser).toBeGreaterThan(0);
    });

    test('DB Creation: Subject', async () => {
        if (unit && assetThumbnail && geoLocation)
            subject = await DBAPI.createSubject(prisma, {
                idUnit: unit.idUnit,
                idAssetThumbnail: assetThumbnail.idAsset,
                idGeoLocation: geoLocation.idGeoLocation,
                Name: 'Test Subject',
                idSubject: 0
            });
        expect(subject).toBeTruthy();
        if (subject)
            expect(subject.idSubject).toBeGreaterThan(0);
    });

    test('DB Creation: VocabularySet', async () => {
        vocabularySet = await DBAPI.createVocabularySet(prisma, {
            Name: 'Test Vocabulary Set',
            SystemMaintained: false,
            idVocabularySet: 0
        });
        expect(vocabularySet).toBeTruthy();
        if (vocabularySet)
            expect(vocabularySet.idVocabularySet).toBeGreaterThan(0);
    });

    test('DB Creation: Vocabulary', async () => {
        if (vocabularySet)
            vocabulary = await DBAPI.Vocabulary.create(prisma, {
                idVocabularySet: vocabularySet.idVocabularySet,
                SortOrder: 0,
                idVocabulary: 0
            });
        expect(vocabulary).toBeTruthy();
        if (vocabulary)
            expect(vocabulary.idVocabulary).toBeGreaterThan(0);
    });

    test('DB Creation: WorkflowTemplate', async () => {
        workflowTemplate = await DBAPI.createWorkflowTemplate(prisma, {
            Name: 'Test Workflow Template',
            idWorkflowTemplate: 0
        });
        expect(workflowTemplate).toBeTruthy();
        if (workflowTemplate)
            expect(workflowTemplate.idWorkflowTemplate).toBeGreaterThan(0);
    });

    test('DB Creation: Scene', async () => {
        if (assetThumbnail)
            scene = await DBAPI.createScene(prisma, {
                Name: 'Test Scene',
                idAssetThumbnail: assetThumbnail.idAsset,
                IsOriented: true,
                HasBeenQCd: true,
                idScene: 0
            });
        expect(scene).toBeTruthy();
        if (scene)
            expect(scene.idScene).toBeGreaterThan(0);
    });

    test('DB Creation: Scene With Nulls', async () => {
        sceneNulls = await DBAPI.createScene(prisma, {
            Name: 'Test Scene',
            idAssetThumbnail: null,
            IsOriented: true,
            HasBeenQCd: true,
            idScene: 0
        });
        expect(sceneNulls).toBeTruthy();
        if (sceneNulls)
            expect(sceneNulls.idScene).toBeGreaterThan(0);
    });

    test('DB Creation: Fetch System Object Subject', async() => {
        systemObjectSubject = subject ? await DBAPI.fetchSystemObjectForSubject(prisma, subject) : null;
        expect(systemObjectSubject).toBeTruthy();
        expect(systemObjectSubject ? systemObjectSubject.idSubject : -1).toBe(subject ? subject.idSubject : -2);
    });

    test('DB Creation: Fetch System Object Scene', async() => {
        systemObjectScene = scene ? await DBAPI.fetchSystemObjectForScene(prisma, scene) : null;
        expect(systemObjectScene).toBeTruthy();
        expect(systemObjectScene ? systemObjectScene.idScene : -1).toBe(scene ? scene.idScene : -2);
    });

    test('DB Creation: Fetch System Object Asset', async() => {
        if (assetThumbnail)
            systemObjectAsset = scene ? await DBAPI.fetchSystemObjectForAsset(prisma, assetThumbnail) : null;
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
        expect(accessAction.data.idAccessAction).toBeGreaterThan(0);
    });

    test('DB Creation: AccessAction 2', async () => {
        accessAction2 = new DBAPI.AccessAction({
            Name: 'Test AccessAction 2',
            SortOrder: 0,
            idAccessAction: 0
        });

        expect(await accessAction2.create()).toBeTruthy();
        expect(accessAction2.data.idAccessAction).toBeGreaterThan(0);
    });

    test('DB Creation: AccessContext', async () => {
        accessContext = new DBAPI.AccessContext(
            { Global: false, Authoritative: false, CaptureData: false, Model: false, Scene: false, IntermediaryFile: false, idAccessContext: 0 }
        );
        expect(await accessContext.create()).toBeTruthy();
        expect(accessContext.data.idAccessContext).toBeGreaterThan(0);
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
                idAccessContext: accessContext.data.idAccessContext,
                idAccessPolicy: 0
            });
            expect(await accessPolicy.create()).toBeTruthy();
        }
        expect(accessPolicy).toBeTruthy();
        if (accessPolicy)
            expect(accessPolicy.data.idAccessPolicy).toBeGreaterThan(0);
    });

    test('DB Creation: AccessContextObject', async () => {
        if (systemObjectScene && accessContext)
            accessContextObject = new DBAPI.AccessContextObject({
                idAccessContext: accessContext.data.idAccessContext,
                idSystemObject: systemObjectScene.idSystemObject,
                idAccessContextObject: 0
            });
        expect(accessContextObject).toBeTruthy();
        if (accessContextObject) {
            expect(await accessContextObject.create()).toBeTruthy();
            expect(accessContextObject.data.idAccessContextObject).toBeGreaterThan(0);
        }
    });

    test('DB Creation: AccessRoleAccessActionXref', async () => {
        if (accessRole && accessAction)
            accessRoleAccessActionXref = await DBAPI.createAccessRoleAccessActionXref(prisma, {
                idAccessRole: accessRole.idAccessRole,
                idAccessAction: accessAction.data.idAccessAction,
                idAccessRoleAccessActionXref: 0
            });
        expect(accessRoleAccessActionXref).toBeTruthy();
        if (accessRoleAccessActionXref)
            expect(accessRoleAccessActionXref.idAccessRoleAccessActionXref).toBeGreaterThan(0);
    });

    test('DB Creation: AccessRoleAccessActionXref 2', async () => {
        if (accessRole && accessAction2)
            accessRoleAccessActionXref2 = await DBAPI.createAccessRoleAccessActionXref(prisma, {
                idAccessRole: accessRole.idAccessRole,
                idAccessAction: accessAction2.data.idAccessAction,
                idAccessRoleAccessActionXref: 0
            });
        expect(accessRoleAccessActionXref2).toBeTruthy();
        if (accessRoleAccessActionXref2)
            expect(accessRoleAccessActionXref2.idAccessRoleAccessActionXref).toBeGreaterThan(0);
    });

    test('DB Creation: Actor With Unit', async () => {
        if (unit)
            actorWithUnit = await DBAPI.createActor(prisma, {
                IndividualName: 'Test Actor Name',
                OrganizationName: 'Test Actor Org',
                idUnit:  unit.idUnit,
                idActor: 0
            });
        expect(actorWithUnit).toBeTruthy();
        if (actorWithUnit)
            expect(actorWithUnit.idActor).toBeGreaterThan(0);
    });

    test('DB Creation: Actor Without Unit', async () => {
        actorWithOutUnit = await DBAPI.createActor(prisma, {
            IndividualName: 'Test Actor Name',
            OrganizationName: 'Test Actor Org',
            idUnit: null,
            idActor: 0
        });
        expect(actorWithOutUnit).toBeTruthy();
        if (actorWithOutUnit)
            expect(actorWithOutUnit.idActor).toBeGreaterThan(0);
    });

    test('DB Creation: Asset Without Asset Group', async () => {
        assetWithoutAG = await DBAPI.createAsset(prisma, {
            FileName: 'Test Asset 2',
            FilePath: '/test/asset/path2',
            idAssetGroup:  null,
            idAsset: 0
        });
        expect(assetWithoutAG).toBeTruthy();
        if (assetWithoutAG)
            expect(assetWithoutAG.idAsset).toBeGreaterThan(0);
    });

    test('DB Creation: AssetVersion', async () => {
        if (assetThumbnail && user)
            assetVersion = await DBAPI.createAssetVersion(prisma, {
                idAsset: assetThumbnail.idAsset,
                idUserCreator: user.idUser,
                DateCreated: new Date(),
                StorageLocation: '/test/asset/path',
                StorageChecksum: 'Asset Checksum',
                StorageSize: 50,
                idAssetVersion: 0
            });
        expect(assetVersion).toBeTruthy();
        if (assetVersion)
            expect(assetVersion.idAsset).toBeGreaterThan(0);
    });

    test('DB Creation: CaptureData', async () => {
        if (vocabulary && assetThumbnail)
            captureData = await DBAPI.createCaptureData(prisma, {
                idVCaptureMethod: vocabulary.idVocabulary,
                idVCaptureDatasetType: vocabulary.idVocabulary,
                DateCaptured: new Date(),
                Description: 'Test Capture Data',
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
                idAssetThumbnail: assetThumbnail.idAsset,
                idCaptureData: 0
            });
        expect(captureData).toBeTruthy();
        if (captureData)
            expect(captureData.idCaptureData).toBeGreaterThan(0);
    });

    test('DB Creation: CaptureData With Nulls', async () => {
        if (vocabulary)
            captureDataNulls = await DBAPI.createCaptureData(prisma, {
                idVCaptureMethod: vocabulary.idVocabulary,
                idVCaptureDatasetType: vocabulary.idVocabulary,
                DateCaptured: new Date(),
                Description: 'Test Capture Data Nulls',
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
                idAssetThumbnail: null,
                idCaptureData: 0
            });
        expect(captureDataNulls).toBeTruthy();
        if (captureDataNulls)
            expect(captureDataNulls.idCaptureData).toBeGreaterThan(0);
    });

    test('DB Creation: CaptureDataGroup', async () => {
        captureDataGroup = await DBAPI.createCaptureDataGroup(prisma);
        expect(captureDataGroup).toBeTruthy();
        if (captureDataGroup)
            expect(captureDataGroup.idCaptureDataGroup).toBeGreaterThan(0);
    });

    test('DB Creation: CaptureDataGroupCaptureDataXref', async () => {
        if (captureDataGroup && captureData)
            captureDataGroupCaptureDataXref = await DBAPI.createCaptureDataGroupCaptureDataXref(prisma, {
                idCaptureDataGroup: captureDataGroup.idCaptureDataGroup,
                idCaptureData: captureData.idCaptureData,
                idCaptureDataGroupCaptureDataXref: 0
            });
        expect(captureDataGroupCaptureDataXref).toBeTruthy();
        if (captureDataGroupCaptureDataXref)
            expect(captureDataGroupCaptureDataXref.idCaptureDataGroupCaptureDataXref).toBeGreaterThan(0);
    });

    test('DB Creation: CaptureDataGroupCaptureDataXref 2', async () => {
        if (captureDataGroup && captureDataNulls)
            captureDataGroupCaptureDataXref2 = await DBAPI.createCaptureDataGroupCaptureDataXref(prisma, {
                idCaptureDataGroup: captureDataGroup.idCaptureDataGroup,
                idCaptureData: captureDataNulls.idCaptureData,
                idCaptureDataGroupCaptureDataXref: 0
            });
        expect(captureDataGroupCaptureDataXref2).toBeTruthy();
        if (captureDataGroupCaptureDataXref2)
            expect(captureDataGroupCaptureDataXref2.idCaptureDataGroupCaptureDataXref).toBeGreaterThan(0);
    });

    test('DB Creation: Identifier', async () => {
        if (systemObjectSubject && vocabulary)
            identifier = await DBAPI.createIdentifier(prisma, {
                IdentifierValue: 'Test Identifier',
                idVIdentifierType: vocabulary.idVocabulary,
                idSystemObject: systemObjectSubject.idSystemObject,
                idIdentifier: 0
            });
        expect(identifier).toBeTruthy();
        if (identifier)
            expect(identifier.idIdentifier).toBeGreaterThan(0);
    });

    test('DB Creation: Identifier With Nulls', async () => {
        if (vocabulary)
            identifierNull = await DBAPI.createIdentifier(prisma, {
                IdentifierValue: 'Test Identifier Null',
                idVIdentifierType: vocabulary.idVocabulary,
                idSystemObject: null,
                idIdentifier: 0
            });
        expect(identifierNull).toBeTruthy();
        if (identifierNull)
            expect(identifierNull.idIdentifier).toBeGreaterThan(0);
    });

    test('DB Creation: IntermediaryFile', async () => {
        if (assetThumbnail)
            intermediaryFile = await DBAPI.createIntermediaryFile(prisma, {
                idAsset: assetThumbnail.idAsset,
                DateCreated: new Date(),
                idIntermediaryFile: 0
            });
        expect(intermediaryFile).toBeTruthy();
        if (intermediaryFile)
            expect(intermediaryFile.idIntermediaryFile).toBeGreaterThan(0);
    });

    test('DB Creation: Item', async () => {
        if (subject && assetThumbnail && geoLocation)
            item = await DBAPI.createItem(prisma, {
                idSubject: subject.idSubject,
                idAssetThumbnail: assetThumbnail.idAsset,
                idGeoLocation: geoLocation.idGeoLocation,
                Name: 'Test Item',
                EntireSubject: true,
                idItem: 0
            });
        expect(item).toBeTruthy();
        if (item)
            expect(item.idItem).toBeGreaterThan(0);
    });

    test('DB Creation: Item With Nulls', async () => {
        if (subject)
            itemNulls = await DBAPI.createItem(prisma, {
                idSubject: subject.idSubject,
                idAssetThumbnail: null,
                idGeoLocation: null,
                Name: 'Test Item Nulls',
                EntireSubject: true,
                idItem: 0
            });
        expect(itemNulls).toBeTruthy();
        if (itemNulls)
            expect(itemNulls.idItem).toBeGreaterThan(0);
    });

    test('DB Creation: Metadata', async () => {
        if (assetThumbnail && user && vocabulary && systemObjectScene)
            metadata = await DBAPI.createMetadata(prisma, {
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
        if (metadata)
            expect(metadata.idMetadata).toBeGreaterThan(0);
    });

    test('DB Creation: Metadata With Nulls', async () => {
        metadataNull = await DBAPI.createMetadata(prisma, {
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
        if (metadataNull)
            expect(metadataNull.idMetadata).toBeGreaterThan(0);
    });

    test('DB Creation: Model', async () => {
        if (vocabulary && assetThumbnail)
            model = await DBAPI.createModel(prisma, {
                DateCreated: new Date(),
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
        if (model)
            expect(model.idModel).toBeGreaterThan(0);
    });

    test('DB Creation: Model With Nulls', async () => {
        if (vocabulary)
            modelNulls = await DBAPI.createModel(prisma, {
                DateCreated: new Date(),
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
        if (modelNulls)
            expect(modelNulls.idModel).toBeGreaterThan(0);
    });

    test('DB Creation: ModelGeometryFile', async () => {
        if (model && assetThumbnail && vocabulary)
            modelGeometryFile = await DBAPI.createModelGeometryFile(prisma, {
                idModel: model.idModel,
                idAsset: assetThumbnail.idAsset,
                idVModelFileType: vocabulary.idVocabulary,
                Roughness: 0, Metalness: 0, PointCount: 0, FaceCount: 0, IsWatertight: false, HasNormals: false, HasVertexColor: false, HasUVSpace: false,
                BoundingBoxP1X: 0, BoundingBoxP1Y: 0, BoundingBoxP1Z: 0, BoundingBoxP2X: 0, BoundingBoxP2Y: 0, BoundingBoxP2Z: 0,
                idModelGeometryFile: 0
            });
        expect(modelGeometryFile).toBeTruthy();
        if (modelGeometryFile)
            expect(modelGeometryFile.idModelGeometryFile).toBeGreaterThan(0);
    });

    test('DB Creation: ModelGeometryFile With Nulls', async () => {
        if (model && assetThumbnail && vocabulary)
            modelGeometryFileNulls = await DBAPI.createModelGeometryFile(prisma, {
                idModel: model.idModel,
                idAsset: assetThumbnail.idAsset,
                idVModelFileType: vocabulary.idVocabulary,
                Roughness: null, Metalness: null, PointCount: null, FaceCount: null, IsWatertight: null, HasNormals: null, HasVertexColor: null, HasUVSpace: null,
                BoundingBoxP1X: null, BoundingBoxP1Y: null, BoundingBoxP1Z: null, BoundingBoxP2X: null, BoundingBoxP2Y: null, BoundingBoxP2Z: null,
                idModelGeometryFile: 0
            });
        expect(modelGeometryFileNulls).toBeTruthy();
        if (modelGeometryFileNulls)
            expect(modelGeometryFileNulls.idModelGeometryFile).toBeGreaterThan(0);
    });

    test('DB Creation: ModelProcessingAction', async () => {
        if (model && actorWithUnit)
            modelProcessingAction = await DBAPI.createModelProcessingAction(prisma, {
                idModel: model.idModel,
                idActor: actorWithUnit.idActor,
                DateProcessed: new Date(),
                ToolsUsed: 'Test Model Processing Action',
                Description: 'Test Model Processing Action Description',
                idModelProcessingAction: 0
            });
        expect(modelProcessingAction).toBeTruthy();
        if (modelProcessingAction)
            expect(modelProcessingAction.idModelProcessingAction).toBeGreaterThan(0);
    });

    test('DB Creation: ModelProcessingActionStep', async () => {
        if (modelProcessingAction && vocabulary)
            modelProcessingActionStep = await DBAPI.createModelProcessingActionStep(prisma, {
                idModelProcessingAction: modelProcessingAction.idModelProcessingAction,
                idVActionMethod: vocabulary.idVocabulary,
                Description: 'Test Model Processing Action Step',
                idModelProcessingActionStep: 0
            });
        expect(modelProcessingActionStep).toBeTruthy();
        if (modelProcessingActionStep)
            expect(modelProcessingActionStep.idModelProcessingActionStep).toBeGreaterThan(0);
    });

    test('DB Creation: ModelSceneXref', async () => {
        if (model && scene)
            modelSceneXref = await DBAPI.createModelSceneXref(prisma, {
                idModel: model.idModel,
                idScene: scene.idScene,
                TS0: 0, TS1: 0, TS2: 0, R0: 0, R1: 0, R2: 0, R3: 0,
                idModelSceneXref: 0
            });
        expect(modelSceneXref).toBeTruthy();
        if (modelSceneXref)
            expect(modelSceneXref.idModelSceneXref).toBeGreaterThan(0);
    });

    test('DB Creation: ModelSceneXref With Nulls', async () => {
        if (model && sceneNulls)
            modelSceneXrefNull = await DBAPI.createModelSceneXref(prisma, {
                idModel: model.idModel,
                idScene: sceneNulls.idScene,
                TS0: null, TS1: null, TS2: null, R0: null, R1: null, R2: null, R3: null,
                idModelSceneXref: 0
            });
        expect(modelSceneXrefNull).toBeTruthy();
        if (modelSceneXrefNull)
            expect(modelSceneXrefNull.idModelSceneXref).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectVersion', async () => {
        if (systemObjectScene) {
            systemObjectVersion = await DBAPI.createSystemObjectVersion(prisma, {
                idSystemObject: systemObjectScene.idSystemObject,
                PublishedState: 0,
                idSystemObjectVersion: 0
            });
        }
        expect(systemObjectVersion).toBeTruthy();
        if (systemObjectVersion)
            expect(systemObjectVersion.idSystemObjectVersion).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectXref', async () => {
        if (systemObjectSubject && systemObjectScene) {
            systemObjectXref = await DBAPI.createSystemObjectXref(prisma, {
                idSystemObjectMaster: systemObjectSubject.idSystemObject,
                idSystemObjectDerived: systemObjectScene.idSystemObject,
                idSystemObjectXref: 0
            });
        }
        expect(systemObjectXref).toBeTruthy();
        if (systemObjectXref)
            expect(systemObjectXref.idSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectXref 2', async () => {
        if (systemObjectSubject && systemObjectAsset) {
            systemObjectXref2 = await DBAPI.createSystemObjectXref(prisma, {
                idSystemObjectMaster: systemObjectSubject.idSystemObject,
                idSystemObjectDerived: systemObjectAsset.idSystemObject,
                idSystemObjectXref: 0
            });
        }
        expect(systemObjectXref2).toBeTruthy();
        if (systemObjectXref2)
            expect(systemObjectXref2.idSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: ModelUVMapFile', async () => {
        if (modelGeometryFile && assetThumbnail)
            modelUVMapFile = await DBAPI.createModelUVMapFile(prisma, {
                idModelGeometryFile: modelGeometryFile.idModelGeometryFile,
                idAsset: assetThumbnail.idAsset,
                UVMapEdgeLength: 0,
                idModelUVMapFile: 0
            });
        expect(modelUVMapFile).toBeTruthy();
        if (modelUVMapFile)
            expect(modelUVMapFile.idModelUVMapFile).toBeGreaterThan(0);
    });

    test('DB Creation: ModelUVMapChannel', async () => {
        if (modelUVMapFile && vocabulary)
            modelUVMapChannel = await DBAPI.createModelUVMapChannel(prisma, {
                idModelUVMapFile: modelUVMapFile.idModelUVMapFile,
                ChannelPosition: 0, ChannelWidth: 1,
                idVUVMapType: vocabulary.idVocabulary,
                idModelUVMapChannel: 0
            });
        expect(modelUVMapChannel).toBeTruthy();
        if (modelUVMapChannel)
            expect(modelUVMapChannel.idModelUVMapChannel).toBeGreaterThan(0);
    });

    test('DB Creation: License', async () => {
        license = await DBAPI.createLicense(prisma, {
            Name: 'Test License',
            Description: 'Test License Description',
            idLicense: 0
        });
        expect(license).toBeTruthy();
        if (license)
            expect(license.idLicense).toBeGreaterThan(0);
    });

    test('DB Creation: LicenseAssignment', async () => {
        if (license && user && systemObjectSubject)
            licenseAssignment = await DBAPI.createLicenseAssignment(prisma, {
                idLicense: license.idLicense,
                idUserCreator: user.idUser,
                DateStart: new Date(),
                DateEnd: new Date(),
                idSystemObject: systemObjectSubject.idSystemObject,
                idLicenseAssignment: 0
            });
        expect(licenseAssignment).toBeTruthy();
        if (licenseAssignment)
            expect(licenseAssignment.idLicenseAssignment).toBeGreaterThan(0);
    });

    test('DB Creation: LicenseAssignment With Nulls', async () => {
        if (license)
            licenseAssignmentNull = await DBAPI.createLicenseAssignment(prisma, {
                idLicense: license.idLicense,
                idUserCreator: null,
                DateStart: null,
                DateEnd: null,
                idSystemObject: null,
                idLicenseAssignment: 0
            });
        expect(licenseAssignmentNull).toBeTruthy();
        if (licenseAssignmentNull)
            expect(licenseAssignmentNull.idLicenseAssignment).toBeGreaterThan(0);
    });

    test('DB Creation: Project', async () => {
        project = await DBAPI.createProject(prisma, {
            Name: 'Test Project',
            Description: 'Test',
            idProject: 0,
        });
        expect(project).toBeTruthy();
        if (project)
            expect(project.idProject).toBeGreaterThan(0);
    });

    test('DB Creation: ProjectDocumentation', async () => {
        if (project)
            projectDocumentation = await DBAPI.createProjectDocumentation(prisma, {
                idProject: project.idProject,
                Name: 'Test Project Documentation',
                Description: 'Test Description',
                idProjectDocumentation: 0
            });
        expect(projectDocumentation).toBeTruthy();
        if (projectDocumentation)
            expect(projectDocumentation.idProjectDocumentation).toBeGreaterThan(0);
    });

    test('DB Creation: Subject With Nulls', async () => {
        if (unit)
            subjectNulls = await DBAPI.createSubject(prisma, {
                idUnit: unit.idUnit,
                idAssetThumbnail: null,
                idGeoLocation: null,
                Name: 'Test Subject Nulls',
                idSubject: 0
            });
        expect(subjectNulls).toBeTruthy();
        if (subjectNulls)
            expect(subjectNulls.idSubject).toBeGreaterThan(0);
    });

    test('DB Creation: Stakeholder', async () => {
        stakeholder = await DBAPI.createStakeholder(prisma, {
            IndividualName: 'Test Stakeholder Name',
            OrganizationName: 'Test Stakeholder Org',
            EmailAddress: 'Test Email',
            PhoneNumberMobile: 'Test Phone Mobile',
            PhoneNumberOffice: 'Test Phone Office',
            MailingAddress: 'Test Mailing Address',
            idStakeholder: 0
        });
        expect(stakeholder).toBeTruthy();
        if (stakeholder)
            expect(stakeholder.idStakeholder).toBeGreaterThan(0);
    });

    test('DB Creation: UserPersonalizationSystemObject', async () => {
        if (systemObjectSubject && user)
            userPersonalizationSystemObject = await DBAPI.createUserPersonalizationSystemObject(prisma, {
                idUser: user.idUser,
                idSystemObject: systemObjectSubject.idSystemObject,
                Personalization: 'Test Personalization',
                idUserPersonalizationSystemObject: 0
            });
        expect(userPersonalizationSystemObject).toBeTruthy();
        if (userPersonalizationSystemObject)
            expect(userPersonalizationSystemObject.idUserPersonalizationSystemObject).toBeGreaterThan(0);
    });

    test('DB Creation: UserPersonalizationUrl', async () => {
        if (user)
            userPersonalizationUrl = await DBAPI.createUserPersonalizationUrl(prisma, {
                idUser: user.idUser,
                URL: '/test/personalization/Url',
                Personalization: 'Test Personalization',
                idUserPersonalizationUrl: 0
            });
        expect(userPersonalizationUrl).toBeTruthy();
        if (userPersonalizationUrl)
            expect(userPersonalizationUrl.idUserPersonalizationUrl).toBeGreaterThan(0);
    });

    test('DB Creation: Workflow', async () => {
        if (workflowTemplate && project && user)
            workflow = await DBAPI.createWorkflow(prisma, {
                idWorkflowTemplate: workflowTemplate.idWorkflowTemplate,
                idProject: project.idProject,
                idUserInitiator: user.idUser,
                DateInitiated: new Date(),
                DateUpdated: new Date(),
                idWorkflow: 0
            });
        expect(workflow).toBeTruthy();
        if (workflow)
            expect(workflow.idWorkflow).toBeGreaterThan(0);
    });

    test('DB Creation: Workflow With Nulls', async () => {
        if (workflowTemplate)
            workflowNulls = await DBAPI.createWorkflow(prisma, {
                idWorkflowTemplate: workflowTemplate.idWorkflowTemplate,
                idProject: null,
                idUserInitiator: null,
                DateInitiated: new Date(),
                DateUpdated: new Date(),
                idWorkflow: 0
            });
        expect(workflowNulls).toBeTruthy();
        if (workflowNulls)
            expect(workflowNulls.idWorkflow).toBeGreaterThan(0);
    });

    test('DB Creation: WorkflowStep', async () => {
        if (workflow && user && vocabulary)
            workflowStep = await DBAPI.createWorkflowStep(prisma, {
                idWorkflow: workflow.idWorkflow,
                idUserOwner: user.idUser,
                idVWorkflowStepType: vocabulary.idVocabulary,
                State: 0,
                DateCreated: new Date(),
                DateCompleted: new Date(),
                idWorkflowStep: 0
            });
        expect(workflowStep).toBeTruthy();
        if (workflowStep)
            expect(workflowStep.idWorkflowStep).toBeGreaterThan(0);
    });

    test('DB Creation: WorkflowStepSystemObjectXref 1', async () => {
        if (systemObjectScene && workflowStep)
            workflowStepSystemObjectXref = await DBAPI.createWorkflowStepSystemObjectXref(prisma, {
                idWorkflowStep: workflowStep.idWorkflowStep,
                idSystemObject: systemObjectScene.idSystemObject,
                Input: false,
                idWorkflowStepSystemObjectXref: 0
            });
        expect(workflowStepSystemObjectXref).toBeTruthy();
        if (workflowStepSystemObjectXref)
            expect(workflowStepSystemObjectXref.idWorkflowStepSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: WorkflowStepSystemObjectXref 2', async () => {
        if (systemObjectSubject && workflowStep)
            workflowStepSystemObjectXref2 = await DBAPI.createWorkflowStepSystemObjectXref(prisma, {
                idWorkflowStep: workflowStep.idWorkflowStep,
                idSystemObject: systemObjectSubject.idSystemObject,
                Input: false,
                idWorkflowStepSystemObjectXref: 0
            });
        expect(workflowStepSystemObjectXref2).toBeTruthy();
        if (workflowStepSystemObjectXref2)
            expect(workflowStepSystemObjectXref2.idWorkflowStepSystemObjectXref).toBeGreaterThan(0);
    });
});

// *******************************************************************
// DB Fetch By ID Test Suite
// *******************************************************************
describe('DB Fetch By ID Test Suite', () => {
    test('DB Fetch By ID: AccessAction', async () => {
        let accessActionFetch: DBAPI.AccessAction | null = null;
        if (accessAction) {
            accessActionFetch = await DBAPI.AccessAction.fetch(accessAction.data.idAccessAction);
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
            accessContextFetch = await DBAPI.AccessContext.fetch(accessContext.data.idAccessContext);
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
            accessContextObjectFetch = await DBAPI.AccessContextObject.fetch(accessContextObject.data.idAccessContextObject);
            if (accessContextObjectFetch) {
                expect(accessContextObjectFetch).toMatchObject(accessContextObject);
                expect(accessContextObject).toMatchObject(accessContextObjectFetch);
            }
        }
        expect(accessContextObjectFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AccessPolicy', async () => {
        let accessPolicyFetch: DBAPI.AccessPolicy | null = null;
        if (accessPolicy) {
            accessPolicyFetch = await DBAPI.AccessPolicy.fetch(accessPolicy.data.idAccessPolicy);
            if (accessPolicyFetch) {
                expect(accessPolicyFetch).toMatchObject(accessPolicy);
                expect(accessPolicy).toMatchObject(accessPolicyFetch);
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
        let accessRoleAccessActionXrefFetch: AccessRoleAccessActionXref | null = null;
        if (accessRoleAccessActionXref) {
            accessRoleAccessActionXrefFetch = await DBAPI.fetchAccessRoleAccessActionXref(prisma, accessRoleAccessActionXref.idAccessRoleAccessActionXref);
            if (accessRoleAccessActionXrefFetch) {
                expect(accessRoleAccessActionXrefFetch).toMatchObject(accessRoleAccessActionXref);
                expect(accessRoleAccessActionXref).toMatchObject(accessRoleAccessActionXrefFetch);
            }
        }
        expect(accessRoleAccessActionXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Actor', async () => {
        let actorFetch: Actor | null = null;
        if (actorWithUnit) {
            actorFetch = await DBAPI.fetchActor(prisma, actorWithUnit.idActor);
            if (actorFetch) {
                expect(actorFetch).toMatchObject(actorWithUnit);
                expect(actorWithUnit).toMatchObject(actorFetch);
            }
        }
        expect(actorFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AssetGroup', async () => {
        let assetGroupFetch: AssetGroup | null = null;
        if (assetGroup) {
            assetGroupFetch = await DBAPI.fetchAssetGroup(prisma, assetGroup.idAssetGroup);
            if (assetGroupFetch) {
                expect(assetGroupFetch).toMatchObject(assetGroup);
                expect(assetGroup).toMatchObject(assetGroupFetch);
            }
        }
        expect(assetGroupFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Asset', async () => {
        let assetFetch: Asset | null = null;
        if (assetThumbnail) {
            assetFetch = await DBAPI.fetchAsset(prisma, assetThumbnail.idAsset);
            if (assetFetch) {
                expect(assetFetch).toMatchObject(assetThumbnail);
                expect(assetThumbnail).toMatchObject(assetFetch);
            }
        }
        expect(assetFetch).toBeTruthy();
    });

    test('DB Fetch By ID: AssetVersion', async () => {
        let assetVersionFetch: AssetVersion | null = null;
        if (assetVersion) {
            assetVersionFetch = await DBAPI.fetchAssetVersion(prisma, assetVersion.idAssetVersion);
            if (assetVersionFetch) {
                expect(assetVersionFetch).toMatchObject(assetVersion);
                expect(assetVersion).toMatchObject(assetVersionFetch);
            }
        }
        expect(assetVersionFetch).toBeTruthy();
    });

    test('DB Fetch By ID: CaptureData', async () => {
        let captureDataFetch: CaptureData | null = null;
        if (captureData) {
            captureDataFetch = await DBAPI.fetchCaptureData(prisma, captureData.idCaptureData);
            if (captureDataFetch) {
                expect(captureDataFetch).toMatchObject(captureData);
                expect(captureData).toMatchObject(captureDataFetch);
            }
        }
        expect(captureDataFetch).toBeTruthy();
    });

    test('DB Fetch By ID: CaptureDataGroup', async () => {
        let captureDataGroupFetch: CaptureDataGroup | null = null;
        if (captureDataGroup) {
            captureDataGroupFetch = await DBAPI.fetchCaptureDataGroup(prisma, captureDataGroup.idCaptureDataGroup);
            if (captureDataGroupFetch) {
                expect(captureDataGroupFetch).toMatchObject(captureDataGroup);
                expect(captureDataGroup).toMatchObject(captureDataGroupFetch);
            }
        }
        expect(captureDataGroupFetch).toBeTruthy();
    });

    test('DB Fetch By ID: CaptureDataGroupCaptureDataXref', async () => {
        let captureDataGroupCaptureDataXrefFetch: CaptureDataGroupCaptureDataXref | null = null;
        if (captureDataGroupCaptureDataXref) {
            captureDataGroupCaptureDataXrefFetch = await DBAPI.fetchCaptureDataGroupCaptureDataXref(prisma, captureDataGroupCaptureDataXref.idCaptureDataGroupCaptureDataXref);
            if (captureDataGroupCaptureDataXrefFetch) {
                expect(captureDataGroupCaptureDataXrefFetch).toMatchObject(captureDataGroupCaptureDataXref);
                expect(captureDataGroupCaptureDataXref).toMatchObject(captureDataGroupCaptureDataXrefFetch);
            }
        }
        expect(captureDataGroupCaptureDataXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: GeoLocation', async () => {
        let geoLocationFetch: GeoLocation | null = null;
        if (geoLocation) {
            geoLocationFetch = await DBAPI.fetchGeoLocation(prisma, geoLocation.idGeoLocation);
            if (geoLocationFetch) {
                expect(geoLocationFetch).toMatchObject(geoLocation);
                expect(geoLocation).toMatchObject(geoLocationFetch);
            }
        }
        expect(geoLocationFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Identifier', async () => {
        let identifierFetch: Identifier | null = null;
        if (identifier) {
            identifierFetch = await DBAPI.fetchIdentifier(prisma, identifier.idIdentifier);
            if (identifierFetch) {
                expect(identifierFetch).toMatchObject(identifier);
                expect(identifier).toMatchObject(identifierFetch);
            }
        }
        expect(identifierFetch).toBeTruthy();
    });

    test('DB Fetch By ID: IntermediaryFile', async () => {
        let intermediaryFileFetch: IntermediaryFile | null = null;
        if (intermediaryFile) {
            intermediaryFileFetch = await DBAPI.fetchIntermediaryFile(prisma, intermediaryFile.idIntermediaryFile);
            if (intermediaryFileFetch) {
                expect(intermediaryFileFetch).toMatchObject(intermediaryFile);
                expect(intermediaryFile).toMatchObject(intermediaryFileFetch);
            }
        }
        expect(intermediaryFileFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Item', async () => {
        let itemFetch: Item | null = null;
        if (item) {
            itemFetch = await DBAPI.fetchItem(prisma, item.idItem);
            if (itemFetch) {
                expect(itemFetch).toMatchObject(item);
                expect(item).toMatchObject(itemFetch);
            }
        }
        expect(itemFetch).toBeTruthy();
    });

    test('DB Fetch By ID: License', async () => {
        let licenseFetch: License | null = null;
        if (license) {
            licenseFetch = await DBAPI.fetchLicense(prisma, license.idLicense);
            if (licenseFetch) {
                expect(licenseFetch).toMatchObject(license);
                expect(license).toMatchObject(licenseFetch);
            }
        }
        expect(licenseFetch).toBeTruthy();
    });

    test('DB Fetch By ID: LicenseAssignment', async () => {
        let licenseAssignmentFetch: LicenseAssignment | null = null;
        if (licenseAssignment) {
            licenseAssignmentFetch = await DBAPI.fetchLicenseAssignment(prisma, licenseAssignment.idLicenseAssignment);
            if (licenseAssignmentFetch) {
                expect(licenseAssignmentFetch).toMatchObject(licenseAssignment);
                expect(licenseAssignment).toMatchObject(licenseAssignmentFetch);
            }
        }
        expect(licenseAssignmentFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Metadata', async () => {
        let metadataFetch: Metadata | null = null;
        if (metadata) {
            metadataFetch = await DBAPI.fetchMetadata(prisma, metadata.idMetadata);
            if (metadataFetch) {
                expect(metadataFetch).toMatchObject(metadata);
                expect(metadata).toMatchObject(metadataFetch);
            }
        }
        expect(metadataFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Model', async () => {
        let modelFetch: Model | null = null;
        if (model) {
            modelFetch = await DBAPI.fetchModel(prisma, model.idModel);
            if (modelFetch) {
                expect(modelFetch).toMatchObject(model);
                expect(model).toMatchObject(modelFetch);
            }
        }
        expect(modelFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelGeometryFile', async () => {
        let modelGeometryFileFetch: ModelGeometryFile | null = null;
        if (modelGeometryFile) {
            modelGeometryFileFetch = await DBAPI.fetchModelGeometryFile(prisma, modelGeometryFile.idModelGeometryFile);
            if (modelGeometryFileFetch) {
                expect(modelGeometryFileFetch).toMatchObject(modelGeometryFile);
                expect(modelGeometryFile).toMatchObject(modelGeometryFileFetch);
            }
        }
        expect(modelGeometryFileFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelProcessingAction', async () => {
        let modelProcessingActionFetch: ModelProcessingAction | null = null;
        if (modelProcessingAction) {
            modelProcessingActionFetch = await DBAPI.fetchModelProcessingAction(prisma, modelProcessingAction.idModelProcessingAction);
            if (modelProcessingActionFetch) {
                expect(modelProcessingActionFetch).toMatchObject(modelProcessingAction);
                expect(modelProcessingAction).toMatchObject(modelProcessingActionFetch);
            }
        }
        expect(modelProcessingActionFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelProcessingActionStep', async () => {
        let modelProcessingActionStepFetch: ModelProcessingActionStep | null = null;
        if (modelProcessingActionStep) {
            modelProcessingActionStepFetch = await DBAPI.fetchModelProcessingActionStep(prisma, modelProcessingActionStep.idModelProcessingActionStep);
            if (modelProcessingActionStepFetch) {
                expect(modelProcessingActionStepFetch).toMatchObject(modelProcessingActionStep);
                expect(modelProcessingActionStep).toMatchObject(modelProcessingActionStepFetch);
            }
        }
        expect(modelProcessingActionStepFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelSceneXref', async () => {
        let modelSceneXrefFetch: ModelSceneXref | null = null;
        if (modelSceneXref) {
            modelSceneXrefFetch = await DBAPI.fetchModelSceneXref(prisma, modelSceneXref.idModelSceneXref);
            if (modelSceneXrefFetch) {
                expect(modelSceneXrefFetch).toMatchObject(modelSceneXref);
                expect(modelSceneXref).toMatchObject(modelSceneXrefFetch);
            }
        }
        expect(modelSceneXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelUVMapChannel', async () => {
        let modelUVMapChannelFetch: ModelUVMapChannel | null = null;
        if (modelUVMapChannel) {
            modelUVMapChannelFetch = await DBAPI.fetchModelUVMapChannel(prisma, modelUVMapChannel.idModelUVMapChannel);
            if (modelUVMapChannelFetch) {
                expect(modelUVMapChannelFetch).toMatchObject(modelUVMapChannel);
                expect(modelUVMapChannel).toMatchObject(modelUVMapChannelFetch);
            }
        }
        expect(modelUVMapChannelFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ModelUVMapFile', async () => {
        let modelUVMapFileFetch: ModelUVMapFile | null = null;
        if (modelUVMapFile) {
            modelUVMapFileFetch = await DBAPI.fetchModelUVMapFile(prisma, modelUVMapFile.idModelUVMapFile);
            if (modelUVMapFileFetch) {
                expect(modelUVMapFileFetch).toMatchObject(modelUVMapFile);
                expect(modelUVMapFile).toMatchObject(modelUVMapFileFetch);
            }
        }
        expect(modelUVMapFileFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Project', async () => {
        let projectFetch: Project | null = null;
        if (project) {
            projectFetch = await DBAPI.fetchProject(prisma, project.idProject);
            if (projectFetch) {
                expect(projectFetch).toMatchObject(project);
                expect(project).toMatchObject(projectFetch);
            }
        }
        expect(projectFetch).toBeTruthy();
    });

    test('DB Fetch By ID: ProjectDocumentation', async () => {
        let projectDocumentationFetch: ProjectDocumentation | null = null;
        if (projectDocumentation) {
            projectDocumentationFetch = await DBAPI.fetchProjectDocumentation(prisma, projectDocumentation.idProjectDocumentation);
            if (projectDocumentationFetch) {
                expect(projectDocumentationFetch).toMatchObject(projectDocumentation);
                expect(projectDocumentation).toMatchObject(projectDocumentationFetch);
            }
        }
        expect(projectDocumentationFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Scene', async () => {
        let sceneFetch: Scene | null = null;
        if (scene) {
            sceneFetch = await DBAPI.fetchScene(prisma, scene.idScene);
            if (sceneFetch) {
                expect(sceneFetch).toMatchObject(scene);
                expect(scene).toMatchObject(sceneFetch);
            }
        }
        expect(sceneFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Stakeholder', async () => {
        let stakeholderFetch: Stakeholder | null = null;
        if (stakeholder) {
            stakeholderFetch = await DBAPI.fetchStakeholder(prisma, stakeholder.idStakeholder);
            if (stakeholderFetch) {
                expect(stakeholderFetch).toMatchObject(stakeholder);
                expect(stakeholder).toMatchObject(stakeholderFetch);
            }
        }
        expect(stakeholderFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Subject', async () => {
        let subjectFetch: Subject | null = null;
        if (subject) {
            subjectFetch = await DBAPI.fetchSubject(prisma, subject.idSubject);
            if (subjectFetch) {
                expect(subjectFetch).toMatchObject(subject);
                expect(subject).toMatchObject(subjectFetch);
            }
        }
        expect(subjectFetch).toBeTruthy();
    });

    test('DB Fetch By ID: SystemObjectVersion', async () => {
        let systemObjectVersionFetch: SystemObjectVersion | null = null;
        if (systemObjectVersion) {
            systemObjectVersionFetch = await DBAPI.fetchSystemObjectVersion(prisma, systemObjectVersion.idSystemObjectVersion);
            if (systemObjectVersionFetch) {
                expect(systemObjectVersionFetch).toMatchObject(systemObjectVersion);
                expect(systemObjectVersion).toMatchObject(systemObjectVersionFetch);
            }
        }
        expect(systemObjectVersionFetch).toBeTruthy();
    });

    test('DB Fetch By ID: SystemObjectXref', async () => {
        let systemObjectXrefFetch: SystemObjectXref | null = null;
        if (systemObjectXref) {
            systemObjectXrefFetch = await DBAPI.fetchSystemObjectXref(prisma, systemObjectXref.idSystemObjectXref);
            if (systemObjectXrefFetch) {
                expect(systemObjectXrefFetch).toMatchObject(systemObjectXref);
                expect(systemObjectXref).toMatchObject(systemObjectXrefFetch);
            }
        }
        expect(systemObjectXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Unit', async () => {
        let unitFetch: Unit | null = null;
        if (unit) {
            unitFetch = await DBAPI.fetchUnit(prisma, unit.idUnit);
            if (unitFetch) {
                expect(unitFetch).toMatchObject(unit);
                expect(unit).toMatchObject(unitFetch);
            }
        }
        expect(unitFetch).toBeTruthy();
    });

    test('DB Fetch By ID: User', async () => {
        let userFetch: User | null = null;
        if (user) {
            userFetch = await DBAPI.fetchUser(prisma, user.idUser);
            if (userFetch) {
                expect(userFetch).toMatchObject(user);
                expect(user).toMatchObject(userFetch);
            }
        }
        expect(userFetch).toBeTruthy();
    });

    test('DB Fetch By ID: UserPersonalizationSystemObject', async () => {
        let userPersonalizationSystemObjectFetch: UserPersonalizationSystemObject | null = null;
        if (userPersonalizationSystemObject) {
            userPersonalizationSystemObjectFetch = await DBAPI.fetchUserPersonalizationSystemObject(prisma, userPersonalizationSystemObject.idUserPersonalizationSystemObject);
            if (userPersonalizationSystemObjectFetch) {
                expect(userPersonalizationSystemObjectFetch).toMatchObject(userPersonalizationSystemObject);
                expect(userPersonalizationSystemObject).toMatchObject(userPersonalizationSystemObjectFetch);
            }
        }
        expect(userPersonalizationSystemObjectFetch).toBeTruthy();
    });

    test('DB Fetch By ID: UserPersonalizationUrl', async () => {
        let userPersonalizationUrlFetch: UserPersonalizationUrl | null = null;
        if (userPersonalizationUrl) {
            userPersonalizationUrlFetch = await DBAPI.fetchUserPersonalizationUrl(prisma, userPersonalizationUrl.idUserPersonalizationUrl);
            if (userPersonalizationUrlFetch) {
                expect(userPersonalizationUrlFetch).toMatchObject(userPersonalizationUrl);
                expect(userPersonalizationUrl).toMatchObject(userPersonalizationUrlFetch);
            }
        }
        expect(userPersonalizationUrlFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Vocabulary', async () => {
        let vocabularyFetch: Vocabulary | null = null;
        if (vocabulary) {
            vocabularyFetch = await DBAPI.Vocabulary.fetch(prisma, vocabulary.idVocabulary);
            if (vocabularyFetch) {
                expect(vocabularyFetch).toMatchObject(vocabulary);
                expect(vocabulary).toMatchObject(vocabularyFetch);
            }
        }
        expect(vocabularyFetch).toBeTruthy();
    });

    test('DB Fetch By ID: VocabularySet', async () => {
        let vocabularySetFetch: VocabularySet | null = null;
        if (vocabularySet) {
            vocabularySetFetch = await DBAPI.fetchVocabularySet(prisma, vocabularySet.idVocabularySet);
            if (vocabularySetFetch) {
                expect(vocabularySetFetch).toMatchObject(vocabularySet);
                expect(vocabularySet).toMatchObject(vocabularySetFetch);
            }
        }
        expect(vocabularySetFetch).toBeTruthy();
    });

    test('DB Fetch By ID: Workflow', async () => {
        let workflowFetch: Workflow | null = null;
        if (workflow) {
            workflowFetch = await DBAPI.fetchWorkflow(prisma, workflow.idWorkflow);
            if (workflowFetch) {
                expect(workflowFetch).toMatchObject(workflow);
                expect(workflow).toMatchObject(workflowFetch);
            }
        }
        expect(workflowFetch).toBeTruthy();
    });

    test('DB Fetch By ID: WorkflowStep', async () => {
        let workflowStepFetch: WorkflowStep | null = null;
        if (workflowStep) {
            workflowStepFetch = await DBAPI.fetchWorkflowStep(prisma, workflowStep.idWorkflowStep);
            if (workflowStepFetch) {
                expect(workflowStepFetch).toMatchObject(workflowStep);
                expect(workflowStep).toMatchObject(workflowStepFetch);
            }
        }
        expect(workflowStepFetch).toBeTruthy();
    });

    test('DB Fetch By ID: WorkflowStepSystemObjectXref', async () => {
        let workflowStepSystemObjectXrefFetch: WorkflowStepSystemObjectXref | null = null;
        if (workflowStepSystemObjectXref) {
            workflowStepSystemObjectXrefFetch = await DBAPI.fetchWorkflowStepSystemObjectXref(prisma, workflowStepSystemObjectXref.idWorkflowStepSystemObjectXref);
            if (workflowStepSystemObjectXrefFetch) {
                expect(workflowStepSystemObjectXrefFetch).toMatchObject(workflowStepSystemObjectXref);
                expect(workflowStepSystemObjectXref).toMatchObject(workflowStepSystemObjectXrefFetch);
            }
        }
        expect(workflowStepSystemObjectXrefFetch).toBeTruthy();
    });

    test('DB Fetch By ID: WorkflowTemplate', async () => {
        let workflowTemplateFetch: WorkflowTemplate | null = null;
        if (workflowTemplate) {
            workflowTemplateFetch = await DBAPI.fetchWorkflowTemplate(prisma, workflowTemplate.idWorkflowTemplate);
            if (workflowTemplateFetch) {
                expect(workflowTemplateFetch).toMatchObject(workflowTemplate);
                expect(workflowTemplate).toMatchObject(workflowTemplateFetch);
            }
        }
        expect(workflowTemplateFetch).toBeTruthy();
    });
});

// *******************************************************************
// DB Fetch SystemObject Test Suite
// *******************************************************************
describe('DB Fetch SystemObject Test Suite', () => {
    test('DB Fetch SystemObject: fetchSystemObjectForActor', async () => {
        let SO: SystemObject | null = null;
        if (actorWithUnit) {
            SO = await DBAPI.fetchSystemObjectForActor(prisma, actorWithUnit);
            if (SO)
                expect(SO.idActor).toEqual(actorWithUnit.idActor);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForActorID', async () => {
        let SO: SystemObject | null = null;
        if (actorWithUnit) {
            SO = await DBAPI.fetchSystemObjectForActorID(prisma, actorWithUnit.idActor);
            if (SO)
                expect(SO.idActor).toEqual(actorWithUnit.idActor);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndActor', async () => {
        let SO: SystemObject & { Actor: Actor | null} | null = null;
        if (actorWithUnit) {
            SO = await DBAPI.fetchSystemObjectAndActor(prisma, actorWithUnit.idActor);
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

    test('DB Fetch SystemObject: fetchSystemObjectForAsset', async () => {
        let SO: SystemObject | null = null;
        if (assetThumbnail) {
            SO = await DBAPI.fetchSystemObjectForAsset(prisma, assetThumbnail);
            if (SO)
                expect(SO.idAsset).toEqual(assetThumbnail.idAsset);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForAssetID', async () => {
        let SO: SystemObject | null = null;
        if (assetThumbnail) {
            SO = await DBAPI.fetchSystemObjectForAssetID(prisma, assetThumbnail.idAsset);
            if (SO)
                expect(SO.idAsset).toEqual(assetThumbnail.idAsset);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndAsset', async () => {
        let SO: SystemObject & { Asset: Asset | null} | null = null;
        if (assetThumbnail) {
            SO = await DBAPI.fetchSystemObjectAndAsset(prisma, assetThumbnail.idAsset);
            if (SO) {
                expect(SO.idAsset).toEqual(assetThumbnail.idAsset);
                expect(SO.Asset).toBeTruthy();
                if (SO.Asset) {
                    expect(SO.Asset).toMatchObject(assetThumbnail);
                    expect(assetThumbnail).toMatchObject(SO.Asset);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForAssetVersion', async () => {
        let SO: SystemObject | null = null;
        if (assetVersion) {
            SO = await DBAPI.fetchSystemObjectForAssetVersion(prisma, assetVersion);
            if (SO)
                expect(SO.idAssetVersion).toEqual(assetVersion.idAssetVersion);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForAssetVersionID', async () => {
        let SO: SystemObject | null = null;
        if (assetVersion) {
            SO = await DBAPI.fetchSystemObjectForAssetVersionID(prisma, assetVersion.idAssetVersion);
            if (SO)
                expect(SO.idAssetVersion).toEqual(assetVersion.idAssetVersion);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndAssetVersion', async () => {
        let SO: SystemObject & { AssetVersion: AssetVersion | null} | null = null;
        if (assetVersion) {
            SO = await DBAPI.fetchSystemObjectAndAssetVersion(prisma, assetVersion.idAssetVersion);
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

    test('DB Fetch SystemObject: fetchSystemObjectForCaptureData', async () => {
        let SO: SystemObject | null = null;
        if (captureData) {
            SO = await DBAPI.fetchSystemObjectForCaptureData(prisma, captureData);
            if (SO)
                expect(SO.idCaptureData).toEqual(captureData.idCaptureData);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForCaptureDataID', async () => {
        let SO: SystemObject | null = null;
        if (captureData) {
            SO = await DBAPI.fetchSystemObjectForCaptureDataID(prisma, captureData.idCaptureData);
            if (SO)
                expect(SO.idCaptureData).toEqual(captureData.idCaptureData);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndCaptureData', async () => {
        let SO: SystemObject & { CaptureData: CaptureData | null} | null = null;
        if (captureData) {
            SO = await DBAPI.fetchSystemObjectAndCaptureData(prisma, captureData.idCaptureData);
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

    test('DB Fetch SystemObject: fetchSystemObjectForIntermediaryFile', async () => {
        let SO: SystemObject | null = null;
        if (intermediaryFile) {
            SO = await DBAPI.fetchSystemObjectForIntermediaryFile(prisma, intermediaryFile);
            if (SO)
                expect(SO.idIntermediaryFile).toEqual(intermediaryFile.idIntermediaryFile);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForIntermediaryFileID', async () => {
        let SO: SystemObject | null = null;
        if (intermediaryFile) {
            SO = await DBAPI.fetchSystemObjectForIntermediaryFileID(prisma, intermediaryFile.idIntermediaryFile);
            if (SO)
                expect(SO.idIntermediaryFile).toEqual(intermediaryFile.idIntermediaryFile);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndIntermediaryFile', async () => {
        let SO: SystemObject & { IntermediaryFile: IntermediaryFile | null} | null = null;
        if (intermediaryFile) {
            SO = await DBAPI.fetchSystemObjectAndIntermediaryFile(prisma, intermediaryFile.idIntermediaryFile);
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

    test('DB Fetch SystemObject: fetchSystemObjectForItem', async () => {
        let SO: SystemObject | null = null;
        if (item) {
            SO = await DBAPI.fetchSystemObjectForItem(prisma, item);
            if (SO)
                expect(SO.idItem).toEqual(item.idItem);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForItemID', async () => {
        let SO: SystemObject | null = null;
        if (item) {
            SO = await DBAPI.fetchSystemObjectForItemID(prisma, item.idItem);
            if (SO)
                expect(SO.idItem).toEqual(item.idItem);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndItem', async () => {
        let SO: SystemObject & { Item: Item | null} | null = null;
        if (item) {
            SO = await DBAPI.fetchSystemObjectAndItem(prisma, item.idItem);
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

    test('DB Fetch SystemObject: fetchSystemObjectForModel', async () => {
        let SO: SystemObject | null = null;
        if (model) {
            SO = await DBAPI.fetchSystemObjectForModel(prisma, model);
            if (SO)
                expect(SO.idModel).toEqual(model.idModel);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForModelID', async () => {
        let SO: SystemObject | null = null;
        if (model) {
            SO = await DBAPI.fetchSystemObjectForModelID(prisma, model.idModel);
            if (SO)
                expect(SO.idModel).toEqual(model.idModel);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndModel', async () => {
        let SO: SystemObject & { Model: Model | null} | null = null;
        if (model) {
            SO = await DBAPI.fetchSystemObjectAndModel(prisma, model.idModel);
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

    test('DB Fetch SystemObject: fetchSystemObjectForProject', async () => {
        let SO: SystemObject | null = null;
        if (project) {
            SO = await DBAPI.fetchSystemObjectForProject(prisma, project);
            if (SO)
                expect(SO.idProject).toEqual(project.idProject);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForProjectID', async () => {
        let SO: SystemObject | null = null;
        if (project) {
            SO = await DBAPI.fetchSystemObjectForProjectID(prisma, project.idProject);
            if (SO)
                expect(SO.idProject).toEqual(project.idProject);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndProject', async () => {
        let SO: SystemObject & { Project: Project | null} | null = null;
        if (project) {
            SO = await DBAPI.fetchSystemObjectAndProject(prisma, project.idProject);
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

    test('DB Fetch SystemObject: fetchSystemObjectForProjectDocumentation', async () => {
        let SO: SystemObject | null = null;
        if (projectDocumentation) {
            SO = await DBAPI.fetchSystemObjectForProjectDocumentation(prisma, projectDocumentation);
            if (SO)
                expect(SO.idProjectDocumentation).toEqual(projectDocumentation.idProjectDocumentation);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForProjectDocumentationID', async () => {
        let SO: SystemObject | null = null;
        if (projectDocumentation) {
            SO = await DBAPI.fetchSystemObjectForProjectDocumentationID(prisma, projectDocumentation.idProjectDocumentation);
            if (SO)
                expect(SO.idProjectDocumentation).toEqual(projectDocumentation.idProjectDocumentation);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndProjectDocumentation', async () => {
        let SO: SystemObject & { ProjectDocumentation: ProjectDocumentation | null} | null = null;
        if (projectDocumentation) {
            SO = await DBAPI.fetchSystemObjectAndProjectDocumentation(prisma, projectDocumentation.idProjectDocumentation);
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

    test('DB Fetch SystemObject: fetchSystemObjectForScene', async () => {
        let SO: SystemObject | null = null;
        if (scene) {
            SO = await DBAPI.fetchSystemObjectForScene(prisma, scene);
            if (SO)
                expect(SO.idScene).toEqual(scene.idScene);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForSceneID', async () => {
        let SO: SystemObject | null = null;
        if (scene) {
            SO = await DBAPI.fetchSystemObjectForSceneID(prisma, scene.idScene);
            if (SO)
                expect(SO.idScene).toEqual(scene.idScene);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndScene', async () => {
        let SO: SystemObject & { Scene: Scene | null} | null = null;
        if (scene) {
            SO = await DBAPI.fetchSystemObjectAndScene(prisma, scene.idScene);
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

    test('DB Fetch SystemObject: fetchSystemObjectForStakeholder', async () => {
        let SO: SystemObject | null = null;
        if (stakeholder) {
            SO = await DBAPI.fetchSystemObjectForStakeholder(prisma, stakeholder);
            if (SO)
                expect(SO.idStakeholder).toEqual(stakeholder.idStakeholder);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForStakeholderID', async () => {
        let SO: SystemObject | null = null;
        if (stakeholder) {
            SO = await DBAPI.fetchSystemObjectForStakeholderID(prisma, stakeholder.idStakeholder);
            if (SO)
                expect(SO.idStakeholder).toEqual(stakeholder.idStakeholder);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndStakeholder', async () => {
        let SO: SystemObject & { Stakeholder: Stakeholder | null} | null = null;
        if (stakeholder) {
            SO = await DBAPI.fetchSystemObjectAndStakeholder(prisma, stakeholder.idStakeholder);
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

    test('DB Fetch SystemObject: fetchSystemObjectForSubject', async () => {
        let SO: SystemObject | null = null;
        if (subject) {
            SO = await DBAPI.fetchSystemObjectForSubject(prisma, subject);
            if (SO)
                expect(SO.idSubject).toEqual(subject.idSubject);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForSubjectID', async () => {
        let SO: SystemObject | null = null;
        if (subject) {
            SO = await DBAPI.fetchSystemObjectForSubjectID(prisma, subject.idSubject);
            if (SO)
                expect(SO.idSubject).toEqual(subject.idSubject);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndSubject', async () => {
        let SO: SystemObject & { Subject: Subject | null} | null = null;
        if (subject) {
            SO = await DBAPI.fetchSystemObjectAndSubject(prisma, subject.idSubject);
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

    test('DB Fetch SystemObject: fetchSystemObjectForUnit', async () => {
        let SO: SystemObject | null = null;
        if (unit) {
            SO = await DBAPI.fetchSystemObjectForUnit(prisma, unit);
            if (SO)
                expect(SO.idUnit).toEqual(unit.idUnit);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForUnitID', async () => {
        let SO: SystemObject | null = null;
        if (unit) {
            SO = await DBAPI.fetchSystemObjectForUnitID(prisma, unit.idUnit);
            if (SO)
                expect(SO.idUnit).toEqual(unit.idUnit);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndUnit', async () => {
        let SO: SystemObject & { Unit: Unit | null} | null = null;
        if (unit) {
            SO = await DBAPI.fetchSystemObjectAndUnit(prisma, unit.idUnit);
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

    test('DB Fetch SystemObject: fetchSystemObjectForWorkflow', async () => {
        let SO: SystemObject | null = null;
        if (workflow) {
            SO = await DBAPI.fetchSystemObjectForWorkflow(prisma, workflow);
            if (SO)
                expect(SO.idWorkflow).toEqual(workflow.idWorkflow);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForWorkflowID', async () => {
        let SO: SystemObject | null = null;
        if (workflow) {
            SO = await DBAPI.fetchSystemObjectForWorkflowID(prisma, workflow.idWorkflow);
            if (SO)
                expect(SO.idWorkflow).toEqual(workflow.idWorkflow);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndWorkflow', async () => {
        let SO: SystemObject & { Workflow: Workflow | null} | null = null;
        if (workflow) {
            SO = await DBAPI.fetchSystemObjectAndWorkflow(prisma, workflow.idWorkflow);
            if (SO) {
                expect(SO.idWorkflow).toEqual(workflow.idWorkflow);
                expect(SO.Workflow).toBeTruthy();
                if (SO.Workflow) {
                    expect(SO.Workflow).toMatchObject(workflow);
                    expect(workflow).toMatchObject(SO.Workflow);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForWorkflowStep', async () => {
        let SO: SystemObject | null = null;
        if (workflowStep) {
            SO = await DBAPI.fetchSystemObjectForWorkflowStep(prisma, workflowStep);
            if (SO)
                expect(SO.idWorkflowStep).toEqual(workflowStep.idWorkflowStep);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectForWorkflowStepID', async () => {
        let SO: SystemObject | null = null;
        if (workflowStep) {
            SO = await DBAPI.fetchSystemObjectForWorkflowStepID(prisma, workflowStep.idWorkflowStep);
            if (SO)
                expect(SO.idWorkflowStep).toEqual(workflowStep.idWorkflowStep);
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObjectAndWorkflowStep', async () => {
        let SO: SystemObject & { WorkflowStep: WorkflowStep | null} | null = null;
        if (workflowStep) {
            SO = await DBAPI.fetchSystemObjectAndWorkflowStep(prisma, workflowStep.idWorkflowStep);
            if (SO) {
                expect(SO.idWorkflowStep).toEqual(workflowStep.idWorkflowStep);
                expect(SO.WorkflowStep).toBeTruthy();
                if (SO.WorkflowStep) {
                    expect(SO.WorkflowStep).toMatchObject(workflowStep);
                    expect(workflowStep).toMatchObject(SO.WorkflowStep);
                }
            }
        }
        expect(SO).toBeTruthy();
    });
});

// *******************************************************************
// DB Fetch SystemObject Pair Test Suite
// *******************************************************************
describe('DB Fetch SystemObject Fetch Pair Test Suite', () => {
    test('DB Fetch SystemObject: fetchSystemObject with Invalid SystemObject ID', async () => {
        const SYOP: DBAPI.SystemObjectAndPairs | null = await DBAPI.fetchSystemObject(prisma, -1);
        expect(SYOP).toBeNull();
    });

    let SOActor: SystemObject | null = null;
    let SOAsset: SystemObject | null = null;
    let SOAssetVersion: SystemObject | null = null;
    let SOCaptureData: SystemObject | null = null;
    let SOIntermediaryFile: SystemObject | null = null;
    let SOItem: SystemObject | null = null;
    let SOModel: SystemObject | null = null;
    let SOProject: SystemObject | null = null;
    let SOProjectDocumentation: SystemObject | null = null;
    let SOScene: SystemObject | null = null;
    let SOStakeholder: SystemObject | null = null;
    let SOSubject: SystemObject | null = null;
    let SOUnit: SystemObject | null = null;
    let SOWorkflow: SystemObject | null = null;
    let SOWorkflowStep: SystemObject | null = null;

    test('DB Fetch SystemObject: fetchSystemObjectFor * setup', async() => {
        SOActor = actorWithUnit ? await DBAPI.fetchSystemObjectForActor(prisma, actorWithUnit) : null;
        SOAsset = assetThumbnail ? await DBAPI.fetchSystemObjectForAsset(prisma, assetThumbnail) : null;
        SOAssetVersion = assetVersion ? await DBAPI.fetchSystemObjectForAssetVersion(prisma, assetVersion) : null;
        SOCaptureData = captureData ? await DBAPI.fetchSystemObjectForCaptureData(prisma, captureData) : null;
        SOIntermediaryFile = intermediaryFile ? await DBAPI.fetchSystemObjectForIntermediaryFile(prisma, intermediaryFile) : null;
        SOItem = item ? await DBAPI.fetchSystemObjectForItem(prisma, item) : null;
        SOModel = model ? await DBAPI.fetchSystemObjectForModel(prisma, model) : null;
        SOProject = project ? await DBAPI.fetchSystemObjectForProject(prisma, project) : null;
        SOProjectDocumentation = projectDocumentation ? await DBAPI.fetchSystemObjectForProjectDocumentation(prisma, projectDocumentation) : null;
        SOScene = scene ? await DBAPI.fetchSystemObjectForScene(prisma, scene) : null;
        SOStakeholder = stakeholder ? await DBAPI.fetchSystemObjectForStakeholder(prisma, stakeholder) : null;
        SOSubject = subject ? await DBAPI.fetchSystemObjectForSubject(prisma, subject) : null;
        SOUnit = unit ? await DBAPI.fetchSystemObjectForUnit(prisma, unit) : null;
        SOWorkflow = workflow ? await DBAPI.fetchSystemObjectForWorkflow(prisma, workflow) : null;
        SOWorkflowStep = workflowStep ? await DBAPI.fetchSystemObjectForWorkflowStep(prisma, workflowStep) : null;

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
        expect(SOWorkflow).toBeTruthy();
        expect(SOWorkflowStep).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Actor', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOActor && actorWithUnit) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOActor.idSystemObject);
            if (SYOP) {
                expect(SYOP.Actor).toBeTruthy();
                expect(SYOP.Actor).toMatchObject(actorWithUnit);
                if (SYOP.Actor)
                    expect(actorWithUnit).toMatchObject(SYOP.Actor);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Asset', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOAsset && assetThumbnail) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOAsset.idSystemObject);
            if (SYOP) {
                expect(SYOP.Asset).toBeTruthy();
                expect(SYOP.Asset).toMatchObject(assetThumbnail);
                if (SYOP.Asset)
                    expect(assetThumbnail).toMatchObject(SYOP.Asset);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for AssetVersion', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOAssetVersion && assetVersion) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOAssetVersion.idSystemObject);
            if (SYOP) {
                expect(SYOP.AssetVersion).toBeTruthy();
                expect(SYOP.AssetVersion).toMatchObject(assetVersion);
                if (SYOP.AssetVersion)
                    expect(assetVersion).toMatchObject(SYOP.AssetVersion);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for CaptureData', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOCaptureData && captureData) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOCaptureData.idSystemObject);
            if (SYOP) {
                expect(SYOP.CaptureData).toBeTruthy();
                expect(SYOP.CaptureData).toMatchObject(captureData);
                if (SYOP.CaptureData)
                    expect(captureData).toMatchObject(SYOP.CaptureData);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for IntermediaryFile', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOIntermediaryFile && intermediaryFile) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOIntermediaryFile.idSystemObject);
            if (SYOP) {
                expect(SYOP.IntermediaryFile).toBeTruthy();
                expect(SYOP.IntermediaryFile).toMatchObject(intermediaryFile);
                if (SYOP.IntermediaryFile)
                    expect(intermediaryFile).toMatchObject(SYOP.IntermediaryFile);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Item', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOItem && item) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOItem.idSystemObject);
            if (SYOP) {
                expect(SYOP.Item).toBeTruthy();
                expect(SYOP.Item).toMatchObject(item);
                if (SYOP.Item)
                    expect(item).toMatchObject(SYOP.Item);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Model', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOModel && model) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOModel.idSystemObject);
            if (SYOP) {
                expect(SYOP.Model).toBeTruthy();
                expect(SYOP.Model).toMatchObject(model);
                if (SYOP.Model)
                    expect(model).toMatchObject(SYOP.Model);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Project', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOProject && project) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOProject.idSystemObject);
            if (SYOP) {
                expect(SYOP.Project).toBeTruthy();
                expect(SYOP.Project).toMatchObject(project);
                if (SYOP.Project)
                    expect(project).toMatchObject(SYOP.Project);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for ProjectDocumentation', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOProjectDocumentation && projectDocumentation) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOProjectDocumentation.idSystemObject);
            if (SYOP) {
                expect(SYOP.ProjectDocumentation).toBeTruthy();
                expect(SYOP.ProjectDocumentation).toMatchObject(projectDocumentation);
                if (SYOP.ProjectDocumentation)
                    expect(projectDocumentation).toMatchObject(SYOP.ProjectDocumentation);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Scene', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOScene && scene) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOScene.idSystemObject);
            if (SYOP) {
                expect(SYOP.Scene).toBeTruthy();
                expect(SYOP.Scene).toMatchObject(scene);
                if (SYOP.Scene)
                    expect(scene).toMatchObject(SYOP.Scene);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Stakeholder', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOStakeholder && stakeholder) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOStakeholder.idSystemObject);
            if (SYOP) {
                expect(SYOP.Stakeholder).toBeTruthy();
                expect(SYOP.Stakeholder).toMatchObject(stakeholder);
                if (SYOP.Stakeholder)
                    expect(stakeholder).toMatchObject(SYOP.Stakeholder);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Subject', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOSubject && subject) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOSubject.idSystemObject);
            if (SYOP) {
                expect(SYOP.Subject).toBeTruthy();
                expect(SYOP.Subject).toMatchObject(subject);
                if (SYOP.Subject)
                    expect(subject).toMatchObject(SYOP.Subject);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Unit', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOUnit && unit) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOUnit.idSystemObject);
            if (SYOP) {
                expect(SYOP.Unit).toBeTruthy();
                expect(SYOP.Unit).toMatchObject(unit);
                if (SYOP.Unit)
                    expect(unit).toMatchObject(SYOP.Unit);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for Workflow', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOWorkflow && workflow) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOWorkflow.idSystemObject);
            if (SYOP) {
                expect(SYOP.Workflow).toBeTruthy();
                expect(SYOP.Workflow).toMatchObject(workflow);
                if (SYOP.Workflow)
                    expect(workflow).toMatchObject(SYOP.Workflow);
            }
        }
        expect(SYOP).toBeTruthy();
    });

    test('DB Fetch SystemObject: fetchSystemObject for WorkflowStep', async () => {
        let SYOP: DBAPI.SystemObjectAndPairs | null = null;

        if (SOWorkflowStep && workflowStep) {
            SYOP = await DBAPI.fetchSystemObject(prisma, SOWorkflowStep.idSystemObject);
            if (SYOP) {
                expect(SYOP.WorkflowStep).toBeTruthy();
                expect(SYOP.WorkflowStep).toMatchObject(workflowStep);
                if (SYOP.WorkflowStep)
                    expect(workflowStep).toMatchObject(SYOP.WorkflowStep);
            }
        }
        expect(SYOP).toBeTruthy();
    });
});

describe('DB Fetch Xref Test Suite', () => {
    test('DB Fetch Xref: AccessRole.fetchFromXref', async () => {
        let AR: PAccessRole[] | null = null;
        if (accessAction && accessRole) {
            AR = await DBAPI.AccessRole.fetchFromXref(accessAction.data.idAccessAction);
            if (AR) {
                expect(AR.length).toBe(1);
                if (AR.length == 1)
                    expect(AR[0].idAccessRole).toBe(accessRole.idAccessRole);
            }
        }
        expect(AR).toBeTruthy();
    });

    test('DB Fetch Xref: AccessAction.fetchFromXref', async () => {
        let AA: PAccessAction[] | null = null;
        if (accessAction && accessAction2 && accessRole) {
            AA = await DBAPI.AccessAction.fetchFromXref(accessRole.idAccessRole);
            if (AA) {
                expect(AA.length).toBe(2);
                if (AA.length == 2)
                    expect(AA[0].idAccessAction + AA[1].idAccessAction).toBe(accessAction.data.idAccessAction + accessAction2?.data.idAccessAction);
            }
        }
        expect(AA).toBeTruthy();
    });

    test('DB Fetch Xref: fetchCaptureDataGroupFromXref', async () => {
        let CDG: CaptureDataGroup[] | null = null;
        if (captureData && captureDataGroup) {
            CDG = await DBAPI.fetchCaptureDataGroupFromXref(prisma, captureData.idCaptureData);
            if (CDG) {
                expect(CDG.length).toBe(1);
                if (CDG.length == 1)
                    expect(CDG[0].idCaptureDataGroup).toBe(captureDataGroup.idCaptureDataGroup);
            }
        }
        expect(CDG).toBeTruthy();
    });

    test('DB Fetch Xref: fetchCaptureDataFromXref', async () => {
        let CD: CaptureData[] | null = null;
        if (captureData && captureDataNulls && captureDataGroup) {
            CD = await DBAPI.fetchCaptureDataFromXref(prisma, captureDataGroup.idCaptureDataGroup);
            if (CD) {
                expect(CD.length).toBe(2);
                if (CD.length == 2) {
                    expect(CD[0].idCaptureData + CD[1].idCaptureData).toBe(captureData.idCaptureData + captureDataNulls.idCaptureData);
                }
            }
        }
        expect(CD).toBeTruthy();
    });

    test('DB Fetch Xref: fetchModelFromXref', async () => {
        let MO: Model[] | null = null;
        if (scene && model) {
            MO = await DBAPI.fetchModelFromXref(prisma, scene.idScene);
            if (MO) {
                expect(MO.length).toBe(1);
                if (MO.length == 1)
                    expect(MO[0].idModel).toBe(model.idModel);
            }
        }
        expect(MO).toBeTruthy();
    });

    test('DB Fetch Xref: fetchSceneFromXref', async () => {
        let SC: Scene[] | null = null;
        if (scene && sceneNulls && model) {
            SC = await DBAPI.fetchSceneFromXref(prisma, model.idModel);
            if (SC) {
                expect(SC.length).toBe(2);
                if (SC.length == 2)
                    expect(SC[0].idScene + SC[1].idScene).toBe(scene.idScene + sceneNulls.idScene);
            }
        }
        expect(SC).toBeTruthy();
    });

    test('DB Fetch Xref: fetchWorkflowStepFromXref', async () => {
        let WFS: WorkflowStep[] | null = null;
        if (systemObjectScene && workflowStep) {
            WFS = await DBAPI.fetchWorkflowStepFromXref(prisma, systemObjectScene.idSystemObject);
            if (WFS) {
                expect(WFS.length).toBe(1);
                if (WFS.length == 1)
                    expect(WFS[0].idWorkflowStep).toBe(workflowStep.idWorkflowStep);
            }
        }
        expect(WFS).toBeTruthy();
    });

    test('DB Fetch Xref: fetchSystemObjectFromXref', async () => {
        let SO: SystemObject[] | null = null;
        if (workflowStep && systemObjectScene && systemObjectSubject) {
            SO = await DBAPI.fetchSystemObjectFromXref(prisma, workflowStep.idWorkflowStep);
            if (SO) {
                expect(SO.length).toBe(2);
                if (SO.length == 2)
                    expect(SO[0].idSystemObject + SO[1].idSystemObject).toBe(systemObjectScene.idSystemObject + systemObjectSubject.idSystemObject);
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Xref: fetchMasterSystemObjectFromXref', async () => {
        let SO: SystemObject[] | null = null;
        if (systemObjectSubject && systemObjectScene) {
            SO = await DBAPI.fetchMasterSystemObjectFromXref(prisma, systemObjectScene.idSystemObject);
            if (SO) {
                expect(SO.length).toBe(1);
                if (SO.length == 1)
                    expect(SO[0].idSystemObject).toBe(systemObjectSubject.idSystemObject);
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Xref: fetchDerivedSystemObjectFromXref', async () => {
        let SO: SystemObject[] | null = null;
        if (systemObjectAsset && systemObjectScene && systemObjectSubject) {
            SO = await DBAPI.fetchDerivedSystemObjectFromXref(prisma, systemObjectSubject.idSystemObject);
            if (SO) {
                expect(SO.length).toBe(2);
                if (SO.length == 2)
                    expect(SO[0].idSystemObject + SO[1].idSystemObject).toBe(systemObjectScene.idSystemObject + systemObjectAsset.idSystemObject);
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Xref: fetchMasterSystemObjectAndPairFromXref', async () => {
        let SO: DBAPI.SystemObjectAndPairs[] | null = null;
        if (systemObjectSubject && systemObjectScene) {
            SO = await DBAPI.fetchMasterSystemObjectAndPairFromXref(prisma, systemObjectScene.idSystemObject);
            if (SO) {
                expect(SO.length).toBe(1);
                if (SO.length == 1) {
                    expect(SO[0].Subject).toBeTruthy();
                    if (SO[0].Subject)
                        expect(SO[0].Subject.idSubject).toBe(systemObjectSubject.idSubject);
                }
            }
        }
        expect(SO).toBeTruthy();
    });

    test('DB Fetch Xref: fetchDerivedSystemObjectAndPairFromXref', async () => {
        let SO: DBAPI.SystemObjectAndPairs[] | null = null;
        if (systemObjectAsset && systemObjectScene && systemObjectSubject) {
            SO = await DBAPI.fetchDerivedSystemObjectAndPairFromXref(prisma, systemObjectSubject.idSystemObject);
            if (SO) {
                expect(SO.length).toBe(2);
                if (SO.length == 2) {
                    expect((SO[0].Scene && SO[1].Asset) || (SO[1].Scene && SO[0].Asset)).toBeTruthy();
                    if (SO[0].Scene)
                        expect(SO[0].Scene.idScene).toBe(systemObjectScene.idScene);
                    if (SO[0].Asset)
                        expect(SO[0].Asset.idAsset).toBe(systemObjectAsset.idAsset);
                    if (SO[1].Scene)
                        expect(SO[1].Scene.idScene).toBe(systemObjectScene.idScene);
                    if (SO[1].Asset)
                        expect(SO[1].Asset.idAsset).toBe(systemObjectAsset.idAsset);
                }
            }
        }
        expect(SO).toBeTruthy();
    });
});