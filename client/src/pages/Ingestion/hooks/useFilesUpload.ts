import { useCallback, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AppContext, AssetType } from '../../../context';
import { TRANSFER_ACTIONS, IngestionFile, FileId, IngestionDispatchAction } from '../../../context';
import lodash from 'lodash';
import { MUTATION_UPLOAD_ASSET, apolloUploader } from '../../../graphql';
import { UPLOAD_STATUS } from '../../../constants';

interface UseFilesUpload {
    onChange: (acceptedFiles: File[]) => void;
    onSubmit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const useFilesUpload = (): UseFilesUpload => {
    const { ingestion, ingestionDispatch } = useContext(AppContext);
    const { files, pending, current, uploading, uploaded, failed } = ingestion.transfer;

    const onSubmit = useCallback(
        (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            event.preventDefault();

            if (uploading) {
                toast.info('Uploading files please wait...');
                return;
            }

            if (files.length) {
                const failedUploads = new Map<FileId, IngestionFile>(failed);
                const pending = files.filter(({ id }) => {
                    if (failedUploads.has(id)) {
                        failedUploads.delete(id);
                    }

                    return !uploaded.has(id);
                });

                const submitAction: IngestionDispatchAction = {
                    type: TRANSFER_ACTIONS.SUBMIT,
                    pending,
                    failed: failedUploads
                };

                ingestionDispatch(submitAction);
            } else {
                toast.warn('You do not have any files loaded.');
            }
        },
        [uploading, files, uploaded, failed, ingestionDispatch]
    );

    const onChange = (acceptedFiles: File[]): void => {
        if (acceptedFiles.length) {
            let ingestionFiles: IngestionFile[] = [];
            acceptedFiles.forEach((file: File): void => {
                const id = file.name;
                const alreadyContains = !!lodash.find(files, { id });
                const type = AssetType.Diconde;

                if (!alreadyContains) {
                    const ingestionFile = { id, file, type };

                    ingestionFiles.push(ingestionFile);
                } else {
                    toast.info(`${file.name} was already loaded`);
                }
            });

            ingestionFiles = lodash.concat(files, ingestionFiles);

            const loadAction: IngestionDispatchAction = {
                type: TRANSFER_ACTIONS.LOAD,
                files: ingestionFiles
            };

            ingestionDispatch(loadAction);
        }
    };

    useEffect(() => {
        const isEmpty = !pending.length;
        if (!isEmpty) {
            // check queue status here

            if (current) {
                const uploadedAction: IngestionDispatchAction = {
                    type: TRANSFER_ACTIONS.FILE_UPLOADED,
                    previous: current
                };

                const errorAction = (error: string): IngestionDispatchAction => ({
                    type: TRANSFER_ACTIONS.UPLOAD_ERROR,
                    error,
                    previous: current
                });

                const { id, file, type } = current;

                apolloUploader({
                    mutation: MUTATION_UPLOAD_ASSET,
                    variables: { file, type },
                    useUpload: true,
                    onProgress: (event: ProgressEvent) => {
                        const { loaded, total } = event;
                        const progress = Math.floor((loaded / total) * 100);
                        const updateProgress = !(progress % 5);

                        if (updateProgress) {
                            const uploadProgressAction: IngestionDispatchAction = {
                                type: TRANSFER_ACTIONS.UPLOAD_PROGRESS,
                                id,
                                progress
                            };

                            ingestionDispatch(uploadProgressAction);
                        }
                    },
                    onAbort: (abort: () => void) => {
                        const setAbortAction: IngestionDispatchAction = {
                            type: TRANSFER_ACTIONS.SET_ABORT_HANDLER,
                            abort
                        };

                        ingestionDispatch(setAbortAction);
                    }
                })
                    .then(({ data }) => {
                        const { uploadAsset } = data;

                        if (uploadAsset.status === UPLOAD_STATUS.SUCCESS) {
                            ingestionDispatch(uploadedAction);
                        } else {
                            const error = `Upload failed for ${file.name}`;
                            ingestionDispatch(errorAction(error));
                        }
                    })
                    .catch(error => {
                        const message = error.message.replace('GraphQL error:', '');
                        ingestionDispatch(errorAction(message));
                    });
            } else if (!current) {
                const current = pending[0];
                ingestionDispatch({ type: TRANSFER_ACTIONS.START_NEXT, current });
            }
        }
    }, [current, pending, ingestionDispatch]);

    useEffect(() => {
        const isEmpty = !pending.length;
        if (isEmpty && uploading) {
            const completeAction: IngestionDispatchAction = {
                type: TRANSFER_ACTIONS.UPLOAD_COMPLETE
            };

            ingestionDispatch(completeAction);
        }
    }, [pending.length, uploading, ingestionDispatch]);

    return {
        onSubmit,
        onChange
    };
};

export default useFilesUpload;
