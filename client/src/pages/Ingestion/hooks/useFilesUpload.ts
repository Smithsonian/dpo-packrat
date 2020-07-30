import { useCallback, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AppContext } from '../../../context';
import { TRANSFER_ACTIONS, IngestionFile, IngestionDispatch, FileId } from '../../../context/ingestion';
import lodash from 'lodash';

const mockApi = {
    uploadFile(id: number, dispatch: IngestionDispatch) {
        // mocks 10s upload each
        return new Promise((resolve, reject) => {
            let progress: number = 0;
            const timer = setInterval(() => {
                progress += 25;
                dispatch({ type: TRANSFER_ACTIONS.UPLOAD_PROGRESS, id, progress });

                const error = progress === Math.floor(Math.random() * (52 - 49) + 49);

                if (error) {
                    clearInterval(timer);
                    return reject('Random Error');
                }

                if (progress === 100) {
                    clearInterval(timer);
                    return resolve();
                }
            }, 500);
        });
    }
};

interface UseFilesUpload {
    onChange: (acceptedFiles: File[]) => void;
    onSubmit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const useFilesUpload = (): UseFilesUpload => {
    const { ingestion: state, ingestionDispatch: dispatch } = useContext(AppContext);
    const { files, pending, current, uploading, uploaded, failed } = state.transfer;

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

                dispatch({ type: TRANSFER_ACTIONS.SUBMIT, pending, failed: failedUploads });
            } else {
                toast.warn('You do not have any files loaded.');
            }
        },
        [uploading, files, uploaded, failed, dispatch]
    );

    const onChange = (acceptedFiles: File[]): void => {
        if (acceptedFiles.length) {
            let ingestionFiles: IngestionFile[] = [];
            acceptedFiles.forEach((file: File): void => {
                const alreadyContains = !!lodash.find(files, { id: file.size });

                if (!alreadyContains) {
                    const id = file.size; // TODO: hash this
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
            dispatch({ type: TRANSFER_ACTIONS.LOAD, files: ingestionFiles });
        }
    };

    useEffect(() => {
        const isEmpty = !pending.length;
        if (!isEmpty) {
            if (current) {
                mockApi
                    .uploadFile(current.id, dispatch)
                    .then(() => {
                        dispatch({ type: TRANSFER_ACTIONS.FILE_UPLOADED, previous: current });
                    })
                    .catch(error => {
                        console.error(error);
                        dispatch({ type: TRANSFER_ACTIONS.UPLOAD_ERROR, previous: current });
                    });
            } else if (!current) {
                const current = pending[0];
                dispatch({ type: TRANSFER_ACTIONS.START_NEXT, current });
            }
        }
    }, [current, pending, dispatch]);

    useEffect(() => {
        const isEmpty = !pending.length;
        if (isEmpty && uploading) {
            dispatch({ type: TRANSFER_ACTIONS.UPLOAD_COMPLETE });
        }
    }, [pending.length, uploading, dispatch]);

    return {
        onSubmit,
        onChange
    };
};

export default useFilesUpload;
