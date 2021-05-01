import Asset from './types/Asset';
import AssetGroup from './types/AssetGroup';
import AssetVersion from './types/AssetVersion';
import getAsset from './queries/getAsset';
import uploadAsset from './mutations/uploadAsset';
import getUploadedAssetVersion from './queries/getUploadedAssetVersion';
import getContentsForAssetVersions from './queries/getContentsForAssetVersions';
import getModelConstellationForAssetVersion from './queries/getModelConstellationForAssetVersion';
import getAssetVersionsDetails from './queries/getAssetVersionsDetails';
import discardUploadedAssetVersions from './mutations/discardUploadedAssetVersions';
import { BigIntResolver } from 'graphql-scalars';
import { GraphQLUpload } from 'graphql-upload';
import * as L from 'lodash';

const resolvers = {
    Query: {
        getAsset,
        getUploadedAssetVersion,
        getContentsForAssetVersions,
        getModelConstellationForAssetVersion,
        getAssetVersionsDetails
    },
    Mutation: {
        uploadAsset,
        discardUploadedAssetVersions
    },
    Asset,
    AssetGroup,
    AssetVersion,
    BigInt: BigIntResolver,
    Upload: GraphQLUpload,
};

// special flavor of GraphQL resolvers, which avoid explicit use of graphql-upload's GraphQLUpload
// resolver for "Upload" scalar; instead, use default Apollo resolver
export const assetResolversForTest = L.clone(resolvers);
delete assetResolversForTest.Upload;

export default resolvers;
