/**
 * Type resolver for License
 */
import { License, LicenseAssignment } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { fetchLicenseAssignmentsForLicenseID } from '../../../../../db';
import { parseLicenseAssignments } from './LicenseAssignment';

const License = {
    licenseAssignments: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveLicenseAssignmentsByLicenseID(prisma, Number.parseInt(id));
    }
};

export async function resolveLicenseAssignmentsByLicenseID(prisma: PrismaClient, licenseId: number): Promise<LicenseAssignment[] | null> {
    const foundLicenseAssignments = await fetchLicenseAssignmentsForLicenseID(prisma, licenseId);

    return parseLicenseAssignments(foundLicenseAssignments);
}

export function parseLicense(foundLicense: DB.License | null): License | null {
    let license;

    if (foundLicense) {
        const { idLicense, Name, Description } = foundLicense;
        license = {
            id: String(idLicense),
            name: Name,
            description: Description
        };
    }

    return license;
}

export default License;
