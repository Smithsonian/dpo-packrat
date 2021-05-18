import { gql } from 'apollo-server-express';

const getSystemObjectVersionFromSystemObject = gql`
    query getSystemObjectVersionFromSystemObject($input: GetSystemObjectVersionFromSystemObjectInput!) {
        getSystemObjectVersionFromSystemObject(input: $input) {
            systemObjectVersions{
                idSystemObjectVersion
                idSystemObject
                PublishedState
            }
        }
    }
`;

export default getSystemObjectVersionFromSystemObject;