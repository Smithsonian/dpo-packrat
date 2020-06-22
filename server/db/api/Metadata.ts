/* eslint-disable camelcase */
import { PrismaClient, Metadata } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createMetadata(prisma: PrismaClient, metadata: Metadata): Promise<Metadata | null> {
    let createSystemObject: Metadata;
    const { Name, ValueShort, ValueExtended, idAssetValue, idUser, idVMetadataSource, idSystemObject } = metadata;
    try {
        createSystemObject = await prisma.metadata.create({
            data: {
                Name,
                ValueShort:     ValueShort          ? ValueShort : undefined,
                ValueExtended:  ValueExtended       ? ValueExtended : undefined,
                Asset:          idAssetValue        ? { connect: { idAsset: idAssetValue }, } : undefined,
                User:           idUser              ? { connect: { idUser }, } : undefined,
                Vocabulary:     idVMetadataSource   ? { connect: { idVocabulary: idVMetadataSource }, } : undefined,
                SystemObject:   idSystemObject      ? { connect: { idSystemObject }, } : undefined,
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createMetadata', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchMetadata(prisma: PrismaClient, idMetadata: number): Promise<Metadata | null> {
    try {
        return await prisma.metadata.findOne({ where: { idMetadata, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchMetadata', error);
        return null;
    }
}