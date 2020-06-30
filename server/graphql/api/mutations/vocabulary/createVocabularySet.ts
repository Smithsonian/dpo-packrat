import { gql } from 'apollo-server-express';

const createVocabularySet = gql`
    mutation createVocabularySet($input: CreateVocabularySetInput!) {
        createVocabularySet(input: $input) {
            VocabularySet {
                idVocabularySet
            }
        }
    }
`;

export default createVocabularySet;
