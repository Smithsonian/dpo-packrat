/* eslint-disable camelcase */
import { PrismaClient, CaptureData, SystemObject, Vocabulary, Asset, CaptureDataGroup, CaptureDataFile } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createCaptureData(prisma: PrismaClient, captureData: CaptureData): Promise<CaptureData | null> {
    let createSystemObject: CaptureData;
    const { idVCaptureMethod, idVCaptureDatasetType, DateCaptured, Description, CaptureDatasetFieldID, idVItemPositionType,
        ItemPositionFieldID, ItemArrangementFieldID, idVFocusType, idVLightSourceType, idVBackgroundRemovalMethod, idVClusterType,
        ClusterGeometryFieldID, CameraSettingsUniform, idAssetThumbnail } = captureData;
    try {
        createSystemObject = await prisma.captureData.create({
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
                SystemObject:                                                   { create: { Retired: false }, },
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createCaptureData', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchCaptureData(prisma: PrismaClient, idCaptureData: number): Promise<CaptureData | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureData', error);
        return null;
    }
}

export async function fetchVCaptureMethodForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVCaptureMethodToVocabulary();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVCaptureMethodForCaptureDataID', error);
        return null;
    }
}

export async function fetchVCaptureDatasetTypeForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVCaptureDatasetTypeToVocabulary();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVCaptureDatasetTypeForCaptureDataID', error);
        return null;
    }
}

export async function fetchVItemPositionTypeForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVItemPositionTypeToVocabulary();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVItemPositionTypeForCaptureDataID', error);
        return null;
    }
}

export async function fetchVFocusTypeForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVFocusTypeToVocabulary();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVFocusTypeForCaptureDataID', error);
        return null;
    }
}

export async function fetchVLightSourceTypeForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVLightSourceTypeToVocabulary();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVLightSourceTypeForCaptureDataID', error);
        return null;
    }
}

export async function fetchVBackgroundRemovalMethodForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVBackgroundRemovalMethodToVocabulary();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVBackgroundRemovalMethodForCaptureDataID', error);
        return null;
    }
}

export async function fetchVClusterTypeForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Vocabulary | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData } }).Vocabulary_CaptureData_idVClusterTypeToVocabulary();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVClusterTypeForCaptureDataID', error);
        return null;
    }
}

export async function fetchAssetForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<Asset | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData } }).Asset();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAssetThumbnailForCaptureDataID', error);
        return null;
    }
}

export async function fetchCaptureDataGroupForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<CaptureDataGroup[] | null> {
    try {
        // TODO: FIXME: discuss xref many-many with Jon
        return await prisma.captureDataGroupCaptureDataXref.findOne({ where: { idCaptureData } }).CaptureDataGroup()[0];
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataGroupForCaptureDataID', error);
        return null;
    }
}

export async function fetchCaptureDataFileForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<CaptureDataFile[] | null> {
    try {
        return await prisma.captureData.findOne({ where: { idCaptureData } }).CaptureDataFile();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataFileForCaptureDataID', error);
        return null;
    }
}

export async function fetchSystemObjectForCaptureData(prisma: PrismaClient, sysObj: CaptureData): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idCaptureData: sysObj.idCaptureData, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForCaptureData', error);
        return null;
    }
}

export async function fetchSystemObjectForCaptureDataID(prisma: PrismaClient, idCaptureData: number): Promise<SystemObject | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idCaptureData, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectForCaptureDataID', error);
        return null;
    }
}

export async function fetchSystemObjectAndCaptureData(prisma: PrismaClient, idCaptureData: number): Promise<SystemObject & { CaptureData: CaptureData | null} | null> {
    try {
        return await prisma.systemObject.findOne({ where: { idCaptureData, }, include: { CaptureData: true, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchSystemObjectAndCaptureData', error);
        return null;
    }
}
