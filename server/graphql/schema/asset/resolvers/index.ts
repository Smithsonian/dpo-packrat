import Asset from './types/Asset';
import AssetGroup from './types/AssetGroup';
import AssetVersion from './types/AssetVersion';
import getAsset from './queries/getAsset';
import uploadAsset from './mutations/uploadAsset';
import getUploadedAssetVersion from './queries/getUploadedAssetVersion';
import getContentsForAssetVersions from './queries/getContentsForAssetVersions';

const resolvers = {
    Query: {
        getAsset,
        getUploadedAssetVersion,
        getContentsForAssetVersions
    },
    Mutation: {
        uploadAsset
    },
    Asset,
    AssetGroup,
    AssetVersion
};

export default resolvers;
