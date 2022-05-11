import { gql } from 'apollo-server-express';

const getObjectChildren = gql`
    query getObjectChildren($input: GetObjectChildrenInput!) {
        getObjectChildren(input: $input) {
            success
            error
            entries {
                idSystemObject
                name
                objectType
                idObject
                metadata
                index
            }
            metadataColumns
            cursorMark
        }
    }
`;

export default getObjectChildren;
