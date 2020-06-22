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
