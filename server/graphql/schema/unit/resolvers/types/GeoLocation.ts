/**
 * Type resolver for GeoLocation
 */

import { fetchItemForGeoLocationID, fetchSubjectForGeoLocationID, fetchGeoLocation } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { Subject, Item, GeoLocation } from '../../../../../types/graphql';
import { parseItems } from './Item';
import { parseSubjects } from './Subject';

const GeoLocation = {
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item[] | null> => {
        const { idGeoLocation } = parent;
        const { prisma } = context;

        return resolveItemByGeoLocationID(prisma, Number.parseInt(idGeoLocation));
    },
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject[] | null> => {
        const { idGeoLocation } = parent;
        const { prisma } = context;

        return resolveSubjectByGeoLocationID(prisma, Number.parseInt(idGeoLocation));
    }
};

export async function resolveGeoLocationByID(prisma: PrismaClient, idGeoLocation: number): Promise<GeoLocation | null> {
    const foundGeoLocation = await fetchGeoLocation(prisma, idGeoLocation);

    return parseGeoLocation(foundGeoLocation);
}

export async function resolveItemByGeoLocationID(prisma: PrismaClient, idGeoLocation: number): Promise<Item[] | null> {
    const foundItems = await fetchItemForGeoLocationID(prisma, idGeoLocation);

    return parseItems(foundItems);
}

export async function resolveSubjectByGeoLocationID(prisma: PrismaClient, idGeoLocation: number): Promise<Subject[] | null> {
    const foundSubjects = await fetchSubjectForGeoLocationID(prisma, idGeoLocation);

    return parseSubjects(foundSubjects);
}

export function parseGeoLocation(foundGeoLocation: DB.GeoLocation | null): GeoLocation | null {
    let geoLocation;
    if (foundGeoLocation) {
        const { idGeoLocation, Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = foundGeoLocation;
        return {
            idGeoLocation: String(idGeoLocation),
            Latitude,
            Longitude,
            Altitude,
            TS0,
            TS1,
            TS2,
            R0,
            R1,
            R2,
            R3
        };
    }

    return geoLocation;
}

export default GeoLocation;
