/**
 * Type resolver for Item
 */
import { fetchSubjectForItemID, fetchAssetForItemID, fetchGeoLocationForItemID, fetchItem } from '../../../../../db';
import * as DB from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { Subject, Item, GeoLocation, Asset } from '../../../../../types/graphql';
import { parseSubject } from './Subject';
import { parseGeoLocation } from './GeoLocation';
import { parseAsset } from '../../../asset/resolvers/types/Asset';

const Item = {
    subject: async (parent: Parent, _: Args, context: Context): Promise<Subject | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveSubjectByItemID(prisma, Number.parseInt(id));
    },
    assetThumbnail: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveAssetByItemID(prisma, Number.parseInt(id));
    },
    geoLocation: async (parent: Parent, _: Args, context: Context): Promise<GeoLocation | null> => {
        const { id } = parent;
        const { prisma } = context;

        return resolveGeoLocationByItemID(prisma, Number.parseInt(id));
    }
};

export async function resolveItemByID(prisma: PrismaClient, geoLocationId: number): Promise<Item | null> {
    const foundGeoLocation = await fetchItem(prisma, geoLocationId);

    return parseItem(foundGeoLocation);
}

export async function resolveSubjectByItemID(prisma: PrismaClient, itemId: number): Promise<Subject | null> {
    const foundSubject = await fetchSubjectForItemID(prisma, itemId);

    return parseSubject(foundSubject);
}

export async function resolveAssetByItemID(prisma: PrismaClient, itemId: number): Promise<Asset | null> {
    const foundAsset = await fetchAssetForItemID(prisma, itemId);

    return parseAsset(foundAsset);
}

export async function resolveGeoLocationByItemID(prisma: PrismaClient, itemId: number): Promise<GeoLocation | null> {
    const foundGeoLocation = await fetchGeoLocationForItemID(prisma, itemId);

    return parseGeoLocation(foundGeoLocation);
}

export function parseItems(foundItems: DB.Item[] | null): Item[] | null {
    let items;
    if (foundItems) {
        items = foundItems.map(item => parseItem(item));
    }

    return items;
}

export function parseItem(foundItem: DB.Item | null): Item | null {
    let item;
    if (foundItem) {
        const { idItem, Name, EntireSubject } = foundItem;
        return {
            id: String(idItem),
            name: Name,
            entireSubject: Boolean(EntireSubject)
        };
    }

    return item;
}

export default Item;
