/**
 * Type resolver for Subject
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Subject = {
    Unit: async (parent: Parent): Promise<DBAPI.Unit | null> => {
        return await DBAPI.Unit.fetch(parent.idUnit);
    },
    AssetThumbnail: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAssetThumbnail);
    },
    GeoLocation: async (parent: Parent): Promise<DBAPI.GeoLocation | null> => {
        return await DBAPI.GeoLocation.fetch(parent.idGeoLocation);
    },
    Item: async (parent: Parent): Promise<DBAPI.Item[] | null> => {
        return await DBAPI.Item.fetchFromSubject(parent.idSubject);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromSubjectID(parent.idSubject);
    }
};

export default Subject;
