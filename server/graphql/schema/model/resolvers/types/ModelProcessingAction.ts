/**
 * Type resolver for ModelProcessingAction
 */
import { Actor, Model, ModelProcessingActionStep } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const ModelProcessingAction = {
    Actor: async (parent: Parent, _: Args, context: Context): Promise<Actor | null> => {
        const { idModelProcessingAction } = parent;
        const { prisma } = context;

        return prisma.modelProcessingAction.findOne({ where: { idModelProcessingAction } }).Actor();
    },
    Model: async (parent: Parent, _: Args, context: Context): Promise<Model | null> => {
        const { idModelProcessingAction } = parent;
        const { prisma } = context;

        return prisma.modelProcessingAction.findOne({ where: { idModelProcessingAction } }).Model();
    },
    ModelProcessingActionStep: async (parent: Parent, _: Args, context: Context): Promise<ModelProcessingActionStep[] | null> => {
        const { idModelProcessingAction } = parent;
        const { prisma } = context;

        return prisma.modelProcessingAction.findOne({ where: { idModelProcessingAction } }).ModelProcessingActionStep();
    }
};

export default ModelProcessingAction;
