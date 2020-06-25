/**
 * Type resolver for UserPersonalizationSystemObject
 */
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { User, SystemObject } from '@prisma/client';

const UserPersonalizationSystemObject = {
    User: async (parent: Parent, _: Args, context: Context): Promise<User | null> => {
        const { idUserPersonalizationSystemObject } = parent;
        const { prisma } = context;

        return prisma.userPersonalizationSystemObject.findOne({ where: { idUser: Number.parseInt(idUserPersonalizationSystemObject) } }).User();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idUserPersonalizationSystemObject } = parent;
        const { prisma } = context;

        return prisma.userPersonalizationSystemObject.findOne({ where: { idUser: Number.parseInt(idUserPersonalizationSystemObject) } }).SystemObject();
    }
};

export default UserPersonalizationSystemObject;
