/**
 * Type resolver for Identifier
 */
import { SystemObject, Vocabulary } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Identifier = {
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idIdentifier } = parent;
        const { prisma } = context;

        return prisma.identifier.findOne({ where: { idIdentifier } }).SystemObject();
    },
    VIdentifierType: async (parent: Parent, _: Args, context: Context): Promise<Vocabulary | null> => {
        const { idIdentifier } = parent;
        const { prisma } = context;

        return prisma.identifier.findOne({ where: { idIdentifier } }).Vocabulary();
    }
};

export default Identifier;
