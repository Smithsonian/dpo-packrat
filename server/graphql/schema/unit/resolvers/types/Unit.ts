/**
 * Type resolver for Unit
 */
import { Subject, Actor, Unit, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Unit = {
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject[] | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return prisma.unit.findOne({ where: { idUnit } }).Subject();
    },
    Actor: async (parent: Parent, _: Args, context: Context): Promise<Actor[] | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return prisma.unit.findOne({ where: { idUnit } }).Actor();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return prisma.unit.findOne({ where: { idUnit } }).SystemObject();
    }
};

export default Unit;
