import { gql } from 'apollo-server-express';

const createVocabulary = gql`
    mutation createVocabulary($input: CreateVocabularyInput!) {
        createVocabulary(input: $input) {
            Vocabulary {
                idVocabulary
            }
        }
    }
`;

export default createVocabulary;
