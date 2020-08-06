import Asset from './types/Asset';
import AssetGroup from './types/AssetGroup';
import AssetVersion from './types/AssetVersion';
import getAsset from './queries/getAsset';
import getUploadedAssetVersion from './queries/getUploadedAssetVersion';
import uploadAsset from './mutations/uploadAsset';

const resolvers = {
    Query: {
        getAsset,
        getUploadedAssetVersion
    },
    Mutation: {
        uploadAsset
    },
    Asset,
    AssetGroup,
    AssetVersion
};

export default resolvers;
