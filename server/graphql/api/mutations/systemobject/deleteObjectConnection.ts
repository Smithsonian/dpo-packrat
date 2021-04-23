import { gql } from 'apollo-server-express';

const deleteObjectConnection = gql`
    mutation deleteObjectConnection($input: DeleteObjectConnectionInput!) {
        deleteObjectConnection(input: $input) {
            success
        }
    }
`;

export default deleteObjectConnection;