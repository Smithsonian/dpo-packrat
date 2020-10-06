import { gql } from 'apollo-server-express';

const getItemsForSubject = gql`
    query getItemsForSubject($input: GetItemsForSubjectInput!) {
        getItemsForSubject(input: $input) {
            Item {
                idItem
                Name
            }
        }
    }
`;

export default getItemsForSubject;
