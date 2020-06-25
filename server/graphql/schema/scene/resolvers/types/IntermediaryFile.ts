/**
 * Type resolver for IntermediaryFile
 */
import { Asset, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const IntermediaryFile = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idIntermediaryFile } = parent;
        const { prisma } = context;

        return prisma.intermediaryFile.findOne({ where: { idIntermediaryFile } }).Asset();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idIntermediaryFile } = parent;
        const { prisma } = context;

        return prisma.intermediaryFile.findOne({ where: { idIntermediaryFile } }).SystemObject();
    }
};

export default IntermediaryFile;
