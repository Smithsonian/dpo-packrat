import { PrismaClient, CaptureDataFile, CaptureData, Asset, Vocabulary } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createCaptureDataFile(prisma: PrismaClient, captureDataFile: CaptureDataFile): Promise<CaptureDataFile | null> {
    let createSystemObject: CaptureDataFile;
    const { idCaptureData, idAsset, idVVariantType, CompressedMultipleFiles } = captureDataFile;
    try {
        createSystemObject = await prisma.captureDataFile.create({
            data: {
                CaptureData: { connect: { idCaptureData } },
                Asset: { connect: { idAsset } },
                Vocabulary: { connect: { idVocabulary: idVVariantType } },
                CompressedMultipleFiles
            }
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createCaptureDataFile', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchCaptureDataFile(prisma: PrismaClient, idCaptureDataFile: number): Promise<CaptureDataFile | null> {
    try {
        return await prisma.captureDataFile.findOne({ where: { idCaptureDataFile } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataFile', error);
        return null;
    }
}

export async function fetchCaptureDataByCaptureDataFileID(prisma: PrismaClient, idCaptureDataFile: number): Promise<CaptureData | null> {
    try {
        return await prisma.captureDataFile.findOne({ where: { idCaptureDataFile } }).CaptureData();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataByCaptureDataFileID', error);
        return null;
    }
}

export async function fetchAssetByCaptureDataFileID(prisma: PrismaClient, idCaptureDataFile: number): Promise<Asset | null> {
    try {
        return await prisma.captureDataFile.findOne({ where: { idCaptureDataFile } }).Asset();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchAssetByCaptureDataFileID', error);
        return null;
    }
}

export async function fetchVocabularyByCaptureDataFileID(prisma: PrismaClient, idCaptureDataFile: number): Promise<Vocabulary | null> {
    try {
        return await prisma.captureDataFile.findOne({ where: { idCaptureDataFile } }).Vocabulary();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchVocabularyByCaptureDataFileID', error);
        return null;
    }
}
