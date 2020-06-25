/**
 * Type resolver for Unit
 */
import { Subject, Actor, Unit } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Unit = {
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject[] | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return prisma.unit.findOne({ where: { idUnit: Number.parseInt(idUnit) } }).Subject();
    },
    Actor: async (parent: Parent, _: Args, context: Context): Promise<Actor[] | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return prisma.unit.findOne({ where: { idUnit: Number.parseInt(idUnit) } }).Actor();
    }
};

export default Unit;
