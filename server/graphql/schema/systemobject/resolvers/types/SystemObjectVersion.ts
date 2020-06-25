/**
 * Type resolver for SystemObjectVersion
 */
import { SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const SystemObjectVersion = {
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSystemObjectVersion } = parent;
        const { prisma } = context;

        return prisma.systemObjectVersion.findOne({ where: { idSystemObjectVersion } }).SystemObject();
    }
};

export default SystemObjectVersion;
