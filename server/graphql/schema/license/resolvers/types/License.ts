/**
 * Type resolver for License
 */
import { License, LicenseAssignment } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { fetchLicenseAssignmentForLicenseID, fetchLicense } from '../../../../../db';
import { parseLicenseAssignments } from './LicenseAssignment';

const License = {
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveLicenseAssignmentByLicenseID(prisma, Number.parseInt(id));
    }
};

export async function resolveLicenseByID(prisma: PrismaClient, licenseId: number): Promise<License | null> {
    const foundLicense = await fetchLicense(prisma, licenseId);

    return parseLicense(foundLicense);
}

export async function resolveLicenseAssignmentByLicenseID(prisma: PrismaClient, licenseId: number): Promise<LicenseAssignment[] | null> {
    const foundLicenseAssignments = await fetchLicenseAssignmentForLicenseID(prisma, licenseId);

    return parseLicenseAssignments(foundLicenseAssignments);
}

export function parseLicense(foundLicense: DB.License | null): License | null {
    let license;

    if (foundLicense) {
        const { idLicense, Name, Description } = foundLicense;
        license = {
            idLicense: String(idLicense),
            Name,
            Description
        };
    }

    return license;
}

export default License;
