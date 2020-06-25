/**
 * Type resolver for Subject
 */
import { Subject, Unit, Item, GeoLocation, Asset } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Subject = {
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return prisma.subject.findOne({ where: { idSubject: Number.parseInt(idSubject) } }).Unit();
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return prisma.subject.findOne({ where: { idSubject: Number.parseInt(idSubject) } }).Asset();
    },
    GeoLocation: async (parent: Parent, _: Args, context: Context): Promise<GeoLocation | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return prisma.subject.findOne({ where: { idSubject: Number.parseInt(idSubject) } }).GeoLocation();
    },
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item[] | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return prisma.subject.findOne({ where: { idSubject: Number.parseInt(idSubject) } }).Item();
    }
};

export default Subject;
