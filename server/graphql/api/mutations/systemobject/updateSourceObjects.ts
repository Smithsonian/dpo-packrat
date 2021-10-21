import { gql } from 'apollo-server-express';

const updateSourceObjects = gql`
    mutation updateSourceObjects($input: UpdateSourceObjectsInput!) {
        updateSourceObjects(input: $input) {
            success
            status
            message
        }
    }
`;

export default updateSourceObjects;
