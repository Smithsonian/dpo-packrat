/**
 * Type resolver for GeoLocation
 */

import { fetchItemsForGeoLocationID, fetchSubjectsForGeoLocationID, fetchGeoLocation } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { Subject, Item, GeoLocation } from '../../../../../types/graphql';
import { parseItems } from './Item';
import { parseSubjects } from './Subject';

const GeoLocation = {
    items: async (parent: Parent, _: Args, context: Context): Promise<Item[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveItemsByGeoLocationID(prisma, Number.parseInt(id));
    },
    subjects: async (parent: Parent, _: Args, context: Context): Promise<Subject[] | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveSubjectsByGeoLocationID(prisma, Number.parseInt(id));
    }
};

export async function resolveGeoLocationByID(prisma: PrismaClient, geoLocationId: number): Promise<GeoLocation | null> {
    const foundGeoLocation = await fetchGeoLocation(prisma, geoLocationId);

    return parseGeoLocation(foundGeoLocation);
}

export async function resolveItemsByGeoLocationID(prisma: PrismaClient, geoLocationId: number): Promise<Item[] | null> {
    const foundItems = await fetchItemsForGeoLocationID(prisma, geoLocationId);

    return parseItems(foundItems);
}

export async function resolveSubjectsByGeoLocationID(prisma: PrismaClient, geoLocationId: number): Promise<Subject[] | null> {
    const foundSubjects = await fetchSubjectsForGeoLocationID(prisma, geoLocationId);

    return parseSubjects(foundSubjects);
}

export function parseGeoLocation(foundGeoLocation: DB.GeoLocation | null): GeoLocation | null {
    let geoLocation;
    if (foundGeoLocation) {
        const { idGeoLocation, Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = foundGeoLocation;
        return {
            id: String(idGeoLocation),
            latitude: Latitude,
            longitude: Longitude,
            altitude: Altitude,
            ts0: TS0,
            ts1: TS1,
            ts2: TS2,
            r0: R0,
            r1: R1,
            r2: R2,
            r3: R3
        };
    }

    return geoLocation;
}

export default GeoLocation;
