import create, { SetState, GetState } from 'zustand';
import { apolloClient } from '../graphql';
import { GetVocabularyEntriesDocument, Vocabulary } from '../types/graphql';
import { eVocabularySetID } from '../types/server';
import lodash from 'lodash';

export type VocabularyOption = Pick<Vocabulary, 'idVocabulary' | 'Term'>;
export type StateVocabulary = Map<eVocabularySetID, VocabularyOption[]>;

type AssetType = {
    photogrammetry: boolean;
    bagit: boolean;
};

type VocabularyStore = {
    vocabularies: Map<eVocabularySetID, VocabularyOption[]>;
    updateVocabularyEntries: () => Promise<StateVocabulary>;
    getEntries: (eVocabularySetID: eVocabularySetID) => VocabularyOption[];
    getInitialEntry: (eVocabularySetID: eVocabularySetID) => number | null;
    getInitialEntryWithVocabularies: (vocabularies: StateVocabulary, eVocabularySetID: eVocabularySetID) => number | null;
    getAssetType: (idVocabulary: number) => AssetType;
};

export const useVocabulary = create<VocabularyStore>((set: SetState<VocabularyStore>, get: GetState<VocabularyStore>) => ({
    vocabularies: new Map<eVocabularySetID, VocabularyOption[]>(),
    updateVocabularyEntries: async (): Promise<StateVocabulary> => {
        const { data } = await apolloClient.query({
            query: GetVocabularyEntriesDocument,
            variables
        });

        const { VocabularyEntries } = data.getVocabularyEntries;

        const vocabularies = new Map<eVocabularySetID, VocabularyOption[]>();

        VocabularyEntries.forEach(({ eVocabSetID, Vocabulary }) => {
            vocabularies.set(eVocabSetID, Vocabulary);
        });

        set({ vocabularies });

        return vocabularies;
    },
    getEntries: (eVocabularySetID: eVocabularySetID): VocabularyOption[] => {
        const { vocabularies } = get();
        const vocabularyEntry = vocabularies.get(eVocabularySetID);

        let options: VocabularyOption[] = [];

        if (vocabularyEntry) {
            options = vocabularyEntry;
        }

        return options;
    },
    getInitialEntry: (eVocabularySetID: eVocabularySetID): number | null => {
        const { vocabularies } = get();
        const vocabularyEntry = vocabularies.get(eVocabularySetID);

        if (vocabularyEntry && vocabularyEntry.length) {
            return vocabularyEntry[0].idVocabulary;
        }

        return null;
    },
    getInitialEntryWithVocabularies: (vocabularies: StateVocabulary, eVocabularySetID: eVocabularySetID): number | null => {
        const vocabularyEntry = vocabularies.get(eVocabularySetID);

        if (vocabularyEntry && vocabularyEntry.length) {
            return vocabularyEntry[0].idVocabulary;
        }

        return null;
    },
    getAssetType: (idVocabulary: number): AssetType => {
        const { vocabularies } = get();
        const vocabularyEntry = vocabularies.get(eVocabularySetID.eAssetAssetType);

        const assetType: AssetType = {
            photogrammetry: false,
            bagit: false
        };

        if (vocabularyEntry) {
            const foundVocabulary = lodash.find(vocabularyEntry, option => option.idVocabulary === idVocabulary);

            if (foundVocabulary) {
                assetType.photogrammetry = foundVocabulary.Term.toLowerCase().includes('photogrammetry');
                assetType.bagit = foundVocabulary.Term.toLowerCase().includes('bulk');
            }
        }

        return assetType;
    }
}));

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
            eVocabularySetID.eCaptureDataFileVariantType,
            eVocabularySetID.eAssetAssetType
        ]
    }
};
