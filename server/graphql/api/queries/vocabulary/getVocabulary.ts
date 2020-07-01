import { gql } from 'apollo-server-express';

const getVocabulary = gql`
    query getVocabulary($input: GetVocabularyInput!) {
        getVocabulary(input: $input) {
            Vocabulary {
                idVocabulary
            }
        }
    }
`;

export default getVocabulary;
