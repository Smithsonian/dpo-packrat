/**
 * Type resolver for Actor
 */
import { Unit, ModelProcessingAction, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Actor = {
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idActor } = parent;
        const { prisma } = context;

        return prisma.actor.findOne({ where: { idActor } }).Unit();
    },
    ModelProcessingAction: async (parent: Parent, _: Args, context: Context): Promise<ModelProcessingAction[] | null> => {
        const { idActor } = parent;
        const { prisma } = context;

        return prisma.actor.findOne({ where: { idActor } }).ModelProcessingAction();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idActor } = parent;
        const { prisma } = context;

        return prisma.actor.findOne({ where: { idActor } }).SystemObject();
    }
};

export default Actor;
