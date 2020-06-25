/**
 * Type resolver for ModelUVMapChannel
 */
import { ModelUVMapFile, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const ModelUVMapChannel = {
    ModelUVMapFile: async (parent: Parent, _: Args, context: Context): Promise<ModelUVMapFile | null> => {
        const { idModelUVMapChannel } = parent;
        const { prisma } = context;

        return prisma.modelUVMapChannel.findOne({ where: { idModelUVMapChannel } }).ModelUVMapFile();
    },
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idModelUVMapChannel } = parent;
        const { prisma } = context;

        return prisma.modelUVMapChannel.findOne({ where: { idModelUVMapChannel } }).Vocabulary();
    }
};

export default ModelUVMapChannel;
