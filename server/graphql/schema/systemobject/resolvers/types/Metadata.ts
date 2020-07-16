/**
 * Type resolver for Metadata
 */

import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Metadata = {
    AssetValue: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAssetValue);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSystemObject);
    },
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUser);
    },
    VMetadataSource: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return await DBAPI.Vocabulary.fetch(parent.idVMetadataSource);
    }
};

export default Metadata;
