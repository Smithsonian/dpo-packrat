/**
 * Type resolver for AccessContext
 */
import { AccessContextObject, AccessPolicy } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const AccessContext = {
    AccessContextObject: async (parent: Parent, _: Args, context: Context): Promise<AccessContextObject[] | null> => {
        const { idAccessContext } = parent;
        const { prisma } = context;

        return prisma.accessContext.findOne({ where: { idAccessContext } }).AccessContextObject();
    },
    AccessPolicy: async (parent: Parent, _: Args, context: Context): Promise<AccessPolicy[] | null> => {
        const { idAccessContext } = parent;
        const { prisma } = context;

        return prisma.accessContext.findOne({ where: { idAccessContext } }).AccessPolicy();
    }
};

export default AccessContext;
