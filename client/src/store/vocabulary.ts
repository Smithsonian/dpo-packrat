/**
 * Vocabulary Store
 *
 * This store manages state for vocabularies used in Ingestion flow.
 */
import lodash from 'lodash';
import create, { GetState, SetState } from 'zustand';
import { apolloClient } from '../graphql';
import { GetVocabularyEntriesDocument, Vocabulary } from '../types/graphql';
import { eVocabularyID, eVocabularySetID } from '@dpo-packrat/common';

export type VocabularyOption = Pick<Vocabulary, 'idVocabulary' | 'Term' | 'eVocabID'>;
export type StateVocabulary = Map<eVocabularySetID, VocabularyOption[]>;

export type AssetType = {
    photogrammetry: boolean;
    scene: boolean;
    model: boolean;
    other: boolean;
    attachment: boolean;
};

type VocabularyStore = {
    vocabularies: Map<eVocabularySetID, VocabularyOption[]>;
    vocabularyMap: Map<eVocabularyID, Vocabulary>;
    updateVocabularyEntries: () => Promise<StateVocabulary>;
    getEntries: (eVocabularySetID: eVocabularySetID) => VocabularyOption[];
    getInitialEntry: (eVocabularySetID: eVocabularySetID) => number | null;
    getVocabularyTerm: (eVocabularySetID: eVocabularySetID, idVocabulary: number) => string | null;
    getVocabularyId: (eVocabularyID: eVocabularyID) => number | null;
    getAssetType: (idVocabulary: number) => AssetType;
    getAssetTypeForExtension: (extension: string) => number | null;
};

// FIXME: read all vocabulary set IDs from enum
export const useVocabularyStore = create<VocabularyStore>((set: SetState<VocabularyStore>, get: GetState<VocabularyStore>) => ({
    vocabularies: new Map<eVocabularySetID, VocabularyOption[]>(),
    vocabularyMap: new Map<eVocabularyID, Vocabulary>(),

    // makes a GraphQL request to return many of the Vocabulary items given the list below.
    // the results are stored in 'vocabularies', which is where routines like getEntries() pulls.
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
                    eVocabularySetID.eModelFileType,
                    eVocabularySetID.eModelMaterialChannelMaterialType,
                    eVocabularySetID.eCaptureDataCaptureMethod,
                    eVocabularySetID.eJobJobType,
                    eVocabularySetID.eWorkflowType,
                    eVocabularySetID.eWorkflowEvent,
                    eVocabularySetID.eEdan3DResourceAttributeUnits,
                    eVocabularySetID.eEdan3DResourceAttributeModelFileType,
                    eVocabularySetID.eEdan3DResourceAttributeFileType,
                    eVocabularySetID.eEdan3DResourceType,
                    eVocabularySetID.eEdan3DResourceCategory,
                    eVocabularySetID.eEdanMDMFields,
                    eVocabularySetID.eMetadataMetadataSource,
                    eVocabularySetID.eCaptureDataDatasetUse,
                ]
            }
        };

        const { data } = await apolloClient.query({
            query: GetVocabularyEntriesDocument,
            variables
        });

        const { VocabularyEntries } = data.getVocabularyEntries;

        const vocabularies = new Map<eVocabularySetID, VocabularyOption[]>();
        const vocabularyMap = new Map<eVocabularyID, Vocabulary>();

        VocabularyEntries.forEach(({ eVocabSetID, Vocabulary }) => {
            vocabularies.set(eVocabSetID, Vocabulary);
            Vocabulary.forEach(vocabEntry => {
                vocabularyMap.set(vocabEntry.eVocabID, vocabEntry);
            });
        });

        console.log('[PACKRAT:DEBUG] Vocabulary Store: ', data);
        console.log('[PACKRAT:DEBUG] Vocabulary Store (vocabularies): ', vocabularies);

        set({ vocabularies, vocabularyMap });
        return vocabularies;
    },
    getEntries: (eVocabularySetID: eVocabularySetID): VocabularyOption[] => {
        // returns list of vocabulary (reduced properties) from when the store was
        // initially filled.
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
    getVocabularyTerm: (eVocabularySetID: eVocabularySetID, idVocabulary: number): string | null => {
        const { vocabularies } = get();
        const vocabularyEntry = vocabularies.get(eVocabularySetID);

        if (vocabularyEntry && vocabularyEntry.length) {
            for (let i = 0; i < vocabularyEntry.length; i++) {
                const vocabulary = vocabularyEntry[i];
                if (vocabulary.idVocabulary === idVocabulary)
                    return vocabulary.Term;
            }
        }

        return null;
    },
    getVocabularyId: (eVocabularyID: eVocabularyID): number | null => {
        const { vocabularyMap } = get();
        const vocabulary = vocabularyMap.get(eVocabularyID);
        return vocabulary ? vocabulary.idVocabulary : null;
    },
    getAssetType: (idVocabulary: number): AssetType => {
        const { vocabularies } = get();
        const vocabularyEntry = vocabularies.get(eVocabularySetID.eAssetAssetType);

        const assetType: AssetType = {
            photogrammetry: false,
            scene: false,
            model: false,
            other: false,
            attachment: false
        };

        if (vocabularyEntry) {
            const foundVocabulary = lodash.find(vocabularyEntry, vocab => vocab.idVocabulary === idVocabulary);

            if (foundVocabulary) {
                const { Term } = foundVocabulary;

                assetType.photogrammetry = (Term === 'Capture Data Set: Photogrammetry' || Term === 'Capture Data File');
                assetType.scene = (Term === 'Scene');
                assetType.model = (Term === 'Model' || Term === 'Model Geometry File');
                assetType.attachment = (Term === 'Attachment');
                assetType.other = !assetType.photogrammetry && !assetType.scene && !assetType.model && !assetType.attachment;
            }
        }

        return assetType;
    },
    getAssetTypeForExtension: (extension: string): number | null => {
        const { vocabularyMap } = get();
        let eVocabEnum: eVocabularyID | null = null;

        switch (extension.toLowerCase()) {
            case '.zip': eVocabEnum = eVocabularyID.eAssetAssetTypeBulkIngestion; break;

            case '.dcm': eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataSetDicom; break;

            case '.raw':
            case '.cr2':
            case '.cr3':
            case '.dng':
            case '.arw':
            case '.camdng':
            case '.tif':
            case '.tiff':
            case '.jpg':
            case '.jpeg': eVocabEnum = eVocabularyID.eAssetAssetTypeCaptureDataFile; break;

            case '.obj':
            case '.ply':
            case '.stl':
            case '.glb':
            case '.gltf':
            case '.usda':
            case '.usdc':
            case '.usdz':
            case '.x3d':
            case '.wrl':
            case '.dae':
            case '.fbx':
            case '.ma':
            case '.3ds':
            case '.ptx':
            case '.pts': eVocabEnum = eVocabularyID.eAssetAssetTypeModel; break;

            case '.svx.json':
            case '.json': eVocabEnum = eVocabularyID.eAssetAssetTypeScene; break;

            default: eVocabEnum = eVocabularyID.eAssetAssetTypeOther; break;
        }

        const vocabulary = vocabularyMap.get(eVocabEnum);
        return (vocabulary) ? vocabulary.idVocabulary : null;
    }
}));