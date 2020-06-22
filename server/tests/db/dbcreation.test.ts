import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import * as path from 'path';
import { PrismaClient,
    AccessAction, AccessContext, AccessContextObject, AccessPolicy, AccessRole, AccessRoleAccessActionXref,
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
    prisma = new PrismaClient();
});

afterAll(async done => {
    await prisma.disconnect();
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
let systemObjectSubject: SystemObject | null;
let systemObjectScene: SystemObject | null;
let accessAction: AccessAction | null;
let accessContext: AccessContext | null;
let accessRole: AccessRole | null;
let accessPolicy: AccessPolicy | null;
let accessContextObject: AccessContextObject | null;
let accessRoleAccessActionXref: AccessRoleAccessActionXref | null;
let actorWithUnit: Actor | null;
let actorWithOutUnit: Actor | null;
let assetWithoutAG: Asset | null;
let assetVersion: AssetVersion | null;
let captureData: CaptureData | null;
let captureDataNulls: CaptureData | null;
let captureDataGroup: CaptureDataGroup | null;
let captureDataGroupCaptureDataXref: CaptureDataGroupCaptureDataXref | null;
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
let modelUVMapFile: ModelUVMapFile | null;
let modelUVMapChannel: ModelUVMapChannel | null;
let license: License | null;
let licenseAssignment: LicenseAssignment | null;
let licenseAssignmentNull: LicenseAssignment | null;
let project: Project | null;
let projectDocumentation: ProjectDocumentation | null;
let sceneNulls: Scene | null;
let subjectNulls: Subject | null;
let stakeholder: Stakeholder | null;
let userPersonalizationSystemObject: UserPersonalizationSystemObject | null;
let userPersonalizationUrl: UserPersonalizationUrl | null;
let workflow: Workflow | null;
let workflowNulls: Workflow | null;
let workflowStep: WorkflowStep | null;
let workflowStepSystemObjectXref: WorkflowStepSystemObjectXref | null;

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
                idAsset: 0,
                idSystemObject: 0
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
            Active: 1,
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
            SystemMaintained: 0,
            idVocabularySet: 0
        });
        expect(vocabularySet).toBeTruthy();
        if (vocabularySet)
            expect(vocabularySet.idVocabularySet).toBeGreaterThan(0);
    });

    test('DB Creation: Vocabulary', async () => {
        if (vocabularySet)
            vocabulary = await DBAPI.createVocabulary(prisma, {
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
                IsOriented: 1,
                HasBeenQCd: 1,
                idScene: 0
            });
        expect(scene).toBeTruthy();
        if (scene)
            expect(scene.idScene).toBeGreaterThan(0);
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

    // *************************************************************************
    // Makes use of objects created above
    // *************************************************************************
    test('DB Creation: AccessAction', async () => {
        accessAction = await DBAPI.createAccessAction(prisma, {
            Name: 'Test AccessAction',
            SortOrder: 0,
            idAccessAction: 0
        });
        expect(accessAction).toBeTruthy();
        if (accessAction)
            expect(accessAction.idAccessAction).toBeGreaterThan(0);
    });

    test('DB Creation: AccessContext', async () => {
        accessContext = await DBAPI.createAccessContext(prisma,
            { Global: 0, Authoritative: 0, CaptureData: 0, Model: 0, Scene: 0, IntermediaryFile: 0, idAccessContext: 0 });
        expect(accessContext).toBeTruthy();
        if (accessContext)
            expect(accessContext.idAccessContext).toBeGreaterThan(0);
    });

    test('DB Creation: AccessRole', async () => {
        accessRole = await DBAPI.createAccessRole(prisma, {
            Name: 'Test AccessRole',
            idAccessRole: 0
        });
        expect(accessRole).toBeTruthy();
        if (accessRole)
            expect(accessRole.idAccessRole).toBeGreaterThan(0);
    });

    test('DB Creation: AccessPolicy', async () => {
        if (user && accessRole && accessContext)
            accessPolicy = await DBAPI.createAccessPolicy(prisma, {
                idUser: user.idUser,
                idAccessRole: accessRole.idAccessRole,
                idAccessContext: accessContext.idAccessContext,
                idAccessPolicy: 0
            });
        expect(accessPolicy).toBeTruthy();
        if (accessPolicy)
            expect(accessPolicy.idAccessPolicy).toBeGreaterThan(0);
    });

    test('DB Creation: AccessContextObject', async () => {
        if (systemObjectScene && accessContext)
            accessContextObject = await DBAPI.createAccessContextObject(prisma, {
                idAccessContext: accessContext.idAccessContext,
                idSystemObject: systemObjectScene.idSystemObject,
                idAccessContextObject: 0
            });
        expect(accessContextObject).toBeTruthy();
        if (accessContextObject)
            expect(accessContextObject.idAccessContextObject).toBeGreaterThan(0);
    });

    test('DB Creation: AccessRoleAccessActionXref', async () => {
        if (accessRole && accessAction)
            accessRoleAccessActionXref = await DBAPI.createAccessRoleAccessActionXref(prisma, {
                idAccessRole: accessRole.idAccessRole,
                idAccessAction: accessAction.idAccessAction,
                idAccessRoleAccessActionXref: 0
            });
        expect(accessRoleAccessActionXref).toBeTruthy();
        if (accessRoleAccessActionXref)
            expect(accessRoleAccessActionXref.idAccessRoleAccessActionXref).toBeGreaterThan(0);
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
            idAsset: 0,
            idSystemObject: 0
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
                CameraSettingsUniform: 0,
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
                CameraSettingsUniform: 0,
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
                EntireSubject: 1,
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
                EntireSubject: 1,
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
                Master: 1,
                Authoritative: 1,
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
                Master: 1,
                Authoritative: 1,
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
                Roughness: 0, Metalness: 0, PointCount: 0, FaceCount: 0, IsWatertight: 0, HasNormals: 0, HasVertexColor: 0, HasUVSpace: 0,
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
        if (model && scene)
            modelSceneXrefNull = await DBAPI.createModelSceneXref(prisma, {
                idModel: model.idModel,
                idScene: scene.idScene,
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

    test('DB Creation: Scene With Nulls', async () => {
        sceneNulls = await DBAPI.createScene(prisma, {
            Name: 'Test Scene',
            idAssetThumbnail: null,
            IsOriented: 1,
            HasBeenQCd: 1,
            idScene: 0
        });
        expect(sceneNulls).toBeTruthy();
        if (sceneNulls)
            expect(sceneNulls.idScene).toBeGreaterThan(0);
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

    test('DB Creation: WorkflowStepSystemObjectXref', async () => {
        if (systemObjectScene && workflowStep)
            workflowStepSystemObjectXref = await DBAPI.createWorkflowStepSystemObjectXref(prisma, {
                idWorkflowStep: workflowStep.idWorkflowStep,
                idSystemObject: systemObjectScene.idSystemObject,
                Input: 0,
                idWorkflowStepSystemObjectXref: 0
            });
        expect(workflowStepSystemObjectXref).toBeTruthy();
        if (workflowStepSystemObjectXref)
            expect(workflowStepSystemObjectXref.idWorkflowStepSystemObjectXref).toBeGreaterThan(0);
    });
});

describe('DB Fetch Test Suite', () => {
    /*
    let assetGroup: AssetGroup;
    let assetThumbnail: Asset;
    let geoLocation: GeoLocation;
    let unit: Unit;
    let user: User;
    let subject: Subject;
    let vocabularySet: VocabularySet;
    let vocabulary: Vocabulary;
    let workflowTemplate: WorkflowTemplate;
    let scene: Scene;
    let systemObjectSubject: SystemObject | null;
    let systemObjectScene: SystemObject | null;
    let accessAction: AccessAction;
    let accessContext: AccessContext;
    let accessRole: AccessRole;
    let accessPolicy: AccessPolicy;
    let accessContextObject: AccessContextObject;
    let accessRoleAccessActionXref: AccessRoleAccessActionXref;
    let actorWithUnit: Actor;
    let actorWithOutUnit: Actor;
    let assetWithoutAG: Asset;
    let assetVersion: AssetVersion;
    let captureData: CaptureData;
    let captureDataNulls: CaptureData;
    let captureDataGroup: CaptureDataGroup;
    let captureDataGroupCaptureDataXref: CaptureDataGroupCaptureDataXref;
    let identifier: Identifier;
    let identifierNull: Identifier;
    let intermediaryFile: IntermediaryFile;
    let item: Item;
    let itemNulls: Item;
    let metadata: Metadata;
    let metadataNull: Metadata;
    let model: Model;
    let modelNulls: Model;
    let modelGeometryFile: ModelGeometryFile;
    let modelGeometryFileNulls: ModelGeometryFile;
    let modelProcessingAction: ModelProcessingAction;
    let modelProcessingActionStep: ModelProcessingActionStep;
    let modelSceneXref: ModelSceneXref;
    let modelSceneXrefNull: ModelSceneXref;
    let systemObjectVersion: SystemObjectVersion;
    let systemObjectXref: SystemObjectXref;
    let modelUVMapFile: ModelUVMapFile;
    let modelUVMapChannel: ModelUVMapChannel;
    let license: License;
    let licenseAssignment: LicenseAssignment;
    let licenseAssignmentNull: LicenseAssignment;
    let project: Project;
    let projectDocumentation: ProjectDocumentation;
    let sceneNulls: Scene;
    let subjectNulls: Subject;
    let stakeholder: Stakeholder;
    let userPersonalizationSystemObject: UserPersonalizationSystemObject;
    let userPersonalizationUrl: UserPersonalizationUrl;
    let workflow: Workflow;
    let workflowNulls: Workflow;
    let workflowStep: WorkflowStep;
    let workflowStepSystemObjectXref: WorkflowStepSystemObjectXref;
    */
    let systemObjectAndPairs: DBAPI.SystemObjectAndPairs | null;
    test('DB Fetch: Invalid SystemObject ID', async () => {
        systemObjectAndPairs = await DBAPI.fetchSystemObject(prisma, 0);
        expect(systemObjectAndPairs).toBeNull();
    });
});