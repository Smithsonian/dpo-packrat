import { gql } from 'apollo-server-express';

const updateSourceObjects = gql`
    mutation updateSourceObjects($input: UpdateSourceObjectsInput!) {
        updateSourceObjects(input: $input) {
            success
        }
    }
`;

export default updateSourceObjects;