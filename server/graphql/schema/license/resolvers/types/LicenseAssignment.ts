/**
 * Type resolver for LicenseAssignment
 */

import { License, LicenseAssignment, SystemObject, User } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const LicenseAssignment = {
    License: async (parent: Parent, _: Args, context: Context): Promise<License | null> => {
        const { idLicense } = parent;
        const { prisma } = context;

        return await DBAPI.fetchLicense(prisma, idLicense);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSystemObject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObject(prisma, idSystemObject);
    },
    UserCreator: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUserCreator } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUser(prisma, idUserCreator);
    }
};

export default LicenseAssignment;
