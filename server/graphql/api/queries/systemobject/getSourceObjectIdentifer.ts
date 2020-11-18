import { gql } from 'apollo-server-express';

const getSourceObjectIdentifer = gql`
    query getSourceObjectIdentifer($input: GetSourceObjectIdentiferInput!) {
        getSourceObjectIdentifer(input: $input) {
            sourceObjectIdentifiers {
                idSystemObject
                identifier
            }
        }
    }
`;

export default getSourceObjectIdentifer;
