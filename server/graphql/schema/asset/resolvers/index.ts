import Asset from './types/Asset';
import AssetGroup from './types/AssetGroup';
import AssetVersion from './types/AssetVersion';
import getAsset from './queries/getAsset';
import uploadAsset from './mutations/uploadAsset';
import getUploadedAssetVersion from './queries/getUploadedAssetVersion';
import getContentsForAssetVersions from './queries/getContentsForAssetVersions';
import getModelConstellationForAssetVersion from './queries/getModelConstellationForAssetVersion';
import getSceneForAssetVersion from './queries/getSceneForAssetVersion';
import getAssetVersionsDetails from './queries/getAssetVersionsDetails';
import discardUploadedAssetVersions from './mutations/discardUploadedAssetVersions';
import rollbackAssetVersion from './mutations/rollbackAssetVersion';

import { BigIntResolver } from 'graphql-scalars';
import { GraphQLUpload } from 'graphql-upload';
import * as L from 'lodash';

const resolvers = {
    Query: {
        getAsset,
        getUploadedAssetVersion,
        getContentsForAssetVersions,
        getModelConstellationForAssetVersion,
        getSceneForAssetVersion,
        getAssetVersionsDetails
    },
    Mutation: {
        uploadAsset,
        discardUploadedAssetVersions,
        rollbackAssetVersion
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
