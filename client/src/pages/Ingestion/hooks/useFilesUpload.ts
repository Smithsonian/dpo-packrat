import { useCallback, useContext } from 'react';
import { toast } from 'react-toastify';
import { AppContext, AssetType, METADATA_ACTIONS, StateMetadata } from '../../../context';
import { UPLOAD_ACTIONS, IngestionFile, FileId, IngestionDispatchAction, FileUploadStatus, IngestionUploadResponse, IngestionUploadStatus } from '../../../context';
import { apolloUploader } from '../../../graphql';
import { UploadAssetDocument } from '../../../types/graphql';
import lodash from 'lodash';
import { defaultPhotogrammetryFields } from '../../../context';

interface UseFilesUpload {
    updateMetadataSteps: () => boolean;
    loadFiles: (acceptedFiles: File[]) => void;
    startUpload: (id: FileId) => void;
    cancelUpload: (id: FileId) => void;
    retryUpload: (id: FileId) => void;
    removeUpload: (id: FileId) => void;
    changeAssetType: (id: FileId, type: AssetType) => void;
    discardFiles: () => void;
}

const useFilesUpload = (): UseFilesUpload => {
    const { ingestion, ingestionDispatch } = useContext(AppContext);
    const { files } = ingestion.uploads;

    const getFile = useCallback((id: FileId): IngestionFile | undefined => lodash.find(files, { id }), [files]);

    const getSelectedFiles = useCallback((): IngestionFile[] => files.filter(({ selected }) => selected), [files]);

    const updateMetadataSteps = useCallback((): boolean => {
        const selectedFiles = getSelectedFiles();

        if (!selectedFiles.length) return false;

        const metadatas: StateMetadata[] = [];

        selectedFiles.forEach((file: IngestionFile) => {
            const metadataStep: StateMetadata = {
                file,
                photogrammetry: defaultPhotogrammetryFields
            };

            metadatas.push(metadataStep);
        });

        const addStepAction: IngestionDispatchAction = {
            type: METADATA_ACTIONS.ADD_METADATA,
            metadatas
        };

        ingestionDispatch(addStepAction);
        return true;
    }, [getSelectedFiles, ingestionDispatch]);

    const loadFiles = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length) {
                const ingestionFiles: IngestionFile[] = [];
                acceptedFiles.forEach((file: File): void => {
                    const id = `${file.name.replace(/[^\w\s]/gi, '')}${files.length}`;
                    const alreadyContains = !!lodash.find(files, { id });

                    const { name, size } = file;

                    if (!alreadyContains) {
                        const ingestionFile = {
                            id,
                            file,
                            name,
                            size,
                            status: FileUploadStatus.READY,
                            progress: 0,
                            type: AssetType.Photogrammetry,
                            selected: false,
                            cancel: null
                        };

                        ingestionFiles.push(ingestionFile);
                    } else {
                        toast.info(`${file.name} was already loaded`);
                    }
                });

                const loadAction: IngestionDispatchAction = {
                    type: UPLOAD_ACTIONS.LOAD,
                    files: ingestionFiles
                };

                ingestionDispatch(loadAction);
            }
        },
        [files, ingestionDispatch]
    );

    const changeAssetType = useCallback(
        (id: FileId, assetType: AssetType): void => {
            const changeAssetTypeAction: IngestionDispatchAction = {
                type: UPLOAD_ACTIONS.SET_ASSET_TYPE,
                id,
                assetType
            };

            ingestionDispatch(changeAssetTypeAction);
        },
        [ingestionDispatch]
    );

    const startUpload = (id: FileId) => {
        const startAction: IngestionDispatchAction = {
            type: UPLOAD_ACTIONS.START,
            id
        };

        const file = getFile(id);

        if (file) {
            ingestionDispatch(startAction);
            startUploadTransfer(file);
        }
    };

    const retryUpload = (id: FileId): void => {
        const retryAction: IngestionDispatchAction = {
            type: UPLOAD_ACTIONS.RETRY,
            id
        };

        const file = getFile(id);

        if (file) {
            ingestionDispatch(retryAction);
            startUploadTransfer(file);
        }
    };

    const cancelUpload = useCallback(
        (id: FileId): void => {
            const file = getFile(id);

            if (file) {
                if (file.status === 'UPLOADING') {
                    const { cancel } = file;
                    if (cancel) {
                        cancel();
                        const cancelledAction: IngestionDispatchAction = {
                            type: UPLOAD_ACTIONS.CANCELLED,
                            id
                        };

                        ingestionDispatch(cancelledAction);
                        toast.warn('Upload has been cancelled');
                    }
                }
            }
        },
        [getFile, ingestionDispatch]
    );

    const removeUpload = useCallback(
        (id: FileId): void => {
            const removeAction: IngestionDispatchAction = {
                type: UPLOAD_ACTIONS.REMOVE,
                id
            };

            ingestionDispatch(removeAction);
        },
        [ingestionDispatch]
    );

    const startUploadTransfer = useCallback(
        async (ingestionFile: IngestionFile) => {
            const { id, file, type } = ingestionFile;

            const successAction: IngestionDispatchAction = {
                type: UPLOAD_ACTIONS.COMPLETE,
                id
            };

            const errorAction: IngestionDispatchAction = {
                type: UPLOAD_ACTIONS.FAILED,
                id
            };

            try {
                const onProgress = (event: ProgressEvent) => {
                    const { loaded, total } = event;
                    const progress = Math.floor((loaded / total) * 100);
                    const updateProgress = !(progress % 5);

                    if (updateProgress) {
                        const uploadProgressAction: IngestionDispatchAction = {
                            type: UPLOAD_ACTIONS.PROGRESS,
                            id,
                            progress
                        };

                        ingestionDispatch(uploadProgressAction);
                    }
                };

                const onCancel = (cancel: () => void) => {
                    const setCancel: IngestionDispatchAction = {
                        type: UPLOAD_ACTIONS.SET_CANCEL_HANDLER,
                        id,
                        cancel
                    };

                    ingestionDispatch(setCancel);
                };

                const { data }: IngestionUploadResponse = await apolloUploader({
                    mutation: UploadAssetDocument,
                    variables: { file, type },
                    useUpload: true,
                    onProgress,
                    onCancel
                });

                const { uploadAsset } = data;

                if (uploadAsset.status === IngestionUploadStatus.COMPLETE) {
                    ingestionDispatch(successAction);
                    toast.success(`Upload finished for ${file.name}`);
                } else if (uploadAsset.status === IngestionUploadStatus.FAILED) {
                    const error = `Upload failed for ${file.name}`;
                    toast.error(error);
                    ingestionDispatch(errorAction);
                }
            } catch ({ message }) {
                const file = getFile(id);
                if (file) {
                    if (file.status !== FileUploadStatus.CANCELLED) {
                        toast.error(message);
                        ingestionDispatch(errorAction);
                    }
                }
            }
        },
        [getFile, ingestionDispatch]
    );

    const discardFiles = () => {
        // TODO: send dispatch to server about discarded items
        const discardFilesAction: IngestionDispatchAction = {
            type: UPLOAD_ACTIONS.DISCARD_FILES
        };

        ingestionDispatch(discardFilesAction);
    };

    return {
        updateMetadataSteps,
        loadFiles,
        startUpload,
        cancelUpload,
        retryUpload,
        removeUpload,
        changeAssetType,
        discardFiles
    };
};

export default useFilesUpload;
