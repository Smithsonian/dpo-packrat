/**
 * Type resolver for Metadata
 */

import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Metadata = {
    AssetVersionValue: async (parent: Parent): Promise<DBAPI.AssetVersion | null> => {
        return await DBAPI.AssetVersion.fetch(parent.idAssetVersionValue);
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
