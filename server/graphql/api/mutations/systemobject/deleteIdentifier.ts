import { gql } from 'apollo-server-express';

const deleteIdentifier = gql`
    mutation deleteIdentifier($input: DeleteIdentifierInput!) {
        deleteIdentifier(input: $input) {
            success
        }
    }
`;

export default deleteIdentifier;