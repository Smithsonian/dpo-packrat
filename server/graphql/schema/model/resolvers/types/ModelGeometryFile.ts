/**
 * Type resolver for ModelGeometryFile
 */
import { Asset, Model, Vocabulary, ModelUVMapFile } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelGeometryFile = {
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAsset } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAsset);
    },
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModel(prisma, idModel);
    },
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVModelFileType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVModelFileType);
    },
    ModelUVMapFile: async (parent: Parent, _: Args, context: Context): Promise<ModelUVMapFile[] | null> => {
        const { idModelGeometryFile } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModelUVMapFileFromModelGeometryFile(prisma, idModelGeometryFile);
    }
};

export default ModelGeometryFile;
