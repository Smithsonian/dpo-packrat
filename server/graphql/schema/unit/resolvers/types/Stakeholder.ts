/**
 * Type resolver for Stakeholder
 */
import { SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Stakeholder = {
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idStakeholder } = parent;
        const { prisma } = context;

        return prisma.stakeholder.findOne({ where: { idStakeholder: Number.parseInt(idStakeholder) } }).SystemObject();
    }
};

export default Stakeholder;
