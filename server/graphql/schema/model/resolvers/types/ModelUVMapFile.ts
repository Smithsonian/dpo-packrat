/**
 * Type resolver for ModelUVMapFile
 */
import { Asset, ModelGeometryFile, ModelUVMapChannel } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelUVMapFile = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAsset);
    },
    ModelGeometryFile: async (parent: Parent, _: Args, context: Context): Promise<ModelGeometryFile | null> => {
        const { idModelGeometryFile } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModelGeometryFile(prisma, idModelGeometryFile);
    },
    ModelUVMapChannel: async (parent: Parent, _: Args, context: Context): Promise<ModelUVMapChannel[] | null> => {
        const { idModelUVMapFile } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModelUVMapChannelFromModelUVMapFile(prisma, idModelUVMapFile);
    }
};

export default ModelUVMapFile;
