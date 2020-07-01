/* eslint-disable camelcase */
import { PrismaClient, ModelUVMapFile } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createModelUVMapFile(prisma: PrismaClient, modelUVMapFile: ModelUVMapFile): Promise<ModelUVMapFile | null> {
    let createSystemObject: ModelUVMapFile;
    const { idModelGeometryFile, idAsset, UVMapEdgeLength } = modelUVMapFile;
    try {
        createSystemObject = await prisma.modelUVMapFile.create({
            data: {
                ModelGeometryFile:  { connect: { idModelGeometryFile }, },
                Asset:              { connect: { idAsset }, },
                UVMapEdgeLength,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createModelUVMapFile', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchModelUVMapFile(prisma: PrismaClient, idModelUVMapFile: number): Promise<ModelUVMapFile | null> {
    try {
        return await prisma.modelUVMapFile.findOne({ where: { idModelUVMapFile, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelUVMapFile', error);
        return null;
    }
}

export async function fetchModelUVMapFileFromModelGeometryFile(prisma: PrismaClient, idModelGeometryFile: number): Promise<ModelUVMapFile[] | null> {
    try {
        return await prisma.modelUVMapFile.findMany({ where: { idModelGeometryFile } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelUVMapFileFromModelGeometryFile', error);
        return null;
    }
}