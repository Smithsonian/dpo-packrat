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

        console.log(`[PACKRAT] startUpload (${updateFile?.file?.name ?? 'na'}, ${updateFile?.file?.size ?? '-1'})`);

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

        console.log(`[PACKRAT] cancelUpload (${file?.name ?? 'undefined'})`);

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

        console.log(`[PACKRAT] startUploadTransfer (${ingestionFile.file.name})`);

        const { pending } = get();
        const { id, file, type } = ingestionFile;
        try {
            const onProgress = (event: ProgressEvent) => {
                // registered with Apollo xhr.upload.onprogress callback and triggers
                // PROGRESS event at every 10 steps so the UX can properly update.
                const { loaded, total } = event;

                if (total === 0) {
                    console.warn('[PACKRAT] ProgressEvent total is zero. Unable to calculate progress.');
                    return;
                }

                const progress = Math.floor((loaded / total) * 100);
                const updateProgress = (progress % 5) === 0;

                if (updateProgress) {
                    const progressEvent: UploadProgressEvent = {
                        id,
                        progress
                    };
                    // console.log(`[PACKRAT] startUploadTransfer.onProgress fire event (event: ${progressEvent} | pending: ${JSON.stringify(pending)})`);
                    console.log('[PACKRAT] upload onProgress',event);
                    UploadEvents.dispatch(UploadEventType.PROGRESS, progressEvent);
                }
            };
            const onCancel = (cancelCallback: () => void) => {
                // registered with Apollo xhr.upload.onabort callbacks and triggers a cancelled event
                const cancelEvent: UploadSetCancelEvent = {
                    id,
                    onCancel: cancelCallback
                };

                // console.log(`[PACKRAT] startUploadTransfer.onCancel fire event (event: ${cancelEvent} | pending: ${JSON.stringify(pending)})`);
                UploadEvents.dispatch(UploadEventType.SET_CANCELLED, cancelEvent);
            };
            const onFailed = (error: ErrorEvent) => {
                // registered with Apollo xhr.upload.onerror and triggers a failed event
                const failedEvent: UploadFailedEvent = {
                    id,
                    message: error.message || 'Unknown Error'
                };

                // console.error(`[PACKRAT] startUploadTransfer.onFailed fire event (event: ${error})`);
                UploadEvents.dispatch(UploadEventType.FAILED, failedEvent);
            };

            const uploadAssetInputs: UploadAssetInput = { file, type };
            if (references && references.idAsset)
                uploadAssetInputs.idAsset = references.idAsset;
            if (references && references.idSOAttachment) {
                uploadAssetInputs.idSOAttachment = references.idSOAttachment;

                const { getVocabularyId } = useVocabularyStore.getState();
                uploadAssetInputs.type = getVocabularyId(eVocabularyID.eAssetAssetTypeAttachment) ?? 0;
            }

            console.log(`[PACKRAT] uploading file '${file?.name ?? 'na'}' of size: ${file?.size ?? '-1'}`);

            const { data } = await apolloUploader({
                mutation: UploadAssetDocument,
                variables: uploadAssetInputs,
                refetchQueries: ['getUploadedAssetVersion'],
                useUpload: true,
                onProgress,
                onCancel,
                onFailed,
            });
            const { uploadAsset }: UploadAssetMutation = data;

            // once we have an uploaded asset we check/handle our response
            if (uploadAsset) {
                const { status, error } = uploadAsset;

                if (status === UploadStatus.Complete) {
                    const uploadEvent: UploadCompleteEvent = { id };
                    UploadEvents.dispatch(UploadEventType.COMPLETE, uploadEvent);
                    //This message occurs when the upload is successfully transferred for processing.
                    toast.success(`Upload finished for ${file.name}`);
                } else if (status === UploadStatus.Failed) {
                    console.log(`[PACKRAT] startUploadTransfer upload failed (id: ${id} | file: ${(file)?file['path']:'na'} | error: ${error})`);
                    const failedEvent: UploadFailedEvent = { id, message: error || 'Unknown error' };
                    UploadEvents.dispatch(UploadEventType.FAILED, failedEvent);

                    const errorMessage = error || `Upload failed for ${file.name}`;
                    toast.error(errorMessage);
                } else if (status === UploadStatus.Noauth) {
                    console.log(`[PACKRAT:ERROR] startUploadTransfer upload failed ${id}, ${JSON.stringify(file)}, user not authenticated`);
                    const failedEvent: UploadFailedEvent = { id, message: error || 'Unknown error' };
                    UploadEvents.dispatch(UploadEventType.FAILED, failedEvent);

                    global.alert('The Packrat user is no longer authenticated. Please login.');
                    window.location.href = ROUTES.LOGIN;
                }
            }
        } catch (error) {
            const message: string = (error instanceof Error) ? error.message : '';
            console.log(`[PACKRAT:ERROR] startUploadTransfer Exception ${message}`);
            const file = getFile(id, pending);

            if (file) {
                if (file.status !== FileUploadStatus.CANCELLED) {
                    console.log(`[PACKRAT:ERROR] startUploadTransfer upload failed ${id}, ${JSON.stringify(file)}, exception ${message}`);
                    const failedEvent: UploadFailedEvent = { id, message: 'cancelled'  };
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

        // set our pending list to the new values. need to create new array because
        // React only updates when reference changes (not properties).
        set({ pending: [ ...updatedPending ] });
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
                set({ completed: [ ...updatedCompleted ] });

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
        set({ completed: [ ...updatedCompleted ] });
    },
    onProgressEvent: (eventData: UploadProgressEvent, options?: UploadOptions): void => {
        const { pending, pendingAttachments, pendingUpdates } = get();
        const { id, progress } = eventData;

        // DEBUG: to help track status changes and events
        // const statusPending = pending.map(item => {
        //     return {
        //         filename: item.file['path'],
        //         status: item.status,
        //         progress: item.progress
        //     };
        // });
        // console.log(`[PACKRAT] onProgressEvent (options: ${JSON.stringify(options)} | pending: ${JSON.stringify(statusPending)})`);

        console.log(`[PACKRAT] onProgress (${progress})`);

        // handles updates and attachments if a SystemObject id is provided
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

            // since React only triggers an update when a reference changes (not properties) we
            // create a new array/reference for pending so we can catch changes to its status.
            set({ pending: [...pending] });

        } else {
            const updatedPendingProgress = lodash.forEach(pending, file => {
                if (file.id === id) {
                    lodash.set(file, 'progress', progress);
                    if (progress === 100)
                        lodash.set(file, 'status', FileUploadStatus.PROCESSING);
                }
            });

            // set our pending list to the new values. need to create new array because
            // React only updates when reference changes (not properties).
            set({ pending: [...updatedPendingProgress] });
        }
    },
    onSetCancelledEvent: (eventData: UploadSetCancelEvent, options?: UploadOptions): void => {
        const { pending, pendingAttachments, pendingUpdates } = get();
        const { id, onCancel } = eventData;

        // DEBUG: to help track status changes and events
        // const statusPending = pending.map(item => {
        //     return {
        //         filename: item.file['path'],
        //         status: item.status,
        //         progress: item.progress
        //     };
        // });
        // console.log(`[PACKRAT] onCancelledEvent (pending: ${JSON.stringify(statusPending)})`);

        console.log(`[PACKRAT] onCancel (id: ${id})`);

        // handles updates and attachments
        if (options?.idSystemObject) {
            const isAttachment = options.references.idSOAttachment;
            const isUpdate = options.references.idAsset;

            if (isAttachment) {
                const updatedAttachments = new Map(pendingAttachments);
                const file = pendingAttachments.get(options.idSystemObject) as IngestionFile;
                file.cancel = onCancel;
                set({ pendingAttachments: updatedAttachments });
            }

            if (isUpdate) {
                const updatedUpdates = new Map(pendingUpdates);
                const file = pendingUpdates.get(options.idSystemObject) as IngestionFile;
                file.cancel = onCancel;
                set({ pendingUpdates: updatedUpdates });
            }

            // since React only triggers an update when a reference changes (not properties) we
            // create a new array/reference for pending so we can catch changes to its status.
            set({ pending: [ ...pending ] });

        } else {
            const updateSetCancel = lodash.forEach(pending, file => {
                if (file.id === id) {
                    lodash.set(file, 'cancel', onCancel);
                }
            });

            // set our pending list to the new values. need to create new array because
            // React only updates when reference changes (not properties).
            set({ pending: [ ...updateSetCancel ] });
        }
    },
    onFailedEvent: (eventData: UploadFailedEvent, options?: UploadOptions): void => {
        const { pending, pendingAttachments, pendingUpdates } = get();
        const { id } = eventData;

        // DEBUG: to help track status changes and events
        // const statusPending = pending.map(item => {
        //     return {
        //         filename: item.file['path'],
        //         status: item.status,
        //         progress: item.progress
        //     };
        // });
        // console.log(`[PACKRAT] onFailedEvent (pending: ${JSON.stringify(statusPending)})`);
        console.log(`[PACKRAT] onFailed (id: ${id})`);

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

            // since React only triggers an update when a reference changes (not properties) we
            // create a new array/reference for pending so we can catch changes to its status.
            set({ pending: [ ...pending ] });

        } else {
            const updatedFailedPending = lodash.forEach(pending, file => {
                if (file.id === id) {
                    lodash.set(file, 'status', FileUploadStatus.FAILED);
                }
            });

            // set our pending list to the new values. need to create new array because
            // React only updates when reference changes (not properties).
            set({ pending: [ ...updatedFailedPending ] });
        }
    },
    onCompleteEvent: (eventData: UploadCompleteEvent, options?: UploadOptions): void => {
        // subscribed to via the main upload index/component
        const { pending, pendingAttachments, pendingUpdates } = get();
        const { id } = eventData;

        // DEBUG: to help track status changes and events
        // const statusPending = pending.map(item => {
        //     return {
        //         filename: item.file['path'],
        //         status: item.status,
        //         progress: item.progress
        //     };
        // });
        // console.log(`[PACKRAT] onCompleteEvent (pending: ${JSON.stringify(statusPending)})`);

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

            // since React only triggers an update when a reference changes (not properties) we
            // create a new array/reference for pending so we can catch changes to its status.
            set({ pending: [ ...pending ] });

        } else {
            const updatedComplete = pending.filter(file => file.id !== id);

            // set our pending list to the new values. need to create new array because
            // React only updates when reference changes (not properties).
            set({ pending: [ ...updatedComplete ] });
        }
    },
    reset: (): void => {
        console.log('[PACKRAT] reset');

        const { completed, /*pending*/ } = get();
        const unselectFiles = (file: IngestionFile): IngestionFile => ({
            ...file,
            selected: false
        });
        const updatedCompleted: IngestionFile[] = completed.map(unselectFiles);

        // DEBUG: to help track status changes and events
        // const statusPending = pending.map(item => {
        //     return {
        //         filename: item.file['path'],
        //         status: item.status,
        //         progress: item.progress
        //     };
        // });
        // console.log(`[PACKRAT] Upload store reset (pending: ${JSON.stringify(statusPending)})`);

        // set our pending list to the new values. need to create new array because
        // React only updates when reference changes (not properties).
        set({ completed: [ ...updatedCompleted ], loading: false });
    },
    resetSpecialPending: (uploadType: eIngestionMode) => {
        console.log('[PACKRAT] reset special');
        if (uploadType === eIngestionMode.eAttach) set({ pendingAttachments: new Map() });
        if (uploadType === eIngestionMode.eUpdate) set({ pendingUpdates: new Map() });
    }
}));

const getFile = (id: FileId, files: IngestionFile[]) => lodash.find(files, { id });

