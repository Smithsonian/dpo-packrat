/**
 * Type resolver for User
 */
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { UserPersonalizationSystemObject, UserPersonalizationUrl, LicenseAssignment, AccessPolicy, AssetVersion, Metadata, Workflow, WorkflowStep } from '@prisma/client';

const User = {
    AccessPolicy: async (parent: Parent, _: Args, context: Context): Promise<AccessPolicy[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).AccessPolicy();
    },
    AssetVersion: async (parent: Parent, _: Args, context: Context): Promise<AssetVersion[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).AssetVersion();
    },
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).LicenseAssignment();
    },
    Metadata: async (parent: Parent, _: Args, context: Context): Promise<Metadata[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).Metadata();
    },
    UserPersonalizationSystemObject: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationSystemObject[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).UserPersonalizationSystemObject();
    },
    UserPersonalizationUrl: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationUrl[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).UserPersonalizationUrl();
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).Workflow();
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).WorkflowStep();
    }
};

export default User;
