/**
 * Type resolver for Item
 */
import { Subject, Item, GeoLocation, Asset, SystemObject } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Item = {
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSubject(prisma, idSubject);
    },
    Asset: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAssetThumbnail } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAssetThumbnail);
    },
    GeoLocation: async (parent: Parent, _: Args, context: Context): Promise<GeoLocation | null> => {
        const { idGeoLocation } = parent;
        const { prisma } = context;

        return await DBAPI.fetchGeoLocation(prisma, idGeoLocation);
    },
    SystemObject: async (parent: Parent, _: Args, context: Context): Promise<SystemObject | null> => {
        const { idItem } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSystemObjectFromItem(prisma, idItem);
    }
};

export default Item;
