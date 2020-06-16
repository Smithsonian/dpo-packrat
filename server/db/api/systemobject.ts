import { PrismaClient, Actor, Asset, AssetGroup, AssetVersion, CaptureData, GeoLocation, 
    IntermediaryFile, Item, Model, Project, ProjectDocumentation, Scene, Stakeholder, 
    Subject, Unit, User, Vocabulary, VocabularySet, Workflow, WorkflowStep, WorkflowTemplate } from '@prisma/client'; 

export async function createActor(prisma: PrismaClient, actor: Actor): Promise<Actor> {
    const { IndividualName, OrganizationName, idUnit } = actor;
    const createSystemObject: Actor = await prisma.actor.create({
        data: {
            IndividualName,
            OrganizationName,
            Unit:               idUnit ? { connect: { idUnit }, } : undefined,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}  

export async function createAsset(prisma: PrismaClient, asset: Asset): Promise<Asset> {
    const { FileName, FilePath, idAssetGroup} = asset;
    const createSystemObject: Asset = await prisma.asset.create({
        data: {
            FileName,
            FilePath,
            AssetGroup:     idAssetGroup ? { connect: { idAssetGroup }, } : undefined,
            SystemObject_Asset_idSystemObjectToSystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}  

export async function createAssetGroup(prisma: PrismaClient, assetGroup: AssetGroup): Promise<AssetGroup> {
    assetGroup;
    const createSystemObject: AssetGroup = await prisma.assetGroup.create({
        data: {
        },
    });

    return createSystemObject;    
}

export async function createAssetVersion(prisma: PrismaClient, assetVersion: AssetVersion): Promise<AssetVersion> {
    const { idAsset, idUserCreator, DateCreated, StorageLocation, StorageChecksum, StorageSize } = assetVersion;
    const createSystemObject: AssetVersion = await prisma.assetVersion.create({
        data: {
            Asset:              { connect: { idAsset: idAsset }, },
            User:               { connect: { idUser: idUserCreator }, },
            DateCreated,
            StorageLocation,
            StorageChecksum,
            StorageSize,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}  

export async function createCaptureData(prisma: PrismaClient, captureData: CaptureData): Promise<CaptureData> {
    const { idVCaptureMethod, idVCaptureDatasetType, DateCaptured, Description, CaptureDatasetFieldID, idVItemPositionType,
        ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
        ClusterGeometryFieldID, CameraSettingsUniform, idAssetThumbnail } = captureData;
    const createSystemObject: CaptureData = await prisma.captureData.create({
        data: {
            Vocabulary_CaptureData_idVCaptureMethodToVocabulary:            { connect: { idVocabulary: idVCaptureMethod}, },
            Vocabulary_CaptureData_idVCaptureDatasetTypeToVocabulary:       { connect: { idVocabulary: idVCaptureDatasetType}, },
            DateCaptured,
            Description,
            CaptureDatasetFieldID,
            Vocabulary_CaptureData_idVItemPositionTypeToVocabulary:         idVItemPositionType ? { connect: { idVocabulary: idVItemPositionType}, } : undefined,
            ItemPositionFieldID,
            ItemArrangementFieldID,
            Vocabulary_CaptureData_idVFocusTypeToVocabulary:                idVFocusType ? { connect: { idVocabulary: idVFocusType}, } : undefined,
            Vocabulary_CaptureData_idVLightSourceTypeToVocabulary:          idVLightSourceType ? { connect: { idVocabulary: idVLightSourceType}, } : undefined,
            Vocabulary_CaptureData_idVBackgroundRemovalMethodToVocabulary:  idVBackgroundRemovalMethod ? { connect: { idVocabulary: idVBackgroundRemovalMethod}, } : undefined,
            Vocabulary_CaptureData_idVClusterTypeToVocabulary:              idVClusterType ? { connect: { idVocabulary: idVClusterType}, } : undefined,
            ClusterGeometryFieldID,
            CameraSettingsUniform,
            Asset:                                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail}, } : undefined,
            SystemObject:                                                   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createGeoLocation(prisma: PrismaClient, geoLocation: GeoLocation): Promise<GeoLocation> {
    const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = geoLocation;
    const createSystemObject: GeoLocation = await prisma.geoLocation.create({
        data: {
            Latitude,
            Longitude,
            Altitude,
            TS0,
            TS1,
            TS2,
            R0,
            R1,
            R2,
            R3
        },
    });

    return createSystemObject;
}  

export async function createIntermediaryFile(prisma: PrismaClient, intermediaryFile: IntermediaryFile): Promise<IntermediaryFile> {
    const { idAsset, DateCreated } = intermediaryFile;
    const createSystemObject: IntermediaryFile = await prisma.intermediaryFile.create({
        data: {
            Asset:          { connect: { idAsset: idAsset }, },
            DateCreated,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}  

export async function createItem(prisma: PrismaClient, item: Item): Promise<Item> {
    const { idSubject, idAssetThumbnail, idGeoLocation, Name, EntireSubject } = item;
    const createSystemObject: Item = await prisma.item.create({
        data: {
            Subject:        { connect: { idSubject }, },
            Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
            GeoLocation:    idGeoLocation    ? { connect: { idGeoLocation }, } : undefined,
            Name,
            EntireSubject,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createModel(prisma: PrismaClient, model: Model): Promise<Model> {
    const { DateCreated, idVCreationMethod, Master, Authoritative, idVModality, idVUnits, idVPurpose, idAssetThumbnail } = model;
    const createSystemObject: Model = await prisma.model.create({
        data: {
            DateCreated,
            Vocabulary_Model_idVCreationMethodToVocabulary: { connect: { idVocabulary: idVCreationMethod}, },
            Master,
            Authoritative,
            Vocabulary_Model_idVModalityToVocabulary:       { connect: { idVocabulary: idVModality}, },
            Vocabulary_Model_idVUnitsToVocabulary:          { connect: { idVocabulary: idVUnits}, },
            Vocabulary_Model_idVPurposeToVocabulary:        { connect: { idVocabulary: idVPurpose}, },
            Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}  

export async function createProject(prisma: PrismaClient, project: Project): Promise<Project> {
    const { Name, Description } = project;
    const createSystemObject: Project = await prisma.project.create({
        data: {
            Name,
            Description,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createProjectDocumentation(prisma: PrismaClient, projectDocumentation: ProjectDocumentation): Promise<ProjectDocumentation> {
    const { idProject, Name, Description } = projectDocumentation;
    const createSystemObject: ProjectDocumentation = await prisma.projectDocumentation.create({
        data: {
            Project:        { connect: { idProject: idProject }, },
            Name,
            Description,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}  

export async function createScene(prisma: PrismaClient, scene: Scene): Promise<Scene> {
    const { Name, idAssetThumbnail, IsOriented, HasBeenQCd } = scene;
    const createSystemObject: Scene = await prisma.scene.create({
        data: {
            Name,
            Asset:              idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
            IsOriented,
            HasBeenQCd,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createStakeholder(prisma: PrismaClient, stakeholder: Stakeholder): Promise<Stakeholder> {
    const { IndividualName, OrganizationName, EmailAddress, PhoneNumberMobile, PhoneNumberOffice, MailingAddress } = stakeholder;
    const createSystemObject: Stakeholder = await prisma.stakeholder.create({
        data: {
            IndividualName,
            OrganizationName,
            EmailAddress,
            PhoneNumberMobile,
            PhoneNumberOffice,
            MailingAddress,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createSubject(prisma: PrismaClient, subject: Subject): Promise<Subject> {
    const { idUnit, idAssetThumbnail, idGeoLocation, Name } = subject;
    const createSystemObject: Subject = await prisma.subject.create({
        data: {
            Unit:           { connect: { idUnit: idUnit }, },
            Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
            GeoLocation:    idGeoLocation    ? { connect: { idGeoLocation }, } : undefined,
            Name,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createUser(prisma: PrismaClient, user: User): Promise<User> {
    const { Name, EmailAddress, SecurityID, Active, DateActivated, DateDisabled, WorkflowNotificationTime, EmailSettings } = user;
    const createSystemObject: User = await prisma.user.create({
        data: {
            Name,
            EmailAddress,
            SecurityID,
            Active,
            DateActivated,
            DateDisabled,
            WorkflowNotificationTime,
            EmailSettings
        },
    });

    return createSystemObject;
}

export async function createUnit(prisma: PrismaClient, unit: Unit): Promise<Unit> {
    const { Name, Abbreviation, ARKPrefix } = unit;
    const createSystemObject: Unit = await prisma.unit.create({
        data: {
            Name,
            Abbreviation,
            ARKPrefix,
            SystemObject:   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createVocabulary(prisma: PrismaClient, vocabulary: Vocabulary): Promise<Vocabulary> {
    const { idVocabularySet, SortOrder } = vocabulary;
    const createSystemObject: Vocabulary = await prisma.vocabulary.create({
        data: {
            VocabularySet: { connect: { idVocabularySet}, },
            SortOrder
        },
    });

    return createSystemObject;
}

export async function createVocabularySet(prisma: PrismaClient, vocabularySet: VocabularySet): Promise<VocabularySet> {
    const { Name, SystemMaintained } = vocabularySet;
    const createSystemObject: VocabularySet = await prisma.vocabularySet.create({
        data: {
            Name,
            SystemMaintained
        },
    });

    return createSystemObject;
}

export async function createWorkflow(prisma: PrismaClient, workflow: Workflow): Promise<Workflow> {
    const { idWorkflowTemplate, idProject, idUserInitiator, DateInitiated, DateUpdated } = workflow;
    const createSystemObject: Workflow = await prisma.workflow.create({
        data: {
            WorkflowTemplate:   { connect: { idWorkflowTemplate: idWorkflowTemplate}, },
            Project:            idProject       ? { connect: { idProject }, } : undefined,
            User:               idUserInitiator ? { connect: { idUser: idUserInitiator }, } : undefined,
            DateInitiated,
            DateUpdated,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createWorkflowStep(prisma: PrismaClient, workflowStep: WorkflowStep): Promise<WorkflowStep> {
    const { idWorkflow, idUserOwner, idVWorkflowStepType, State, DateCreated, DateCompleted } = workflowStep;
    const createSystemObject: WorkflowStep = await prisma.workflowStep.create({
        data: {
            Workflow:           { connect: { idWorkflow: idWorkflow}, },
            User:               { connect: { idUser: idUserOwner}, },
            Vocabulary:         { connect: { idVocabulary: idVWorkflowStepType}, },
            State,
            DateCreated,
            DateCompleted,
            SystemObject:       { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createWorkflowTemplate(prisma: PrismaClient, workflowTemplate: WorkflowTemplate): Promise<WorkflowTemplate> {
    const { Name } = workflowTemplate;
    const createSystemObject: WorkflowTemplate = await prisma.workflowTemplate.create({
        data: {
            Name
        },
    });

    return createSystemObject;
}