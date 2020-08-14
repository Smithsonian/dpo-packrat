import { useContext } from 'react';
import { AppContext, FileId, StateMetadata, PhotogrammetryFields, METADATA_ACTIONS, IngestionDispatchAction, AssetType } from '../../../context';
import lodash from 'lodash';

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
}

function useMetadata(): UseMetadata {
    const {
        ingestion: { metadatas },
        ingestionDispatch
    } = useContext(AppContext);

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

    return {
        getFieldErrors,
        getCurrentMetadata,
        getMetadataInfo,
        updatePhotogrammetryFields
    };
}

export default useMetadata;
