/**
 * Type resolver for ModelGeometryFile
 */
import { Asset, Model, Vocabulary, ModelUVMapFile } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const ModelGeometryFile = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idModelGeometryFile } = parent;
        const { prisma } = context;

        return prisma.modelGeometryFile.findOne({ where: { idModelGeometryFile: Number.parseInt(idModelGeometryFile) } }).Asset();
    },
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model | null> => {
        const { idModelGeometryFile } = parent;
        const { prisma } = context;

        return prisma.modelGeometryFile.findOne({ where: { idModelGeometryFile: Number.parseInt(idModelGeometryFile) } }).Model();
    },
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idModelGeometryFile } = parent;
        const { prisma } = context;

        return prisma.modelGeometryFile.findOne({ where: { idModelGeometryFile: Number.parseInt(idModelGeometryFile) } }).Vocabulary();
    },
    ModelUVMapFile: async (parent: Parent, _: Args, context: Context): Promise<ModelUVMapFile[] | null> => {
        const { idModelGeometryFile } = parent;
        const { prisma } = context;

        return prisma.modelGeometryFile.findOne({ where: { idModelGeometryFile: Number.parseInt(idModelGeometryFile) } }).ModelUVMapFile();
    }
};

export default ModelGeometryFile;
