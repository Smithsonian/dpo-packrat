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