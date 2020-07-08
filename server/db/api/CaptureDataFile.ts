import { PrismaClient, CaptureDataFile } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createCaptureDataFile(prisma: PrismaClient, captureDataFile: CaptureDataFile): Promise<CaptureDataFile | null> {
    let createSystemObject: CaptureDataFile;
    const { idCaptureData, idAsset, idVVariantType, CompressedMultipleFiles } = captureDataFile;
    try {
        createSystemObject = await prisma.captureDataFile.create({
            data: {
                CaptureData:    { connect: { idCaptureData }, },
                Asset:          { connect: { idAsset }, },
                Vocabulary:     { connect: { idVocabulary: idVVariantType }, },
                CompressedMultipleFiles
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createCaptureDataFile', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchCaptureDataFile(prisma: PrismaClient, idCaptureDataFile: number): Promise<CaptureDataFile | null> {
    try {
        return await prisma.captureDataFile.findOne({ where: { idCaptureDataFile, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataFile', error);
        return null;
    }
}

export async function fetchCaptureDataFileFromCaptureData(prisma: PrismaClient, idCaptureData: number): Promise<CaptureDataFile[] | null> {
    try {
        return await prisma.captureDataFile.findMany({ where: { idCaptureData } });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataFileFromCaptureData', error);
        return null;
    }
}