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

export async function fetchLicense(prisma: PrismaClient, idLicense: number): Promise<License | null> {
    try {
        return await prisma.license.findOne({ where: { idLicense, }, });
    } catch (error) {
        LOG.logger.error('DBAPI.fetchLicense', error);
        return null;
    }
}

export async function fetchLicenseAssignmentForLicenseID(prisma: PrismaClient, idLicense: number): Promise<LicenseAssignment[] | null> {
    try {
        return await prisma.license.findOne({ where: { idLicense } }).LicenseAssignment();
    } catch (error) {
        LOG.logger.error('DBAPI.fetchLicenseAssignmentForLicenseID', error);
        return null;
    }
}
