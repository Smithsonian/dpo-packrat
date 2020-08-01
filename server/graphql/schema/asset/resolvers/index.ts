import Asset from './types/Asset';
import AssetGroup from './types/AssetGroup';
import AssetVersion from './types/AssetVersion';
import getAsset from './queries/getAsset';
import uploadAsset from './mutations/uploadAsset';

const resolvers = {
    Query: {
        getAsset
    },
    Mutation: {
        uploadAsset
    },
    Asset,
    AssetGroup,
    AssetVersion
};

export default resolvers;
