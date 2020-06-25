/**
 * Type resolver for User
 */
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { UserPersonalizationSystemObject, UserPersonalizationUrl, LicenseAssignment } from '@prisma/client';

const User = {
    UserPersonalizationSystemObject: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationSystemObject[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).UserPersonalizationSystemObject();
    },
    UserPersonalizationUrl: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationUrl[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).UserPersonalizationUrl();
    },
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return prisma.user.findOne({ where: { idUser: Number.parseInt(idUser) } }).LicenseAssignment();
    }
};

export default User;
