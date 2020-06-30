import { gql } from 'apollo-server-express';

const getItem = gql`
    query getItem($input: GetItemInput!) {
        getItem(input: $input) {
            Item {
                idItem
            }
        }
    }
`;

export default getItem;
