/**
 * Type resolver for LicenseAssignment
 */
import { License, LicenseAssignment, User } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { fetchUserForLicenseAssignmentID, fetchLicenseForLicenseAssignmentID } from '../../../../../db';
import { parseLicense } from './License';
import { parseUser } from '../../../user/resolvers/types/User';

const LicenseAssignment = {
    License: async (parent: Parent, _: Args, context: Context): Promise<License | null> => {
        const { idLicenseAssignment } = parent;
        const { prisma } = context;

        return resolveLicenseByLicenseAssignmentID(prisma, Number.parseInt(idLicenseAssignment));
    },
    UserCreator: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idLicenseAssignment } = parent;
        const { prisma } = context;

        return resolveUserCreatorByLicenseAssignmentID(prisma, Number.parseInt(idLicenseAssignment));
    }
};

export async function resolveLicenseByLicenseAssignmentID(prisma: PrismaClient, idLicenseAssignment: number): Promise<License | null> {
    const foundLicense = await fetchLicenseForLicenseAssignmentID(prisma, idLicenseAssignment);

    return parseLicense(foundLicense);
}

export async function resolveUserCreatorByLicenseAssignmentID(prisma: PrismaClient, idLicenseAssignment: number): Promise<User | null> {
    const foundUser = await fetchUserForLicenseAssignmentID(prisma, idLicenseAssignment);

    return parseUser(foundUser);
}

export function parseLicenseAssignments(foundLicenseAssignments: DB.LicenseAssignment[] | null): LicenseAssignment[] | null {
    let licenseAssignments;
    if (foundLicenseAssignments) {
        licenseAssignments = foundLicenseAssignments.map(licenseAssignment => parseLicenseAssignment(licenseAssignment));
    }

    return licenseAssignments;
}

export function parseLicenseAssignment(foundLicenseAssignment: DB.LicenseAssignment | null): LicenseAssignment | null {
    let licenseAssignment;
    if (foundLicenseAssignment) {
        const { idLicenseAssignment, DateStart, DateEnd } = foundLicenseAssignment;
        licenseAssignment = {
            idLicenseAssignment: String(idLicenseAssignment),
            DateStart,
            DateEnd
        };
    }

    return licenseAssignment;
}

export default LicenseAssignment;
