/**
 * Type resolver for AccessPolicy
 */
import { AccessContext, AccessRole, User } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const AccessPolicy = {
    AccessContext: async (parent: Parent, _: Args, context: Context): Promise<AccessContext | null> => {
        const { idAccessPolicy } = parent;
        const { prisma } = context;

        return prisma.accessPolicy.findOne({ where: { idAccessPolicy } }).AccessContext();
    },
    AccessRole: async (parent: Parent, _: Args, context: Context): Promise<AccessRole | null> => {
        const { idAccessPolicy } = parent;
        const { prisma } = context;

        return prisma.accessPolicy.findOne({ where: { idAccessPolicy } }).AccessRole();
    },
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idAccessPolicy } = parent;
        const { prisma } = context;

        return prisma.accessPolicy.findOne({ where: { idAccessPolicy } }).User();
    }
};

export default AccessPolicy;
