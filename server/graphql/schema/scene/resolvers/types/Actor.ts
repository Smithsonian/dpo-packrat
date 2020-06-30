/**
 * Type resolver for Actor
 */
import { Unit, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Actor = {
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idActor } = parent;
        const { prisma } = context;

        return prisma.actor.findOne({ where: { idActor } }).Unit();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idActor } = parent;
        const { prisma } = context;

        return prisma.actor.findOne({ where: { idActor } }).SystemObject();
    }
};

export default Actor;
