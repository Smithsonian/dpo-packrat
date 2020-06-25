/**
 * Type resolver for SystemObjectXref
 */
import { SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const SystemObjectXref = {
    SystemObjectDerived: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSystemObjectXref } = parent;
        const { prisma } = context;

        return prisma.systemObjectXref.findOne({ where: { idSystemObjectXref } }).SystemObject_SystemObjectToSystemObjectXref_idSystemObjectDerived();
    },
    SystemObjectMaster: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSystemObjectXref } = parent;
        const { prisma } = context;

        return prisma.systemObjectXref.findOne({ where: { idSystemObjectXref } }).SystemObject_SystemObjectToSystemObjectXref_idSystemObjectMaster();
    }
};

export default SystemObjectXref;
