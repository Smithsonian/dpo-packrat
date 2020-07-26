/**
 * Type resolver for AssetVersion
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const AssetVersion = {
    Asset: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAsset);
    },
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUserCreator);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromAssetVersionID(parent.idAssetVersion);
    }
};

export default AssetVersion;
