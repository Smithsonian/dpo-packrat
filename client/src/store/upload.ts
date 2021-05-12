/**
 * Upload Store
 *
 * This store manages state for file uploads used in Ingestion flow.
 */
import create, { SetState, GetState } from 'zustand';
import lodash from 'lodash';
import path from 'path';
import { toast } from 'react-toastify';
import { eVocabularySetID } from '../types/server';
import { generateFileId } from '../utils/upload';
import { useVocabularyStore } from './vocabulary';
import { apolloClient, apolloUploader } from '../graphql';
import { DiscardUploadedAssetVersionsDocument, DiscardUploadedAssetVersionsMutation, UploadAssetDocument, UploadAssetMutation, UploadStatus } from '../types/graphql';
import { FetchResult } from '@apollo/client';
import { parseFileId } from './utils';
import { UploadEvents, UploadEventType, UploadCompleteEvent, UploadProgressEvent, UploadSetCancelEvent, UploadFailedEvent } from '../utils/events';

export type FileId = string;

export enum FileUploadStatus {
    READY = 'READY',
    UPLOADING = 'UPLOADING',
    PROCESSING = 'PROCESSING',
    COMPLETE = 'COMPLETE',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED'
}

export type IngestionFile = {
    id: FileId;
    size: number;
    name: string;
    file: File;
    type: number;
    status: FileUploadStatus;
    progress: number;
    selected: boolean;
    cancel: (() => void) | null;
};

type UploadStore = {
    completed: IngestionFile[];
    pending: IngestionFile[];
    loading: boolean;
    updateMode: boolean;
    //create new property to handle the asset context
    setUpdateMode: (update: boolean) => void;
    getSelectedFiles: (files: IngestionFile[], selected: boolean) => IngestionFile[];
    loadPending: (acceptedFiles: File[]) => void;
    loadCompleted: (completed: IngestionFile[]) => void;
    selectFile: (id: FileId, selected: boolean) => void;
    startUpload: (id: FileId) => void;
    cancelUpload: (id: FileId) => void;
    retryUpload: (id: FileId) => void;
    removeUpload: (id: FileId) => void;
    startUploadTransfer: (ingestionFile: IngestionFile) => void;
    changeAssetType: (id: FileId, assetType: number) => void;
    discardFiles: () => Promise<void>;
    removeSelectedUploads: () => void;
    onProgressEvent: (data: UploadProgressEvent) => void;
    onSetCancelledEvent: (data: UploadSetCancelEvent) => void;
    onFailedEvent: (data: UploadFailedEvent) => void;
    onCompleteEvent: (data: UploadCompleteEvent) => void;
    reset: () => void;
};

export const useUploadStore = create<UploadStore>((set: SetState<UploadStore>, get: GetState<UploadStore>) => ({
    completed: [],
    pending: [],
    loading: true,
    updateMode: false,
    setUpdateMode: (update) => { set({ updateMode: update }) },
    getSelectedFiles: (files: IngestionFile[], selected: boolean): IngestionFile[] => lodash.filter(files, file => file.selected === selected),
    loadPending: (acceptedFiles: File[]) => {
        const { pending } = get();

        if (acceptedFiles.length) {
            const ingestionFiles: IngestionFile[] = [];
            acceptedFiles.forEach((file: File): void => {
                const id = generateFileId();
                const alreadyContains = !!lodash.find(pending, { id });

                const { name, size } = file;
                const extension: string = (name.toLowerCase().endsWith('.svx.json')) ? '.svx.json' : path.extname(name);
                const { getAssetTypeForExtension, getInitialEntry } = useVocabularyStore.getState();
                let type = getAssetTypeForExtension(extension);
                if (!type)
                    type = getInitialEntry(eVocabularySetID.eAssetAssetType);
                if (!type) {
                    toast.error(`Asset type for file ${name} not found`);
                    return;
                }

                if (!alreadyContains) {
                    const ingestionFile = {
                        id,
                        file,
                        name,
                        size,
                        status: FileUploadStatus.READY,
                        progress: 0,
                        type,
                        selected: false,
                        cancel: null
                    };

                    ingestionFiles.push(ingestionFile);
                } else {
                    toast.info(`${file.name} was already loaded`);
                }
            });

            const updatedPendingFiles = lodash.concat(pending, ingestionFiles);
            set({ pending: updatedPendingFiles });
        }
    },
    loadCompleted: (completed: IngestionFile[]): void => {
        set({ completed, loading: false });
    },
    selectFile: (id: FileId, selected: boolean) => {
        const { completed } = get();
        const updatedCompleted = lodash.forEach(completed, file => {
            if (file.id === id) {
                lodash.set(file, 'selected', selected);
            }
        });

        set({ completed: updatedCompleted });
    },
    startUpload: (id: FileId) => {
        const { pending, startUploadTransfer } = get();
        const file = getFile(id, pending);

        if (file) {
            const updatedPending = lodash.forEach(pending, file => {
                if (file.id === id) {
                    lodash.set(file, 'progress', 0);
                    lodash.set(file, 'status', FileUploadStatus.UPLOADING);
                }
            });

            set({ pending: updatedPending });
            startUploadTransfer(file);
        }
    },
    retryUpload: (id: FileId): void => {
        const { pending, startUploadTransfer } = get();
        const file = getFile(id, pending);
        if (file) {
            const updatedPending = lodash.forEach(pending, file => {
                if (file.id === id) {
                    lodash.set(file, 'status', FileUploadStatus.UPLOADING);
                }
            });

            set({ pending: updatedPending });
            startUploadTransfer(file);
        }
    },
    cancelUpload: (id: FileId): void => {
        const { pending } = get();
        const file = getFile(id, pending);

        if (file) {
            if (file.status === FileUploadStatus.UPLOADING) {
                const { cancel } = file;
                if (cancel) {
                    cancel();
                    const updatedPending = lodash.forEach(pending, file => {
                        if (file.id === id) {
                            lodash.set(file, 'status', FileUploadStatus.CANCELLED);
                        }
                    });
                    set({ pending: updatedPending });
                    toast.warn('Upload has been cancelled');
                }
            }
        }
    },
    removeUpload: (id: FileId): void => {
        const { pending } = get();
        const updatedPending = pending.filter(file => file.id !== id);
        set({ pending: updatedPending });
    },
    startUploadTransfer: async (ingestionFile: IngestionFile) => {
        const { pending } = get();
        const { id, file, type } = ingestionFile;

        try {
            const onProgress = (event: ProgressEvent) => {
                const { loaded, total } = event;
                const progress = Math.floor((loaded / total) * 100);
                const updateProgress = !(progress % 1);

                if (updateProgress) {
                    const progressEvent: UploadProgressEvent = {
                        id,
                        progress
                    };
                    UploadEvents.dispatch(UploadEventType.PROGRESS, progressEvent);
                }
            };

            const onCancel = (cancel: () => void) => {
                const setCancelEvent: UploadSetCancelEvent = {
                    id,
                    cancel
                };
                UploadEvents.dispatch(UploadEventType.SET_CANCELLED, setCancelEvent);
            };

            const { data } = await apolloUploader({
                mutation: UploadAssetDocument,
                variables: { file, type },
                refetchQueries: ['getUploadedAssetVersion'],
                useUpload: true,
                onProgress,
                onCancel
            });

            const { uploadAsset }: UploadAssetMutation = data;

            if (uploadAsset) {
                const { status, error } = uploadAsset;

                if (status === UploadStatus.Complete) {
                    const uploadEvent: UploadCompleteEvent = { id };
                    UploadEvents.dispatch(UploadEventType.COMPLETE, uploadEvent);

                    toast.success(`Upload finished for ${file.name}`);
                } else if (status === UploadStatus.Failed) {
                    const failedEvent: UploadFailedEvent = { id };
                    UploadEvents.dispatch(UploadEventType.FAILED, failedEvent);

                    const errorMessage = error || `Upload failed for ${file.name}`;
                    toast.error(errorMessage);
                }
            }
        } catch ({ message }) {
            const file = getFile(id, pending);

            if (file) {
                if (file.status !== FileUploadStatus.CANCELLED) {
                    const failedEvent: UploadFailedEvent = { id };
                    UploadEvents.dispatch(UploadEventType.FAILED, failedEvent);
                }
            }
        }
    },
    changeAssetType: (id: FileId, assetType: number): void => {
        const { pending } = get();
        const updatedPending = lodash.forEach(pending, file => {
            if (file.id === id) {
                lodash.set(file, 'type', assetType);
            }
        });
        set({ pending: updatedPending });
    },
    discardFiles: async (): Promise<void> => {
        const { completed, getSelectedFiles } = get();
        const selectedFiles = getSelectedFiles(completed, true);

        if (!selectedFiles.length) {
            toast.warn('Please select at least 1 file to discard');
            return;
        }

        const isConfirmed = global.confirm('Do you want to discard selected items?');

        if (!isConfirmed) return;

        const idAssetVersions: number[] = selectedFiles.map(({ id }) => parseFileId(id));

        const discardMutationVariables = {
            input: {
                idAssetVersions
            }
        };

        try {
            const { data }: FetchResult<DiscardUploadedAssetVersionsMutation> = await apolloClient.mutate({
                mutation: DiscardUploadedAssetVersionsDocument,
                variables: discardMutationVariables
            });

            if (data) {
                const { discardUploadedAssetVersions } = data;
                const { success } = discardUploadedAssetVersions;

                if (!success) {
                    toast.error('Failed to discard selected files');
                    return;
                }

                const updatedCompleted = getSelectedFiles(completed, false);
                set({ completed: updatedCompleted });

                toast.info('Selected files have been discarded');
                return;
            }
        } catch {
            toast.error('Failed to discard selected files');
        }
    },
    removeSelectedUploads: (): void => {
        const { completed } = get();
        const updatedCompleted = completed.filter(({ selected }) => !selected);
        set({ completed: updatedCompleted });
    },
    onProgressEvent: (eventData: UploadProgressEvent): void => {
        const { pending } = get();
        const { id, progress } = eventData;

        const updatedPendingProgress = lodash.forEach(pending, file => {
            if (file.id === id) {
                lodash.set(file, 'progress', progress);
                if (progress === 100)
                    lodash.set(file, 'status', FileUploadStatus.PROCESSING);
            }
        });
        set({ pending: updatedPendingProgress });
    },
    onSetCancelledEvent: (eventData: UploadSetCancelEvent): void => {
        const { pending } = get();
        const { id, cancel } = eventData;

        const updateSetCancel = lodash.forEach(pending, file => {
            if (file.id === id) {
                lodash.set(file, 'cancel', cancel);
            }
        });
        set({ pending: updateSetCancel });
    },
    onFailedEvent: (eventData: UploadFailedEvent): void => {
        const { pending } = get();
        const { id } = eventData;

        const updatedFailedPending = lodash.forEach(pending, file => {
            if (file.id === id) {
                lodash.set(file, 'status', FileUploadStatus.FAILED);
            }
        });

        set({ pending: updatedFailedPending });
    },
    onCompleteEvent: (eventData: UploadCompleteEvent): void => {
        const { pending } = get();
        const { id } = eventData;
        const updatedComplete = pending.filter(file => file.id !== id);

        set({ pending: updatedComplete });
    },
    reset: (): void => {
        const { completed } = get();
        const unselectFiles = (file: IngestionFile): IngestionFile => ({
            ...file,
            selected: false
        });

        const updatedCompleted: IngestionFile[] = completed.map(unselectFiles);
        set({ completed: updatedCompleted, loading: false });
    }
}));

const getFile = (id: FileId, files: IngestionFile[]) => lodash.find(files, { id });
