/**
 * Type resolver for Item
 */
import { Subject, Item, GeoLocation, Asset } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Item = {
    Subject: async (parent: Parent, _: Args, context: Context): Promise<Subject | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchSubject(prisma, idSubject);
    },
    AssetThumbnail: async (parent: Parent, _: Args, context: Context): Promise<Asset | null> => {
        const { idAssetThumbnail } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAsset(prisma, idAssetThumbnail);
    },
    GeoLocation: async (parent: Parent, _: Args, context: Context): Promise<GeoLocation | null> => {
        const { idGeoLocation } = parent;
        const { prisma } = context;

        return await DBAPI.fetchGeoLocation(prisma, idGeoLocation);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromItemID(parent.idItem);
    }
};

export default Item;
