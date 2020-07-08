/**
 * Type resolver for ModelProcessingActionStep
 */
import { ModelProcessingAction, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelProcessingActionStep = {
    ModelProcessingAction: async (parent: Parent, _: Args, context: Context): Promise<ModelProcessingAction | null> => {
        const { idModelProcessingAction } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModelProcessingAction(prisma, idModelProcessingAction);
    },
    VActionMethod: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idVActionMethod } = parent;
        const { prisma } = context;

        return await DBAPI.Vocabulary.fetch(prisma, idVActionMethod);
    }
};

export default ModelProcessingActionStep;
