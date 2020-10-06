import Asset from './types/Asset';
import AssetGroup from './types/AssetGroup';
import AssetVersion from './types/AssetVersion';
import getAsset from './queries/getAsset';
import uploadAsset from './mutations/uploadAsset';
import getUploadedAssetVersion from './queries/getUploadedAssetVersion';
import getContentsForAssetVersions from './queries/getContentsForAssetVersions';
import getAssetVersionsDetails from './queries/getAssetVersionsDetails';
import discardUploadedAssetVersions from './mutations/discardUploadedAssetVersions';

const resolvers = {
    Query: {
        getAsset,
        getUploadedAssetVersion,
        getContentsForAssetVersions,
        getAssetVersionsDetails
    },
    Mutation: {
        uploadAsset,
        discardUploadedAssetVersions
    },
    Asset,
    AssetGroup,
    AssetVersion
};

export default resolvers;
