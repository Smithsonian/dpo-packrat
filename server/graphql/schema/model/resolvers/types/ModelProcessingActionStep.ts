/**
 * Type resolver for ModelProcessingActionStep
 */
import { ModelProcessingAction, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const ModelProcessingActionStep = {
    ModelProcessingAction: async (parent: Parent, _: Args, context: Context): Promise<ModelProcessingAction | null> => {
        const { idModelProcessingActionStep } = parent;
        const { prisma } = context;

        return prisma.modelProcessingActionStep.findOne({ where: { idModelProcessingActionStep: Number.parseInt(idModelProcessingActionStep) } }).ModelProcessingAction();
    },
    Vocabulary: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idModelProcessingActionStep } = parent;
        const { prisma } = context;

        return prisma.modelProcessingActionStep.findOne({ where: { idModelProcessingActionStep: Number.parseInt(idModelProcessingActionStep) } }).Vocabulary();
    }
};

export default ModelProcessingActionStep;
