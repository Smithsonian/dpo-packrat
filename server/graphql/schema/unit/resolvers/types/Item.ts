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
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return resolveSubjectByItemID(prisma, Number.parseInt(idItem));
    },
    AssetThumbnail: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return resolveAssetByItemID(prisma, Number.parseInt(idItem));
    },
    GeoLocation: async (parent: Parent, _: Args, context: Context): Promise<GeoLocation | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return resolveGeoLocationByItemID(prisma, Number.parseInt(idItem));
    }
};

export async function resolveItemByID(prisma: PrismaClient, idItem: number): Promise<Item | null> {
    const foundGeoLocation = await fetchItem(prisma, idItem);

    return parseItem(foundGeoLocation);
}

export async function resolveSubjectByItemID(prisma: PrismaClient, idItem: number): Promise<Subject | null> {
    const foundSubject = await fetchSubjectForItemID(prisma, idItem);

    return parseSubject(foundSubject);
}

export async function resolveAssetByItemID(prisma: PrismaClient, idItem: number): Promise<Asset | null> {
    const foundAsset = await fetchAssetForItemID(prisma, idItem);

    return parseAsset(foundAsset);
}

export async function resolveGeoLocationByItemID(prisma: PrismaClient, idItem: number): Promise<GeoLocation | null> {
    const foundGeoLocation = await fetchGeoLocationForItemID(prisma, idItem);

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
            idItem: String(idItem),
            Name,
            EntireSubject,
        };
    }

    return item;
}

export default Item;
