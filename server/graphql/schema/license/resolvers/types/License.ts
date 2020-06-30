/**
 * Type resolver for License
 */

import { License, LicenseAssignment } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const License = {
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { idLicense } = parent;
        const { prisma } = context;

        return await DBAPI.fetchLicenseAssignmentFromLicense(prisma, idLicense);
    }
};

export default License;
