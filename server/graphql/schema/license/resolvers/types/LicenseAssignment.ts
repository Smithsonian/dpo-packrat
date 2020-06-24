/**
 * Type resolver for LicenseAssignment
 */
import { License, LicenseAssignment, User } from '../../../../../types/graphql';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { fetchUserForLicenseAssignmentID, fetchLicenseForLicenseAssignmentID, fetchLicenseAssignmentForUserID } from '../../../../../db';
import { parseLicense } from './License';
import { parseUser } from '../../../user/resolvers/types/User';

const LicenseAssignment = {
    License: async (parent: Parent, _: Args, context: Context): Promise<License | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveLicenseByLicenseAssignmentID(prisma, Number.parseInt(id));
    },
    UserCreator: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveUserCreatorByLicenseAssignmentID(prisma, Number.parseInt(id));
    }
};

export async function resolveLicenseByLicenseAssignmentID(prisma: PrismaClient, licenseAssignmentId: number): Promise<License | null> {
    const foundLicense = await fetchLicenseForLicenseAssignmentID(prisma, licenseAssignmentId);

    return parseLicense(foundLicense);
}

export async function resolveUserCreatorByLicenseAssignmentID(prisma: PrismaClient, licenseAssignmentId: number): Promise<User | null> {
    const foundUser = await fetchUserForLicenseAssignmentID(prisma, licenseAssignmentId);

    return parseUser(foundUser);
}

export async function resolveLicenseAssignmentByUserID(prisma: PrismaClient, idUser: number): Promise<LicenseAssignment[] | null> {
    const foundLicenseAssignments = await fetchLicenseAssignmentForUserID(prisma, idUser);

    return parseLicenseAssignments(foundLicenseAssignments);
}

export function parseLicenseAssignments(foundLicenseAssignments: DB.LicenseAssignment[] | null): LicenseAssignment[] | null {
    let licenseAssignments;
    if (foundLicenseAssignments) {
        licenseAssignments = foundLicenseAssignments.map(licenseAssignment => {
            const { idLicense, DateStart, DateEnd } = licenseAssignment;

            return {
                idLicense: String(idLicense),
                DateStart,
                DateEnd
            };
        });

        return licenseAssignments;
    }

    return licenseAssignments;
}

export default LicenseAssignment;
