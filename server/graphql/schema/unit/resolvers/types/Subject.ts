/**
 * Type resolver for Subject
 */
import { fetchUnitForSubjectID, fetchAssetForSubjectID, fetchGeoLocationSubjectID, fetchItemForSubjectID } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { Subject, Unit, Item, GeoLocation, Asset } from '../../../../../types/graphql';
import { parseUnit } from './Unit';
import { parseItems } from './Item';
import { parseGeoLocation } from './GeoLocation';
import { parseAsset } from '../../../asset/resolvers/types/Asset';

const Subject = {
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return resolveUnitBySubjectID(prisma, Number.parseInt(idSubject));
    },
    AssetThumbnail: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return resolveAssetBySubjectID(prisma, Number.parseInt(idSubject));
    },
    GeoLocation: async (parent: Parent, _: Args, context: Context): Promise<GeoLocation | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return resolveGeoLocationBySubjectID(prisma, Number.parseInt(idSubject));
    },
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item[] | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return resolveItemBySubjectID(prisma, Number.parseInt(idSubject));
    }
};

export async function resolveUnitBySubjectID(prisma: PrismaClient, idSubject: number): Promise<Unit | null> {
    const foundUnit = await fetchUnitForSubjectID(prisma, idSubject);

    return parseUnit(foundUnit);
}

export async function resolveAssetBySubjectID(prisma: PrismaClient, idSubject: number): Promise<Asset | null> {
    const foundAsset = await fetchAssetForSubjectID(prisma, idSubject);

    return parseAsset(foundAsset);
}

export async function resolveGeoLocationBySubjectID(prisma: PrismaClient, idSubject: number): Promise<GeoLocation | null> {
    const foundGeoLocation = await fetchGeoLocationSubjectID(prisma, idSubject);

    return parseGeoLocation(foundGeoLocation);
}

export async function resolveItemBySubjectID(prisma: PrismaClient, idSubject: number): Promise<Item[] | null> {
    const foundItems = await fetchItemForSubjectID(prisma, idSubject);

    return parseItems(foundItems);
}

export function parseSubjects(foundSubjects: DB.Subject[] | null): Subject[] | null {
    let subjects;
    if (foundSubjects) {
        subjects = foundSubjects.map(subject => parseSubject(subject));
    }

    return subjects;
}

export function parseSubject(foundSubject: DB.Subject | null): Subject | null {
    let subject;
    if (foundSubject) {
        const { idSubject, Name } = foundSubject;

        return {
            idSubject: String(idSubject),
            Name
        };
    }

    return subject;
}

export default Subject;
