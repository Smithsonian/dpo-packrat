import * as DBAPI from '../../../db/api';
import { PrismaClient,
    AccessAction, AccessContext, AccessContextObject, AccessPolicy, AccessRole, AccessRoleAccessActionXref,
    Actor, Asset, AssetGroup, AssetVersion, CaptureData, CaptureDataGroup, CaptureDataGroupCaptureDataXref,
    GeoLocation, Identifier, IntermediaryFile, Item, License, LicenseAssignment, Metadata,
    Model, ModelGeometryFile, ModelProcessingAction, ModelProcessingActionStep,
    ModelSceneXref, ModelUVMapChannel, ModelUVMapFile, Project, ProjectDocumentation, Scene, Stakeholder,
    Subject, SystemObject, SystemObjectVersion, SystemObjectXref,
    Unit, User, UserPersonalizationSystemObject, UserPersonalizationUrl, Vocabulary, VocabularySet,
    Workflow, WorkflowStep, WorkflowStepSystemObjectXref, WorkflowTemplate } from '@prisma/client';

export async function testCreateAccessAction(prisma: PrismaClient, Name: string, SortOrder: number): Promise<AccessAction> {
    const accessAction: AccessAction = {
        Name,
        SortOrder,
        idAccessAction: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAccessAction(prisma, accessAction);
        return createdSystemObject;
    } catch (error) {
        console.error(`AccessAction creation failed: ${error}`);
        return accessAction;
    }
}

export async function testCreateAccessContext(prisma: PrismaClient, Global: number, Authoritative: number, CaptureData: number,
    Model: number, Scene: number, IntermediaryFile: number): Promise<AccessContext> {
    const accessContext: AccessContext = {
        Global, Authoritative, CaptureData, Model, Scene, IntermediaryFile,
        idAccessContext: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAccessContext(prisma, accessContext);
        return createdSystemObject;
    } catch (error) {
        console.error(`AccessContext creation failed: ${error}`);
        return accessContext;
    }
}

export async function testCreateAccessContextObject(prisma: PrismaClient, accessContext: AccessContext, systemObject: SystemObject): Promise<AccessContextObject> {
    const accessContextObject: AccessContextObject = {
        idAccessContext: accessContext.idAccessContext,
        idSystemObject: systemObject.idSystemObject,
        idAccessContextObject: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAccessContextObject(prisma, accessContextObject);
        return createdSystemObject;
    } catch (error) {
        console.error(`AccessContextObject creation failed: ${error}`);
        return accessContextObject;
    }
}

export async function testCreateAccessPolicy(prisma: PrismaClient, user: User, accessRole: AccessRole, accessContext: AccessContext): Promise<AccessPolicy> {
    const accessPolicy: AccessPolicy = {
        idUser: user.idUser,
        idAccessRole: accessRole.idAccessRole,
        idAccessContext: accessContext.idAccessContext,
        idAccessPolicy: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAccessPolicy(prisma, accessPolicy);
        return createdSystemObject;
    } catch (error) {
        console.error(`AccessPolicy creation failed: ${error}`);
        return accessPolicy;
    }
}

export async function testCreateAccessRole(prisma: PrismaClient, Name: string): Promise<AccessRole> {
    const accessRole: AccessRole = {
        Name,
        idAccessRole: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAccessRole(prisma, accessRole);
        return createdSystemObject;
    } catch (error) {
        console.error(`AccessRole creation failed: ${error}`);
        return accessRole;
    }
}

export async function testCreateAccessRoleAccessActionXref(prisma: PrismaClient, accessRole: AccessRole, accessAction: AccessAction): Promise<AccessRoleAccessActionXref> {
    const accessRoleAccessActionXref: AccessRoleAccessActionXref = {
        idAccessRole: accessRole.idAccessRole,
        idAccessAction: accessAction.idAccessAction,
        idAccessRoleAccessActionXref: 0
    };

    try {
        const createdSystemObject = await DBAPI.createAccessRoleAccessActionXref(prisma, accessRoleAccessActionXref);
        return createdSystemObject;
    } catch (error) {
        console.error(`AccessRoleAccessActionXref creation failed: ${error}`);
        return accessRoleAccessActionXref;
    }
}

export async function testCreateActor(prisma: PrismaClient,
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

export async function testCreateAsset(prisma: PrismaClient,
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

export async function testCreateAssetGroup(prisma: PrismaClient): Promise<AssetGroup> {
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

export async function testCreateAssetVersion(prisma: PrismaClient,
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

export async function testCreateCaptureData(prisma: PrismaClient,
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

export async function testCreateCaptureDataGroup(prisma: PrismaClient): Promise<CaptureDataGroup> {
    try {
        const createdSystemObject = await DBAPI.createCaptureDataGroup(prisma);
        return createdSystemObject;
    } catch (error) {
        console.error(`CaptureDataGroup creation failed: ${error}`);
        return { idCaptureDataGroup: 0 };
    }
}

export async function testCreateCaptureDataGroupCaptureDataXref(prisma: PrismaClient,
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

export async function testCreateGeoLocation(prisma: PrismaClient, Latitude: number, Longitude: number,
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

export async function testCreateIdentifier(prisma: PrismaClient, IdentifierValue: string,
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

export async function testCreateIntermediaryFile(prisma: PrismaClient, asset: Asset, DateCreated: Date): Promise<IntermediaryFile> {
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

export async function testCreateItem(prisma: PrismaClient, subject: Subject, assetThumbnail: Asset | null,
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

export async function testCreateLicense(prisma: PrismaClient, Name: string, Description: string): Promise<License> {
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

export async function testCreateLicenseAssignment(prisma: PrismaClient, license: License, userCreator: User | null,
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

export async function testCreateMetadata(prisma: PrismaClient, Name: string, ValueShort: string | null, ValueExtended: string | null,
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

export async function testCreateModel(prisma: PrismaClient, DateCreated: Date, CreationMethod: Vocabulary,
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

export async function testCreateModelGeometryFile(prisma: PrismaClient, model: Model, asset: Asset, ModelFileType: Vocabulary,
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

export async function testCreateModelProcessingAction(prisma: PrismaClient, model: Model, actor: Actor, DateProcessed: Date,
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

export async function testCreateModelProcessingActionStep(prisma: PrismaClient, modelProcessingAction: ModelProcessingAction,
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

export async function testCreateModelSceneXref(prisma: PrismaClient, model: Model, scene: Scene, TS0: number | null,
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

export async function testCreateModelUVMapChannel(prisma: PrismaClient, modelUVMapFile: ModelUVMapFile, ChannelPosition: number,
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

export async function testCreateModelUVMapFile(prisma: PrismaClient, modelGeometryFile: ModelGeometryFile, asset: Asset, UVMapEdgeLength: number): Promise<ModelUVMapFile> {
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

export async function testCreateProject(prisma: PrismaClient, Name: string, Description: string): Promise<Project> {
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

export async function testCreateProjectDocumentation(prisma: PrismaClient, project: Project, Name: string, Description: string): Promise<ProjectDocumentation> {
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

export async function testCreateScene(prisma: PrismaClient, Name: string, assetThumbnail: Asset | null, IsOriented: number, HasBeenQCd: number): Promise<Scene> {
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

export async function testCreateStakeholder(prisma: PrismaClient, IndividualName: string, OrganizationName: string,
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

export async function testCreateSystemObjectVersion(prisma: PrismaClient, systemObject: SystemObject, PublishedState: number): Promise<SystemObjectVersion> {
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

export async function testCreateSystemObjectXref(prisma: PrismaClient,
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

export async function testCreateSubject(prisma: PrismaClient,
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

export async function testCreateUnit(prisma: PrismaClient, Name: string, Abbreviation: string, ARKPrefix: string): Promise<Unit> {
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

export async function testCreateUser(prisma: PrismaClient, Name: string, EmailAddress: string, SecurityID: string,
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

export async function testCreateUserPersonalizationSystemObject(prisma: PrismaClient, user: User, systemObject: SystemObject,
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

export async function testCreateUserPersonalizationUrl(prisma: PrismaClient, user: User, URL: string, Personalization: string): Promise<UserPersonalizationUrl> {
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

export async function testCreateVocabulary(prisma: PrismaClient, vocabularySet: VocabularySet, SortOrder: number): Promise<Vocabulary> {
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

export async function testCreateVocabularySet(prisma: PrismaClient, Name: string, SystemMaintained: number): Promise<VocabularySet> {
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

export async function testCreateWorkflow(prisma: PrismaClient, workflowTemplate: WorkflowTemplate, project: Project | null,
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

export async function testCreateWorkflowStep(prisma: PrismaClient, workflow: Workflow, userOwner: User,
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

export async function testCreateWorkflowStepSystemObjectXref(prisma: PrismaClient, workflowStep: WorkflowStep,
    systemObject: SystemObject, Input: number): Promise<WorkflowStepSystemObjectXref> {
    const workflowStepSystemObjectXref: WorkflowStepSystemObjectXref = {
        idWorkflowStep: workflowStep.idWorkflowStep,
        idSystemObject: systemObject.idSystemObject,
        Input,
        idWorkflowStepSystemObjectXref: 0
    };

    try {
        const createdSystemObject = await DBAPI.createWorkflowStepSystemObjectXref(prisma, workflowStepSystemObjectXref);
        return createdSystemObject;
    } catch (error) {
        console.error(`WorkflowStepSystemObjectXref creation failed: ${error}`);
        return workflowStepSystemObjectXref;
    }
}

export async function testCreateWorkflowTemplate(prisma: PrismaClient, Name: string): Promise<WorkflowTemplate> {
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

