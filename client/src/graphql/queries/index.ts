import { loader } from 'graphql.macro';

const QUERY_GET_CURRENT_USER = loader('./getCurrentUser.graphql');
const QUERY_GET_UPLOADED_ASSET_VERSION = loader('./getUploadedAssetVersion.graphql');

export { QUERY_GET_CURRENT_USER, QUERY_GET_UPLOADED_ASSET_VERSION };
