/* eslint-disable camelcase */
import { PrismaClient, ModelProcessingActionStep } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createModelProcessingActionStep(prisma: PrismaClient, modelProcessingActionStep: ModelProcessingActionStep): Promise<ModelProcessingActionStep | null> {
    let createSystemObject: ModelProcessingActionStep;
    const { idModelProcessingAction, idVActionMethod, Description } = modelProcessingActionStep;
    try {
        createSystemObject = await prisma.modelProcessingActionStep.create({
            data: {
                ModelProcessingAction:  { connect: { idModelProcessingAction }, },
                Vocabulary:             { connect: { idVocabulary: idVActionMethod }, },
                Description,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createModelProcessingActionStep', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchModelProcessingActionStep(prisma: PrismaClient, idModelProcessingActionStep: number): Promise<ModelProcessingActionStep | null> {
    try {
        return await prisma.modelProcessingActionStep.findOne({ where: { idModelProcessingActionStep, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelProcessingActionStep', error);
        return null;
    }
}

export async function fetchModelProcessingActionStepFromModelProcessingAction(prisma: PrismaClient, idModelProcessingAction: number): Promise<ModelProcessingActionStep[] | null> {
    try {
        return await prisma.modelProcessingActionStep.findMany({ where: { idModelProcessingAction } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelProcessingActionStepFromModelProcessingAction', error);
        return null;
    }
}
