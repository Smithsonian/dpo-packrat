/**
 * Type resolver for AccessRoleAccessActionXref
 */
import { AccessAction, AccessRole } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const AccessRoleAccessActionXref = {
    AccessAction: async (parent: Parent, _: Args, context: Context): Promise<AccessAction | null> => {
        const { idAccessRoleAccessActionXref } = parent;
        const { prisma } = context;

        return prisma.accessRoleAccessActionXref.findOne({ where: { idAccessRoleAccessActionXref: Number.parseInt(idAccessRoleAccessActionXref) } }).AccessAction();
    },
    AccessRole: async (parent: Parent, _: Args, context: Context): Promise<AccessRole | null> => {
        const { idAccessRoleAccessActionXref } = parent;
        const { prisma } = context;

        return prisma.accessRoleAccessActionXref.findOne({ where: { idAccessRoleAccessActionXref: Number.parseInt(idAccessRoleAccessActionXref) } }).AccessRole();
    }
};

export default AccessRoleAccessActionXref;
