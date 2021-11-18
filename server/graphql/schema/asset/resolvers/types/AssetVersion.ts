/**
 * Type resolver for AssetVersion
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';

const AssetVersion = {
    Asset: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAsset);
    },
    User: async (parent: Parent): Promise<DBAPI.User | null> => {
        return await DBAPI.User.fetch(parent.idUserCreator);
    },
    SOAttachment: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetch(parent.idSOAttachment);
    },
    SOAttachmentObjectType: async (parent: Parent): Promise<number | null> => {
        if (!parent.idSOAttachment)
            return null;
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(parent.idSOAttachment);
        return (oID !== undefined) ? oID.eObjectType : null;
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromAssetVersionID(parent.idAssetVersion);
    }
};

export default AssetVersion;
