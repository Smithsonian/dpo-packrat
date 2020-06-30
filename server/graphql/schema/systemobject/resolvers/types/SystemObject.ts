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
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Actor();
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Asset();
    },
    AssetVersion: async (parent: Parent, _: Args, context: Context): Promise<AssetVersion | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).AssetVersion();
    },
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).CaptureData();
    },
    IntermediaryFile: async (parent: Parent, _: Args, context: Context): Promise<IntermediaryFile | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).IntermediaryFile();
    },
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Item();
    },
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Model();
    },
    Project: async (parent: Parent, _: Args, context: Context): Promise<Project | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Project();
    },
    ProjectDocumentation: async (parent: Parent, _: Args, context: Context): Promise<ProjectDocumentation | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).ProjectDocumentation();
    },
    Scene: async (parent: Parent, _: Args, context: Context): Promise<Scene | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Scene();
    },
    Stakeholder: async (parent: Parent, _: Args, context: Context): Promise<Stakeholder | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Stakeholder();
    },
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Subject();
    },
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Unit();
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Workflow();
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).WorkflowStep();
    },
    AccessContextObject: async (parent: Parent, _: Args, context: Context): Promise<AccessContextObject[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).AccessContextObject();
    },
    Identifier: async (parent: Parent, _: Args, context: Context): Promise<Identifier[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Identifier();
    },
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).LicenseAssignment();
    },
    Metadata: async (parent: Parent, _: Args, context: Context): Promise<Metadata[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).Metadata();
    },
    SystemObjectVersion: async (parent: Parent, _: Args, context: Context): Promise<SystemObjectVersion[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject } }).SystemObjectVersion();
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

        return prisma.systemObject.findOne({ where: { idSystemObject } }).UserPersonalizationSystemObject();
    },
    WorkflowStepXref: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowStepFromXref(prisma, idSystemObject);
    }
};

export default SystemObject;
