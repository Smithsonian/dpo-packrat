/**
 * Type resolver for ModelUVMapChannel
 */
import { ModelUVMapFile, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelUVMapChannel = {
    ModelUVMapFile: async (parent: Parent, _: Args, context: Context): Promise<ModelUVMapFile | null> => {
        const { idModelUVMapFile } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModelUVMapFile(prisma, idModelUVMapFile);
    },
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVUVMapType } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVUVMapType);
    }
};

export default ModelUVMapChannel;
