/**
 * Type resolver for ModelSceneXref
 */
import { Model, Scene } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const ModelSceneXref = {
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model | null> => {
        const { idModelSceneXref } = parent;
        const { prisma } = context;

        return prisma.modelSceneXref.findOne({ where: { idModelSceneXref: Number.parseInt(idModelSceneXref) } }).Model();
    },
    Scene: async (parent: Parent, _: Args, context: Context): Promise<Scene | null> => {
        const { idModelSceneXref } = parent;
        const { prisma } = context;

        return prisma.modelSceneXref.findOne({ where: { idModelSceneXref: Number.parseInt(idModelSceneXref) } }).Scene();
    }
};

export default ModelSceneXref;
