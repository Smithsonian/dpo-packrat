/**
 * Type resolver for ModelProcessingAction
 */
import { Model, ModelProcessingActionStep } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ModelProcessingAction = {
    Actor: async (parent: Parent): Promise<DBAPI.Actor | null> => {
        return await DBAPI.Actor.fetch(parent.idActor);
    },
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model | null> => {
        const { idModel } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModel(prisma, idModel);
    },
    ModelProcessingActionStep: async (parent: Parent, _: Args, context: Context): Promise<ModelProcessingActionStep[] | null> => {
        const { idModelProcessingAction } = parent;
        const { prisma } = context;

        return await DBAPI.fetchModelProcessingActionStepFromModelProcessingAction(prisma, idModelProcessingAction);
    }
};

export default ModelProcessingAction;
