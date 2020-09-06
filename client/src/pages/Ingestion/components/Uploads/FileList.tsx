import { AnimatePresence } from 'framer-motion';
import React, { useContext } from 'react';
import { AppContext, FileId, IngestionFile, FileUploadStatus, IngestionDispatchAction, UPLOAD_ACTIONS, VocabularyOption } from '../../../../context';
import useFilesUpload from '../../hooks/useFilesUpload';
import useVocabularyEntries from '../../hooks/useVocabularyEntries';
import FileListItem from './FileListItem';
import { eVocabularySetID } from '../../../../types/server';

interface FileListProps {
    files: IngestionFile[];
}

function FileList(props: FileListProps): React.ReactElement {
    const { ingestionDispatch } = useContext(AppContext);
    const { getEntries } = useVocabularyEntries();
    const { files } = props;

    const { changeAssetType, startUpload, retryUpload, cancelUpload, removeUpload } = useFilesUpload();

    const onChangeType = (id: FileId, assetType: number): void => changeAssetType(id, assetType);

    const onUpload = (id: FileId): void => startUpload(id);

    const onRetry = (id: FileId): void => retryUpload(id);

    const onCancel = (id: FileId): void => cancelUpload(id);

    const onRemove = (id: FileId): void => removeUpload(id);

    const onSelect = (id: FileId, selected: boolean): void => {
        const selectAction: IngestionDispatchAction = {
            type: UPLOAD_ACTIONS.SELECT,
            id,
            selected
        };

        ingestionDispatch(selectAction);
    };

    const getFileList = ({ id, name, size, status, selected, progress, type }: IngestionFile, index: number) => {
        const uploading = status === FileUploadStatus.UPLOADING;
        const complete = status === FileUploadStatus.COMPLETE;
        const failed = status === FileUploadStatus.FAILED;
        const cancelled = status === FileUploadStatus.CANCELLED;

        const typeOptions: VocabularyOption[] = getEntries(eVocabularySetID.eAssetAssetType);

        return (
            <AnimatePresence key={index}>
                <FileListItem
                    id={id}
                    name={name}
                    size={size}
                    type={type}
                    typeOptions={typeOptions}
                    selected={selected}
                    uploading={uploading}
                    complete={complete}
                    failed={failed}
                    cancelled={cancelled}
                    progress={progress}
                    status={status}
                    onChangeType={onChangeType}
                    onSelect={onSelect}
                    onCancel={onCancel}
                    onUpload={onUpload}
                    onRetry={onRetry}
                    onRemove={onRemove}
                />
            </AnimatePresence>
        );
    };

    return (
        <>
            {files.map(getFileList)}
        </>
    );
}

export default FileList;