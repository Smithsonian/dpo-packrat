/**
 * Type resolver for Item
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Item = {
    Subject: async (parent: Parent): Promise<DBAPI.Subject | null> => {
        return await DBAPI.Subject.fetch(parent.idSubject);
    },
    AssetThumbnail: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAssetThumbnail);
    },
    GeoLocation: async (parent: Parent): Promise<DBAPI.GeoLocation | null> => {
        return await DBAPI.GeoLocation.fetch(parent.idGeoLocation);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromItemID(parent.idItem);
    }
};

export default Item;
