/* eslint-disable camelcase */
import { PrismaClient, Identifier, Metadata, SystemObject, SystemObjectVersion, SystemObjectXref,
    Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Item, Model, Project, ProjectDocumentation,
    Scene, Stakeholder, Subject, Unit, Workflow, WorkflowStep } from '@prisma/client';

export async function createIdentifier(prisma: PrismaClient, identifier: Identifier): Promise<Identifier> {
    const { IdentifierValue, idVIdentifierType, idSystemObject } = identifier;
    const createSystemObject: Identifier = await prisma.identifier.create({
        data: {
            IdentifierValue,
            Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
            SystemObject: idSystemObject ? { connect: { idSystemObject }, } : undefined,
        },
    });

    return createSystemObject;
}

export async function createMetadata(prisma: PrismaClient, metadata: Metadata): Promise<Metadata> {
    const { Name, ValueShort, ValueExtended, idAssetValue, idUser, idVMetadataSource, idSystemObject } = metadata;
    const createSystemObject: Metadata = await prisma.metadata.create({
        data: {
            Name,
            ValueShort:     ValueShort          ? ValueShort : undefined,
            ValueExtended:  ValueExtended       ? ValueExtended : undefined,
            Asset:          idAssetValue        ? { connect: { idAsset: idAssetValue }, } : undefined,
            User:           idUser              ? { connect: { idUser }, } : undefined,
            Vocabulary:     idVMetadataSource   ? { connect: { idVocabulary: idVMetadataSource }, } : undefined,
            SystemObject:   idSystemObject      ? { connect: { idSystemObject }, } : undefined,
        },
    });

    return createSystemObject;
}

// NO EXPLICIT METHOD FOR CREATING SYSTEMOBJECT DIRECTLY.
// This is done via creation methods of the objects linked to SystemObject

export async function createSystemObjectVersion(prisma: PrismaClient, systemObjectVersion: SystemObjectVersion): Promise<SystemObjectVersion> {
    const { idSystemObject, PublishedState } = systemObjectVersion;
    const createSystemObject: SystemObjectVersion = await prisma.systemObjectVersion.create({
        data: {
            SystemObject: { connect: { idSystemObject }, },
            PublishedState,
        },
    });

    return createSystemObject;
}

export async function createSystemObjectXref(prisma: PrismaClient, systemObjectXref: SystemObjectXref): Promise<SystemObjectXref> {
    const { idSystemObjectMaster, idSystemObjectDerived } = systemObjectXref;
    const createSystemObject: SystemObjectXref = await prisma.systemObjectXref.create({
        data: {
            SystemObject_SystemObjectToSystemObjectXref_idSystemObjectMaster:  { connect: { idSystemObject: idSystemObjectMaster }, },
            SystemObject_SystemObjectToSystemObjectXref_idSystemObjectDerived: { connect: { idSystemObject: idSystemObjectDerived }, },
        },
    });

    return createSystemObject;
}

export type SystemObjectAndPairs = SystemObject
& { Actor: Actor | null}
& { Asset: Asset | null}
& { AssetVersion: AssetVersion | null}
& { CaptureData: CaptureData | null}
& { IntermediaryFile: IntermediaryFile | null}
& { Item: Item | null}
& { Model: Model | null}
& { Project: Project | null}
& { ProjectDocumentation: ProjectDocumentation | null}
& { Scene: Scene | null}
& { Stakeholder: Stakeholder | null}
& { Subject: Subject | null}
& { Unit: Unit | null}
& { Workflow: Workflow | null}
& { WorkflowStep: WorkflowStep | null}
| null;

export async function fetchSystemObject(prisma: PrismaClient, idSystemObject: number): Promise<SystemObjectAndPairs> {
    return await prisma.systemObject.findOne({
        where: { idSystemObject, },
        include: {
            Actor: true,
            Asset: true,
            AssetVersion: true,
            CaptureData: true,
            IntermediaryFile: true,
            Item: true,
            Model: true,
            Project: true,
            ProjectDocumentation: true,
            Scene: true,
            Stakeholder: true,
            Subject: true,
            Unit: true,
            Workflow: true,
            WorkflowStep: true
        },
    });
}

export async function fetchSystemObjectForActor(prisma: PrismaClient, sysObj: Actor): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idActor: sysObj.idActor, }, });
}
export async function fetchSystemObjectForActorID(prisma: PrismaClient, idActor: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idActor, }, });
}
export async function fetchSystemObjectAndActor(prisma: PrismaClient, idActor: number): Promise<SystemObject & { Actor: Actor | null} | null> {
    return await prisma.systemObject.findOne({ where: { idActor, }, include: { Actor: true, }, });
}

export async function fetchSystemObjectForAsset(prisma: PrismaClient, sysObj: Asset): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idAsset: sysObj.idAsset, }, });
}
export async function fetchSystemObjectForAssetID(prisma: PrismaClient, idAsset: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idAsset, }, });
}

export async function fetchSystemObjectAndAssetID(prisma: PrismaClient, idAsset: number): Promise<SystemObject & { Asset: Asset | null} | null> {
    return await prisma.systemObject.findOne({ where: { idAsset, }, include: { Asset: true, }, });
}

export async function fetchSystemObjectForAssetVersion(prisma: PrismaClient, sysObj: AssetVersion): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idAssetVersion: sysObj.idAssetVersion, }, });
}
export async function fetchSystemObjectForAssetVersionID(prisma: PrismaClient, idAssetVersion: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idAssetVersion, }, });
}
export async function fetchSystemObjectAndAssetVersion(prisma: PrismaClient, idAssetVersion: number): Promise<SystemObject & { AssetVersion: AssetVersion | null} | null> {
    return await prisma.systemObject.findOne({ where: { idAssetVersion, }, include: { AssetVersion: true, }, });
}

export async function fetchSystemObjectForCaptureData(prisma: PrismaClient, sysObj: CaptureData): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idCaptureData: sysObj.idCaptureData, }, });
}
export async function fetchSystemObjectForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idCaptureData, }, });
}
export async function fetchSystemObjectAndCaptureData(prisma: PrismaClient, idCaptureData: number): Promise<SystemObject & { CaptureData: CaptureData | null} | null> {
    return await prisma.systemObject.findOne({ where: { idCaptureData, }, include: { CaptureData: true, }, });
}

export async function fetchSystemObjectForIntermediaryFile(prisma: PrismaClient, sysObj: IntermediaryFile): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idIntermediaryFile: sysObj.idIntermediaryFile, }, });
}
export async function fetchSystemObjectForIntermediaryFileID(prisma: PrismaClient, idIntermediaryFile: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idIntermediaryFile, }, });
}
export async function fetchSystemObjectAndIntermediaryFile(prisma: PrismaClient, idIntermediaryFile: number): Promise<SystemObject & { IntermediaryFile: IntermediaryFile | null} | null> {
    return await prisma.systemObject.findOne({ where: { idIntermediaryFile, }, include: { IntermediaryFile: true, }, });
}

export async function fetchSystemObjectForItem(prisma: PrismaClient, sysObj: Item): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idItem: sysObj.idItem, }, });
}
export async function fetchSystemObjectForItemID(prisma: PrismaClient, idItem: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idItem, }, });
}
export async function fetchSystemObjectAndItem(prisma: PrismaClient, idItem: number): Promise<SystemObject & { Item: Item | null} | null> {
    return await prisma.systemObject.findOne({ where: { idItem, }, include: { Item: true, }, });
}

export async function fetchSystemObjectForModel(prisma: PrismaClient, sysObj: Model): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idModel: sysObj.idModel, }, });
}
export async function fetchSystemObjectForModelID(prisma: PrismaClient, idModel: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idModel, }, });
}
export async function fetchSystemObjectAndModel(prisma: PrismaClient, idModel: number): Promise<SystemObject & { Model: Model | null} | null> {
    return await prisma.systemObject.findOne({ where: { idModel, }, include: { Model: true, }, });
}

export async function fetchSystemObjectForProject(prisma: PrismaClient, sysObj: Project): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idProject: sysObj.idProject, }, });
}
export async function fetchSystemObjectForProjectID(prisma: PrismaClient, idProject: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idProject, }, });
}
export async function fetchSystemObjectAndProject(prisma: PrismaClient, idProject: number): Promise<SystemObject & { Project: Project | null} | null> {
    return await prisma.systemObject.findOne({ where: { idProject, }, include: { Project: true, }, });
}

export async function fetchSystemObjectForProjectDocumentation(prisma: PrismaClient, sysObj: ProjectDocumentation): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idProjectDocumentation: sysObj.idProjectDocumentation, }, });
}
export async function fetchSystemObjectForProjectDocumentationID(prisma: PrismaClient, idProjectDocumentation: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idProjectDocumentation, }, });
}
export async function fetchSystemObjectAndProjectDocumentation(prisma: PrismaClient, idProjectDocumentation: number): Promise<SystemObject & { ProjectDocumentation: ProjectDocumentation | null} | null> {
    return await prisma.systemObject.findOne({ where: { idProjectDocumentation, }, include: { ProjectDocumentation: true, }, });
}

export async function fetchSystemObjectForScene(prisma: PrismaClient, sysObj: Scene): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idScene: sysObj.idScene, }, });
}
export async function fetchSystemObjectForSceneID(prisma: PrismaClient, idScene: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idScene, }, });
}
export async function fetchSystemObjectAndScene(prisma: PrismaClient, idScene: number): Promise<SystemObject & { Scene: Scene | null} | null> {
    return await prisma.systemObject.findOne({ where: { idScene, }, include: { Scene: true, }, });
}

export async function fetchSystemObjectForStakeholder(prisma: PrismaClient, sysObj: Stakeholder): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idStakeholder: sysObj.idStakeholder, }, });
}
export async function fetchSystemObjectForStakeholderID(prisma: PrismaClient, idStakeholder: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idStakeholder, }, });
}
export async function fetchSystemObjectAndStakeholder(prisma: PrismaClient, idStakeholder: number): Promise<SystemObject & { Stakeholder: Stakeholder | null} | null> {
    return await prisma.systemObject.findOne({ where: { idStakeholder, }, include: { Stakeholder: true, }, });
}

export async function fetchSystemObjectForSubject(prisma: PrismaClient, sysObj: Subject): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idSubject: sysObj.idSubject, }, });
}
export async function fetchSystemObjectForSubjectID(prisma: PrismaClient, idSubject: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idSubject, }, });
}
export async function fetchSystemObjectAndSubject(prisma: PrismaClient, idSubject: number): Promise<SystemObject & { Subject: Subject | null} | null> {
    return await prisma.systemObject.findOne({ where: { idSubject, }, include: { Subject: true, }, });
}

export async function fetchSystemObjectForUnit(prisma: PrismaClient, sysObj: Unit): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idUnit: sysObj.idUnit, }, });
}
export async function fetchSystemObjectForUnitID(prisma: PrismaClient, idUnit: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idUnit, }, });
}
export async function fetchSystemObjectAndUnit(prisma: PrismaClient, idUnit: number): Promise<SystemObject & { Unit: Unit | null} | null> {
    return await prisma.systemObject.findOne({ where: { idUnit, }, include: { Unit: true, }, });
}

export async function fetchSystemObjectForWorkflow(prisma: PrismaClient, sysObj: Workflow): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idWorkflow: sysObj.idWorkflow, }, });
}
export async function fetchSystemObjectForWorkflowID(prisma: PrismaClient, idWorkflow: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idWorkflow, }, });
}
export async function fetchSystemObjectAndWorkflow(prisma: PrismaClient, idWorkflow: number): Promise<SystemObject & { Workflow: Workflow | null} | null> {
    return await prisma.systemObject.findOne({ where: { idWorkflow, }, include: { Workflow: true, }, });
}

export async function fetchSystemObjectForWorkflowStep(prisma: PrismaClient, sysObj: WorkflowStep): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idWorkflowStep: sysObj.idWorkflowStep, }, });
}
export async function fetchSystemObjectForWorkflowStepID(prisma: PrismaClient, idWorkflowStep: number): Promise<SystemObject | null> {
    return await prisma.systemObject.findOne({ where: { idWorkflowStep, }, });
}
export async function fetchSystemObjectAndWorkflowStep(prisma: PrismaClient, idWorkflowStep: number): Promise<SystemObject & { WorkflowStep: WorkflowStep | null} | null> {
    return await prisma.systemObject.findOne({ where: { idWorkflowStep, }, include: { WorkflowStep: true, }, });
}

