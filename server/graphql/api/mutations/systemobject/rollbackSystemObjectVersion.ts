import { gql } from 'apollo-server-express';

const rollbackSystemObjectVersion = gql`
    mutation rollbackSystemObjectVersion($input: RollbackSystemObjectVersionInput!) {
        rollbackSystemObjectVersion(input: $input) {
            success
            message
        }
    }
`;

export default rollbackSystemObjectVersion;