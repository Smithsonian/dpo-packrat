/**
 * Vocabulary Store
 *
 * This store manages state for vocabularies used in Ingestion flow.
 */
import lodash from 'lodash';
import create, { GetState, SetState } from 'zustand';
import { apolloClient } from '../graphql';
import { GetVocabularyEntriesDocument, Vocabulary } from '../types/graphql';
import { eVocabularySetID } from '../types/server';
import { multiIncludes } from '../utils/shared';

export type VocabularyOption = Pick<Vocabulary, 'idVocabulary' | 'Term'>;
export type StateVocabulary = Map<eVocabularySetID, VocabularyOption[]>;

type AssetType = {
    photogrammetry: boolean;
    scene: boolean;
    model: boolean;
    other: boolean;
};

type VocabularyStore = {
    vocabularies: Map<eVocabularySetID, VocabularyOption[]>;
    updateVocabularyEntries: () => Promise<StateVocabulary>;
    getEntries: (eVocabularySetID: eVocabularySetID) => VocabularyOption[];
    getInitialEntry: (eVocabularySetID: eVocabularySetID) => number | null;
    getAssetType: (idVocabulary: number) => AssetType;
};

export const useVocabularyStore = create<VocabularyStore>((set: SetState<VocabularyStore>, get: GetState<VocabularyStore>) => ({
    vocabularies: new Map<eVocabularySetID, VocabularyOption[]>(),
    updateVocabularyEntries: async (): Promise<StateVocabulary> => {
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
                    eVocabularySetID.eAssetAssetType,
                    eVocabularySetID.eModelCreationMethod,
                    eVocabularySetID.eModelModality,
                    eVocabularySetID.eModelUnits,
                    eVocabularySetID.eModelPurpose,
                    eVocabularySetID.eModelGeometryFileModelFileType,
                    eVocabularySetID.eModelUVMapChannelUVMapType
                ]
            }
        };

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
    getAssetType: (idVocabulary: number): AssetType => {
        const { vocabularies } = get();
        const vocabularyEntry = vocabularies.get(eVocabularySetID.eAssetAssetType);

        const assetType: AssetType = {
            photogrammetry: false,
            scene: false,
            model: false,
            other: false
        };

        if (vocabularyEntry) {
            const foundVocabulary = lodash.find(vocabularyEntry, option => option.idVocabulary === idVocabulary);

            if (foundVocabulary) {
                const { Term } = foundVocabulary;
                const term = Term.toLowerCase();

                assetType.photogrammetry = term.includes('photogrammetry');
                assetType.scene = term.includes('scene');
                assetType.model = term.includes('model');
                assetType.other = !multiIncludes(term, ['photogrammetry', 'scene', 'model']);
            }
        }

        return assetType;
    }
}));
