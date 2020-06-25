/**
 * Type resolver for GeoLocation
 */

import { Subject, Item, GeoLocation } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';

const GeoLocation = {
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item[] | null> => {
        const { idGeoLocation } = parent;
        const { prisma } = context;

        return prisma.geoLocation.findOne({ where: { idGeoLocation: Number.parseInt(idGeoLocation) } }).Item();
    },
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject[] | null> => {
        const { idGeoLocation } = parent;
        const { prisma } = context;

        return prisma.geoLocation.findOne({ where: { idGeoLocation: Number.parseInt(idGeoLocation) } }).Subject();
    }
};

export default GeoLocation;
