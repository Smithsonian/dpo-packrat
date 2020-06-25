/**
 * Type resolver for Scene
 */
import { Asset, ModelSceneXref, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Scene = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idScene } = parent;
        const { prisma } = context;

        return prisma.scene.findOne({ where: { idScene } }).Asset();
    },
    ModelSceneXref: async (parent: Parent, _: Args, context: Context): Promise<ModelSceneXref[] | null> => {
        const { idScene } = parent;
        const { prisma } = context;

        return prisma.scene.findOne({ where: { idScene } }).ModelSceneXref();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idScene } = parent;
        const { prisma } = context;

        return prisma.scene.findOne({ where: { idScene } }).SystemObject();
    }
};

export default Scene;
