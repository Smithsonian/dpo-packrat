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
        const { idLicense } = parent;
        const { prisma } = context;

        return resolveLicenseAssignmentByLicenseID(prisma, Number.parseInt(idLicense));
    }
};

export async function resolveLicenseByID(prisma: PrismaClient, idLicense: number): Promise<License | null> {
    const foundLicense = await fetchLicense(prisma, idLicense);

    return parseLicense(foundLicense);
}

export async function resolveLicenseAssignmentByLicenseID(prisma: PrismaClient, idLicense: number): Promise<LicenseAssignment[] | null> {
    const foundLicenseAssignments = await fetchLicenseAssignmentForLicenseID(prisma, idLicense);

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
