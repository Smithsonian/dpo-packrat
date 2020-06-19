/* eslint-disable camelcase */
import { PrismaClient, License, LicenseAssignment } from '@prisma/client';

export async function createLicense(prisma: PrismaClient, license: License): Promise<License> {
    const { Name, Description } = license;
    const createSystemObject: License = await prisma.license.create({
        data: {
            Name,
            Description
        },
    });

    return createSystemObject;
}

export async function createLicenseAssignment(prisma: PrismaClient, licenseAssignment: LicenseAssignment): Promise<LicenseAssignment> {
    const { idLicense, idUserCreator, DateStart, DateEnd, idSystemObject } = licenseAssignment;
    const createSystemObject: LicenseAssignment = await prisma.licenseAssignment.create({
        data: {
            License:        { connect: { idLicense }, },
            User:           idUserCreator ? { connect: { idUser: idUserCreator }, } : undefined,
            DateStart,
            DateEnd,
            SystemObject:   idSystemObject ? { connect: { idSystemObject }, } : undefined
        },
    });

    return createSystemObject;
}
