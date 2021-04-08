import { gql } from 'apollo-server-express';

const getVocabularyEntries = gql`
    query getVocabularyEntries($input: GetVocabularyEntriesInput!) {
        getVocabularyEntries(input: $input) {
            VocabularyEntries {
                eVocabSetID
                Vocabulary {
                    idVocabulary
                    Term
                    eVocabID
                }
            }
        }
    }
`;

export default getVocabularyEntries;
