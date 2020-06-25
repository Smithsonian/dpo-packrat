/**
 * Type resolver for AccessRole
 */
import { AccessPolicy, AccessRoleAccessActionXref } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const AccessRole = {
    AccessPolicy: async (parent: Parent, _: Args, context: Context): Promise<AccessPolicy[] | null> => {
        const { idAccessRole } = parent;
        const { prisma } = context;

        return prisma.accessRole.findOne({ where: { idAccessRole } }).AccessPolicy();
    },
    AccessRoleAccessActionXref: async (parent: Parent, _: Args, context: Context): Promise<AccessRoleAccessActionXref[] | null> => {
        const { idAccessRole } = parent;
        const { prisma } = context;

        return prisma.accessRole.findOne({ where: { idAccessRole } }).AccessRoleAccessActionXref();
    }
};

export default AccessRole;
