import { useCallback, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AppContext } from '../../../context';
import { TRANSFER_ACTIONS, IngestionFile, IngestionDispatch } from '../../../context/ingestion';
import lodash from 'lodash';

const mockApi = {
    uploadFile(dispatch: IngestionDispatch) {
        // mocks 10s upload each
        return new Promise(resolve => {
            let progress: number = 0;
            const timer = setInterval(() => {
                progress += 10;
                if (progress === 100) {
                    clearInterval(timer);
                    resolve();
                }

                dispatch({ type: TRANSFER_ACTIONS.UPLOAD_PROGRESS, progress });
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
    const { files, pending, next, uploading } = state.transfer;

    const onSubmit = useCallback(
        (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            event.preventDefault();
            if (uploading) {
                toast.info('Uploading files please wait...');
                return;
            }

            if (files.length) {
                dispatch({ type: TRANSFER_ACTIONS.SUBMIT });
            } else {
                toast.warn('You do not have any files loaded.');
            }
        },
        [uploading, files.length]
    );

    const onChange = (acceptedFiles: File[]): void => {
        if (acceptedFiles.length) {
            let ingestionFiles: IngestionFile[] = [];
            acceptedFiles.forEach((file: File): void => {
                const alreadyContains = !!lodash.find(files, { id: file.size });

                if (!alreadyContains) {
                    const src = window.URL.createObjectURL(file);
                    const ingestionFile = { file, id: file.size, src };
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
        if (pending.length) {
            if (next) {
                mockApi
                    .uploadFile(dispatch)
                    .then(() => {
                        const prev = next;
                        const updatedPending = pending.slice(1);
                        dispatch({ type: TRANSFER_ACTIONS.FILE_UPLOADED, prev, pending: updatedPending });
                    })
                    .catch(error => {
                        console.error(error);
                        dispatch({ type: TRANSFER_ACTIONS.SET_UPLOAD_ERROR, error });
                    });
            } else if (!next) {
                const next = pending[0];
                dispatch({ type: TRANSFER_ACTIONS.NEXT, next });
            }
        }
    }, [next, pending]);

    useEffect(() => {
        if (!pending.length && uploading) {
            dispatch({ type: TRANSFER_ACTIONS.FILES_UPLOADED });
        }
    }, [pending.length, uploading]);

    return {
        onSubmit,
        onChange
    };
};

export default useFilesUpload;
