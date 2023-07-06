/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Upload Store
 *
 * This store manages state for file uploads used in Ingestion flow.
 */
import create, { SetState, GetState } from 'zustand';
import lodash from 'lodash';
import path from 'path';
import { toast } from 'react-toastify';
import { eVocabularySetID, eVocabularyID } from '@dpo-packrat/common';
import { generateFileId } from '../utils/upload';
import { useVocabularyStore } from './vocabulary';
import { apolloClient, apolloUploader } from '../graphql';
import { DiscardUploadedAssetVersionsDocument, DiscardUploadedAssetVersionsMutation, UploadAssetDocument, UploadAssetMutation, UploadStatus, UploadAssetInput } from '../types/graphql';
import { FetchResult } from '@apollo/client';
import { parseFileId } from './utils';
import { UploadEvents, UploadEventType, UploadCompleteEvent, UploadProgressEvent, UploadSetCancelEvent, UploadFailedEvent } from '../utils/events';
import { eIngestionMode, ROUTES } from '../constants';

export type FileId = string;

export enum FileUploadStatus {
    READY = 'READY',
    UPLOADING = 'UPLOADING',
    PROCESSING = 'PROCESSING',
    COMPLETE = 'COMPLETE',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED'
}

export type UploadReferences = {
    idAsset?: number;
    idSOAttachment?: number;
};

type UploadOptions = {
    references: UploadReferences;
    idSystemObject: number;
};

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
    idAsset?: number;
    idSOAttachment?: number;
    updateContext?: string;
};

type UploadStore = {
    completed: IngestionFile[];
    pending: IngestionFile[];
    pendingUpdates: Map<number, IngestionFile>;
    pendingAttachments: Map<number, IngestionFile>;
    loading: boolean;
    getSelectedFiles: (files: IngestionFile[], selected: boolean) => IngestionFile[];
    loadPending: (acceptedFiles: File[]) => void;
    loadSpecialPending: (acceptedFiles: File[], references: UploadReferences, idSO: number) => void;
    loadCompleted: (completed: IngestionFile[], refetch) => void;
    selectFile: (id: FileId, selected: boolean) => void;
    startUpload: (id: FileId, options?: UploadOptions) => void;
    cancelUpload: (id: FileId) => void;
    cancelSpecialUpload: (uploadType: eIngestionMode, idSO: number) => void;
    retryUpload: (id: FileId) => void;
    retrySpecialUpload: (uploadType: eIngestionMode, idSO: number) => void;
    removeUpload: (id: FileId) => void;
    removeSpecialPending: (uploadType: eIngestionMode, idSO: number) => void;
    startUploadTransfer: (ingestionFile: IngestionFile, references?: UploadReferences) => void;
    changeAssetType: (id: FileId, assetType: number) => void;
    discardFiles: () => Promise<void>;
    removeSelectedUploads: () => void;
    onProgressEvent: (data: UploadProgressEvent, options?: UploadOptions) => void;
    onSetCancelledEvent: (data: UploadSetCancelEvent, options?: UploadOptions) => void;
    onFailedEvent: (data: UploadFailedEvent, options?: UploadOptions) => void;
    onCompleteEvent: (data: UploadCompleteEvent, options?: UploadOptions) => void;
    reset: () => void;
    resetSpecialPending: (uploadType: eIngestionMode) => void;
    refetch?: (variables?) => Promise<any>;
};

export const useUploadStore = create<UploadStore>((set: SetState<UploadStore>, get: GetState<UploadStore>) => ({
    completed: [],
    pending: [],
    pendingUpdates: new Map(),
    pendingAttachments: new Map(),
    loading: true,
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
    loadSpecialPending: (acceptedFiles: File[], references: UploadReferences, idSO: number) => {
        const { pendingUpdates, pendingAttachments } = get();
        const isUpdate = references.idAsset;
        const isAttachment = references.idSOAttachment;

        if (acceptedFiles.length > 1 || acceptedFiles.length === 0) {
            toast.warning(`${isUpdate ? 'Update' : 'Attachment'} upload only accepts 1 file.`);
            return;
        }

        if (isUpdate && pendingUpdates.has(idSO)) {
            toast.warning('A file has already been queued for upload. Please remove it first and try again.');
            return;
        }

        if (isAttachment && pendingAttachments.has(idSO)) {
            toast.warning('A file has already been queued for upload. Please remove it first and try again.');
            return;
        }

        const file = acceptedFiles[0];

        const id = generateFileId();

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

        if (isUpdate) {
            pendingUpdates.set(idSO, ingestionFile);
            set({ pendingUpdates });
        }

        if (isAttachment) {
            pendingAttachments.set(idSO, ingestionFile);
            set({ pendingAttachments });
        }
    },
    loadCompleted: (completed: IngestionFile[], refetch): void => {
        set({ completed, loading: false, refetch });
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
    startUpload: (id: FileId, options?: UploadOptions) => {
        const { pending, startUploadTransfer, pendingAttachments, pendingUpdates } = get();
        const isUpdate = options?.references.idAsset;
        const isAttachment = options?.references.idSOAttachment;
        const idSystemObject = options?.idSystemObject as number;
        const updateFile = pendingUpdates.get(idSystemObject) as IngestionFile;
        const attachmentFile = pendingAttachments.get(idSystemObject) as IngestionFile;
        const file = isUpdate ? updateFile : isAttachment ? attachmentFile : getFile(id, pending);

        if (file) {
            if (isUpdate) {
                file.progress = 0;
                file.status = FileUploadStatus.UPLOADING;
                const updatedUpdates = new Map(pendingUpdates);
                updatedUpdates.set(idSystemObject, file);
            } else if (isAttachment) {
                file.progress = 0;
                file.status = FileUploadStatus.UPLOADING;
                const updatedAttachments = new Map(pendingAttachments);
                updatedAttachments.set(idSystemObject, file);
            } else {
                const updatedPending = lodash.forEach(pending, file => {
                    if (file.id === id) {
                        lodash.set(file, 'progress', 0);
                        lodash.set(file, 'status', FileUploadStatus.UPLOADING);
                    }
                });

                set({ pending: updatedPending });
            }

            startUploadTransfer(file, options?.references);
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
    retrySpecialUpload: (uploadType: eIngestionMode, idSO: number): void => {
        const { pendingAttachments, pendingUpdates, startUploadTransfer } = get();

        if (uploadType === eIngestionMode.eAttach) {
            const updatedAttachments = new Map(pendingAttachments);
            const file = updatedAttachments.get(idSO) as IngestionFile;
            file.status = FileUploadStatus.UPLOADING;
            set({ pendingAttachments: updatedAttachments });
            startUploadTransfer(file, { idSOAttachment: file.idSOAttachment });
        }
        if (uploadType === eIngestionMode.eUpdate) {
            const updatedUpdates = new Map(pendingUpdates);
            const file = updatedUpdates.get(idSO) as IngestionFile;
            file.status = FileUploadStatus.UPLOADING;
            set({ pendingUpdates: updatedUpdates });
            startUploadTransfer(file, { idAsset: file.idAsset });
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
    cancelSpecialUpload: (uploadType: eIngestionMode, idSO: number): void => {
        const { pendingAttachments, pendingUpdates } = get();
        const updatedAttachments = new Map(pendingAttachments);
        const updatedUpdates = new Map(pendingUpdates);

        if (uploadType === eIngestionMode.eAttach) {
            const file = updatedAttachments.get(idSO) as IngestionFile;
            if (file.status === FileUploadStatus.UPLOADING) {
                const { cancel } = file;
                if (cancel) {
                    cancel();
                    file.status = FileUploadStatus.CANCELLED;
                    set({ pendingAttachments: updatedAttachments });
                }
            }
        }

        if (uploadType === eIngestionMode.eUpdate) {
            const file = updatedUpdates.get(idSO) as IngestionFile;
            if (file.status === FileUploadStatus.UPLOADING) {
                const { cancel } = file;
                if (cancel) {
                    cancel();
                    file.status = FileUploadStatus.CANCELLED;
                    set({ pendingUpdates: updatedUpdates });
                }
            }
        }
    },
    removeUpload: (id: FileId): void => {
        const { pending } = get();
        const updatedPending = pending.filter(file => file.id !== id);
        set({ pending: updatedPending });
    },
    removeSpecialPending: (uploadType: eIngestionMode, idSO: number): void => {
        const { pendingAttachments, pendingUpdates } = get();
        const updatedAttachments = new Map(pendingAttachments);
        const updatedUpdates = new Map(pendingUpdates);

        if (uploadType === eIngestionMode.eAttach) {
            updatedAttachments.delete(idSO);
            set({ pendingAttachments: updatedAttachments });
        }
        if (uploadType === eIngestionMode.eUpdate) {
            updatedUpdates.delete(idSO);
            set({ pendingUpdates: updatedUpdates });
        }
    },

    //This is the uploading for the Processed Files
    startUploadTransfer: async (ingestionFile: IngestionFile, references?: UploadReferences) => {
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

            const uploadAssetInputs: UploadAssetInput = { file, type };
            if (references && references.idAsset)
                uploadAssetInputs.idAsset = references.idAsset;
            if (references && references.idSOAttachment) {
                uploadAssetInputs.idSOAttachment = references.idSOAttachment;

                const { getVocabularyId } = useVocabularyStore.getState();
                uploadAssetInputs.type = getVocabularyId(eVocabularyID.eAssetAssetTypeAttachment) ?? 0;
            }

            const { data } = await apolloUploader({
                mutation: UploadAssetDocument,
                variables: uploadAssetInputs,
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
                    //This message occurs when the upload is successfully transferred for processing.
                    toast.success(`Upload finished for ${file.name}`);
                } else if (status === UploadStatus.Failed) {
                    console.log(`startUploadTransfer upload failed ${id}, ${JSON.stringify(file)}, error = ${error}`);
                    const failedEvent: UploadFailedEvent = { id };
                    UploadEvents.dispatch(UploadEventType.FAILED, failedEvent);

                    const errorMessage = error || `Upload failed for ${file.name}`;
                    toast.error(errorMessage);
                } else if (status === UploadStatus.Noauth) {
                    console.log(`startUploadTransfer upload failed ${id}, ${JSON.stringify(file)}, user not authenticated`);
                    const failedEvent: UploadFailedEvent = { id };
                    UploadEvents.dispatch(UploadEventType.FAILED, failedEvent);

                    global.alert('The Packrat user is no longer authenticated. Please login.');
                    window.location.href = ROUTES.LOGIN;
                }
            }
        } catch (error) {
            const message: string = (error instanceof Error) ? error.message : '';
            console.log(`startUploadTransfer Exception ${message}`);
            const file = getFile(id, pending);

            if (file) {
                if (file.status !== FileUploadStatus.CANCELLED) {
                    console.log(`startUploadTransfer upload failed ${id}, ${JSON.stringify(file)}, exception ${message}`);
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
        const { completed, getSelectedFiles, refetch } = get();
        const selectedFiles = getSelectedFiles(completed, true);

        if (!selectedFiles.length) {
            toast.warn('Please select at least 1 file to discard');
            return;
        }

        const isConfirmed = global.confirm('Do you want to discard selected items?');
        if (!isConfirmed)
            return;

        try {
            const idAssetVersions: number[] = selectedFiles.map(({ id }) => parseFileId(id));
            const discardMutationVariables = { input: { idAssetVersions } };
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

                if (refetch)
                    refetch();
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
    onProgressEvent: (eventData: UploadProgressEvent, options?: UploadOptions): void => {
        const { pending, pendingAttachments, pendingUpdates } = get();
        const { id, progress } = eventData;

        // handles updates and attachments
        if (options?.idSystemObject) {
            const isAttachment = options.references.idSOAttachment;
            const isUpdate = options.references.idAsset;

            if (isAttachment) {
                const file = pendingAttachments.get(options.idSystemObject) as IngestionFile;
                file.progress = progress;
                if (progress === 100)
                    file.status = FileUploadStatus.PROCESSING;
                const updatedAttachments = new Map(pendingAttachments);
                updatedAttachments.set(options.idSystemObject, file);
                set({ pendingAttachments: updatedAttachments });
            }

            if (isUpdate) {
                const file = pendingUpdates.get(options.idSystemObject) as IngestionFile;
                file.progress = progress;
                if (progress === 100)
                    file.status = FileUploadStatus.PROCESSING;
                const updatedUpdate = new Map(pendingUpdates);
                updatedUpdate.set(options.idSystemObject, file);
                set({ pendingUpdates: updatedUpdate });
            }
        } else {
            const updatedPendingProgress = lodash.forEach(pending, file => {
                if (file.id === id) {
                    lodash.set(file, 'progress', progress);
                    if (progress === 100)
                        lodash.set(file, 'status', FileUploadStatus.PROCESSING);
                }
            });
            set({ pending: updatedPendingProgress });
        }
    },
    onSetCancelledEvent: (eventData: UploadSetCancelEvent, options?: UploadOptions): void => {
        const { pending, pendingAttachments, pendingUpdates } = get();
        const { id, cancel } = eventData;

        // handles updates and attachments
        if (options?.idSystemObject) {
            const isAttachment = options.references.idSOAttachment;
            const isUpdate = options.references.idAsset;

            if (isAttachment) {
                const updatedAttachments = new Map(pendingAttachments);
                const file = pendingAttachments.get(options.idSystemObject) as IngestionFile;
                file.cancel = cancel;
                set({ pendingAttachments: updatedAttachments });
            }

            if (isUpdate) {
                const updatedUpdates = new Map(pendingUpdates);
                const file = pendingUpdates.get(options.idSystemObject) as IngestionFile;
                file.cancel = cancel;
                set({ pendingUpdates: updatedUpdates });
            }
        } else {
            const updateSetCancel = lodash.forEach(pending, file => {
                if (file.id === id) {
                    lodash.set(file, 'cancel', cancel);
                }
            });
            set({ pending: updateSetCancel });
        }
    },
    onFailedEvent: (eventData: UploadFailedEvent, options?: UploadOptions): void => {
        const { pending, pendingAttachments, pendingUpdates } = get();
        const { id } = eventData;

        // handles updates and attachments
        if (options?.idSystemObject) {
            const isAttachment = options.references.idSOAttachment;
            const isUpdate = options.references.idAsset;

            if (isAttachment) {
                const updatedAttachments = new Map(pendingAttachments);
                const file = updatedAttachments.get(options.idSystemObject) as IngestionFile;
                file.status = FileUploadStatus.FAILED;
                set({ pendingAttachments: updatedAttachments });
            }

            if (isUpdate) {
                const updatedUpdates = new Map(pendingUpdates);
                const file = updatedUpdates.get(options.idSystemObject) as IngestionFile;
                file.status = FileUploadStatus.FAILED;
                set({ pendingUpdates: updatedUpdates });
            }
        } else {
            const updatedFailedPending = lodash.forEach(pending, file => {
                if (file.id === id) {
                    lodash.set(file, 'status', FileUploadStatus.FAILED);
                }
            });

            set({ pending: updatedFailedPending });
        }
    },
    onCompleteEvent: (eventData: UploadCompleteEvent, options?: UploadOptions): void => {
        const { pending, pendingAttachments, pendingUpdates } = get();
        const { id } = eventData;

        // handles updates and attachments
        if (options?.idSystemObject) {
            const isAttachment = options.references.idSOAttachment;
            const isUpdate = options.references.idAsset;
            if (isAttachment) {
                const updatedAttachments = new Map(pendingAttachments);
                updatedAttachments.delete(options.idSystemObject);
                set({ pendingAttachments: updatedAttachments });
            }
            if (isUpdate) {
                const updatedUpdate = new Map(pendingUpdates);
                updatedUpdate.delete(options.idSystemObject);
                set({ pendingUpdates: updatedUpdate });
            }
        } else {
            const updatedComplete = pending.filter(file => file.id !== id);

            set({ pending: updatedComplete });
        }
    },
    reset: (): void => {
        const { completed } = get();
        const unselectFiles = (file: IngestionFile): IngestionFile => ({
            ...file,
            selected: false
        });

        const updatedCompleted: IngestionFile[] = completed.map(unselectFiles);
        set({ completed: updatedCompleted, loading: false });
    },
    resetSpecialPending: (uploadType: eIngestionMode) => {
        if (uploadType === eIngestionMode.eAttach) set({ pendingAttachments: new Map() });
        if (uploadType === eIngestionMode.eUpdate) set({ pendingUpdates: new Map() });
    }
}));

const getFile = (id: FileId, files: IngestionFile[]) => lodash.find(files, { id });

