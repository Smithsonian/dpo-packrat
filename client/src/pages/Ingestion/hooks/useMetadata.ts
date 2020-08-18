import { useContext } from 'react';
import {
    AppContext,
    FileId,
    StateMetadata,
    PhotogrammetryFields,
    METADATA_ACTIONS,
    IngestionDispatchAction,
    AssetType,
    StateFolder,
    StateVocabulary,
    StateIdentifier
} from '../../../context';
import lodash from 'lodash';
import { GetContentsForAssetVersionsDocument } from '../../../types/graphql';
import { apolloClient } from '../../../graphql';
import { eVocabularySetID } from '../../../types/server';
import useVocabularyEntries from './useVocabularyEntries';

type MetadataInfo = {
    metadata: StateMetadata;
    metadataIndex: number;
    isLast: boolean;
};

type FieldErrors = {
    photogrammetry: {
        dateCaptured: boolean;
        datasetType: boolean;
    };
};

interface UseMetadata {
    getFieldErrors: (metadata: StateMetadata) => FieldErrors;
    getCurrentMetadata: (id: FileId) => StateMetadata | undefined;
    getMetadataInfo: (id: FileId) => MetadataInfo;
    updatePhotogrammetryFields: (metadataIndex: number, values: PhotogrammetryFields) => void;
    updateMetadataFolders: (vocabularies: StateVocabulary) => Promise<void>;
}

function useMetadata(): UseMetadata {
    const {
        ingestion: { metadatas },
        ingestionDispatch
    } = useContext(AppContext);

    const { getInitialEntryWithVocabularies } = useVocabularyEntries();

    // TODO: replace index with fileId this afterwards
    const idAssetVersions: number[] = [...metadatas].map((_, index) => index);

    const getFieldErrors = (metadata: StateMetadata): FieldErrors => {
        const errors: FieldErrors = {
            photogrammetry: {
                dateCaptured: false,
                datasetType: false
            }
        };

        const { file } = metadata;
        const { type } = file;

        if (type === AssetType.Photogrammetry) {
            errors.photogrammetry.dateCaptured = metadata.photogrammetry.dateCaptured.toString() === 'Invalid Date';
            errors.photogrammetry.datasetType = metadata.photogrammetry.datasetType === null;
        }

        return errors;
    };

    const getCurrentMetadata = (id: FileId): StateMetadata | undefined => metadatas.find(({ file }) => file.id === id);

    const getMetadataInfo = (id: FileId): MetadataInfo => {
        const metadataLength = metadatas.length;
        const metadata: StateMetadata | undefined = metadatas.find(({ file }) => file.id === id);
        const metadataIndex = lodash.indexOf(metadatas, metadata);
        const isLast = metadataIndex + 1 === metadataLength;

        return {
            metadata: metadatas[metadataIndex],
            metadataIndex,
            isLast
        };
    };

    const updatePhotogrammetryFields = (metadataIndex: number, values: PhotogrammetryFields): void => {
        const updatedMetadatas = lodash.map([...metadatas], (metadata: StateMetadata, index: number) => {
            if (index === metadataIndex) {
                return {
                    ...metadata,
                    photogrammetry: {
                        ...values
                    }
                };
            }

            return metadata;
        });

        const updateMetadataFieldsAction: IngestionDispatchAction = {
            type: METADATA_ACTIONS.UPDATE_METADATA_FIELDS,
            metadatas: updatedMetadatas
        };

        ingestionDispatch(updateMetadataFieldsAction);
    };

    const updateMetadataFolders = async (vocabularies: StateVocabulary): Promise<void> => {
        const getInitialVocabularyEntry = (eVocabularySetID: eVocabularySetID) => getInitialEntryWithVocabularies(vocabularies, eVocabularySetID);

        const defaultIdentifier: StateIdentifier = {
            id: 0,
            identifier: '',
            identifierType: getInitialVocabularyEntry(eVocabularySetID.eIdentifierIdentifierType),
            selected: false
        };

        const defaultVocabularyFields = {
            datasetType: getInitialVocabularyEntry(eVocabularySetID.eCaptureDataDatasetType),
            identifiers: [defaultIdentifier]
        };

        const variables = {
            input: {
                idAssetVersions
            }
        };

        const { data } = await apolloClient.query({
            query: GetContentsForAssetVersionsDocument,
            variables
        });

        const { getContentsForAssetVersions } = data;
        const { AssetVersionContent } = getContentsForAssetVersions;

        let updatedMetadatas = metadatas.slice();

        AssetVersionContent.forEach(({ idAssetVersion, folders }, index) => {
            const stateFolders: StateFolder[] = folders.map((folder, index) => ({
                id: index,
                name: folder,
                variantType: getInitialVocabularyEntry(eVocabularySetID.eCaptureDataFileVariantType)
            }));

            updatedMetadatas = updatedMetadatas.map(metadata => {
                const { photogrammetry } = metadata;
                // TODO: replace index with fileId this afterwards
                if (index === idAssetVersion) {
                    return {
                        ...metadata,
                        photogrammetry: {
                            ...photogrammetry,
                            ...defaultVocabularyFields,
                            folders: stateFolders
                        }
                    };
                }

                return metadata;
            });
        });

        const updateMetadataFieldsAction: IngestionDispatchAction = {
            type: METADATA_ACTIONS.UPDATE_METADATA_FIELDS,
            metadatas: updatedMetadatas
        };

        ingestionDispatch(updateMetadataFieldsAction);
    };

    return {
        getFieldErrors,
        getCurrentMetadata,
        getMetadataInfo,
        updatePhotogrammetryFields,
        updateMetadataFolders
    };
}

export default useMetadata;
