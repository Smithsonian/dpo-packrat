/* eslint-disable camelcase */
import { PrismaClient, Model, SystemObject } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createModel(prisma: PrismaClient, model: Model): Promise<Model | null> {
    let createSystemObject: Model;
    const { DateCreated, idVCreationMethod, Master, Authoritative, idVModality, idVUnits, idVPurpose, idAssetThumbnail } = model;
    try {
        createSystemObject = await prisma.model.create({
            data: {
                DateCreated,
                Vocabulary_Model_idVCreationMethodToVocabulary: { connect: { idVocabulary: idVCreationMethod }, },
                Master,
                Authoritative,
                Vocabulary_Model_idVModalityToVocabulary:       { connect: { idVocabulary: idVModality }, },
                Vocabulary_Model_idVUnitsToVocabulary:          { connect: { idVocabulary: idVUnits }, },
                Vocabulary_Model_idVPurposeToVocabulary:        { connect: { idVocabulary: idVPurpose }, },
                Asset:                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                SystemObject:   { create: { Retired: 0 }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createModel', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchModel(prisma: PrismaClient, idModel: number): Promise<Model | null> {
    try {
        return await prisma.model.findOne({ where: { idModel, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchModel', error);
        return null;
    }
}

export async function fetchSystemObjectForModel(prisma: PrismaClient, sysObj: Model): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idModel: sysObj.idModel, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForModel', error);
        return null;
    }
}

export async function fetchSystemObjectForModelID(prisma: PrismaClient, idModel: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idModel, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForModelID', error);
        return null;
    }
}

export async function fetchSystemObjectAndModel(prisma: PrismaClient, idModel: number): Promise<SystemObject & { Model: Model | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idModel, }, include: { Model: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndModel', error);
        return null;
    }
}
