import { useQuery } from '@apollo/client';
import { GetVocabularyEntriesDocument, GetVocabularyEntriesQuery } from '../../../types/graphql';
import { eVocabularySetID } from '../../../types/server';
import { ApolloError } from '@apollo/client';

interface UseVocabularyEntries {
    vocabularyEntryData: GetVocabularyEntriesQuery | undefined;
    vocabularyEntryLoading: boolean;
    vocabularyEntryError?: ApolloError;
}

function useVocabularyEntries(): UseVocabularyEntries {
    const { data: vocabularyEntryData, loading: vocabularyEntryLoading, error: vocabularyEntryError } = useQuery(GetVocabularyEntriesDocument, {
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
