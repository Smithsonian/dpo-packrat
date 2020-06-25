/**
 * Type resolver for LicenseAssignment
 */

import { License, LicenseAssignment, User } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const LicenseAssignment = {
    License: async (parent: Parent, _: Args, context: Context): Promise<License | null> => {
        const { idLicenseAssignment } = parent;
        const { prisma } = context;

        return prisma.licenseAssignment.findOne({ where: { idLicenseAssignment: Number.parseInt(idLicenseAssignment) } }).License();
    },
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idLicenseAssignment } = parent;
        const { prisma } = context;

        return prisma.licenseAssignment.findOne({ where: { idLicenseAssignment: Number.parseInt(idLicenseAssignment) } }).User();
    }
};

export default LicenseAssignment;
