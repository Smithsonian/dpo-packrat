import Asset from './types/Asset';
import AssetGroup from './types/AssetGroup';
import AssetVersion from './types/AssetVersion';
import getAsset from './queries/getAsset';

const resolvers = {
    Query: {
        getAsset
    },
    Asset,
    AssetGroup,
    AssetVersion
};

export default resolvers;
