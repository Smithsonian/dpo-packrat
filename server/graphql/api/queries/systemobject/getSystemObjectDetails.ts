import { gql } from 'apollo-server-express';

const getSystemObjectDetails = gql`
    query getSystemObjectDetails($input: GetSystemObjectDetailsInput!) {
        getSystemObjectDetails(input: $input) {
            name
            retired
            objectType
            allowed
            thumbnail
            identifiers {
                identifier
                identifierType
            }
            objectAncestors {
                idSystemObject
                name
                objectType
            }
            sourceObjects {
                idSystemObject
                name
                identifier
                objectType
            }
            derivedObjects {
                idSystemObject
                name
                variantType
                objectType
            }
        }
    }
`;

export default getSystemObjectDetails;
