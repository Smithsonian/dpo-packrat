/**
 * Type resolver for AccessAction
 */
import { AccessRoleAccessActionXref } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const AccessAction = {
    AccessRoleAccessActionXref: async (parent: Parent, _: Args, context: Context): Promise<AccessRoleAccessActionXref[] | null> => {
        const { idAccessAction } = parent;
        const { prisma } = context;

        return prisma.accessAction.findOne({ where: { idAccessAction: Number.parseInt(idAccessAction) } }).AccessRoleAccessActionXref();
    }
};

export default AccessAction;
