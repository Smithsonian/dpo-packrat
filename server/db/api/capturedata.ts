/* eslint-disable camelcase */
import { PrismaClient, CaptureData, CaptureDataFile, CaptureDataGroup, CaptureDataGroupCaptureDataXref } from '@prisma/client';

export async function createCaptureData(prisma: PrismaClient, captureData: CaptureData): Promise<CaptureData> {
    const { idVCaptureMethod, idVCaptureDatasetType, DateCaptured, Description, CaptureDatasetFieldID, idVItemPositionType,
        ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
        ClusterGeometryFieldID, CameraSettingsUniform, idAssetThumbnail } = captureData;
    const createSystemObject: CaptureData = await prisma.captureData.create({
        data: {
            Vocabulary_CaptureData_idVCaptureMethodToVocabulary:            { connect: { idVocabulary: idVCaptureMethod }, },
            Vocabulary_CaptureData_idVCaptureDatasetTypeToVocabulary:       { connect: { idVocabulary: idVCaptureDatasetType }, },
            DateCaptured,
            Description,
            CaptureDatasetFieldID,
            Vocabulary_CaptureData_idVItemPositionTypeToVocabulary:         idVItemPositionType ? { connect: { idVocabulary: idVItemPositionType }, } : undefined,
            ItemPositionFieldID,
            ItemArrangementFieldID,
            Vocabulary_CaptureData_idVFocusTypeToVocabulary:                idVFocusType ? { connect: { idVocabulary: idVFocusType }, } : undefined,
            Vocabulary_CaptureData_idVLightSourceTypeToVocabulary:          idVLightSourceType ? { connect: { idVocabulary: idVLightSourceType }, } : undefined,
            Vocabulary_CaptureData_idVBackgroundRemovalMethodToVocabulary:  idVBackgroundRemovalMethod ? { connect: { idVocabulary: idVBackgroundRemovalMethod }, } : undefined,
            Vocabulary_CaptureData_idVClusterTypeToVocabulary:              idVClusterType ? { connect: { idVocabulary: idVClusterType }, } : undefined,
            ClusterGeometryFieldID,
            CameraSettingsUniform,
            Asset:                                                          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
            SystemObject:                                                   { create: { Retired: 0 }, },
        },
    });

    return createSystemObject;
}

export async function createCaptureDataFile(prisma: PrismaClient, captureDataFile: CaptureDataFile): Promise<CaptureDataFile> {
    const { idCaptureData, idAsset, idVVariantType, CompressedMultipleFiles } = captureDataFile;
    const createSystemObject: CaptureDataFile = await prisma.captureDataFile.create({
        data: {
            CaptureData:    { connect: { idCaptureData }, },
            Asset:          { connect: { idAsset }, },
            Vocabulary:     { connect: { idVocabulary: idVVariantType }, },
            CompressedMultipleFiles
        },
    });

    return createSystemObject;
}

export async function createCaptureDataGroup(prisma: PrismaClient): Promise<CaptureDataGroup> {
    const createSystemObject: CaptureDataGroup = await prisma.captureDataGroup.create({
        data: {
        },
    });

    return createSystemObject;
}

export async function createCaptureDataGroupCaptureDataXref(prisma: PrismaClient, captureDataGroupCaptureDataXref: CaptureDataGroupCaptureDataXref): Promise<CaptureDataGroupCaptureDataXref> {
    const { idCaptureDataGroup, idCaptureData } = captureDataGroupCaptureDataXref;
    const createSystemObject: CaptureDataGroupCaptureDataXref = await prisma.captureDataGroupCaptureDataXref.create({
        data: {
            CaptureDataGroup:   { connect: { idCaptureDataGroup }, },
            CaptureData:        { connect: { idCaptureData }, }
        },
    });

    return createSystemObject;
}