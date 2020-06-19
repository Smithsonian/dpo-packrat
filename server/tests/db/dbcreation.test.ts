/**
 * @jest-environment node
 */
import * as DBAPI from '../../db/api';
import { PrismaClient, Actor, Asset, AssetGroup, AssetVersion, CaptureData, CaptureDataGroup, CaptureDataGroupCaptureDataXref,
    GeoLocation, Identifier, IntermediaryFile, Item, License, LicenseAssignment, Metadata,
    Model, ModelGeometryFile, ModelProcessingAction, ModelProcessingActionStep,
    ModelSceneXref, ModelUVMapChannel, ModelUVMapFile, Project, ProjectDocumentation, Scene, Stakeholder,
    Subject, SystemObject, SystemObjectVersion, SystemObjectXref,
    Unit, User, UserPersonalizationSystemObject, UserPersonalizationUrl, Vocabulary, VocabularySet,
    Workflow, WorkflowStep, WorkflowTemplate } from '@prisma/client';

let prisma;

beforeAll(() => {
    prisma = new PrismaClient();
});

describe('DB Creation Test Suite', () => {
    let assetGroup: AssetGroup;
    it('DB Creation: AssetGroup', async () => {
        assetGroup = await testCreateAssetGroup(prisma);
        expect(assetGroup.idAssetGroup).toBeGreaterThan(0);
    });

    let assetThumbnail: Asset;
    it('DB Creation: Asset', async () => {
        assetThumbnail = await testCreateAsset(prisma, 'Test Asset Thumbnail', '/test/asset/path', assetGroup);
        expect(assetThumbnail.idAsset).toBeGreaterThan(0);
    });

    let geoLocation: GeoLocation;
    it('DB Creation: GeoLocation', async () => {
        geoLocation = await testCreateGeoLocation(prisma, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        expect(geoLocation.idGeoLocation).toBeGreaterThan(0);
    });

    let unit: Unit;
    it('DB Creation: Unit', async () => {
        unit = await testCreateUnit(prisma, 'DPO', 'DPO', 'http://abbadabbadoo/');
        expect(unit.idUnit).toBeGreaterThan(0);
    });

    let user: User;
    it('DB Creation: User', async () => {
        user = await testCreateUser(prisma, 'Test User', 'test@si.edu', 'SECURITY_ID', 1, new Date(), null, new Date(), 0);
        expect(user.idUser).toBeGreaterThan(0);
    });

    let subject: Subject;
    it('DB Creation: Subject', async () => {
        subject = await testCreateSubject(prisma, unit, assetThumbnail, geoLocation, 'Test Subject');
        expect(subject.idSubject).toBeGreaterThan(0);
    });

    let vocabularySet: VocabularySet;
    it('DB Creation: VocabularySet', async () => {
        vocabularySet = await testCreateVocabularySet(prisma, 'Test Vocabulary Set', 0);
        expect(vocabularySet.idVocabularySet).toBeGreaterThan(0);
    });

    let vocabulary: Vocabulary;
    it('DB Creation: Vocabulary', async () => {
        vocabulary = await testCreateVocabulary(prisma, vocabularySet, 0);
        expect(vocabulary.idVocabulary).toBeGreaterThan(0);
    });

    let workflowTemplate: WorkflowTemplate;
    it('DB Creation: WorkflowTemplate', async () => {
        workflowTemplate = await testCreateWorkflowTemplate(prisma, 'Test Workflow Template');
        expect(workflowTemplate.idWorkflowTemplate).toBeGreaterThan(0);
    });

    let scene: Scene;
    it('DB Creation: Scene', async () => {
        scene = await testCreateScene(prisma, 'Test Scene', assetThumbnail, 1, 1);
        expect(scene.idScene).toBeGreaterThan(0);
    });

    let systemObjectSubject: SystemObject | null;
    it('DB Creation: Fetch System Object Subject', async() => {
        systemObjectSubject = await testFetchSystemObjectSubject(prisma, subject);
        expect(systemObjectSubject).not.toBeNull();
        expect(systemObjectSubject ? systemObjectSubject.idSubject : -1).toBe(subject.idSubject);
    });

    let systemObjectScene: SystemObject | null;
    it('DB Creation: Fetch System Object Scene', async() => {
        systemObjectScene = await testFetchSystemObjectScene(prisma, scene);
        expect(systemObjectScene).not.toBeNull();
        expect(systemObjectScene ? systemObjectScene.idScene : -1).toBe(scene.idScene);
    });

    // *************************************************************************
    // Makes use of objects created above
    // *************************************************************************
    let actorWithUnit: Actor;
    it('DB Creation: Actor With Unit', async () => {
        actorWithUnit = await testCreateActor(prisma, 'Test Actor Name', 'Test Actor Org', unit);
        expect(actorWithUnit.idActor).toBeGreaterThan(0);
    });

    let actorWithOutUnit: Actor;
    it('DB Creation: Actor Without Unit', async () => {
        actorWithOutUnit = await testCreateActor(prisma, 'Test Actor Name', 'Test Actor Org', null);
        expect(actorWithOutUnit.idActor).toBeGreaterThan(0);
    });

    let assetWithoutAG: Asset;
    it('DB Creation: Asset Without Asset Group', async () => {
        assetWithoutAG = await testCreateAsset(prisma, 'Test Asset 2', '/test/asset/path2', null);
        expect(assetWithoutAG.idAsset).toBeGreaterThan(0);
    });

    let assetVersion: AssetVersion;
    it('DB Creation: AssetVersion', async () => {
        assetVersion = await testCreateAssetVersion(prisma, assetThumbnail, user, new Date(), '/test/asset/path', 'Asset Checksum', 50);
        expect(assetVersion.idAsset).toBeGreaterThan(0);
    });

    let captureData: CaptureData;
    it('DB Creation: CaptureData', async () => {
        captureData = await testCreateCaptureData(prisma, vocabulary, vocabulary, new Date(),
            'Test Capture Data', 0, vocabulary, 0, 0, vocabulary, vocabulary, vocabulary, vocabulary, 0, 0, assetThumbnail);
        expect(captureData.idCaptureData).toBeGreaterThan(0);
    });

    let captureDataNulls: CaptureData;
    it('DB Creation: CaptureData With Nulls', async () => {
        captureDataNulls = await testCreateCaptureData(prisma, vocabulary, vocabulary, new Date(),
            'Test Capture Data Nulls', 0, null, 0, 0, null, null, null, null, 0, 0, null);
        expect(captureDataNulls.idCaptureData).toBeGreaterThan(0);
    });

    let captureDataGroup: CaptureDataGroup;
    it('DB Creation: CaptureDataGroup', async () => {
        captureDataGroup = await testCreateCaptureDataGroup(prisma);
        expect(captureDataGroup.idCaptureDataGroup).toBeGreaterThan(0);
    });

    let captureDataGroupCaptureDataXref: CaptureDataGroupCaptureDataXref;
    it('DB Creation: CaptureDataGroupCaptureDataXref', async () => {
        captureDataGroupCaptureDataXref = await testCreateCaptureDataGroupCaptureDataXref(prisma, captureDataGroup, captureData);
        expect(captureDataGroupCaptureDataXref.idCaptureDataGroupCaptureDataXref).toBeGreaterThan(0);
    });

    let identifier: Identifier;
    it('DB Creation: Identifier', async () => {
        identifier = await testCreateIdentifier(prisma, 'Test Identifier', vocabulary, systemObjectSubject);
        expect(identifier.idIdentifier).toBeGreaterThan(0);
    });

    let identifierNull: Identifier;
    it('DB Creation: Identifier With Nulls', async () => {
        identifierNull = await testCreateIdentifier(prisma, 'Test Identifier', vocabulary, null);
        expect(identifierNull.idIdentifier).toBeGreaterThan(0);
    });

    let intermediaryFile: IntermediaryFile;
    it('DB Creation: IntermediaryFile', async () => {
        intermediaryFile = await testCreateIntermediaryFile(prisma, assetThumbnail, new Date());
        expect(intermediaryFile.idIntermediaryFile).toBeGreaterThan(0);
    });

    let item: Item;
    it('DB Creation: Item', async () => {
        item = await testCreateItem(prisma, subject, assetThumbnail, geoLocation, 'Test Item', 1);
        expect(item.idItem).toBeGreaterThan(0);
    });

    let itemNulls: Item;
    it('DB Creation: Item With Nulls', async () => {
        itemNulls = await testCreateItem(prisma, subject, null, null, 'Test Item Nulls', 1);
        expect(itemNulls.idItem).toBeGreaterThan(0);
    });

    let metadata: Metadata;
    it('DB Creation: Metadata', async () => {
        metadata = await testCreateMetadata(prisma, 'Test Metadata', 'Test Value Short', 'Test Value Ext', assetThumbnail, user, vocabulary, systemObjectScene);
        expect(metadata.idMetadata).toBeGreaterThan(0);
    });

    let metadataNull: Metadata;
    it('DB Creation: Metadata With Nulls', async () => {
        metadataNull = await testCreateMetadata(prisma, 'Test Metadata', null, null, null, null, null, null);
        expect(metadataNull.idMetadata).toBeGreaterThan(0);
    });

    let model: Model;
    it('DB Creation: Model', async () => {
        model = await testCreateModel(prisma, new Date(), vocabulary, 1, 1, vocabulary, vocabulary, vocabulary, assetThumbnail);
        expect(model.idModel).toBeGreaterThan(0);
    });

    let modelNulls: Model;
    it('DB Creation: Model With Nulls', async () => {
        modelNulls = await testCreateModel(prisma, new Date(), vocabulary, 1, 1, vocabulary, vocabulary, vocabulary, null);
        expect(modelNulls.idModel).toBeGreaterThan(0);
    });

    let modelGeometryFile: ModelGeometryFile;
    it('DB Creation: ModelGeometryFile', async () => {
        modelGeometryFile = await testCreateModelGeometryFile(prisma, model, assetThumbnail, vocabulary, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        expect(modelGeometryFile.idModelGeometryFile).toBeGreaterThan(0);
    });

    let modelGeometryFileNulls: ModelGeometryFile;
    it('DB Creation: ModelGeometryFile With Nulls', async () => {
        modelGeometryFileNulls = await testCreateModelGeometryFile(prisma, model, assetThumbnail, vocabulary, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null);
        expect(modelGeometryFileNulls.idModelGeometryFile).toBeGreaterThan(0);
    });

    let modelProcessingAction: ModelProcessingAction;
    it('DB Creation: ModelProcessingAction', async () => {
        modelProcessingAction = await testCreateModelProcessingAction(prisma, model, actorWithUnit, new Date(),
            'Test Model Processing Action', 'Test Model Processing Action Description');
        expect(modelProcessingAction.idModelProcessingAction).toBeGreaterThan(0);
    });

    let modelProcessingActionStep: ModelProcessingActionStep;
    it('DB Creation: ModelProcessingActionStep', async () => {
        modelProcessingActionStep = await testCreateModelProcessingActionStep(prisma, modelProcessingAction, vocabulary,
            'Test Model Processing Action Step');
        expect(modelProcessingActionStep.idModelProcessingActionStep).toBeGreaterThan(0);
    });

    let modelSceneXref: ModelSceneXref;
    it('DB Creation: ModelSceneXref', async () => {
        modelSceneXref = await testCreateModelSceneXref(prisma, model, scene, 0, 0, 0, 0, 0, 0, 0);
        expect(modelSceneXref.idModelSceneXref).toBeGreaterThan(0);
    });

    let modelSceneXrefNull: ModelSceneXref;
    it('DB Creation: ModelSceneXref With Nulls', async () => {
        modelSceneXrefNull = await testCreateModelSceneXref(prisma, model, scene, null, null, null, null, null, null, null);
        expect(modelSceneXrefNull.idModelSceneXref).toBeGreaterThan(0);
    });

    let systemObjectVersion: SystemObjectVersion;
    it('DB Creation: SystemObjectVersion', async () => {
        if (systemObjectScene) {
            systemObjectVersion = await testCreateSystemObjectVersion(prisma, systemObjectScene, 0);
        }
        expect(systemObjectVersion.idSystemObjectVersion).toBeGreaterThan(0);
    });

    let systemObjectXref: SystemObjectXref;
    it('DB Creation: SystemObjectXref', async () => {
        if (systemObjectSubject && systemObjectScene) {
            systemObjectXref = await testCreateSystemObjectXref(prisma, systemObjectSubject, systemObjectScene);
        }
        expect(systemObjectXref.idSystemObjectXref).toBeGreaterThan(0);
    });

    let modelUVMapFile: ModelUVMapFile;
    it('DB Creation: ModelUVMapFile', async () => {
        modelUVMapFile = await testCreateModelUVMapFile(prisma, modelGeometryFile, assetThumbnail, 0);
        expect(modelUVMapFile.idModelUVMapFile).toBeGreaterThan(0);
    });

    let modelUVMapChannel: ModelUVMapChannel;
    it('DB Creation: ModelUVMapChannel', async () => {
        modelUVMapChannel = await testCreateModelUVMapChannel(prisma, modelUVMapFile, 0, 1, vocabulary);
        expect(modelUVMapChannel.idModelUVMapChannel).toBeGreaterThan(0);
    });

    let license: License;
    it('DB Creation: License', async () => {
        license = await testCreateLicense(prisma, 'Test License', 'Test License Description');
        expect(license.idLicense).toBeGreaterThan(0);
    });

    let licenseAssignment: LicenseAssignment;
    it('DB Creation: LicenseAssignment', async () => {
        licenseAssignment = await testCreateLicenseAssignment(prisma, license, user, new Date(), new Date(), systemObjectSubject);
        expect(licenseAssignment.idLicenseAssignment).toBeGreaterThan(0);
    });

    let licenseAssignmentNull: LicenseAssignment;
    it('DB Creation: LicenseAssignment With Nulls', async () => {
        licenseAssignmentNull = await testCreateLicenseAssignment(prisma, license, null, null, null, null);
        expect(licenseAssignmentNull.idLicenseAssignment).toBeGreaterThan(0);
    });

    let project: Project;
    it('DB Creation: Project', async () => {
        project = await testCreateProject(prisma, 'Test Project', 'Test');
        expect(project.idProject).toBeGreaterThan(0);
    });

    let projectDocumentation: ProjectDocumentation;
    it('DB Creation: ProjectDocumentation', async () => {
        projectDocumentation = await testCreateProjectDocumentation(prisma, project, 'Test Project Documentation', 'Test Description');
        expect(projectDocumentation.idProjectDocumentation).toBeGreaterThan(0);
    });

    let sceneNulls: Scene;
    it('DB Creation: Scene With Nulls', async () => {
        sceneNulls = await testCreateScene(prisma, 'Test Scene', null, 1, 1);
        expect(sceneNulls.idScene).toBeGreaterThan(0);
    });

    let subjectNulls: Subject;
    it('DB Creation: Subject With Nulls', async () => {
        subjectNulls = await testCreateSubject(prisma, unit, null, null, 'Test Subject Nulls');
        expect(subjectNulls.idSubject).toBeGreaterThan(0);
    });

    let stakeholder: Stakeholder;
    it('DB Creation: Stakeholder', async () => {
        stakeholder = await testCreateStakeholder(prisma, 'Test Stakeholder Name', 'Test Stakeholder Org', 'Test Email', 'Test Phone Mobile', 'Test Phone Office', 'Test Mailing');
        expect(stakeholder.idStakeholder).toBeGreaterThan(0);
    });

    let userPersonalizationSystemObject: UserPersonalizationSystemObject;
    it('DB Creation: UserPersonalizationSystemObject', async () => {
        if (systemObjectSubject) {
            userPersonalizationSystemObject = await testCreateUserPersonalizationSystemObject(prisma, user, systemObjectSubject, 'Test Personalization');
        }
        expect(userPersonalizationSystemObject.idUserPersonalizationSystemObject).toBeGreaterThan(0);
    });

    let userPersonalizationUrl: UserPersonalizationUrl;
    it('DB Creation: UserPersonalizationUrl', async () => {
        userPersonalizationUrl = await testCreateUserPersonalizationUrl(prisma, user, '/test/personalization/Url', 'Test Personalization');
        expect(userPersonalizationUrl.idUserPersonalizationUrl).toBeGreaterThan(0);
    });

    let workflow: Workflow;
    it('DB Creation: Workflow', async () => {
        workflow = await testCreateWorkflow(prisma, workflowTemplate, project, user, new Date(), new Date());
        expect(workflow.idWorkflow).toBeGreaterThan(0);
    });

    let workflowNulls: Workflow;
    it('DB Creation: Workflow WIth Nulls', async () => {
        workflowNulls = await testCreateWorkflow(prisma, workflowTemplate, null, null, new Date(), new Date());
        expect(workflowNulls.idWorkflow).toBeGreaterThan(0);
    });

    let workflowStep: WorkflowStep;
    it('DB Creation: WorkflowStep', async () => {
        workflowStep = await testCreateWorkflowStep(prisma, workflow, user, vocabulary, 0, new Date(), new Date());
        expect(workflowStep.idWorkflowStep).toBeGreaterThan(0);
    });
});

afterAll(async done => {
    await prisma.disconnect();
    done();
});

async function testCreateActor(prisma: PrismaClient,
    IndividualName: string, OrganizationName: string, unit: Unit | null): Promise<Actor> {
    const actor: Actor = {
        IndividualName,
        OrganizationName,
        idUnit:  unit ? unit.idUnit : 0,
        idActor: 0
    };

    try {
        const createdSystemObject = await DBAPI.createActor(prisma, actor);
        return createdSystemObject;
    } catch (error) {
        console.error(`Actor creation failed: ${error}`);
        return actor;
    }
}

async function testCreateAsset(prisma: PrismaClient,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`Asset creation failed: ${error}`);
        return asset;
    }
}

async function testCreateAssetGroup(prisma: PrismaClient): Promise<AssetGroup> {
    const assetGroup: AssetGroup = {
        idAssetGroup: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAssetGroup(prisma, assetGroup);
        return createdSystemObject;
    } catch (error) {
        console.error(`AssetGroup creation failed: ${error}`);
        return assetGroup;
    }
}

async function testCreateAssetVersion(prisma: PrismaClient,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`AssetVersion creation failed: ${error}`);
        return assetVersion;
    }
}

async function testCreateCaptureData(prisma: PrismaClient,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`CaptureData creation failed: ${error}`);
        return captureData;
    }
}

async function testCreateCaptureDataGroup(prisma: PrismaClient): Promise<CaptureDataGroup> {
    try {
        const createdSystemObject = await DBAPI.createCaptureDataGroup(prisma);
        return createdSystemObject;
    } catch (error) {
        console.error(`CaptureDataGroup creation failed: ${error}`);
        return { idCaptureDataGroup: 0 };
    }
}

async function testCreateCaptureDataGroupCaptureDataXref(prisma: PrismaClient,
    captureDataGroup: CaptureDataGroup, captureData: CaptureData): Promise<CaptureDataGroupCaptureDataXref> {
    const captureDataGroupCaptureDataXref: CaptureDataGroupCaptureDataXref = {
        idCaptureDataGroup: captureDataGroup.idCaptureDataGroup,
        idCaptureData: captureData.idCaptureData,
        idCaptureDataGroupCaptureDataXref: 0
    };

    try {
        const createdSystemObject = await DBAPI.createCaptureDataGroupCaptureDataXref(prisma, captureDataGroupCaptureDataXref);
        return createdSystemObject;
    } catch (error) {
        console.error(`CaptureDataGroupCaptureDataXref creation failed: ${error}`);
        return captureDataGroupCaptureDataXref;
    }
}

async function testCreateGeoLocation(prisma: PrismaClient, Latitude: number, Longitude: number,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`GeoLocation creation failed: ${error}`);
        return geoLocation;
    }
}

async function testCreateIdentifier(prisma: PrismaClient, IdentifierValue: string,
    IdentifierType: Vocabulary, systemObject: SystemObject | null): Promise<Identifier> {
    const identifier: Identifier = {
        IdentifierValue,
        idVIdentifierType: IdentifierType.idVocabulary,
        idSystemObject: systemObject ? systemObject.idSystemObject : null,
        idIdentifier: 0
    };

    try {
        const createdSystemObject = await DBAPI.createIdentifier(prisma, identifier);
        return createdSystemObject;
    } catch (error) {
        console.error(`Identifier creation failed: ${error}`);
        return identifier;
    }
}

async function testCreateIntermediaryFile(prisma: PrismaClient, asset: Asset, DateCreated: Date): Promise<IntermediaryFile> {
    const intermediaryFile: IntermediaryFile = {
        idAsset: asset.idAsset,
        DateCreated,
        idIntermediaryFile: 0
    };

    try {
        const createdSystemObject = await DBAPI.createIntermediaryFile(prisma, intermediaryFile);
        return createdSystemObject;
    } catch (error) {
        console.error(`IntermediaryFile creation failed: ${error}`);
        return intermediaryFile;
    }
}

async function testCreateItem(prisma: PrismaClient, subject: Subject, assetThumbnail: Asset | null,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`Item creation failed: ${error}`);
        return item;
    }
}

async function testCreateLicense(prisma: PrismaClient, Name: string, Description: string): Promise<License> {
    const license: License = {
        Name,
        Description,
        idLicense: 0
    };

    try {
        const createdSystemObject = await DBAPI.createLicense(prisma, license);
        return createdSystemObject;
    } catch (error) {
        console.error(`License creation failed: ${error}`);
        return license;
    }
}

async function testCreateLicenseAssignment(prisma: PrismaClient, license: License, userCreator: User | null,
    DateStart: Date | null, DateEnd: Date | null, systemObject: SystemObject | null): Promise<LicenseAssignment> {
    const licenseAssignment: LicenseAssignment = {
        idLicense: license.idLicense,
        idUserCreator: userCreator ? userCreator.idUser : null,
        DateStart,
        DateEnd,
        idSystemObject: systemObject ? systemObject.idSystemObject : null,
        idLicenseAssignment: 0
    };

    try {
        const createdSystemObject = await DBAPI.createLicenseAssignment(prisma, licenseAssignment);
        return createdSystemObject;
    } catch (error) {
        console.error(`LicenseAssignment creation failed: ${error}`);
        return licenseAssignment;
    }
}

async function testCreateMetadata(prisma: PrismaClient, Name: string, ValueShort: string | null, ValueExtended: string | null,
    asset: Asset | null, user: User | null, MetadataSource: Vocabulary | null, systemObject: SystemObject | null): Promise<Metadata> {
    const metadata: Metadata = {
        Name,
        ValueShort,
        ValueExtended,
        idAssetValue: asset ? asset.idAsset : null,
        idUser: user ? user.idUser : null,
        idVMetadataSource: MetadataSource ? MetadataSource.idVocabulary : null,
        idSystemObject: systemObject ? systemObject.idSystemObject : null,
        idMetadata: 0,
    };

    try {
        const createdSystemObject = await DBAPI.createMetadata(prisma, metadata);
        return createdSystemObject;
    } catch (error) {
        console.error(`Metadata creation failed: ${error}`);
        return metadata;
    }
}

async function testCreateModel(prisma: PrismaClient, DateCreated: Date, CreationMethod: Vocabulary,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`Model creation failed: ${error}`);
        return model;
    }
}

async function testCreateModelGeometryFile(prisma: PrismaClient, model: Model, asset: Asset, ModelFileType: Vocabulary,
    Roughness: number | null, Metalness: number | null, PointCount: number | null, FaceCount: number | null,
    IsWatertight: number | null, HasNormals: number | null, HasVertexColor: number | null, HasUVSpace: number | null,
    BoundingBoxP1X: number | null, BoundingBoxP1Y: number | null, BoundingBoxP1Z: number | null,
    BoundingBoxP2X: number | null, BoundingBoxP2Y: number | null, BoundingBoxP2Z: number | null): Promise<ModelGeometryFile> {
    const modelGeometryFile: ModelGeometryFile = {
        idModel: model.idModel,
        idAsset: asset.idAsset,
        idVModelFileType: ModelFileType.idVocabularySet,
        Roughness, Metalness, PointCount, FaceCount, IsWatertight, HasNormals, HasVertexColor, HasUVSpace,
        BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
        idModelGeometryFile: 0
    };

    try {
        const createdSystemObject = await DBAPI.createModelGeometryFile(prisma, modelGeometryFile);
        return createdSystemObject;
    } catch (error) {
        console.error(`ModelGeometryFile creation failed: ${error}`);
        return modelGeometryFile;
    }
}

async function testCreateModelProcessingAction(prisma: PrismaClient, model: Model, actor: Actor, DateProcessed: Date,
    ToolsUsed: string, Description: string): Promise<ModelProcessingAction> {
    const modelProcessingAction: ModelProcessingAction = {
        idModel: model.idModel,
        idActor: actor.idActor,
        DateProcessed,
        ToolsUsed,
        Description,
        idModelProcessingAction: 0
    };

    try {
        const createdSystemObject = await DBAPI.createModelProcessingAction(prisma, modelProcessingAction);
        return createdSystemObject;
    } catch (error) {
        console.error(`ModelProcessingAction creation failed: ${error}`);
        return modelProcessingAction;
    }
}

async function testCreateModelProcessingActionStep(prisma: PrismaClient, modelProcessingAction: ModelProcessingAction,
    ActionMethod: Vocabulary, Description: string): Promise<ModelProcessingActionStep> {
    const modelProcessingActionStep: ModelProcessingActionStep = {
        idModelProcessingAction: modelProcessingAction.idModelProcessingAction,
        idVActionMethod: ActionMethod.idVocabularySet,
        Description,
        idModelProcessingActionStep: 0
    };

    try {
        const createdSystemObject = await DBAPI.createModelProcessingActionStep(prisma, modelProcessingActionStep);
        return createdSystemObject;
    } catch (error) {
        console.error(`ModelProcessingActionStep creation failed: ${error}`);
        return modelProcessingActionStep;
    }
}

async function testCreateModelSceneXref(prisma: PrismaClient, model: Model, scene: Scene, TS0: number | null,
    TS1: number | null, TS2: number | null, R0: number | null, R1: number | null, R2: number | null,
    R3: number | null): Promise<ModelSceneXref> {
    const modelSceneXref: ModelSceneXref = {
        idModel: model.idModel,
        idScene: scene.idScene,
        TS0, TS1, TS2, R0, R1, R2, R3,
        idModelSceneXref: 0
    };

    try {
        const createdSystemObject = await DBAPI.createModelSceneXref(prisma, modelSceneXref);
        return createdSystemObject;
    } catch (error) {
        console.error(`ModelSceneXref creation failed: ${error}`);
        return modelSceneXref;
    }
}

async function testCreateModelUVMapChannel(prisma: PrismaClient, modelUVMapFile: ModelUVMapFile, ChannelPosition: number,
    ChannelWidth: number, UVMapType: Vocabulary): Promise<ModelUVMapChannel> {
    const modelUVMapChannel: ModelUVMapChannel = {
        idModelUVMapFile: modelUVMapFile.idModelUVMapFile,
        ChannelPosition, ChannelWidth,
        idVUVMapType: UVMapType.idVocabulary,
        idModelUVMapChannel: 0
    };

    try {
        const createdSystemObject = await DBAPI.createModelUVMapChannel(prisma, modelUVMapChannel);
        return createdSystemObject;
    } catch (error) {
        console.error(`ModelUVMapChannel creation failed: ${error}`);
        return modelUVMapChannel;
    }
}

async function testCreateModelUVMapFile(prisma: PrismaClient, modelGeometryFile: ModelGeometryFile, asset: Asset, UVMapEdgeLength: number): Promise<ModelUVMapFile> {
    const modelUVMapFile: ModelUVMapFile = {
        idModelGeometryFile: modelGeometryFile.idModelGeometryFile,
        idAsset: asset.idAsset,
        UVMapEdgeLength,
        idModelUVMapFile: 0
    };

    try {
        const createdSystemObject = await DBAPI.createModelUVMapFile(prisma, modelUVMapFile);
        return createdSystemObject;
    } catch (error) {
        console.error(`ModelUVMapFile creation failed: ${error}`);
        return modelUVMapFile;
    }
}

async function testCreateProject(prisma: PrismaClient, Name: string, Description: string): Promise<Project> {
    const project: Project = {
        Name,
        Description,
        idProject: 0,
    };

    try {
        const createdSystemObject = await DBAPI.createProject(prisma, project);
        return createdSystemObject;
    } catch (error) {
        console.error(`Project creation failed: ${error}`);
        return project;
    }
}

async function testCreateProjectDocumentation(prisma: PrismaClient, project: Project, Name: string, Description: string): Promise<ProjectDocumentation> {
    const projectDocumentation: ProjectDocumentation = {
        idProject: project.idProject,
        Name,
        Description,
        idProjectDocumentation: 0
    };

    try {
        const createdSystemObject = await DBAPI.createProjectDocumentation(prisma, projectDocumentation);
        return createdSystemObject;
    } catch (error) {
        console.error(`ProjectDocumentation creation failed: ${error}`);
        return projectDocumentation;
    }
}

async function testCreateScene(prisma: PrismaClient, Name: string, assetThumbnail: Asset | null, IsOriented: number, HasBeenQCd: number): Promise<Scene> {
    const scene: Scene = {
        Name,
        idAssetThumbnail: assetThumbnail ? assetThumbnail.idAsset : null,
        IsOriented,
        HasBeenQCd,
        idScene: 0
    };

    try {
        const createdSystemObject = await DBAPI.createScene(prisma, scene);
        return createdSystemObject;
    } catch (error) {
        console.error(`Scene creation failed: ${error}`);
        return scene;
    }
}

async function testCreateStakeholder(prisma: PrismaClient, IndividualName: string, OrganizationName: string,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`Stakeholder creation failed: ${error}`);
        return stakeholder;
    }
}

async function testCreateSystemObjectVersion(prisma: PrismaClient, systemObject: SystemObject, PublishedState: number): Promise<SystemObjectVersion> {
    const systemObjectVersion: SystemObjectVersion = {
        idSystemObject: systemObject.idSystemObject,
        PublishedState,
        idSystemObjectVersion: 0
    };

    try {
        const createdSystemObject = await DBAPI.createSystemObjectVersion(prisma, systemObjectVersion);
        return createdSystemObject;
    } catch (error) {
        console.error(`SystemObjectVersion creation failed: ${error}`);
        return systemObjectVersion;
    }
}

async function testCreateSystemObjectXref(prisma: PrismaClient,
    systemObjectMaster: SystemObject, systemObjectDerived: SystemObject): Promise<SystemObjectXref> {
    const systemObjectXref: SystemObjectXref = {
        idSystemObjectMaster: systemObjectMaster.idSystemObject,
        idSystemObjectDerived: systemObjectDerived.idSystemObject,
        idSystemObjectXref: 0
    };

    try {
        const createdSystemObject = await DBAPI.createSystemObjectXref(prisma, systemObjectXref);
        return createdSystemObject;
    } catch (error) {
        console.error(`SystemObjectXref creation failed: ${error}`);
        return systemObjectXref;
    }
}

async function testCreateSubject(prisma: PrismaClient,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`Subject creation failed: ${error}`);
        return subject;
    }
}

async function testCreateUnit(prisma: PrismaClient, Name: string, Abbreviation: string, ARKPrefix: string): Promise<Unit> {
    const unit: Unit = {
        Name,
        Abbreviation,
        ARKPrefix,
        idUnit: 0
    };

    try {
        const createdSystemObject = await DBAPI.createUnit(prisma, unit);
        return createdSystemObject;
    } catch (error) {
        console.error(`Unit creation failed: ${error}`);
        return unit;
    }
}

async function testCreateUser(prisma: PrismaClient, Name: string, EmailAddress: string, SecurityID: string,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`User creation failed: ${error}`);
        return user;
    }
}

async function testCreateUserPersonalizationSystemObject(prisma: PrismaClient, user: User, systemObject: SystemObject,
    Personalization: string | null): Promise<UserPersonalizationSystemObject> {
    const userPersonalizationSystemObject: UserPersonalizationSystemObject = {
        idUser: user.idUser,
        idSystemObject: systemObject.idSystemObject,
        Personalization,
        idUserPersonalizationSystemObject: 0
    };

    try {
        const createdSystemObject = await DBAPI.createUserPersonalizationSystemObject(prisma, userPersonalizationSystemObject);
        return createdSystemObject;
    } catch (error) {
        console.error(`UserPersonalizationSystemObject creation failed: ${error}`);
        return userPersonalizationSystemObject;
    }
}

async function testCreateUserPersonalizationUrl(prisma: PrismaClient, user: User, URL: string, Personalization: string): Promise<UserPersonalizationUrl> {
    const userPersonalizationUrl: UserPersonalizationUrl = {
        idUser: user.idUser,
        URL,
        Personalization,
        idUserPersonalizationUrl: 0
    };

    try {
        const createdSystemObject = await DBAPI.createUserPersonalizationUrl(prisma, userPersonalizationUrl);
        return createdSystemObject;
    } catch (error) {
        console.error(`UserPersonalizationUrl creation failed: ${error}`);
        return userPersonalizationUrl;
    }
}

async function testCreateVocabulary(prisma: PrismaClient, vocabularySet: VocabularySet, SortOrder: number): Promise<Vocabulary> {
    const vocabulary: Vocabulary = {
        idVocabularySet: vocabularySet.idVocabularySet,
        SortOrder,
        idVocabulary: 0
    };

    try {
        const createdSystemObject = await DBAPI.createVocabulary(prisma, vocabulary);
        return createdSystemObject;
    } catch (error) {
        console.error(`Vocabulary creation failed: ${error}`);
        return vocabulary;
    }
}

async function testCreateVocabularySet(prisma: PrismaClient, Name: string, SystemMaintained: number): Promise<VocabularySet> {
    const vocabularySet: VocabularySet = {
        Name,
        SystemMaintained,
        idVocabularySet: 0
    };

    try {
        const createdSystemObject = await DBAPI.createVocabularySet(prisma, vocabularySet);
        return createdSystemObject;
    } catch (error) {
        console.error(`VocabularySet creation failed: ${error}`);
        return vocabularySet;
    }
}

async function testCreateWorkflow(prisma: PrismaClient, workflowTemplate: WorkflowTemplate, project: Project | null,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`Workflow creation failed: ${error}`);
        return workflow;
    }
}

async function testCreateWorkflowStep(prisma: PrismaClient, workflow: Workflow, userOwner: User,
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
        return createdSystemObject;
    } catch (error) {
        console.error(`WorkflowStep creation failed: ${error}`);
        return workflowStep;
    }
}

async function testCreateWorkflowTemplate(prisma: PrismaClient, Name: string): Promise<WorkflowTemplate> {
    const workflowTemplate: WorkflowTemplate = {
        Name,
        idWorkflowTemplate: 0
    };

    try {
        const createdSystemObject = await DBAPI.createWorkflowTemplate(prisma, workflowTemplate);
        return createdSystemObject;
    } catch (error) {
        console.error(`WorkflowTemplate creation failed: ${error}`);
        return workflowTemplate;
    }
}

async function testFetchSystemObjectSubject(prisma: PrismaClient, subject: Subject): Promise<SystemObject | null> {
    try {
        return await DBAPI.fetchSystemObjectForSubject(prisma, subject);
    } catch (error) {
        console.error(`fetchSystemObjectForScene: ${error}`);
        return null;
    }
}

async function testFetchSystemObjectScene(prisma: PrismaClient, scene: Scene): Promise<SystemObject | null> {
    try {
        return await DBAPI.fetchSystemObjectForScene(prisma, scene);
    } catch (error) {
        console.error(`fetchSystemObjectForScene: ${error}`);
        return null;
    }
}
