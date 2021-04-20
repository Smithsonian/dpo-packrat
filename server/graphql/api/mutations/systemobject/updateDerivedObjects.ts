import { gql } from 'apollo-server-express';

const updateDerivedObjects = gql`
    mutation updateDerivedObjects($input: UpdateDerivedObjectsInput!) {
        updateDerivedObjects(input: $input) {
            success
        }
    }
`;

export default updateDerivedObjects;