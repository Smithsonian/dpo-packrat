/**
 * Type resolver for Scene
 */
import { Asset, ModelSceneXref, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Scene = {
    AssetThumbnail: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAssetThumbnail } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAssetThumbnail);
    },
    ModelSceneXref: async (parent: Parent, _: Args, context: Context): Promise<ModelSceneXref[] | null> => {
        const { idScene } = parent;
        const { prisma } = context;
        // TODO: xref elimination
        return prisma.scene.findOne({ where: { idScene } }).ModelSceneXref();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idScene } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromScene(prisma, idScene);
    }
};

export default Scene;
