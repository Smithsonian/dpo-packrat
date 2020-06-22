/* eslint-disable camelcase */
import { PrismaClient, ModelProcessingAction } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createModelProcessingAction(prisma: PrismaClient, modelProcessingAction: ModelProcessingAction): Promise<ModelProcessingAction | null> {
    let createSystemObject: ModelProcessingAction;
    const { idModel, idActor, DateProcessed, ToolsUsed, Description } = modelProcessingAction;
    try {
        createSystemObject = await prisma.modelProcessingAction.create({
            data: {
                Model:          { connect: { idModel }, },
                Actor:          { connect: { idActor }, },
                DateProcessed,
                ToolsUsed,
                Description,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createModelProcessingAction', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchModelProcessingAction(prisma: PrismaClient, idModelProcessingAction: number): Promise<ModelProcessingAction | null> {
    try {
        return await prisma.modelProcessingAction.findOne({ where: { idModelProcessingAction, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelProcessingAction', error);
        return null;
    }
}