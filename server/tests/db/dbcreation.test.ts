import * as DBC from './util/dbcreation';
import * as DBF from './util/dbfetch';
import * as DBAPI from '../../db';
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
    prisma = new PrismaClient();
});

afterAll(async done => {
    await prisma.disconnect();
    done();
});

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

describe('DB Creation Test Suite', () => {
    test('DB Creation: AssetGroup', async () => {
        assetGroup = await DBC.testCreateAssetGroup(prisma);
        expect(assetGroup.idAssetGroup).toBeGreaterThan(0);
    });

    test('DB Creation: Asset', async () => {
        assetThumbnail = await DBC.testCreateAsset(prisma, 'Test Asset Thumbnail', '/test/asset/path', assetGroup);
        expect(assetThumbnail.idAsset).toBeGreaterThan(0);
    });

    test('DB Creation: GeoLocation', async () => {
        geoLocation = await DBC.testCreateGeoLocation(prisma, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        expect(geoLocation.idGeoLocation).toBeGreaterThan(0);
    });

    test('DB Creation: Unit', async () => {
        unit = await DBC.testCreateUnit(prisma, 'DPO', 'DPO', 'http://abbadabbadoo/');
        expect(unit.idUnit).toBeGreaterThan(0);
    });

    test('DB Creation: User', async () => {
        user = await DBC.testCreateUser(prisma, 'Test User', 'test@si.edu', 'SECURITY_ID', 1, new Date(), null, new Date(), 0);
        expect(user.idUser).toBeGreaterThan(0);
    });

    test('DB Creation: Subject', async () => {
        subject = await DBC.testCreateSubject(prisma, unit, assetThumbnail, geoLocation, 'Test Subject');
        expect(subject.idSubject).toBeGreaterThan(0);
    });

    test('DB Creation: VocabularySet', async () => {
        vocabularySet = await DBC.testCreateVocabularySet(prisma, 'Test Vocabulary Set', 0);
        expect(vocabularySet.idVocabularySet).toBeGreaterThan(0);
    });

    test('DB Creation: Vocabulary', async () => {
        vocabulary = await DBC.testCreateVocabulary(prisma, vocabularySet, 0);
        expect(vocabulary.idVocabulary).toBeGreaterThan(0);
    });

    test('DB Creation: WorkflowTemplate', async () => {
        workflowTemplate = await DBC.testCreateWorkflowTemplate(prisma, 'Test Workflow Template');
        expect(workflowTemplate.idWorkflowTemplate).toBeGreaterThan(0);
    });

    test('DB Creation: Scene', async () => {
        scene = await DBC.testCreateScene(prisma, 'Test Scene', assetThumbnail, 1, 1);
        expect(scene.idScene).toBeGreaterThan(0);
    });

    test('DB Creation: Fetch System Object Subject', async() => {
        systemObjectSubject = await DBF.testFetchSystemObjectSubject(prisma, subject);
        expect(systemObjectSubject).not.toBeNull();
        expect(systemObjectSubject ? systemObjectSubject.idSubject : -1).toBe(subject.idSubject);
    });

    test('DB Creation: Fetch System Object Scene', async() => {
        systemObjectScene = await DBF.testFetchSystemObjectScene(prisma, scene);
        expect(systemObjectScene).not.toBeNull();
        expect(systemObjectScene ? systemObjectScene.idScene : -1).toBe(scene.idScene);
    });

    // *************************************************************************
    // Makes use of objects created above
    // *************************************************************************
    // AccessAction, AccessContext, AccessContextObject, AccessPolicy, AccessRole, AccessRoleAccessActionXref,
    // DBC.testCreateAccessAction, DBC.testCreateAccessContext, DBC.testCreateAccessContextObject, DBC.testCreateAccessPolicy, DBC.testCreateAccessRole, DBC.testCreateAccessRoleDBC.testCreateAccessActionXref,
    test('DB Creation: AccessAction', async () => {
        accessAction = await DBC.testCreateAccessAction(prisma, 'Test AccessAction', 0);
        expect(accessAction.idAccessAction).toBeGreaterThan(0);
    });

    test('DB Creation: AccessContext', async () => {
        accessContext = await DBC.testCreateAccessContext(prisma, 0, 0, 0, 0, 0, 0);
        expect(accessContext.idAccessContext).toBeGreaterThan(0);
    });

    test('DB Creation: AccessRole', async () => {
        accessRole = await DBC.testCreateAccessRole(prisma, 'Test AccessRole');
        expect(accessRole.idAccessRole).toBeGreaterThan(0);
    });

    test('DB Creation: AccessPolicy', async () => {
        accessPolicy = await DBC.testCreateAccessPolicy(prisma, user, accessRole, accessContext);
        expect(accessPolicy.idAccessPolicy).toBeGreaterThan(0);
    });

    test('DB Creation: AccessContextObject', async () => {
        if (systemObjectScene)
            accessContextObject = await DBC.testCreateAccessContextObject(prisma, accessContext, systemObjectScene);
        expect(accessContextObject.idAccessContextObject).toBeGreaterThan(0);
    });

    test('DB Creation: AccessRoleAccessActionXref', async () => {
        accessRoleAccessActionXref = await DBC.testCreateAccessRoleAccessActionXref(prisma, accessRole, accessAction);
        expect(accessRoleAccessActionXref.idAccessRoleAccessActionXref).toBeGreaterThan(0);
    });

    test('DB Creation: Actor With Unit', async () => {
        actorWithUnit = await DBC.testCreateActor(prisma, 'Test Actor Name', 'Test Actor Org', unit);
        expect(actorWithUnit.idActor).toBeGreaterThan(0);
    });

    test('DB Creation: Actor Without Unit', async () => {
        actorWithOutUnit = await DBC.testCreateActor(prisma, 'Test Actor Name', 'Test Actor Org', null);
        expect(actorWithOutUnit.idActor).toBeGreaterThan(0);
    });

    test('DB Creation: Asset Without Asset Group', async () => {
        assetWithoutAG = await DBC.testCreateAsset(prisma, 'Test Asset 2', '/test/asset/path2', null);
        expect(assetWithoutAG.idAsset).toBeGreaterThan(0);
    });

    test('DB Creation: AssetVersion', async () => {
        assetVersion = await DBC.testCreateAssetVersion(prisma, assetThumbnail, user, new Date(), '/test/asset/path', 'Asset Checksum', 50);
        expect(assetVersion.idAsset).toBeGreaterThan(0);
    });

    test('DB Creation: CaptureData', async () => {
        captureData = await DBC.testCreateCaptureData(prisma, vocabulary, vocabulary, new Date(),
            'Test Capture Data', 0, vocabulary, 0, 0, vocabulary, vocabulary, vocabulary, vocabulary, 0, 0, assetThumbnail);
        expect(captureData.idCaptureData).toBeGreaterThan(0);
    });

    test('DB Creation: CaptureData With Nulls', async () => {
        captureDataNulls = await DBC.testCreateCaptureData(prisma, vocabulary, vocabulary, new Date(),
            'Test Capture Data Nulls', 0, null, 0, 0, null, null, null, null, 0, 0, null);
        expect(captureDataNulls.idCaptureData).toBeGreaterThan(0);
    });

    test('DB Creation: CaptureDataGroup', async () => {
        captureDataGroup = await DBC.testCreateCaptureDataGroup(prisma);
        expect(captureDataGroup.idCaptureDataGroup).toBeGreaterThan(0);
    });

    test('DB Creation: CaptureDataGroupCaptureDataXref', async () => {
        captureDataGroupCaptureDataXref = await DBC.testCreateCaptureDataGroupCaptureDataXref(prisma, captureDataGroup, captureData);
        expect(captureDataGroupCaptureDataXref.idCaptureDataGroupCaptureDataXref).toBeGreaterThan(0);
    });

    test('DB Creation: Identifier', async () => {
        identifier = await DBC.testCreateIdentifier(prisma, 'Test Identifier', vocabulary, systemObjectSubject);
        expect(identifier.idIdentifier).toBeGreaterThan(0);
    });

    test('DB Creation: Identifier With Nulls', async () => {
        identifierNull = await DBC.testCreateIdentifier(prisma, 'Test Identifier', vocabulary, null);
        expect(identifierNull.idIdentifier).toBeGreaterThan(0);
    });

    test('DB Creation: IntermediaryFile', async () => {
        intermediaryFile = await DBC.testCreateIntermediaryFile(prisma, assetThumbnail, new Date());
        expect(intermediaryFile.idIntermediaryFile).toBeGreaterThan(0);
    });

    test('DB Creation: Item', async () => {
        item = await DBC.testCreateItem(prisma, subject, assetThumbnail, geoLocation, 'Test Item', 1);
        expect(item.idItem).toBeGreaterThan(0);
    });

    test('DB Creation: Item With Nulls', async () => {
        itemNulls = await DBC.testCreateItem(prisma, subject, null, null, 'Test Item Nulls', 1);
        expect(itemNulls.idItem).toBeGreaterThan(0);
    });

    test('DB Creation: Metadata', async () => {
        metadata = await DBC.testCreateMetadata(prisma, 'Test Metadata', 'Test Value Short', 'Test Value Ext', assetThumbnail, user, vocabulary, systemObjectScene);
        expect(metadata.idMetadata).toBeGreaterThan(0);
    });

    test('DB Creation: Metadata With Nulls', async () => {
        metadataNull = await DBC.testCreateMetadata(prisma, 'Test Metadata', null, null, null, null, null, null);
        expect(metadataNull.idMetadata).toBeGreaterThan(0);
    });

    test('DB Creation: Model', async () => {
        model = await DBC.testCreateModel(prisma, new Date(), vocabulary, 1, 1, vocabulary, vocabulary, vocabulary, assetThumbnail);
        expect(model.idModel).toBeGreaterThan(0);
    });

    test('DB Creation: Model With Nulls', async () => {
        modelNulls = await DBC.testCreateModel(prisma, new Date(), vocabulary, 1, 1, vocabulary, vocabulary, vocabulary, null);
        expect(modelNulls.idModel).toBeGreaterThan(0);
    });

    test('DB Creation: ModelGeometryFile', async () => {
        modelGeometryFile = await DBC.testCreateModelGeometryFile(prisma, model, assetThumbnail, vocabulary, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        expect(modelGeometryFile.idModelGeometryFile).toBeGreaterThan(0);
    });

    test('DB Creation: ModelGeometryFile With Nulls', async () => {
        modelGeometryFileNulls = await DBC.testCreateModelGeometryFile(prisma, model, assetThumbnail, vocabulary, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null);
        expect(modelGeometryFileNulls.idModelGeometryFile).toBeGreaterThan(0);
    });

    test('DB Creation: ModelProcessingAction', async () => {
        modelProcessingAction = await DBC.testCreateModelProcessingAction(prisma, model, actorWithUnit, new Date(),
            'Test Model Processing Action', 'Test Model Processing Action Description');
        expect(modelProcessingAction.idModelProcessingAction).toBeGreaterThan(0);
    });

    test('DB Creation: ModelProcessingActionStep', async () => {
        modelProcessingActionStep = await DBC.testCreateModelProcessingActionStep(prisma, modelProcessingAction, vocabulary,
            'Test Model Processing Action Step');
        expect(modelProcessingActionStep.idModelProcessingActionStep).toBeGreaterThan(0);
    });

    test('DB Creation: ModelSceneXref', async () => {
        modelSceneXref = await DBC.testCreateModelSceneXref(prisma, model, scene, 0, 0, 0, 0, 0, 0, 0);
        expect(modelSceneXref.idModelSceneXref).toBeGreaterThan(0);
    });

    test('DB Creation: ModelSceneXref With Nulls', async () => {
        modelSceneXrefNull = await DBC.testCreateModelSceneXref(prisma, model, scene, null, null, null, null, null, null, null);
        expect(modelSceneXrefNull.idModelSceneXref).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectVersion', async () => {
        if (systemObjectScene)
            systemObjectVersion = await DBC.testCreateSystemObjectVersion(prisma, systemObjectScene, 0);
        expect(systemObjectVersion.idSystemObjectVersion).toBeGreaterThan(0);
    });

    test('DB Creation: SystemObjectXref', async () => {
        if (systemObjectSubject && systemObjectScene)
            systemObjectXref = await DBC.testCreateSystemObjectXref(prisma, systemObjectSubject, systemObjectScene);
        expect(systemObjectXref.idSystemObjectXref).toBeGreaterThan(0);
    });

    test('DB Creation: ModelUVMapFile', async () => {
        modelUVMapFile = await DBC.testCreateModelUVMapFile(prisma, modelGeometryFile, assetThumbnail, 0);
        expect(modelUVMapFile.idModelUVMapFile).toBeGreaterThan(0);
    });

    test('DB Creation: ModelUVMapChannel', async () => {
        modelUVMapChannel = await DBC.testCreateModelUVMapChannel(prisma, modelUVMapFile, 0, 1, vocabulary);
        expect(modelUVMapChannel.idModelUVMapChannel).toBeGreaterThan(0);
    });

    test('DB Creation: License', async () => {
        license = await DBC.testCreateLicense(prisma, 'Test License', 'Test License Description');
        expect(license.idLicense).toBeGreaterThan(0);
    });

    test('DB Creation: LicenseAssignment', async () => {
        licenseAssignment = await DBC.testCreateLicenseAssignment(prisma, license, user, new Date(), new Date(), systemObjectSubject);
        expect(licenseAssignment.idLicenseAssignment).toBeGreaterThan(0);
    });

    test('DB Creation: LicenseAssignment With Nulls', async () => {
        licenseAssignmentNull = await DBC.testCreateLicenseAssignment(prisma, license, null, null, null, null);
        expect(licenseAssignmentNull.idLicenseAssignment).toBeGreaterThan(0);
    });

    test('DB Creation: Project', async () => {
        project = await DBC.testCreateProject(prisma, 'Test Project', 'Test');
        expect(project.idProject).toBeGreaterThan(0);
    });

    test('DB Creation: ProjectDocumentation', async () => {
        projectDocumentation = await DBC.testCreateProjectDocumentation(prisma, project, 'Test Project Documentation', 'Test Description');
        expect(projectDocumentation.idProjectDocumentation).toBeGreaterThan(0);
    });

    test('DB Creation: Scene With Nulls', async () => {
        sceneNulls = await DBC.testCreateScene(prisma, 'Test Scene', null, 1, 1);
        expect(sceneNulls.idScene).toBeGreaterThan(0);
    });

    test('DB Creation: Subject With Nulls', async () => {
        subjectNulls = await DBC.testCreateSubject(prisma, unit, null, null, 'Test Subject Nulls');
        expect(subjectNulls.idSubject).toBeGreaterThan(0);
    });

    test('DB Creation: Stakeholder', async () => {
        stakeholder = await DBC.testCreateStakeholder(prisma, 'Test Stakeholder Name', 'Test Stakeholder Org', 'Test Email', 'Test Phone Mobile', 'Test Phone Office', 'Test Mailing');
        expect(stakeholder.idStakeholder).toBeGreaterThan(0);
    });

    test('DB Creation: UserPersonalizationSystemObject', async () => {
        if (systemObjectSubject)
            userPersonalizationSystemObject = await DBC.testCreateUserPersonalizationSystemObject(prisma, user, systemObjectSubject, 'Test Personalization');
        expect(userPersonalizationSystemObject.idUserPersonalizationSystemObject).toBeGreaterThan(0);
    });

    test('DB Creation: UserPersonalizationUrl', async () => {
        userPersonalizationUrl = await DBC.testCreateUserPersonalizationUrl(prisma, user, '/test/personalization/Url', 'Test Personalization');
        expect(userPersonalizationUrl.idUserPersonalizationUrl).toBeGreaterThan(0);
    });

    test('DB Creation: Workflow', async () => {
        workflow = await DBC.testCreateWorkflow(prisma, workflowTemplate, project, user, new Date(), new Date());
        expect(workflow.idWorkflow).toBeGreaterThan(0);
    });

    test('DB Creation: Workflow WIth Nulls', async () => {
        workflowNulls = await DBC.testCreateWorkflow(prisma, workflowTemplate, null, null, new Date(), new Date());
        expect(workflowNulls.idWorkflow).toBeGreaterThan(0);
    });

    test('DB Creation: WorkflowStep', async () => {
        workflowStep = await DBC.testCreateWorkflowStep(prisma, workflow, user, vocabulary, 0, new Date(), new Date());
        expect(workflowStep.idWorkflowStep).toBeGreaterThan(0);
    });

    test('DB Creation: WorkflowStepSystemObjectXref', async () => {
        if (systemObjectScene)
            workflowStepSystemObjectXref = await DBC.testCreateWorkflowStepSystemObjectXref(prisma, workflowStep, systemObjectScene, 1);
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
        systemObjectAndPairs = await DBF.testFetchSystemObject(prisma, 0);
        expect(systemObjectAndPairs).toBeNull();
    });
});