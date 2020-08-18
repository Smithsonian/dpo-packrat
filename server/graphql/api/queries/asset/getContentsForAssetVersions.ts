import { gql } from 'apollo-server-express';

const getContentsForAssetVersions = gql`
    query getContentsForAssetVersions($input: GetContentsForAssetVersionsInput!) {
        getContentsForAssetVersions(input: $input) {
            AssetVersionContent {
                idAssetVersion
                folders
                all
            }
        }
    }
`;

export default getContentsForAssetVersions;
