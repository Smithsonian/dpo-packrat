/* eslint-disable camelcase */
import { PrismaClient, ModelUVMapChannel } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createModelUVMapChannel(prisma: PrismaClient, modelUVMapChannel: ModelUVMapChannel): Promise<ModelUVMapChannel | null> {
    let createSystemObject: ModelUVMapChannel;
    const { idModelUVMapFile, ChannelPosition, ChannelWidth, idVUVMapType } = modelUVMapChannel;
    try {
        createSystemObject = await prisma.modelUVMapChannel.create({
            data: {
                ModelUVMapFile:  { connect: { idModelUVMapFile }, },
                ChannelPosition, ChannelWidth,
                Vocabulary: { connect: { idVocabulary: idVUVMapType }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createModelUVMapChannel', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchModelUVMapChannel(prisma: PrismaClient, idModelUVMapChannel: number): Promise<ModelUVMapChannel | null> {
    try {
        return await prisma.modelUVMapChannel.findOne({ where: { idModelUVMapChannel, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelUVMapChannel', error);
        return null;
    }
}

export async function fetchModelUVMapChannelFromModelUVMapFile(prisma: PrismaClient, idModelUVMapFile: number): Promise<ModelUVMapChannel[] | null> {
    try {
        return await prisma.modelUVMapChannel.findMany({ where: { idModelUVMapFile } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModelUVMapChannelFromModelUVMapFile', error);
        return null;
    }
}