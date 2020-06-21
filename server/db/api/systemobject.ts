/* eslint-disable camelcase */
import { PrismaClient, Identifier, Metadata, SystemObject, SystemObjectVersion, SystemObjectXref,
    Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Item, Model, Project, ProjectDocumentation,
    Scene, Stakeholder, Subject, Unit, Workflow, WorkflowStep } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createIdentifier(prisma: PrismaClient, identifier: Identifier): Promise<Identifier | null> {
    let createSystemObject: Identifier;
    const { IdentifierValue, idVIdentifierType, idSystemObject } = identifier;
    try {
        createSystemObject = await prisma.identifier.create({
            data: {
                IdentifierValue,
                Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
                SystemObject: idSystemObject ? { connect: { idSystemObject }, } : undefined,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createIdentifier', error);
        return null;
    }
    return createSystemObject;
}

export async function createMetadata(prisma: PrismaClient, metadata: Metadata): Promise<Metadata | null> {
    let createSystemObject: Metadata;
    const { Name, ValueShort, ValueExtended, idAssetValue, idUser, idVMetadataSource, idSystemObject } = metadata;
    try {
        createSystemObject = await prisma.metadata.create({
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
    } catch (error) {
        LOG.logger.error('DBAPI.createMetadata', error);
        return null;
    }
    return createSystemObject;
}

// NO EXPLICIT METHOD FOR CREATING SYSTEMOBJECT DIRECTLY.
// This is done via creation methods of the objects linked to SystemObject

export async function createSystemObjectVersion(prisma: PrismaClient, systemObjectVersion: SystemObjectVersion): Promise<SystemObjectVersion | null> {
    let createSystemObject: SystemObjectVersion;
    const { idSystemObject, PublishedState } = systemObjectVersion;
    try {
        createSystemObject = await prisma.systemObjectVersion.create({
            data: {
                SystemObject: { connect: { idSystemObject }, },
                PublishedState,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createSystemObjectVersion', error);
        return null;
    }
    return createSystemObject;
}

export async function createSystemObjectXref(prisma: PrismaClient, systemObjectXref: SystemObjectXref): Promise<SystemObjectXref | null> {
    let createSystemObject: SystemObjectXref;
    const { idSystemObjectMaster, idSystemObjectDerived } = systemObjectXref;
    try {
        createSystemObject = await prisma.systemObjectXref.create({
            data: {
                SystemObject_SystemObjectToSystemObjectXref_idSystemObjectMaster:  { connect: { idSystemObject: idSystemObjectMaster }, },
                SystemObject_SystemObjectToSystemObjectXref_idSystemObjectDerived: { connect: { idSystemObject: idSystemObjectDerived }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createSystemObjectXref', error);
        return null;
    }
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
& { WorkflowStep: WorkflowStep | null};

export async function fetchSystemObject(prisma: PrismaClient, idSystemObject: number): Promise<SystemObjectAndPairs | null> {
    try {
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
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObject', error);
        return null;
    }
}

export async function fetchSystemObjectForActor(prisma: PrismaClient, sysObj: Actor): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idActor: sysObj.idActor, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForActor', error);
        return null;
    }
}
export async function fetchSystemObjectForActorID(prisma: PrismaClient, idActor: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idActor, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForActorID', error);
        return null;
    }
}
export async function fetchSystemObjectAndActor(prisma: PrismaClient, idActor: number): Promise<SystemObject & { Actor: Actor | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idActor, }, include: { Actor: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndActor', error);
        return null;
    }
}

export async function fetchSystemObjectForAsset(prisma: PrismaClient, sysObj: Asset): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAsset: sysObj.idAsset, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForAsset', error);
        return null;
    }
}

export async function fetchSystemObjectForAssetID(prisma: PrismaClient, idAsset: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAsset, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForAssetID', error);
        return null;
    }
}

export async function fetchSystemObjectAndAssetID(prisma: PrismaClient, idAsset: number): Promise<SystemObject & { Asset: Asset | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAsset, }, include: { Asset: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndAssetID', error);
        return null;
    }
}

export async function fetchSystemObjectForAssetVersion(prisma: PrismaClient, sysObj: AssetVersion): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAssetVersion: sysObj.idAssetVersion, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForAssetVersion', error);
        return null;
    }
}

export async function fetchSystemObjectForAssetVersionID(prisma: PrismaClient, idAssetVersion: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAssetVersion, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForAssetVersionID', error);
        return null;
    }
}

export async function fetchSystemObjectAndAssetVersion(prisma: PrismaClient, idAssetVersion: number): Promise<SystemObject & { AssetVersion: AssetVersion | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAssetVersion, }, include: { AssetVersion: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndAssetVersion', error);
        return null;
    }
}

export async function fetchSystemObjectForCaptureData(prisma: PrismaClient, sysObj: CaptureData): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idCaptureData: sysObj.idCaptureData, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForCaptureData', error);
        return null;
    }
}

export async function fetchSystemObjectForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idCaptureData, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForCaptureDataID', error);
        return null;
    }
}

export async function fetchSystemObjectAndCaptureData(prisma: PrismaClient, idCaptureData: number): Promise<SystemObject & { CaptureData: CaptureData | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idCaptureData, }, include: { CaptureData: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndCaptureData', error);
        return null;
    }
}

export async function fetchSystemObjectForIntermediaryFile(prisma: PrismaClient, sysObj: IntermediaryFile): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idIntermediaryFile: sysObj.idIntermediaryFile, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForIntermediaryFile', error);
        return null;
    }
}

export async function fetchSystemObjectForIntermediaryFileID(prisma: PrismaClient, idIntermediaryFile: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idIntermediaryFile, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForIntermediaryFileID', error);
        return null;
    }
}

export async function fetchSystemObjectAndIntermediaryFile(prisma: PrismaClient, idIntermediaryFile: number): Promise<SystemObject & { IntermediaryFile: IntermediaryFile | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idIntermediaryFile, }, include: { IntermediaryFile: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndIntermediaryFile', error);
        return null;
    }
}

export async function fetchSystemObjectForItem(prisma: PrismaClient, sysObj: Item): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idItem: sysObj.idItem, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForItem', error);
        return null;
    }
}

export async function fetchSystemObjectForItemID(prisma: PrismaClient, idItem: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idItem, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForItemID', error);
        return null;
    }
}

export async function fetchSystemObjectAndItem(prisma: PrismaClient, idItem: number): Promise<SystemObject & { Item: Item | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idItem, }, include: { Item: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndItem', error);
        return null;
    }
}

export async function fetchSystemObjectForModel(prisma: PrismaClient, sysObj: Model): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idModel: sysObj.idModel, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForModel', error);
        return null;
    }
}

export async function fetchSystemObjectForModelID(prisma: PrismaClient, idModel: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idModel, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForModelID', error);
        return null;
    }
}

export async function fetchSystemObjectAndModel(prisma: PrismaClient, idModel: number): Promise<SystemObject & { Model: Model | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idModel, }, include: { Model: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndModel', error);
        return null;
    }
}

export async function fetchSystemObjectForProject(prisma: PrismaClient, sysObj: Project): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProject: sysObj.idProject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForProject', error);
        return null;
    }
}

export async function fetchSystemObjectForProjectID(prisma: PrismaClient, idProject: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForProjectID', error);
        return null;
    }
}

export async function fetchSystemObjectAndProject(prisma: PrismaClient, idProject: number): Promise<SystemObject & { Project: Project | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProject, }, include: { Project: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndProject', error);
        return null;
    }
}

export async function fetchSystemObjectForProjectDocumentation(prisma: PrismaClient, sysObj: ProjectDocumentation): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProjectDocumentation: sysObj.idProjectDocumentation, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForProjectDocumentation', error);
        return null;
    }
}

export async function fetchSystemObjectForProjectDocumentationID(prisma: PrismaClient, idProjectDocumentation: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProjectDocumentation, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForProjectDocumentationID', error);
        return null;
    }
}

export async function fetchSystemObjectAndProjectDocumentation(prisma: PrismaClient, idProjectDocumentation: number): Promise<SystemObject & { ProjectDocumentation: ProjectDocumentation | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProjectDocumentation, }, include: { ProjectDocumentation: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndProjectDocumentation', error);
        return null;
    }
}

export async function fetchSystemObjectForScene(prisma: PrismaClient, sysObj: Scene): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idScene: sysObj.idScene, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForScene', error);
        return null;
    }
}

export async function fetchSystemObjectForSceneID(prisma: PrismaClient, idScene: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idScene, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForSceneID', error);
        return null;
    }
}

export async function fetchSystemObjectAndScene(prisma: PrismaClient, idScene: number): Promise<SystemObject & { Scene: Scene | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idScene, }, include: { Scene: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndScene', error);
        return null;
    }
}

export async function fetchSystemObjectForStakeholder(prisma: PrismaClient, sysObj: Stakeholder): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idStakeholder: sysObj.idStakeholder, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForStakeholder', error);
        return null;
    }
}

export async function fetchSystemObjectForStakeholderID(prisma: PrismaClient, idStakeholder: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idStakeholder, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForStakeholderID', error);
        return null;
    }
}

export async function fetchSystemObjectAndStakeholder(prisma: PrismaClient, idStakeholder: number): Promise<SystemObject & { Stakeholder: Stakeholder | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idStakeholder, }, include: { Stakeholder: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndStakeholder', error);
        return null;
    }
}

export async function fetchSystemObjectForSubject(prisma: PrismaClient, sysObj: Subject): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idSubject: sysObj.idSubject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForSubject', error);
        return null;
    }
}

export async function fetchSystemObjectForSubjectID(prisma: PrismaClient, idSubject: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idSubject, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForSubjectID', error);
        return null;
    }
}

export async function fetchSystemObjectAndSubject(prisma: PrismaClient, idSubject: number): Promise<SystemObject & { Subject: Subject | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idSubject, }, include: { Subject: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndSubject', error);
        return null;
    }
}

export async function fetchSystemObjectForUnit(prisma: PrismaClient, sysObj: Unit): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idUnit: sysObj.idUnit, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForUnit', error);
        return null;
    }
}

export async function fetchSystemObjectForUnitID(prisma: PrismaClient, idUnit: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idUnit, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForUnitID', error);
        return null;
    }
}

export async function fetchSystemObjectAndUnit(prisma: PrismaClient, idUnit: number): Promise<SystemObject & { Unit: Unit | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idUnit, }, include: { Unit: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndUnit', error);
        return null;
    }
}

export async function fetchSystemObjectForWorkflow(prisma: PrismaClient, sysObj: Workflow): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflow: sysObj.idWorkflow, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForWorkflow', error);
        return null;
    }
}

export async function fetchSystemObjectForWorkflowID(prisma: PrismaClient, idWorkflow: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflow, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForWorkflowID', error);
        return null;
    }
}

export async function fetchSystemObjectAndWorkflow(prisma: PrismaClient, idWorkflow: number): Promise<SystemObject & { Workflow: Workflow | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflow, }, include: { Workflow: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndWorkflow', error);
        return null;
    }
}

export async function fetchSystemObjectForWorkflowStep(prisma: PrismaClient, sysObj: WorkflowStep): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflowStep: sysObj.idWorkflowStep, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForWorkflowStep', error);
        return null;
    }
}

export async function fetchSystemObjectForWorkflowStepID(prisma: PrismaClient, idWorkflowStep: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflowStep, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForWorkflowStepID', error);
        return null;
    }
}

export async function fetchSystemObjectAndWorkflowStep(prisma: PrismaClient, idWorkflowStep: number): Promise<SystemObject & { WorkflowStep: WorkflowStep | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflowStep, }, include: { WorkflowStep: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndWorkflowStep', error);
        return null;
    }
}
