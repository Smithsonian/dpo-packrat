/**
 * Type resolver for SystemObject
 */
import {
    Actor,
    Asset,
    AssetVersion,
    CaptureData,
    IntermediaryFile,
    Item,
    Model,
    Project,
    ProjectDocumentation,
    Scene,
    Stakeholder,
    Subject,
    Unit,
    Workflow,
    WorkflowStep,
    AccessContextObject,
    Identifier,
    LicenseAssignment,
    Metadata,
    SystemObject,
    SystemObjectVersion,
    UserPersonalizationSystemObject
} from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const SystemObject = {
    Actor: async (parent: Parent, _: Args, context: Context): Promise<Actor | null> => {
        const { idActor } = parent;
        const { prisma } = context;

        return await DBAPI.fetchActor(prisma, idActor);
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAsset);
    },
    AssetVersion: async (parent: Parent, _: Args, context: Context): Promise<AssetVersion | null> => {
        const { idAssetVersion } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAssetVersion(prisma, idAssetVersion);
    },
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData | null> => {
        const { idCaptureData } = parent;
        const { prisma } = context;

        return await DBAPI.fetchCaptureData(prisma, idCaptureData);
    },
    IntermediaryFile: async (parent: Parent, _: Args, context: Context): Promise<IntermediaryFile | null> => {
        const { idIntermediaryFile } = parent;
        const { prisma } = context;

        return await DBAPI.fetchIntermediaryFile(prisma, idIntermediaryFile);
    },
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return await DBAPI.fetchItem(prisma, idItem);
    },
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModel(prisma, idModel);
    },
    Project: async (parent: Parent, _: Args, context: Context): Promise<Project | null> => {
        const { idProject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchProject(prisma, idProject);
    },
    ProjectDocumentation: async (parent: Parent, _: Args, context: Context): Promise<ProjectDocumentation | null> => {
        const { idProjectDocumentation } = parent;
        const { prisma } = context;

        return await DBAPI.fetchProjectDocumentation(prisma, idProjectDocumentation);
    },
    Scene: async (parent: Parent, _: Args, context: Context): Promise<Scene | null> => {
        const { idScene } = parent;
        const { prisma } = context;

        return await DBAPI.fetchScene(prisma, idScene);
    },
    Stakeholder: async (parent: Parent, _: Args, context: Context): Promise<Stakeholder | null> => {
        const { idStakeholder } = parent;
        const { prisma } = context;

        return await DBAPI.fetchStakeholder(prisma, idStakeholder);
    },
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSubject(prisma, idSubject);
    },
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUnit(prisma, idUnit);
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow | null> => {
        const { idWorkflow } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflow(prisma, idWorkflow);
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep | null> => {
        const { idWorkflowStep } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowStep(prisma, idWorkflowStep);
    },
    AccessContextObject: async (parent: Parent): Promise<AccessContextObject[] | null> => {
        return await DBAPI.AccessContextObject.fetchFromSystemObject(parent.idSystemObject);
    },
    Identifier: async (parent: Parent, _: Args, context: Context): Promise<Identifier[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchIdentifierFromSystemObject(prisma, idSystemObject);
    },
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchLicenseAssignmentFromSystemObject(prisma, idSystemObject);
    },
    Metadata: async (parent: Parent, _: Args, context: Context): Promise<Metadata[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchMetadataFromSystemObject(prisma, idSystemObject);
    },
    SystemObjectVersion: async (parent: Parent, _: Args, context: Context): Promise<SystemObjectVersion[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectVersionFromSystemObject(prisma, idSystemObject);
    },
    SystemObjectDerived: async (parent: Parent, _: Args, context: Context): Promise<SystemObject[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchDerivedSystemObjectFromXref(prisma, idSystemObject);
    },
    SystemObjectMaster: async (parent: Parent, _: Args, context: Context): Promise<SystemObject[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchMasterSystemObjectFromXref(prisma, idSystemObject);
    },
    UserPersonalizationSystemObject: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationSystemObject[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUserPersonalizationSystemObjectFromSystemObject(prisma, idSystemObject);
    },
    WorkflowStepXref: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowStepFromXref(prisma, idSystemObject);
    }
};

export default SystemObject;
