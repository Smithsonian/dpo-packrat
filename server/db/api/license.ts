/* eslint-disable camelcase */
import { PrismaClient, License, LicenseAssignment, User } from '@prisma/client';

export async function fetchLicense(prisma: PrismaClient, idLicense: number): Promise<License | null> {
    return prisma.license.findOne({ where: { idLicense } });
}

export async function fetchLicenseAssignmentsForLicenseID(prisma: PrismaClient, idLicense: number): Promise<LicenseAssignment[] | null> {
    return prisma.license.findOne({ where: { idLicense } }).LicenseAssignment();
}

export async function fetchLicenseForLicenseAssignmentID(prisma: PrismaClient, idLicenseAssignment: number): Promise<License | null> {
    return prisma.licenseAssignment.findOne({ where: { idLicenseAssignment } }).License();
}

export async function fetchUserForLicenseAssignmentID(prisma: PrismaClient, idLicenseAssignment: number): Promise<User | null> {
    return prisma.licenseAssignment.findOne({ where: { idLicenseAssignment } }).User();
}


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
