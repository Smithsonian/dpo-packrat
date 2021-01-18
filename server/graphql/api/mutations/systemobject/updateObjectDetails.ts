import { gql } from 'apollo-server-express';

const updateObjectDetails = gql`
    mutation updateObjectDetails($input: UpdateObjectDetailsInput!) {
        updateObjectDetails(input: $input) {
          success
        }
    }
`;

export default updateObjectDetails;
