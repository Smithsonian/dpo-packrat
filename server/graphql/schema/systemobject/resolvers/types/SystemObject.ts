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
    SystemObjectVersion,
    SystemObjectXref,
    UserPersonalizationSystemObject,
    WorkflowStepSystemObjectXref
} from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const SystemObject = {
    Actor: async (parent: Parent, _: Args, context: Context): Promise<Actor | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Actor();
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Asset();
    },
    AssetVersion: async (parent: Parent, _: Args, context: Context): Promise<AssetVersion | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).AssetVersion();
    },
    CaptureData: async (parent: Parent, _: Args, context: Context): Promise<CaptureData | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).CaptureData();
    },
    IntermediaryFile: async (parent: Parent, _: Args, context: Context): Promise<IntermediaryFile | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).IntermediaryFile();
    },
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Item();
    },
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Model();
    },
    Project: async (parent: Parent, _: Args, context: Context): Promise<Project | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Project();
    },
    ProjectDocumentation: async (parent: Parent, _: Args, context: Context): Promise<ProjectDocumentation | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).ProjectDocumentation();
    },
    Scene: async (parent: Parent, _: Args, context: Context): Promise<Scene | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Scene();
    },
    Stakeholder: async (parent: Parent, _: Args, context: Context): Promise<Stakeholder | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Stakeholder();
    },
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Subject();
    },
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Unit();
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Workflow();
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).WorkflowStep();
    },
    AccessContextObject: async (parent: Parent, _: Args, context: Context): Promise<AccessContextObject[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).AccessContextObject();
    },
    Identifier: async (parent: Parent, _: Args, context: Context): Promise<Identifier[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Identifier();
    },
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).LicenseAssignment();
    },
    Metadata: async (parent: Parent, _: Args, context: Context): Promise<Metadata[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).Metadata();
    },
    SystemObjectVersion: async (parent: Parent, _: Args, context: Context): Promise<SystemObjectVersion[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).SystemObjectVersion();
    },
    SystemObjectDerived: async (parent: Parent, _: Args, context: Context): Promise<SystemObjectXref[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectDerived();
    },
    SystemObjectMaster: async (parent: Parent, _: Args, context: Context): Promise<SystemObjectXref[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectMaster();
    },
    UserPersonalizationSystemObject: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationSystemObject[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).UserPersonalizationSystemObject();
    },
    WorkflowStepSystemObjectXref: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStepSystemObjectXref[] | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return prisma.systemObject.findOne({ where: { idSystemObject: Number.parseInt(idSystemObject) } }).WorkflowStepSystemObjectXref();
    }
};

export default SystemObject;
