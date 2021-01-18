import { gql } from 'apollo-server-express';

const getSystemObjectDetails = gql`
    query getSystemObjectDetails($input: GetSystemObjectDetailsInput!) {
        getSystemObjectDetails(input: $input) {
            idObject
            name
            retired
            objectType
            allowed
            publishedState
            thumbnail
            identifiers {
                identifier
                identifierType
            }
            unit {
                idSystemObject
                name
                objectType
            }
            project {
                idSystemObject
                name
                objectType
            }
            subject {
                idSystemObject
                name
                objectType
            }
            item {
                idSystemObject
                name
                objectType
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
                identifier
                objectType
            }
        }
    }
`;

export default getSystemObjectDetails;
