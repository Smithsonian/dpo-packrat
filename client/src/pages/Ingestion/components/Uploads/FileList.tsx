import { AnimatePresence } from 'framer-motion';
import React, { useContext } from 'react';
import { AppContext, AssetType, FileId, IngestionFile, FileUploadStatus, IngestionDispatchAction, UPLOAD_ACTIONS } from '../../../../context';
import useFilesUpload from '../../hooks/useFilesUpload';
import FileListItem from './FileListItem';

interface FileListProps {
    files: IngestionFile[];
}

function FileList(props: FileListProps): React.ReactElement {
    const { ingestionDispatch } = useContext(AppContext);
    const { files } = props;

    const { changeAssetType, startUpload, retryUpload, cancelUpload, removeUpload } = useFilesUpload();

    const onChangeType = (id: FileId, assetType: AssetType): void => changeAssetType(id, assetType);

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

        return (
            <AnimatePresence key={index}>
                <FileListItem
                    id={id}
                    name={name}
                    size={size}
                    type={type}
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