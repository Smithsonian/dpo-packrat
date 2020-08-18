import { useContext } from 'react';
import { AppContext, IngestionDispatchAction, StateVocabulary, VocabularyOption, VOCABULARY_ACTIONS } from '../../../context';
import { apolloClient } from '../../../graphql';
import { GetVocabularyEntriesDocument } from '../../../types/graphql';
import { eVocabularySetID } from '../../../types/server';

interface UseVocabularyEntries {
    updateVocabularyEntries: () => Promise<StateVocabulary>;
    getEntries: (eVocabularySetID: eVocabularySetID) => VocabularyOption[];
    getInitialEntry: (eVocabularySetID: eVocabularySetID) => number | null;
    getInitialEntryWithVocabularies: (vocabularies: StateVocabulary, eVocabularySetID: eVocabularySetID) => number | null;
}

function useVocabularyEntries(): UseVocabularyEntries {
    const {
        ingestion: { vocabularies },
        ingestionDispatch
    } = useContext(AppContext);

    const variables = {
        input: {
            eVocabSetIDs: [
                eVocabularySetID.eIdentifierIdentifierType,
                eVocabularySetID.eCaptureDataDatasetType,
                eVocabularySetID.eCaptureDataItemPositionType,
                eVocabularySetID.eCaptureDataFocusType,
                eVocabularySetID.eCaptureDataLightSourceType,
                eVocabularySetID.eCaptureDataBackgroundRemovalMethod,
                eVocabularySetID.eCaptureDataClusterType,
                eVocabularySetID.eCaptureDataFileVariantType
            ]
        }
    };

    const updateVocabularyEntries = async (): Promise<StateVocabulary> => {
        const { data } = await apolloClient.query({
            query: GetVocabularyEntriesDocument,
            variables
        });

        const { VocabularyEntries } = data.getVocabularyEntries;

        const updatedVocabularyEntries = new Map<eVocabularySetID, VocabularyOption[]>();

        VocabularyEntries.forEach(({ eVocabSetID, Vocabulary }) => {
            updatedVocabularyEntries.set(eVocabSetID, Vocabulary);
        });

        const updateMetadataFieldsAction: IngestionDispatchAction = {
            type: VOCABULARY_ACTIONS.ADD_VOCABULARIES,
            vocabularies: updatedVocabularyEntries
        };

        ingestionDispatch(updateMetadataFieldsAction);

        return updatedVocabularyEntries;
    };

    const getEntries = (eVocabularySetID: eVocabularySetID): VocabularyOption[] => {
        const vocabularyEntry = vocabularies.get(eVocabularySetID);

        let selectOptions: VocabularyOption[] = [];

        if (vocabularyEntry) {
            selectOptions = vocabularyEntry;
        }

        return selectOptions;
    };

    const getInitialEntry = (eVocabularySetID: eVocabularySetID): number | null => {
        const vocabularyEntry = vocabularies.get(eVocabularySetID);

        if (vocabularyEntry) {
            return vocabularyEntry[0].idVocabulary;
        }

        return null;
    };

    const getInitialEntryWithVocabularies = (vocabularies: StateVocabulary, eVocabularySetID: eVocabularySetID): number | null => {
        const vocabularyEntry = vocabularies.get(eVocabularySetID);

        if (vocabularyEntry) {
            return vocabularyEntry[0].idVocabulary;
        }

        return null;
    };

    return {
        updateVocabularyEntries,
        getEntries,
        getInitialEntry,
        getInitialEntryWithVocabularies
    };
}

export default useVocabularyEntries;
