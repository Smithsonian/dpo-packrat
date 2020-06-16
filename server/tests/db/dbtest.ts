/* eslint-disable no-multi-spaces */
import { TestResult } from '..';
import * as DBAPI from '../../db/api';
import { PrismaClient, Actor, Asset, AssetGroup, AssetVersion, CaptureData, GeoLocation,
    IntermediaryFile, Item, Model, Project, ProjectDocumentation, Scene, Stakeholder,
    Subject, Unit, User, Vocabulary, VocabularySet, Workflow, WorkflowStep, WorkflowTemplate } from '@prisma/client';

export async function testCreate(prisma: PrismaClient): Promise<TestResult> {
    const TR: TestResult                                = { Success: true, Message: '' };
    // objects needed for subsequent object creation:
    TR.Message += '********************************************<br/>';
    TR.Message += 'Creating objects needed for subsequent object creation:<br/>';
    TR.Message += '********************************************<br/>';
    const assetGroup: AssetGroup                        = await testCreateAssetGroup(prisma, TR);
    const assetThumbnail: Asset                         = await testCreateAsset(prisma, TR, 'Test Asset Thumbnail', '/test/asset/path', assetGroup);
    const geoLocation: GeoLocation                      = await testCreateGeoLocation(prisma, TR, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const unit: Unit                                    = await testCreateUnit(prisma, TR, 'DPO', 'DPO', 'http://abbadabbadoo/');
    const user: User                                    = await testCreateUser(prisma, TR, 'Test User', 'test@si.edu', 'SECURITY_ID', 1, new Date(), null, new Date(), 0);
    const subject: Subject                              = await testCreateSubject(prisma, TR, unit, assetThumbnail, geoLocation, 'Test Subject');
    const vocabularySet: VocabularySet                  = await testCreateVocabularySet(prisma, TR, 'Test Vocabulary Set', 0);
    const vocabulary: Vocabulary                        = await testCreateVocabulary(prisma, TR, vocabularySet, 0);
    const workflowTemplate: WorkflowTemplate            = await testCreateWorkflowTemplate(prisma, TR, 'Test Workflow Template');

    TR.Message += '<br/>';
    TR.Message += '********************************************<br/>';
    TR.Message += 'Creating additional objects:<br/>';
    TR.Message += '********************************************<br/>';
    const actorWithUnit: Actor                          = await testCreateActor(prisma, TR, 'Test Actor Name', 'Test Actor Org', unit);
    const actorWithOutUnit: Actor                       = await testCreateActor(prisma, TR, 'Test Actor Name', 'Test Actor Org', null);
    const assetWithoutAG: Asset                         = await testCreateAsset(prisma, TR, 'Test Asset 2', '/test/asset/path2', null);
    const assetVersion: AssetVersion                    = await testCreateAssetVersion(prisma, TR, assetThumbnail, user, new Date(), '/test/asset/path', 'Asset Checksum', 50);
    const captureData: CaptureData                      = await testCreateCaptureData(prisma, TR, vocabulary, vocabulary, new Date(),
        'Test Capture Data', 0, vocabulary, 0, 0, vocabulary, vocabulary, vocabulary, vocabulary, 0, 0, assetThumbnail);
    const captureDataNulls: CaptureData                 = await testCreateCaptureData(prisma, TR, vocabulary, vocabulary, new Date(),
        'Test Capture Data Nulls', 0, null, 0, 0, null, null, null, null, 0, 0, null);
    const intermediaryFile: IntermediaryFile            = await testCreateIntermediaryFile(prisma, TR, assetThumbnail, new Date());
    const item: Item                                    = await testCreateItem(prisma, TR, subject, assetThumbnail, geoLocation, 'Test Item', 1);
    const itemNulls: Item                               = await testCreateItem(prisma, TR, subject, null, null, 'Test Item Nulls', 1);
    const model: Model                                  = await testCreateModel(prisma, TR, new Date(), vocabulary, 1, 1, vocabulary, vocabulary, vocabulary, assetThumbnail);
    const modelNulls: Model                             = await testCreateModel(prisma, TR, new Date(), vocabulary, 1, 1, vocabulary, vocabulary, vocabulary, null);
    const project: Project                              = await testCreateProject(prisma, TR, 'Test Project', 'Test');
    const projectDocumentation: ProjectDocumentation    = await testCreateProjectDocumentation(prisma, TR, project, 'Test Project Documentation', 'Test Description');
    const scene: Scene                                  = await testCreateScene(prisma, TR, 'Test Scene', assetThumbnail, 1, 1);
    const sceneNulls: Scene                             = await testCreateScene(prisma, TR, 'Test Scene', null, 1, 1);
    const subjectNulls: Subject                         = await testCreateSubject(prisma, TR, unit, null, null, 'Test Subject Nulls');
    const stakeholder: Stakeholder                      = await testCreateStakeholder(prisma, TR, 'Test Stakeholder Name', 'Test Stakeholder Org', 'Test Email', 'Test Phone Mobile', 'Test Phone Office', 'Test Mailing');
    const workflow: Workflow                            = await testCreateWorkflow(prisma, TR, workflowTemplate, project, user, new Date(), new Date());
    const workflowNulls: Workflow                       = await testCreateWorkflow(prisma, TR, workflowTemplate, null, null, new Date(), new Date());
    const workflowStep: WorkflowStep                    = await testCreateWorkflowStep(prisma, TR, workflow, user, vocabulary, 0, new Date(), new Date());

    actorWithUnit; actorWithOutUnit; assetVersion; assetWithoutAG; captureData; captureDataNulls; intermediaryFile; item; itemNulls; model; modelNulls; project; projectDocumentation; scene; sceneNulls; stakeholder; subject; subjectNulls; workflow; workflowNulls; workflowStep;
    return TR;
}

async function testCreateActor(prisma: PrismaClient, TR: TestResult,
    IndividualName: string, OrganizationName: string, unit: Unit | null): Promise<Actor> {
    const actor: Actor = {
        IndividualName,
        OrganizationName,
        idUnit:  unit ? unit.idUnit : 0,
        idActor: 0
    };

    try {
        const createdSystemObject = await DBAPI.createActor(prisma, actor);
        TR.Message += `Actor creation suceeded with ID ${createdSystemObject.idActor}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message += `Actor creation failed: ${error}</br>`;
        return actor;
    }
}

async function testCreateAsset(prisma: PrismaClient, TR: TestResult,
    FileName: string, FilePath: string, assetGroup: AssetGroup | null ): Promise<Asset> {
    const asset: Asset = {
        FileName,
        FilePath,
        idAssetGroup:  assetGroup ? assetGroup.idAssetGroup : null,
        idAsset: 0,
        idSystemObject: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAsset(prisma, asset);
        TR.Message += `Asset creation suceeded with ID ${createdSystemObject.idAsset}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message += `Asset creation failed: ${error}</br>`;
        return asset;
    }
}

async function testCreateAssetGroup(prisma: PrismaClient, TR: TestResult): Promise<AssetGroup> {
    const assetGroup: AssetGroup = {
        idAssetGroup: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAssetGroup(prisma, assetGroup);
        TR.Message += `AssetGroup creation suceeded with ID ${createdSystemObject.idAssetGroup}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message += `AssetGroup creation failed: ${error}</br>`;
        return assetGroup;
    }
}

async function testCreateAssetVersion(prisma: PrismaClient, TR: TestResult,
    asset: Asset, user: User, DateCreated: Date, StorageLocation: string, StorageChecksum: string,
    StorageSize: number): Promise<AssetVersion> {
    const assetVersion: AssetVersion = {
        idAsset: asset.idAsset,
        idUserCreator: user.idUser,
        DateCreated,
        StorageLocation,
        StorageChecksum,
        StorageSize,
        idAssetVersion: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAssetVersion(prisma, assetVersion);
        TR.Message += `AssetVersion creation suceeded with ID ${createdSystemObject.idAssetVersion}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message += `AssetVersion creation failed: ${error}</br>`;
        return assetVersion;
    }
}

async function testCreateCaptureData(prisma: PrismaClient, TR: TestResult,
    CaptureMethod: Vocabulary, CaptureDatasetType: Vocabulary, DateCaptured: Date, Description: string,
    CaptureDatasetFieldID: number, ItemPositionType: Vocabulary | null, ItemPositionFieldID: number,
    ItemArrangementFieldID: number, FocusType: Vocabulary | null, LightSourceType: Vocabulary | null,
    BackgroundRemovalMethod: Vocabulary | null, ClusterType: Vocabulary | null, ClusterGeometryFieldID: number,
    CameraSettingsUniform: number, assetThumbnail: Asset | null): Promise<CaptureData> {
    const captureData: CaptureData = {
        idVCaptureMethod: CaptureMethod.idVocabulary,
        idVCaptureDatasetType: CaptureDatasetType.idVocabulary,
        DateCaptured,
        Description,
        CaptureDatasetFieldID,
        idVItemPositionType: ItemPositionType ? ItemPositionType.idVocabulary : null,
        ItemPositionFieldID,
        ItemArrangementFieldID,
        idVFocusType: FocusType ? FocusType.idVocabulary : null,
        idVLightSourceType: LightSourceType ? LightSourceType.idVocabulary : null,
        idVBackgroundRemovalMethod: BackgroundRemovalMethod ? BackgroundRemovalMethod.idVocabulary : null,
        idVClusterType: ClusterType ? ClusterType.idVocabulary : null,
        ClusterGeometryFieldID,
        CameraSettingsUniform,
        idAssetThumbnail: assetThumbnail ? assetThumbnail.idAsset : null,
        idCaptureData: 0
    };

    try {
        const createdSystemObject = await DBAPI.createCaptureData(prisma, captureData);
        TR.Message += `CaptureData creation suceeded with ID ${createdSystemObject.idCaptureData}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message += `CaptureData creation failed: ${error}</br>`;
        return captureData;
    }
}

async function testCreateGeoLocation(prisma: PrismaClient, TR: TestResult, Latitude: number, Longitude: number,
    Altitude: number, TS0: number, TS1: number, TS2: number,
    R0: number, R1: number, R2: number, R3: number): Promise<GeoLocation> {
    const geoLocation: GeoLocation = {
        Latitude,
        Longitude,
        Altitude,
        TS0,
        TS1,
        TS2,
        R0,
        R1,
        R2,
        R3,
        idGeoLocation: 0
    };

    try {
        const createdSystemObject = await DBAPI.createGeoLocation(prisma, geoLocation);
        TR.Message += `GeoLocation creation succeeded with ID ${createdSystemObject.idGeoLocation}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `GeoLocation creation failed: ${error}</br>`;
        return geoLocation;
    }
}

async function testCreateIntermediaryFile(prisma: PrismaClient, TR: TestResult, asset: Asset, DateCreated: Date): Promise<IntermediaryFile> {
    const intermediaryFile: IntermediaryFile = {
        idAsset: asset.idAsset,
        DateCreated,
        idIntermediaryFile: 0
    };

    try {
        const createdSystemObject = await DBAPI.createIntermediaryFile(prisma, intermediaryFile);
        TR.Message += `IntermediaryFile creation succeeded with ID ${createdSystemObject.idIntermediaryFile}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `IntermediaryFile creation failed: ${error}</br>`;
        return intermediaryFile;
    }
}

async function testCreateItem(prisma: PrismaClient, TR: TestResult, subject: Subject, assetThumbnail: Asset | null,
    geoLocation: GeoLocation | null, Name: string, EntireSubject: number): Promise<Item> {
    const item: Item = {
        idSubject: subject.idSubject,
        idAssetThumbnail: assetThumbnail ? assetThumbnail.idAsset : null,
        idGeoLocation: geoLocation ? geoLocation.idGeoLocation : null,
        Name,
        EntireSubject,
        idItem: 0
    };

    try {
        const createdSystemObject = await DBAPI.createItem(prisma, item);
        TR.Message += `Item creation succeeded with ID ${createdSystemObject.idItem}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `Item creation failed: ${error}</br>`;
        return item;
    }
}

async function testCreateModel(prisma: PrismaClient, TR: TestResult, DateCreated: Date, CreationMethod: Vocabulary,
    Master: number, Authoritative: number, Modality: Vocabulary, Units: Vocabulary, Purpose: Vocabulary,
    assetThumbnail: Asset | null): Promise<Model> {
    const model: Model = {
        DateCreated,
        idVCreationMethod: CreationMethod.idVocabulary,
        Master,
        Authoritative,
        idVModality: Modality.idVocabulary,
        idVUnits: Units.idVocabulary,
        idVPurpose: Purpose.idVocabulary,
        idAssetThumbnail: assetThumbnail ? assetThumbnail.idAsset : null,
        idModel: 0
    };

    try {
        const createdSystemObject = await DBAPI.createModel(prisma, model);
        TR.Message += `Model creation succeeded with ID ${createdSystemObject.idModel}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `Model creation failed: ${error}</br>`;
        return model;
    }
}

async function testCreateProject(prisma: PrismaClient, TR: TestResult, Name: string, Description: string): Promise<Project> {
    const project: Project = {
        Name,
        Description,
        idProject: 0,
    };

    try {
        const createdSystemObject = await DBAPI.createProject(prisma, project);
        TR.Message += `Project creation suceeded with ID ${createdSystemObject.idProject}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message += `Project creation failed: ${error}</br>`;
        return project;
    }
}

async function testCreateProjectDocumentation(prisma: PrismaClient, TR: TestResult, project: Project, Name: string, Description: string): Promise<ProjectDocumentation> {
    const projectDocumentation: ProjectDocumentation = {
        idProject: project.idProject,
        Name,
        Description,
        idProjectDocumentation: 0
    };

    try {
        const createdSystemObject = await DBAPI.createProjectDocumentation(prisma, projectDocumentation);
        TR.Message += `ProjectDocumentation creation succeeded with ID ${createdSystemObject.idProjectDocumentation}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `ProjectDocumentation creation failed: ${error}</br>`;
        return projectDocumentation;
    }
}

async function testCreateScene(prisma: PrismaClient, TR: TestResult, Name: string, assetThumbnail: Asset | null, IsOriented: number, HasBeenQCd: number): Promise<Scene> {
    const scene: Scene = {
        Name,
        idAssetThumbnail: assetThumbnail ? assetThumbnail.idAsset : null,
        IsOriented,
        HasBeenQCd,
        idScene: 0
    };

    try {
        const createdSystemObject = await DBAPI.createScene(prisma, scene);
        TR.Message += `Scene creation succeeded with ID ${createdSystemObject.idScene}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `Scene creation failed: ${error}</br>`;
        return scene;
    }
}

async function testCreateStakeholder(prisma: PrismaClient, TR: TestResult, IndividualName: string, OrganizationName: string,
    EmailAddress: string, PhoneNumberMobile: string, PhoneNumberOffice: string, MailingAddress: string): Promise<Stakeholder> {
    const stakeholder: Stakeholder = {
        IndividualName,
        OrganizationName,
        EmailAddress,
        PhoneNumberMobile,
        PhoneNumberOffice,
        MailingAddress,
        idStakeholder: 0
    };

    try {
        const createdSystemObject = await DBAPI.createStakeholder(prisma, stakeholder);
        TR.Message += `Stakeholder creation succeeded with ID ${createdSystemObject.idStakeholder}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `Stakeholder creation failed: ${error}</br>`;
        return stakeholder;
    }
}

async function testCreateSubject(prisma: PrismaClient, TR: TestResult,
    unit: Unit, assetThumbnail: Asset | null, geoLocation: GeoLocation | null, Name: string): Promise<Subject> {
    const subject: Subject = {
        idUnit: unit.idUnit,
        idAssetThumbnail: assetThumbnail ? assetThumbnail.idAsset : null,
        idGeoLocation: geoLocation ? geoLocation.idGeoLocation : null,
        Name,
        idSubject: 0
    };

    try {
        const createdSystemObject = await DBAPI.createSubject(prisma, subject);
        TR.Message += `Subject creation succeeded with ID ${createdSystemObject.idSubject}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `Subject creation failed: ${error}</br>`;
        return subject;
    }
}

async function testCreateUnit(prisma: PrismaClient, TR: TestResult, Name: string, Abbreviation: string, ARKPrefix: string): Promise<Unit> {
    const unit: Unit = {
        Name,
        Abbreviation,
        ARKPrefix,
        idUnit: 0
    };

    try {
        const createdSystemObject = await DBAPI.createUnit(prisma, unit);
        TR.Message += `Unit creation succeeded with ID ${createdSystemObject.idUnit}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `Unit creation failed: ${error}</br>`;
        return unit;
    }
}

async function testCreateUser(prisma: PrismaClient, TR: TestResult, Name: string, EmailAddress: string, SecurityID: string,
    Active: number, DateActivated: Date, DateDisabled: Date | null, WorkflowNotificationTime: Date, EmailSettings: number): Promise<User> {
    const user: User = {
        Name,
        EmailAddress,
        SecurityID,
        Active,
        DateActivated,
        DateDisabled,
        WorkflowNotificationTime,
        EmailSettings,
        idUser: 0
    };

    try {
        const createdSystemObject = await DBAPI.createUser(prisma, user);
        TR.Message += `User creation succeeded with ID ${createdSystemObject.idUser}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `User creation failed: ${error}</br>`;
        return user;
    }
}

async function testCreateVocabulary(prisma: PrismaClient, TR: TestResult, vocabularySet: VocabularySet, SortOrder: number): Promise<Vocabulary> {
    const vocabulary: Vocabulary = {
        idVocabularySet: vocabularySet.idVocabularySet,
        SortOrder,
        idVocabulary: 0
    };

    try {
        const createdSystemObject = await DBAPI.createVocabulary(prisma, vocabulary);
        TR.Message += `Vocabulary creation succeeded with ID ${createdSystemObject.idVocabulary}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `Vocabulary creation failed: ${error}</br>`;
        return vocabulary;
    }
}

async function testCreateVocabularySet(prisma: PrismaClient, TR: TestResult, Name: string, SystemMaintained: number): Promise<VocabularySet> {
    const vocabularySet: VocabularySet = {
        Name,
        SystemMaintained,
        idVocabularySet: 0
    };

    try {
        const createdSystemObject = await DBAPI.createVocabularySet(prisma, vocabularySet);
        TR.Message += `VocabularySet creation succeeded with ID ${createdSystemObject.idVocabularySet}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `VocabularySet creation failed: ${error}</br>`;
        return vocabularySet;
    }
}

async function testCreateWorkflow(prisma: PrismaClient, TR: TestResult, workflowTemplate: WorkflowTemplate, project: Project | null,
    userInitiator: User | null, DateInitiated: Date, DateUpdated: Date): Promise<Workflow> {
    const workflow: Workflow = {
        idWorkflowTemplate: workflowTemplate.idWorkflowTemplate,
        idProject: project ? project.idProject : null,
        idUserInitiator: userInitiator ? userInitiator.idUser : null,
        DateInitiated,
        DateUpdated,
        idWorkflow: 0
    };

    try {
        const createdSystemObject = await DBAPI.createWorkflow(prisma, workflow);
        TR.Message += `Workflow creation succeeded with ID ${createdSystemObject.idWorkflow}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `Workflow creation failed: ${error}</br>`;
        return workflow;
    }
}

async function testCreateWorkflowStep(prisma: PrismaClient, TR: TestResult, workflow: Workflow, userOwner: User,
    WorkflowStepType: Vocabulary, State: number, DateCreated: Date, DateCompleted: Date): Promise<WorkflowStep> {
    const workflowStep: WorkflowStep = {
        idWorkflow: workflow.idWorkflow,
        idUserOwner: userOwner.idUser,
        idVWorkflowStepType: WorkflowStepType.idVocabulary,
        State,
        DateCreated,
        DateCompleted,
        idWorkflowStep: 0
    };

    try {
        const createdSystemObject = await DBAPI.createWorkflowStep(prisma, workflowStep);
        TR.Message += `WorkflowStep creation succeeded with ID ${createdSystemObject.idWorkflowStep}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `WorkflowStep creation failed: ${error}</br>`;
        return workflowStep;
    }
}

async function testCreateWorkflowTemplate(prisma: PrismaClient, TR: TestResult, Name: string): Promise<WorkflowTemplate> {
    const workflowTemplate: WorkflowTemplate = {
        Name,
        idWorkflowTemplate: 0
    };

    try {
        const createdSystemObject = await DBAPI.createWorkflowTemplate(prisma, workflowTemplate);
        TR.Message += `WorkflowTemplate creation succeeded with ID ${createdSystemObject.idWorkflowTemplate}</br>`;
        return createdSystemObject;
    } catch (error) {
        console.log(error);
        TR.Message  += `WorkflowTemplate creation failed: ${error}</br>`;
        return workflowTemplate;
    }
}