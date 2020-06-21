/* eslint-disable camelcase */
import { PrismaClient, Model, ModelGeometryFile, ModelProcessingAction, ModelProcessingActionStep,
    ModelSceneXref, ModelUVMapChannel, ModelUVMapFile } from '@prisma/client';
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