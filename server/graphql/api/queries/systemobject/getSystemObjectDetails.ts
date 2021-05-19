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
                idIdentifier
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
            objectVersions {
                idSystemObjectVersion
                idSystemObject
                PublishedState
                DateCreated
            }
        }
    }
`;

export default getSystemObjectDetails;
