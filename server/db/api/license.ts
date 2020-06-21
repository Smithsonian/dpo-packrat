/* eslint-disable camelcase */
import { PrismaClient, License, LicenseAssignment } from '@prisma/client';
import * as LOG from '../../utils/logger';

export async function createLicense(prisma: PrismaClient, license: License): Promise<License | null> {
    let createSystemObject: License;
    const { Name, Description } = license;
    try {
        createSystemObject = await prisma.license.create({
            data: {
                Name,
                Description
            },
        });
    } catch (error) {
        LOG.logger.error('DBAPI.createLicense', error);
        return null;
    }
    return createSystemObject;
}

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
