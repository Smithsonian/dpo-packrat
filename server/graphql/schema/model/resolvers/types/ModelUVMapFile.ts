/**
 * Type resolver for ModelUVMapFile
 */

import { Asset, ModelGeometryFile, ModelUVMapChannel } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const ModelUVMapFile = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idModelUVMapFile } = parent;
        const { prisma } = context;

        return prisma.modelUVMapFile.findOne({ where: { idModelUVMapFile } }).Asset();
    },
    ModelGeometryFile: async (parent: Parent, _: Args, context: Context): Promise<ModelGeometryFile | null> => {
        const { idModelUVMapFile } = parent;
        const { prisma } = context;

        return prisma.modelUVMapFile.findOne({ where: { idModelUVMapFile } }).ModelGeometryFile();
    },
    ModelUVMapChannel: async (parent: Parent, _: Args, context: Context): Promise<ModelUVMapChannel[] | null> => {
        const { idModelUVMapFile } = parent;
        const { prisma } = context;

        return prisma.modelUVMapFile.findOne({ where: { idModelUVMapFile } }).ModelUVMapChannel();
    }
};

export default ModelUVMapFile;
