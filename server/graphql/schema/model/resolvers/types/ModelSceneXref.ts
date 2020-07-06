/**
 * Type resolver for ModelSceneXref
 */
import { Model, Scene } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelSceneXref = {
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModel(prisma, idModel);
    },
    Scene: async (parent: Parent, _: Args, context: Context): Promise<Scene | null> => {
        const { idScene } = parent;
        const { prisma } = context;

        return await DBAPI.fetchScene(prisma, idScene);
    }
};

export default ModelSceneXref;
