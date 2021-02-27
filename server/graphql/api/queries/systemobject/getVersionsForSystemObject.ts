import { gql } from 'apollo-server-express';

const getVersionsForSystemObject = gql`
    query getVersionsForSystemObject($input: GetVersionsForSystemObjectInput!) {
        getVersionsForSystemObject(input: $input) {
          versions {
                idSystemObject
                version
                name
                creator
                dateCreated
                size
            }
        }
    }
`;

export default getVersionsForSystemObject;
