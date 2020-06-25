/**
 * Type resolver for Subject
 */
import { Subject, Unit, Item, GeoLocation, Asset, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Subject = {
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return prisma.subject.findOne({ where: { idSubject } }).Unit();
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return prisma.subject.findOne({ where: { idSubject } }).Asset();
    },
    GeoLocation: async (parent: Parent, _: Args, context: Context): Promise<GeoLocation | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return prisma.subject.findOne({ where: { idSubject } }).GeoLocation();
    },
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item[] | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return prisma.subject.findOne({ where: { idSubject } }).Item();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return prisma.subject.findOne({ where: { idSubject } }).SystemObject();
    }
};

export default Subject;
