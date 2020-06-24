/* eslint-disable camelcase */
import { PrismaClient, CaptureDataGroup, CaptureData } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createCaptureDataGroup(prisma: PrismaClient): Promise<CaptureDataGroup | null> {
    let createSystemObject: CaptureDataGroup;
    try {
        createSystemObject = await prisma.captureDataGroup.create({
            data: {
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createCaptureDataGroup', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchCaptureDataGroup(prisma: PrismaClient, idCaptureDataGroup: number): Promise<CaptureDataGroup | null> {
    try {
        return await prisma.captureDataGroup.findOne({ where: { idCaptureDataGroup, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataGroup', error);
        return null;
    }
}

export async function fetchCaptureDataForCaptureDataGroupID(prisma: PrismaClient, idCaptureDataGroup: number): Promise<CaptureData[] | null> {
    try {
        // TODO: FIXME: discuss xref many-many with Jon
        return await prisma.captureDataGroupCaptureDataXref.findOne({ where: { idCaptureDataGroup } }).CaptureData()[0];
    } catch (error) {
        LOG.logger.error('DBAPI.fetchCaptureDataForCaptureDataGroupID', error);
        return null;
    }
}