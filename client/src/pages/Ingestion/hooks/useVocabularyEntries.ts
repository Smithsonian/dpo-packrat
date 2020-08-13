import { useQuery } from '@apollo/react-hooks';
import { QUERY_GET_VOCABULARY_ENTRIES } from '../../../graphql';
import { eVocabularySetID } from '../../../types/server';
import { ApolloError } from 'apollo-client';

interface UseVocabularyEntries {
    vocabularyEntryData: any | undefined;
    vocabularyEntryLoading: boolean;
    vocabularyEntryError?: ApolloError;
}

function useVocabularyEntries(): UseVocabularyEntries {
    const { data: vocabularyEntryData, loading: vocabularyEntryLoading, error: vocabularyEntryError } = useQuery(QUERY_GET_VOCABULARY_ENTRIES, {
        variables: {
            input: {
                eVocabSetIDs: [
                    eVocabularySetID.eCaptureDataDatasetType,
                    eVocabularySetID.eCaptureDataItemPositionType,
                    eVocabularySetID.eCaptureDataFocusType,
                    eVocabularySetID.eCaptureDataLightSourceType,
                    eVocabularySetID.eCaptureDataBackgroundRemovalMethod,
                    eVocabularySetID.eCaptureDataClusterType
                ]
            }
        }
    });

    return {
        vocabularyEntryData,
        vocabularyEntryLoading,
        vocabularyEntryError
    };
}

export default useVocabularyEntries;
