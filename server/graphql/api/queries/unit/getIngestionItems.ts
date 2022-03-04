import { gql } from 'apollo-server-express';

const getIngestionItems = gql`
    query getIngestionItems($input: GetIngestionItemsInput!) {
        getIngestionItems(input: $input) {
            IngestionItem {
                idItem
                EntireSubject
                MediaGroupName
                idProject
                ProjectName
            }
        }
    }
`;

export default getIngestionItems;
