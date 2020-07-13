/**
 * Type resolver for Scene
 */
import { Asset, ModelSceneXref } from '@prisma/client';
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

        return await DBAPI.fetchModelSceneXrefFromScene(prisma, idScene);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromSceneID(parent.idScene);
    }
};

export default Scene;
