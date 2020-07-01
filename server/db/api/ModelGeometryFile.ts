/* eslint-disable camelcase */
import { PrismaClient, ModelGeometryFile } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createModelGeometryFile(prisma: PrismaClient, modelGeometryFile: ModelGeometryFile): Promise<ModelGeometryFile | null> {
    let createSystemObject: ModelGeometryFile;
    const { idModel, idAsset, idVModelFileType, Roughness, Metalness, PointCount, FaceCount, IsWatertight, HasNormals, HasVertexColor, HasUVSpace,
        BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z } = modelGeometryFile;
    try {
        createSystemObject = await prisma.modelGeometryFile.create({
            data: {
                Model:          { connect: { idModel }, },
                Asset:          { connect: { idAsset }, },
                Vocabulary:     { connect: { idVocabulary: idVModelFileType }, },
                Roughness, Metalness, PointCount, FaceCount, IsWatertight, HasNormals, HasVertexColor, HasUVSpace,
                BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createModelGeometryFile', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchModelGeometryFile(prisma: PrismaClient, idModelGeometryFile: number): Promise<ModelGeometryFile | null> {
    try {
        return await prisma.modelGeometryFile.findOne({ where: { idModelGeometryFile, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelGeometryFile', error);
        return null;
    }
}

export async function fetchModelGeometryFileFromModel(prisma: PrismaClient, idModel: number): Promise<ModelGeometryFile[] | null> {
    try {
        return await prisma.modelGeometryFile.findMany({ where: { idModel } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelGeometryFileFromModel', error);
        return null;
    }
}