/* eslint-disable camelcase */
import { PrismaClient, ModelSceneXref } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createModelSceneXref(prisma: PrismaClient, modelSceneXref: ModelSceneXref): Promise<ModelSceneXref | null> {
    let createSystemObject: ModelSceneXref;
    const { idModel, idScene, TS0, TS1, TS2, R0, R1, R2, R3 } = modelSceneXref;
    try {
        createSystemObject = await prisma.modelSceneXref.create({
            data: {
                Model:  { connect: { idModel }, },
                Scene:  { connect: { idScene }, },
                TS0, TS1, TS2, R0, R1, R2, R3,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createModelSceneXref', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchModelSceneXref(prisma: PrismaClient, idModelSceneXref: number): Promise<ModelSceneXref | null> {
    try {
        return await prisma.modelSceneXref.findOne({ where: { idModelSceneXref, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelSceneXref', error);
        return null;
    }
}