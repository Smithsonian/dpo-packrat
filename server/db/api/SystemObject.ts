/* eslint-disable camelcase */
import { PrismaClient, SystemObject,
    Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Item, Model, Project, ProjectDocumentation,
    Scene, Stakeholder, Subject, Unit, Workflow, WorkflowStep } from '@prisma/client';
import * as LOG from '../../utils/logger';

// NO EXPLICIT METHOD FOR CREATING SYSTEMOBJECT DIRECTLY.
// This is done via creation methods of the objects linked to SystemObject

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

export async function fetchDerivedSystemObjectFromXref(prisma: PrismaClient, idSystemObjectMaster: number): Promise<SystemObject[] | null> {
    try {
        return await prisma.systemObject.findMany({
            where: {
                SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectDerived: {
                    some: { idSystemObjectMaster },
                },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchDerivedSystemObjectFromXref', error);
        return null;
    }
}

export async function fetchDerivedSystemObjectAndPairFromXref(prisma: PrismaClient, idSystemObjectMaster: number): Promise<SystemObjectAndPairs[] | null> {
    try {
        return await prisma.systemObject.findMany({
            where: {
                SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectDerived: {
                    some: { idSystemObjectMaster },
                },
            },
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
        LOG.logger.error('DBAPI.fetchDerivedSystemObjectAndPairFromXref', error);
        return null;
    }
}

export async function fetchMasterSystemObjectFromXref(prisma: PrismaClient, idSystemObjectDerived: number): Promise<SystemObject[] | null> {
    try {
        return await prisma.systemObject.findMany({
            where: {
                SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectMaster: {
                    some: { idSystemObjectDerived },
                },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchMasterSystemObjectFromXref', error);
        return null;
    }
}

export async function fetchMasterSystemObjectAndPairFromXref(prisma: PrismaClient, idSystemObjectDerived: number): Promise<SystemObjectAndPairs[] | null> {
    try {
        return await prisma.systemObject.findMany({
            where: {
                SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectMaster: {
                    some: { idSystemObjectDerived },
                },
            },
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
        LOG.logger.error('DBAPI.fetchMasterSystemObjectAndPairFromXref', error);
        return null;
    }
}

export async function fetchWorkflowStepFromXref(prisma: PrismaClient, idSystemObject: number): Promise<WorkflowStep[] | null> {
    try {
        return await prisma.workflowStep.findMany({
            where: {
                WorkflowStepSystemObjectXref: {
                    some: { idSystemObject },
                },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchWorkflowStepFromXref', error);
        return null;
    }
}

export async function fetchSystemObjectFromCaptureData(prisma: PrismaClient, idCaptureData: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idCaptureData } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromCaptureData', error);
        return null;
    }
}

export async function fetchSystemObjectFromAsset(prisma: PrismaClient, idAsset: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAsset } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromAsset', error);
        return null;
    }
}

export async function fetchSystemObjectFromAssetVersion(prisma: PrismaClient, idAssetVersion: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idAssetVersion } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromAssetVersion', error);
        return null;
    }
}

export async function fetchSystemObjectFromUnit(prisma: PrismaClient, idUnit: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idUnit } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromUnit', error);
        return null;
    }
}

export async function fetchSystemObjectFromProject(prisma: PrismaClient, idProject: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProject } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromProject', error);
        return null;
    }
}

export async function fetchSystemObjectFromProjectDocumentation(prisma: PrismaClient, idProjectDocumentation: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idProjectDocumentation } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromProjectDocumentation', error);
        return null;
    }
}

export async function fetchSystemObjectFromStakeholder(prisma: PrismaClient, idStakeholder: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idStakeholder } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromStakeholder', error);
        return null;
    }
}

export async function fetchSystemObjectFromItem(prisma: PrismaClient, idItem: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idItem } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromItem', error);
        return null;
    }
}

export async function fetchSystemObjectFromSubject(prisma: PrismaClient, idSubject: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idSubject } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromSubject', error);
        return null;
    }
}

export async function fetchSystemObjectFromActor(prisma: PrismaClient, idActor: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idActor } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromActor', error);
        return null;
    }
}

export async function fetchSystemObjectFromIntermediaryFile(prisma: PrismaClient, idIntermediaryFile: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idIntermediaryFile } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromIntermediaryFile', error);
        return null;
    }
}

export async function fetchSystemObjectFromScene(prisma: PrismaClient, idScene: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idScene } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromScene', error);
        return null;
    }
}

export async function fetchSystemObjectFromModel(prisma: PrismaClient, idModel: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idModel } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromModel', error);
        return null;
    }
}

export async function fetchSystemObjectFromWorkflow(prisma: PrismaClient, idWorkflow: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflow } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromWorkflow', error);
        return null;
    }
}

export async function fetchSystemObjectFromWorkflowStep(prisma: PrismaClient, idWorkflowStep: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idWorkflowStep } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectFromWorkflowStep', error);
        return null;
    }
}
