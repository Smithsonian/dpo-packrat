import { gql } from 'apollo-server-express';

const createItem = gql`
    query createItem($input: CreateItemInput!) {
        createItem(input: $input) {
            Item {
                idItem
            }
        }
    }
`;

export default createItem;
