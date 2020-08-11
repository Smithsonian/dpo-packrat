import { useContext } from 'react';
import { AppContext, FileId, StateMetadata, MetadataFieldValue, METADATA_ACTIONS, IngestionDispatchAction, AssetType } from '../../../context';
import lodash from 'lodash';

type MetadataInfo = {
    metadata: StateMetadata;
    metadataIndex: number;
    isLast: boolean;
};

type FieldErrors = {
    photogrammetry: {
        dateCaptured: boolean;
    };
};

interface UseMetadata {
    getFieldErrors: (metadata: StateMetadata) => FieldErrors;
    getCurrentMetadata: (id: FileId) => StateMetadata | undefined;
    getMetadataInfo: (id: FileId) => MetadataInfo;
    updateFields: (id: FileId, fieldName: string, fieldValue: MetadataFieldValue, assetType: AssetType) => void;
}

function useMetadata(): UseMetadata {
    const {
        ingestion: { metadatas },
        ingestionDispatch
    } = useContext(AppContext);

    const getFieldErrors = (metadata: StateMetadata): FieldErrors => {
        const errors: FieldErrors = {
            photogrammetry: {
                dateCaptured: false
            }
        };

        const { file } = metadata;
        const { type } = file;

        if (type === AssetType.Photogrammetry) {
            errors.photogrammetry.dateCaptured = metadata.photogrammetry.dateCaptured.toString() === 'Invalid Date';
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

    const updateFields = (id: FileId, fieldName: string, fieldValue: MetadataFieldValue, assetType: AssetType): void => {
        const updateMetadataFieldsAction: IngestionDispatchAction = {
            type: METADATA_ACTIONS.UPDATE_METADATA_FIELDS,
            id,
            fieldName,
            fieldValue,
            assetType
        };

        ingestionDispatch(updateMetadataFieldsAction);
    };

    return {
        getFieldErrors,
        getCurrentMetadata,
        getMetadataInfo,
        updateFields
    };
}

export default useMetadata;
