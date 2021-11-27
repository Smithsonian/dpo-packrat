/**
 * Type resolver for Metadata
 */

import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Metadata = {
    AssetVersionValue: async (parent: Parent): Promise<DBAPI.AssetVersion | null> => {
        return parent.idAssetVersionValue ? await DBAPI.AssetVersion.fetch(parent.idAssetVersionValue) : null;
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return parent.idSystemObject ? await DBAPI.SystemObject.fetch(parent.idSystemObject) : null;
    },
    SystemObjectParent: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return parent.idSystemObjectParent ? await DBAPI.SystemObject.fetch(parent.idSystemObjectParent) : null;
    },
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return parent.idUser ? await DBAPI.User.fetch(parent.idUser) : null;
    },
    VMetadataSource: async (parent: Parent): Promise<DBAPI.Vocabulary | null> => {
        return parent.idVMetadataSource ? await DBAPI.Vocabulary.fetch(parent.idVMetadataSource) : null;
    }
};

export default Metadata;
