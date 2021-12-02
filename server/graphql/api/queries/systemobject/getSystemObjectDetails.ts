import { gql } from 'apollo-server-express';

const getSystemObjectDetails = gql`
    query getSystemObjectDetails($input: GetSystemObjectDetailsInput!) {
        getSystemObjectDetails(input: $input) {
            idSystemObject
            idObject
            name
            retired
            objectType
            allowed
            publishedState
            publishedEnum
            publishable
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
            assetOwner {
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
                Comment
                CommentLink
            }
            metadata {
                idMetadata
                Name
                ValueShort
                ValueExtended
                idAssetVersionValue
                idVMetadataSource
            }
            licenseInheritance
            license {
                idLicense
                Name
                Description
                RestrictLevel
            }
        }
    }
`;

export default getSystemObjectDetails;
