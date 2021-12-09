import { gql } from 'apollo-server-express';

const deleteMetadata = gql`
    mutation deleteMetadata($input: DeleteMetadataInput!) {
        deleteMetadata(input: $input) {
            success
        }
    }
`;

export default deleteMetadata;