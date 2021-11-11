/**
 * FileList
 *
 * This component renders file list used in UploadList and UploadCompleteList components.
 */
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { FileId, FileUploadStatus, IngestionFile, useUploadStore, useVocabularyStore, VocabularyOption } from '../../../../store';
import { eVocabularySetID } from '../../../../types/server';
import FileListItem from './FileListItem';

interface FileListProps {
    files: IngestionFile[];
    uploadPendingList?: boolean;
}

function FileList(props: FileListProps): React.ReactElement {
    const { selectFile } = useUploadStore();
    const { getEntries } = useVocabularyStore();
    const { files, uploadPendingList } = props;

    const { startUpload, retryUpload, cancelUpload, removeUpload, changeAssetType } = useUploadStore();

    const onChangeType = (id: FileId, assetType: number): void => changeAssetType(id, assetType);

    const onUpload = (id: FileId): void => startUpload(id);

    const onRetry = (id: FileId): void => retryUpload(id);

    const onCancel = (id: FileId): void => cancelUpload(id);

    const onRemove = (id: FileId): void => removeUpload(id);

    const onSelect = (id: FileId, selected: boolean): void => selectFile(id, selected);

const getFileList = ({ id, name, size, status, selected, progress, type, idAsset /*, idSystemObjectParentAttachment */ }: IngestionFile, index: number) => {
        const uploading = (status === FileUploadStatus.UPLOADING || status === FileUploadStatus.PROCESSING);
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
                    idAsset={idAsset}
                    // idSystemObjectParentAttachment={idSystemObjectParentAttachment}
                    uploadPendingList={uploadPendingList}
                />
            </AnimatePresence>
        );
    };

    return (
        <React.Fragment>
            {files.map(getFileList)}
        </React.Fragment>
    );
}

export default FileList;
