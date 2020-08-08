import { useContext } from 'react';
import { AppContext, FileId, StateMetadata } from '../../../context';
import lodash from 'lodash';

type MetadataInfo = {
    metadata: StateMetadata | undefined;
    metadataIndex: number;
    isLast: boolean;
};

interface UseMetadata {
    getCurrentMetadata: (id: FileId) => StateMetadata | undefined;
    getMetadataInfo: (id: FileId) => MetadataInfo;
}

function useMetadata(): UseMetadata {
    const {
        ingestion: { metadatas }
    } = useContext(AppContext);

    const getCurrentMetadata = (id: FileId): StateMetadata | undefined => metadatas.find(({ file }) => file.id === id);

    const getMetadataInfo = (id: FileId): MetadataInfo => {
        const metadataLength = metadatas.length;
        const metadata: StateMetadata | undefined = metadatas.find(({ file }) => file.id === id);
        const metadataIndex = lodash.indexOf(metadatas, metadata);
        const isLast = metadataIndex + 1 === metadataLength;

        return {
            metadata,
            metadataIndex,
            isLast
        };
    };

    return {
        getCurrentMetadata,
        getMetadataInfo
    };
}

export default useMetadata;
