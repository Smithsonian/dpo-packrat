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
    IdentifierPreferred: async (parent: Parent): Promise<DBAPI.Identifier | null> => {
        return await DBAPI.Identifier.fetch(parent.IdentifierPreferred);
    },
    Item: async (parent: Parent): Promise<DBAPI.Item[] | null> => {
        return await DBAPI.Item.fetchDerivedFromSubject(parent.idSubject);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromSubjectID(parent.idSubject);
    }
};

export default Subject;
