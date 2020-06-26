/**
 * Type resolver for LicenseAssignment
 */

import { License, LicenseAssignment, SystemObject, User } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const LicenseAssignment = {
    License: async (parent: Parent, _: Args, context: Context): Promise<License | null> => {
        const { idLicenseAssignment } = parent;
        const { prisma } = context;

        return prisma.licenseAssignment.findOne({ where: { idLicenseAssignment } }).License();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idLicenseAssignment } = parent;
        const { prisma } = context;

        return prisma.licenseAssignment.findOne({ where: { idLicenseAssignment } }).SystemObject();
    },
    UserCreator: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idLicenseAssignment } = parent;
        const { prisma } = context;

        return prisma.licenseAssignment.findOne({ where: { idLicenseAssignment } }).User();
    }
};

export default LicenseAssignment;
