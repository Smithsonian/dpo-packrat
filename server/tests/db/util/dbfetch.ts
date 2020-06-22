import * as DBAPI from '../../../db';
import { PrismaClient, Scene, Subject, SystemObject } from '@prisma/client';

export async function testFetchSystemObjectSubject(prisma: PrismaClient, subject: Subject): Promise<SystemObject | null> {
    try {
        return await DBAPI.fetchSystemObjectForSubject(prisma, subject);
    } catch (error) {
        console.error(`fetchSystemObjectForScene: ${error}`);
        return null;
    }
}

export async function testFetchSystemObjectScene(prisma: PrismaClient, scene: Scene): Promise<SystemObject | null> {
    try {
        return await DBAPI.fetchSystemObjectForScene(prisma, scene);
    } catch (error) {
        console.error(`fetchSystemObjectForScene: ${error}`);
        return null;
    }
}

export async function testFetchSystemObject(prisma: PrismaClient, idSystemObject: number): Promise<DBAPI.SystemObjectAndPairs | null> {
    try {
        return await DBAPI.fetchSystemObject(prisma, idSystemObject);
    } catch (error) {
        console.error(`fetchSystemObject: ${error}`);
        return null;
    }
}

/*
fetchActor Actor | null
fetchIntermediaryFile IntermediaryFile | null
fetchScene Scene | null
fetchSystemObjectForActor SystemObject | null
fetchSystemObjectForActorID SystemObject | null
fetchSystemObjectAndActor SystemObject & { Actor: Actor | null} | null
fetchSystemObjectForAsset SystemObject | null
fetchSystemObjectForAssetID SystemObject | null
fetchSystemObjectAndAssetID SystemObject & { Asset: Asset | null} | null
fetchSystemObjectForAssetVersion SystemObject | null
fetchSystemObjectForAssetVersionID SystemObject | null
fetchSystemObjectAndAssetVersion SystemObject & { AssetVersion: AssetVersion | null} | null
fetchSystemObjectForCaptureData SystemObject | null
fetchSystemObjectForCaptureDataID SystemObject | null
fetchSystemObjectAndCaptureData SystemObject & { CaptureData: CaptureData | null} | null
fetchSystemObjectForIntermediaryFile SystemObject | null
fetchSystemObjectForIntermediaryFileID SystemObject | null
fetchSystemObjectAndIntermediaryFile SystemObject & { IntermediaryFile: IntermediaryFile | null} | null
fetchSystemObjectForItem SystemObject | null
fetchSystemObjectForItemID SystemObject | null
fetchSystemObjectAndItem SystemObject & { Item: Item | null} | null
fetchSystemObjectForModel SystemObject | null
fetchSystemObjectForModelID SystemObject | null
fetchSystemObjectAndModel SystemObject & { Model: Model | null} | null
fetchSystemObjectForProject SystemObject | null
fetchSystemObjectForProjectID SystemObject | null
fetchSystemObjectAndProject SystemObject & { Project: Project | null} | null
fetchSystemObjectForProjectDocumentation SystemObject | null
fetchSystemObjectForProjectDocumentationID SystemObject | null
fetchSystemObjectAndProjectDocumentation SystemObject & { ProjectDocumentation: ProjectDocumentation | null} | null
fetchSystemObjectForScene SystemObject | null
fetchSystemObjectForSceneID SystemObject | null
fetchSystemObjectAndScene SystemObject & { Scene: Scene | null} | null
fetchSystemObjectForStakeholder SystemObject | null
fetchSystemObjectForStakeholderID SystemObject | null
fetchSystemObjectAndStakeholder SystemObject & { Stakeholder: Stakeholder | null} | null
fetchSystemObjectForSubject SystemObject | null
fetchSystemObjectForSubjectID SystemObject | null
fetchSystemObjectAndSubject SystemObject & { Subject: Subject | null} | null
fetchSystemObjectForUnit SystemObject | null
fetchSystemObjectForUnitID SystemObject | null
fetchSystemObjectAndUnit SystemObject & { Unit: Unit | null} | null
fetchSystemObjectForWorkflow SystemObject | null
fetchSystemObjectForWorkflowID SystemObject | null
fetchSystemObjectAndWorkflow SystemObject & { Workflow: Workflow | null} | null
fetchSystemObjectForWorkflowStep SystemObject | null
fetchSystemObjectForWorkflowStepID SystemObject | null
fetchSystemObjectAndWorkflowStep SystemObject & { WorkflowStep: WorkflowStep | null} | null
*/