import { useCallback, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AppContext } from '../../../context';
import { TRANSFER_ACTIONS, IngestionFile, FileId, IngestionDispatchAction } from '../../../context';
import lodash from 'lodash';
import { MUTATION_UPLOAD_FILE, apolloUploader } from '../../../graphql';

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

                if (!alreadyContains) {
                    const blob = window.URL.createObjectURL(file);
                    const ingestionFile = {
                        id,
                        data: file,
                        blob
                    };

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
            if (current) {
                const { id, data } = current;
                apolloUploader({
                    mutation: MUTATION_UPLOAD_FILE,
                    variables: {
                        file: data
                    },
                    useUpload: true,
                    onProgress: (event: ProgressEvent) => {
                        const { loaded, total } = event;
                        const progress = (loaded / total) * 100;

                        const uploadProgressAction: IngestionDispatchAction = {
                            type: TRANSFER_ACTIONS.UPLOAD_PROGRESS,
                            id,
                            progress
                        };

                        ingestionDispatch(uploadProgressAction);
                    },
                    onAbortPossible: (abortHandler: AbortController) => {
                        console.log(abortHandler);
                    }
                })
                    .then(() => {
                        const uploadedAction: IngestionDispatchAction = {
                            type: TRANSFER_ACTIONS.FILE_UPLOADED,
                            previous: current
                        };

                        ingestionDispatch(uploadedAction);
                    })
                    .catch(error => {
                        console.error(error);
                        const errorAction: IngestionDispatchAction = {
                            type: TRANSFER_ACTIONS.UPLOAD_ERROR,
                            previous: current
                        };

                        ingestionDispatch(errorAction);
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
