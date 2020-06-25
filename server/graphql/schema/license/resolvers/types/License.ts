/**
 * Type resolver for License
 */

import { License, LicenseAssignment } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const License = {
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { idLicense } = parent;
        const { prisma } = context;

        return prisma.license.findOne({ where: { idLicense: Number.parseInt(idLicense) } }).LicenseAssignment();
    }
};

export default License;
