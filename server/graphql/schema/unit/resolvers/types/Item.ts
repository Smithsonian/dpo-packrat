/**
 * Type resolver for Item
 */
import { Subject, Item, GeoLocation, Asset, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const Item = {
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return prisma.item.findOne({ where: { idItem } }).Subject();
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return prisma.item.findOne({ where: { idItem } }).Asset();
    },
    GeoLocation: async (parent: Parent, _: Args, context: Context): Promise<GeoLocation | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return prisma.item.findOne({ where: { idItem } }).GeoLocation();
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return prisma.item.findOne({ where: { idItem } }).SystemObject();
    }
};

export default Item;
