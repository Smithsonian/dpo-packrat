/**
 * Type resolver for AccessContextObject
 */
import { AccessContext, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const AccessContextObject = {
    AccessContext: async (parent: Parent, _: Args, context: Context): Promise<AccessContext | null> => {
        const { idAccessContextObject } = parent;
        const { prisma } = context;

        return prisma.accessContextObject.findOne({ where: { idAccessContextObject: Number.parseInt(idAccessContextObject) } }).AccessContext();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idAccessContextObject } = parent;
        const { prisma } = context;

        return prisma.accessContextObject.findOne({ where: { idAccessContextObject: Number.parseInt(idAccessContextObject) } }).SystemObject();
    }
};

export default AccessContextObject;
