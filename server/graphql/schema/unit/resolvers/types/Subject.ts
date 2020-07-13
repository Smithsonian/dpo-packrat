/**
 * Type resolver for Subject
 */
import { Subject, Unit, Item, GeoLocation, Asset } from '@prisma/client';
import { Parent, Args, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Subject = {
    Unit: async (parent: Parent, _: Args, context: Context): Promise<Unit | null> => {
        const { idUnit } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUnit(prisma, idUnit);
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
    Item: async (parent: Parent, _: Args, context: Context): Promise<Item[] | null> => {
        const { idSubject } = parent;
        const { prisma } = context;

        return await DBAPI.fetchItemFromSubject(prisma, idSubject);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromSubjectID(parent.idSubject);
    }
};

export default Subject;
