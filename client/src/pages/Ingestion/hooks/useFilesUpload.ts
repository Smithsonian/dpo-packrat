import { useCallback, useContext } from 'react';
import { toast } from 'react-toastify';
import {
    AppContext,
    METADATA_ACTIONS,
    StateMetadata,
    StateProject,
    parseProjectToState,
    StateItem,
    parseItemToState,
    parseSubjectUnitIdentifierToState,
    StateSubject
} from '../../../context';
import { UPLOAD_ACTIONS, IngestionFile, FileId, IngestionDispatchAction, FileUploadStatus } from '../../../context';
import { apolloUploader, apolloClient } from '../../../graphql';
import { UploadAssetDocument, UploadAssetMutation, UploadStatus, GetAssetVersionsDetailsDocument, GetAssetVersionsDetailsQuery } from '../../../types/graphql';
import lodash from 'lodash';
import { defaultPhotogrammetryFields } from '../../../context';
import useVocabularyEntries from './useVocabularyEntries';
import { eVocabularySetID } from '../../../types/server';
import { ApolloQueryResult } from '@apollo/client';
import useProject from './useProject';
import useItem from './useItem';
import { Item, Project, SubjectUnitIdentifier } from '../../../types/graphql';
import useSubject from './useSubject';

type MetadataUpdate = {
    valid: boolean;
    selectedFiles: boolean;
};

interface UseFilesUpload {
    updateMetadataSteps: () => Promise<MetadataUpdate>;
    loadFiles: (acceptedFiles: File[]) => void;
    startUpload: (id: FileId) => void;
    cancelUpload: (id: FileId) => void;
    retryUpload: (id: FileId) => void;
    removeUpload: (id: FileId) => void;
    changeAssetType: (id: FileId, type: number) => void;
    discardFiles: () => void;
}

const useFilesUpload = (): UseFilesUpload => {
    const { ingestion, ingestionDispatch } = useContext(AppContext);
    const { files } = ingestion.uploads;

    const { getInitialEntry } = useVocabularyEntries();
    const { addSubjects } = useSubject();
    const { addProjects } = useProject();
    const { addItems } = useItem();

    const getFile = useCallback((id: FileId): IngestionFile | undefined => lodash.find(files, { id }), [files]);

    const getSelectedFiles = useCallback((): IngestionFile[] => files.filter(({ selected }) => selected), [files]);

    const updateMetadataSteps = async (): Promise<MetadataUpdate> => {
        const selectedFiles = getSelectedFiles();

        if (!selectedFiles.length) {
            return {
                valid: false,
                selectedFiles: false
            };
        }

        const idAssetVersions: number[] = lodash.map(selectedFiles, ({ id }) => Number.parseInt(id, 10));

        try {
            const assetVersionDetailsQuery: ApolloQueryResult<GetAssetVersionsDetailsQuery> = await apolloClient.query({
                query: GetAssetVersionsDetailsDocument,
                variables: {
                    input: {
                        idAssetVersions
                    }
                }
            });

            const { data } = assetVersionDetailsQuery;

            if (data) {
                const { getAssetVersionsDetails } = data;

                const { SubjectUnitIdentifier: foundSubjectUnitIdentifier, Project: foundProject, Item: foundItem } = getAssetVersionsDetails;

                const subjects: StateSubject[] = foundSubjectUnitIdentifier.map((subjectUnitIdentifier: SubjectUnitIdentifier) =>
                    parseSubjectUnitIdentifierToState(subjectUnitIdentifier)
                );
                addSubjects(subjects);

                const projects: StateProject[] = foundProject.map((project: Project, index: number) => parseProjectToState(project, !index));
                addProjects(projects);

                const items: StateItem[] = foundItem.map((item: Item) => parseItemToState(item, false));
                addItems(items);

                const metadatas: StateMetadata[] = [];

                selectedFiles.forEach((file: IngestionFile) => {
                    const metadataStep: StateMetadata = {
                        file,
                        photogrammetry: defaultPhotogrammetryFields
                    };

                    metadatas.push(metadataStep);
                });

                const addMetadataStepAction: IngestionDispatchAction = {
                    type: METADATA_ACTIONS.ADD_METADATA,
                    metadatas
                };

                ingestionDispatch(addMetadataStepAction);

                return {
                    valid: true,
                    selectedFiles: true
                };
            }
        } catch {
            toast.error('Failed to ingest selected files, please try again later');
        }

        return {
            valid: false,
            selectedFiles: true
        };
    };

    const loadFiles = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length) {
                const ingestionFiles: IngestionFile[] = [];
                acceptedFiles.forEach((file: File): void => {
                    const id = `${file.name.replace(/[^\w\s]/gi, '')}${files.length}`;
                    const alreadyContains = !!lodash.find(files, { id });

                    const { name, size } = file;

                    const type = getInitialEntry(eVocabularySetID.eAssetAssetType);

                    if (!alreadyContains && type) {
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

                const loadAction: IngestionDispatchAction = {
                    type: UPLOAD_ACTIONS.LOAD,
                    files: ingestionFiles
                };

                ingestionDispatch(loadAction);
            }
        },
        [files, getInitialEntry, ingestionDispatch]
    );

    const changeAssetType = useCallback(
        (id: FileId, assetType: number): void => {
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

                const { data } = await apolloUploader({
                    mutation: UploadAssetDocument,
                    variables: { file, type },
                    useUpload: true,
                    onProgress,
                    onCancel
                });

                const { uploadAsset }: UploadAssetMutation = data;

                if (uploadAsset) {
                    if (uploadAsset.status === UploadStatus.Complete) {
                        ingestionDispatch(successAction);
                        toast.success(`Upload finished for ${file.name}`);
                    } else if (uploadAsset.status === UploadStatus.Failed) {
                        const error = `Upload failed for ${file.name}`;
                        toast.error(error);
                        ingestionDispatch(errorAction);
                    }
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
