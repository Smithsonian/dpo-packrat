/**
 * FileList
 *
 * This component renders file list used in UploadList and UploadCompleteList components.
 */
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { FileId, FileUploadStatus, IngestionFile, useUploadStore, useVocabularyStore, VocabularyOption } from '../../../../store';
import { eVocabularySetID } from '@dpo-packrat/common';
import FileListItem from './FileListItem';
import { UploadReferences } from '../../../../store/upload';
import { eIngestionMode } from '../../../../constants';

interface FileListProps {
    files: IngestionFile[];
    uploadPendingList?: boolean;
    references?: UploadReferences;
    uploadType?: eIngestionMode;
    idSystemObject?: number;
}

function FileList(props: FileListProps): React.ReactElement {
    const { selectFile } = useUploadStore();
    const { getEntries } = useVocabularyStore();
    const { files, uploadPendingList, references, idSystemObject } = props;
    const { startUpload, retryUpload, retrySpecialUpload, cancelUpload, cancelSpecialUpload, removeUpload, removeSpecialPending, changeAssetType } = useUploadStore();
    const onChangeType = (id: FileId, assetType: number): void => changeAssetType(id, assetType);

    const onUpload = (id: FileId): void => {
        if (references && idSystemObject)
            startUpload(id, { idSystemObject, references });
        else
            startUpload(id);
    };

    const onRetry = (id: FileId): void => retryUpload(id);

    const onRetrySpecial = (uploadType: eIngestionMode, idSO: number) => retrySpecialUpload(uploadType, idSO);

    const onCancel = (id: FileId): void => cancelUpload(id);

    const onCancelSpecial = (uploadType: eIngestionMode, idSO: number) => cancelSpecialUpload(uploadType, idSO);

    const onRemove = (id: FileId): void => removeUpload(id);

    const onRemoveSpecial = (uploadType: eIngestionMode, idSO: number) => removeSpecialPending(uploadType, idSO);

    const onSelect = (id: FileId, selected: boolean): void => selectFile(id, selected);

    const getFileList = ({ id, name, size, status, selected, progress, type, idAsset, idSOAttachment, updateContext }: IngestionFile, index: number) => {
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
                    updateContext={updateContext}
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
                    onCancelSpecial={onCancelSpecial}
                    onUpload={onUpload}
                    onRetry={onRetry}
                    onRetrySpecial={onRetrySpecial}
                    onRemove={onRemove}
                    onRemoveSpecial={onRemoveSpecial}
                    idAsset={idAsset}
                    idSOAttachment={idSOAttachment}
                    references={references}
                    uploadPendingList={uploadPendingList}
                    idSystemObject={idSystemObject}
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
