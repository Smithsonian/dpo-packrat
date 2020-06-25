/* eslint-disable camelcase */
import { PrismaClient, LicenseAssignment } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createLicenseAssignment(prisma: PrismaClient, licenseAssignment: LicenseAssignment): Promise<LicenseAssignment | null> {
    let createSystemObject: LicenseAssignment;
    const { idLicense, idUserCreator, DateStart, DateEnd, idSystemObject } = licenseAssignment;
    try {
        createSystemObject = await prisma.licenseAssignment.create({
            data: {
                License:        { connect: { idLicense }, },
                User:           idUserCreator ? { connect: { idUser: idUserCreator }, } : undefined,
                DateStart,
                DateEnd,
                SystemObject:   idSystemObject ? { connect: { idSystemObject }, } : undefined
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createLicenseAssignment', error);
        return null;
    }
    return createSystemObject;
}

export async function fetchLicenseAssignment(prisma: PrismaClient, idLicenseAssignment: number): Promise<LicenseAssignment | null> {
    try {
        return await prisma.licenseAssignment.findOne({ where: { idLicenseAssignment, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchLicenseAssignment', error);
        return null;
    }
}
