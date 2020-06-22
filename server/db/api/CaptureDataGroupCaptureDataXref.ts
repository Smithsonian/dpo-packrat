/* eslint-disable camelcase */
import { PrismaClient, CaptureDataGroupCaptureDataXref } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createCaptureDataGroupCaptureDataXref(prisma: PrismaClient, captureDataGroupCaptureDataXref: CaptureDataGroupCaptureDataXref): Promise<CaptureDataGroupCaptureDataXref | null> {
    let createSystemObject: CaptureDataGroupCaptureDataXref;
    const { idCaptureDataGroup, idCaptureData } = captureDataGroupCaptureDataXref;
    try {
        createSystemObject = await prisma.captureDataGroupCaptureDataXref.create({
            data: {
                CaptureDataGroup:   { connect: { idCaptureDataGroup }, },
                CaptureData:        { connect: { idCaptureData }, }
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createCaptureDataGroupCaptureDataXref', error);
        return null;
    }

    return createSystemObject;
}

export async function fetchCaptureDataGroupCaptureDataXref(prisma: PrismaClient, idCaptureDataGroupCaptureDataXref: number): Promise<CaptureDataGroupCaptureDataXref | null> {
    try {
        return await prisma.captureDataGroupCaptureDataXref.findOne({ where: { idCaptureDataGroupCaptureDataXref, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataGroupCaptureDataXref', error);
        return null;
    }
}