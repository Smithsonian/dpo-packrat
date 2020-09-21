import { useContext } from 'react';
import {
    AppContext,
    FileId,
    StateMetadata,
    PhotogrammetryFields,
    METADATA_ACTIONS,
    IngestionDispatchAction,
    StateFolder,
    StateVocabulary,
    StateIdentifier,
    parseFileId
} from '../../../context';
import lodash from 'lodash';
import { GetContentsForAssetVersionsDocument, AreCameraSettingsUniformDocument, IngestFolder, AssetVersionContent } from '../../../types/graphql';
import { apolloClient } from '../../../graphql';
import { eVocabularySetID } from '../../../types/server';
import useVocabularyEntries from './useVocabularyEntries';
import { toast } from 'react-toastify';

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
    getStateFolders: (folders: IngestFolder[]) => StateFolder[];
    getSelectedIdentifiers: (metadata: StateMetadata) => StateIdentifier[] | undefined;
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

    const { getInitialEntryWithVocabularies, getAssetType, getInitialEntry } = useVocabularyEntries();

    const idAssetVersions: number[] = [...metadatas].map(({ file: { id } }) => parseFileId(id));

    const getSelectedIdentifiers = (metadata: StateMetadata): StateIdentifier[] | undefined => lodash.filter(metadata.photogrammetry.identifiers, { selected: true });

    const getFieldErrors = (metadata: StateMetadata): FieldErrors => {
        const errors: FieldErrors = {
            photogrammetry: {
                dateCaptured: false,
                datasetType: false
            }
        };

        const { file } = metadata;
        const { type } = file;

        const assetType = getAssetType(type);

        if (assetType.photogrammetry) {
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

    const getStateFolders = (folders: IngestFolder[]): StateFolder[] => {
        const stateFolders: StateFolder[] = folders.map(({ name, variantType }, index: number) => ({
            id: index,
            name,
            variantType
        }));

        return stateFolders;
    };

    const getInitialStateFolders = (folders: string[]): StateFolder[] => {
        const stateFolders: StateFolder[] = folders.map((folder, index: number) => ({
            id: index,
            name: folder,
            variantType: getInitialEntry(eVocabularySetID.eCaptureDataFileVariantType)
        }));

        return stateFolders;
    };

    const getInitialVocabularyEntry = (vocabularies: StateVocabulary, eVocabularySetID: eVocabularySetID) => getInitialEntryWithVocabularies(vocabularies, eVocabularySetID);

    const updateMetadataFolders = async (vocabularies: StateVocabulary): Promise<void> => {
        const defaultIdentifier: StateIdentifier = {
            id: 0,
            identifier: '',
            identifierType: getInitialVocabularyEntry(vocabularies, eVocabularySetID.eIdentifierIdentifierType),
            selected: false
        };

        const defaultVocabularyFields = {
            datasetType: getInitialVocabularyEntry(vocabularies, eVocabularySetID.eCaptureDataDatasetType)
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

        const { AssetVersionContent: foundAssetVersionContent } = getContentsForAssetVersions;

        let updatedMetadatas = await updateCameraSettings(metadatas);

        updatedMetadatas = updatedMetadatas.map(metadata => {
            const { photogrammetry } = metadata;
            const identifiers = photogrammetry.identifiers.length ? photogrammetry.identifiers : [defaultIdentifier];

            return {
                ...metadata,
                photogrammetry: {
                    ...photogrammetry,
                    ...defaultVocabularyFields,
                    identifiers
                }
            };
        });

        foundAssetVersionContent.forEach(({ idAssetVersion, folders }: AssetVersionContent) => {
            const stateFolders: StateFolder[] = getInitialStateFolders(folders);

            updatedMetadatas = updatedMetadatas.map(metadata => {
                const { file, photogrammetry } = metadata;
                const fileId = parseFileId(file.id);
                if (fileId === idAssetVersion) {
                    return {
                        ...metadata,
                        photogrammetry: {
                            ...photogrammetry,
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

    const updateCameraSettings = async (metadatas: StateMetadata[]): Promise<StateMetadata[]> => {
        const updatedMetadatas = metadatas.slice();

        for (let index = 0; index < updatedMetadatas.length; index++) {
            const metadata = updatedMetadatas[index];
            const { file, photogrammetry } = metadata;
            const idAssetVersion = parseFileId(file.id);

            const assetType = getAssetType(file.type);

            if (assetType.photogrammetry) {
                const variables = {
                    input: {
                        idAssetVersion
                    }
                };

                try {
                    const { data } = await apolloClient.query({
                        query: AreCameraSettingsUniformDocument,
                        variables
                    });

                    const { areCameraSettingsUniform } = data;
                    const { isUniform } = areCameraSettingsUniform;

                    photogrammetry.cameraSettingUniform = isUniform;
                } catch {
                    toast.error('Failed to retrieve camera settings details');
                }
            }
        }

        return updatedMetadatas;
    };

    return {
        getStateFolders,
        getSelectedIdentifiers,
        getFieldErrors,
        getCurrentMetadata,
        getMetadataInfo,
        updatePhotogrammetryFields,
        updateMetadataFolders
    };
}

export default useMetadata;
