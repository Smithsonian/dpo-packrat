/**
 * Type resolver for Item
 */
import { Subject, Item, GeoLocation, Asset } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Item = {
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return prisma.item.findOne({ where: { idItem: Number.parseInt(idItem) } }).Subject();
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return prisma.item.findOne({ where: { idItem: Number.parseInt(idItem) } }).Asset();
    },
    GeoLocation: async (parent: Parent, _: Args, context: Context): Promise<GeoLocation | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return prisma.item.findOne({ where: { idItem: Number.parseInt(idItem) } }).GeoLocation();
    }
};

export default Item;
