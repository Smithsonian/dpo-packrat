/* eslint-disable camelcase */
import { PrismaClient, Model, ModelGeometryFile, ModelProcessingAction, ModelProcessingActionStep,
    ModelSceneXref, ModelUVMapChannel, ModelUVMapFile } from '@prisma/client';

export async function createModel(prisma: PrismaClient, model: Model): Promise<Model> {
    const { DateCreated, idVCreationMethod, Master, Authoritative, idVModality, idVUnits, idVPurpose, idAssetThumbnail } = model;
    const createSystemObject: Model = await prisma.model.create({
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

    return createSystemObject;
}

export async function createModelGeometryFile(prisma: PrismaClient, modelGeometryFile: ModelGeometryFile): Promise<ModelGeometryFile> {
    const { idModel, idAsset, idVModelFileType, Roughness, Metalness, PointCount, FaceCount, IsWatertight, HasNormals, HasVertexColor, HasUVSpace,
        BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z } = modelGeometryFile;
    const createSystemObject: ModelGeometryFile = await prisma.modelGeometryFile.create({
        data: {
            Model:          { connect: { idModel }, },
            Asset:          { connect: { idAsset }, },
            Vocabulary:     { connect: { idVocabulary: idVModelFileType }, },
            Roughness, Metalness, PointCount, FaceCount, IsWatertight, HasNormals, HasVertexColor, HasUVSpace,
            BoundingBoxP1X, BoundingBoxP1Y, BoundingBoxP1Z, BoundingBoxP2X, BoundingBoxP2Y, BoundingBoxP2Z,
        },
    });

    return createSystemObject;
}

export async function createModelProcessingAction(prisma: PrismaClient, modelProcessingAction: ModelProcessingAction): Promise<ModelProcessingAction> {
    const { idModel, idActor, DateProcessed, ToolsUsed, Description } = modelProcessingAction;
    const createSystemObject: ModelProcessingAction = await prisma.modelProcessingAction.create({
        data: {
            Model:          { connect: { idModel }, },
            Actor:          { connect: { idActor }, },
            DateProcessed,
            ToolsUsed,
            Description,
        },
    });

    return createSystemObject;
}

export async function createModelProcessingActionStep(prisma: PrismaClient, modelProcessingActionStep: ModelProcessingActionStep): Promise<ModelProcessingActionStep> {
    const { idModelProcessingAction, idVActionMethod, Description } = modelProcessingActionStep;
    const createSystemObject: ModelProcessingActionStep = await prisma.modelProcessingActionStep.create({
        data: {
            ModelProcessingAction:  { connect: { idModelProcessingAction }, },
            Vocabulary:             { connect: { idVocabulary: idVActionMethod }, },
            Description,
        },
    });

    return createSystemObject;
}

export async function createModelSceneXref(prisma: PrismaClient, modelSceneXref: ModelSceneXref): Promise<ModelSceneXref> {
    const { idModel, idScene, TS0, TS1, TS2, R0, R1, R2, R3 } = modelSceneXref;
    const createSystemObject: ModelSceneXref = await prisma.modelSceneXref.create({
        data: {
            Model:  { connect: { idModel }, },
            Scene:  { connect: { idScene }, },
            TS0, TS1, TS2, R0, R1, R2, R3,
        },
    });

    return createSystemObject;
}

export async function createModelUVMapChannel(prisma: PrismaClient, modelUVMapChannel: ModelUVMapChannel): Promise<ModelUVMapChannel> {
    const { idModelUVMapFile, ChannelPosition, ChannelWidth, idVUVMapType } = modelUVMapChannel;
    const createSystemObject: ModelUVMapChannel = await prisma.modelUVMapChannel.create({
        data: {
            ModelUVMapFile:  { connect: { idModelUVMapFile }, },
            ChannelPosition, ChannelWidth,
            Vocabulary: { connect: { idVocabulary: idVUVMapType }, },
        },
    });

    return createSystemObject;
}

export async function createModelUVMapFile(prisma: PrismaClient, modelUVMapFile: ModelUVMapFile): Promise<ModelUVMapFile> {
    const { idModelGeometryFile, idAsset, UVMapEdgeLength } = modelUVMapFile;
    const createSystemObject: ModelUVMapFile = await prisma.modelUVMapFile.create({
        data: {
            ModelGeometryFile:  { connect: { idModelGeometryFile }, },
            Asset:              { connect: { idAsset }, },
            UVMapEdgeLength,
        },
    });

    return createSystemObject;
}