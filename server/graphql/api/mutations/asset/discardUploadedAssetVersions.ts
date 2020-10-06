import { gql } from 'apollo-server-express';

const discardUploadedAssetVersions = gql`
    mutation discardUploadedAssetVersions($input: DiscardUploadedAssetVersionsInput!) {
        discardUploadedAssetVersions(input: $input) {
            success
        }
    }
`;

export default discardUploadedAssetVersions;
