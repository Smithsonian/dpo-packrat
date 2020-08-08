import { gql } from 'apollo-server-express';

const getIngestionItemsForSubjects = gql`
    query getIngestionItemsForSubjects($input: GetIngestionItemsForSubjectsInput!) {
        getIngestionItemsForSubjects(input: $input) {
            Item {
                idItem
                EntireSubject
                Name
            }
        }
    }
`;

export default getIngestionItemsForSubjects;
