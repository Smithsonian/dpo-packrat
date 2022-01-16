import { gql } from 'apollo-server-express';

const rollbackAssetVersion = gql`
    mutation rollbackAssetVersion($input: RollbackAssetVersionInput!) {
        rollbackAssetVersion(input: $input) {
            success
            message
        }
    }
`;

export default rollbackAssetVersion;