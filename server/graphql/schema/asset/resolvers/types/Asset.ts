/**
 * Type resolver for Asset
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Asset = {
    AssetGroup: async (parent: Parent): Promise<DBAPI.AssetGroup | null> => {
        return await DBAPI.AssetGroup.fetch(parent.idAssetGroup);
    },
    AssetVersion: async (parent: Parent): Promise<DBAPI.AssetVersion[] | null> => {
        return await DBAPI.AssetVersion.fetchFromAsset(parent.idAsset);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromAssetID(parent.idAsset);
    }
};

export default Asset;
