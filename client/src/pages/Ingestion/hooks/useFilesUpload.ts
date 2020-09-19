import { ApolloQueryResult, FetchResult } from '@apollo/client';
import lodash from 'lodash';
import { useCallback, useContext } from 'react';
import { toast } from 'react-toastify';
import {
    AppContext,
    defaultPhotogrammetryFields,
    FileId,
    FileUploadStatus,
    IngestionDispatchAction,
    IngestionFile,
    METADATA_ACTIONS,
    parseFileId,
    parseItemToState,
    parseProjectToState,
    parseSubjectUnitIdentifierToState,
    StateIdentifier,
    StateItem,
    StateMetadata,
    StateProject,
    StateSubject,
    UPLOAD_ACTIONS
} from '../../../context';
import { apolloClient, apolloUploader } from '../../../graphql';
import {
    DiscardUploadedAssetVersionsDocument,
    DiscardUploadedAssetVersionsMutation,
    GetAssetVersionsDetailsDocument,
    GetAssetVersionsDetailsQuery,
    Project,
    UploadAssetDocument,
    UploadAssetMutation,
    UploadStatus
} from '../../../types/graphql';
import { eVocabularySetID } from '../../../types/server';
import useItem from './useItem';
import useMetadata from './useMetadata';
import useProject from './useProject';
import useSubject from './useSubject';
import useVocabularyEntries from './useVocabularyEntries';

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
    discardFiles: () => Promise<void>;
}

const useFilesUpload = (): UseFilesUpload => {
    const { ingestion, ingestionDispatch } = useContext(AppContext);
    const { files } = ingestion.uploads;

    const { getInitialEntry } = useVocabularyEntries();
    const { addSubjects } = useSubject();
    const { addProjects } = useProject();
    const { addItems } = useItem();
    const { getStateFolders } = useMetadata();

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

        const idAssetVersions: number[] = lodash.map(selectedFiles, ({ id }) => parseFileId(id));

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
                const {
                    getAssetVersionsDetails: { Details }
                } = data;
                console.log(Details);
                const subjects: StateSubject[] = [];
                const projects: StateProject[] = [];
                const items: StateItem[] = [];
                const metadatas: StateMetadata[] = [];

                for (let i = 0; i < Details.length; i++) {
                    const { idAssetVersion, SubjectUnitIdentifier: foundSubjectUnitIdentifier, Project: foundProject, Item: foundItem, CaptureDataPhoto } = Details[i];
                    if (foundSubjectUnitIdentifier) {
                        const subject: StateSubject = parseSubjectUnitIdentifierToState(foundSubjectUnitIdentifier);
                        subjects.push(subject);
                    }
                    if (foundProject) {
                        const stateProjects: StateProject[] = foundProject.map((project: Project, index: number) => parseProjectToState(project, !index));
                        projects.push(...stateProjects);
                    }
                    if (foundItem) {
                        const item: StateItem = parseItemToState(foundItem, false);
                        items.push(item);
                    }

                    let metadataStep: StateMetadata;
                    const file = files.find((file: IngestionFile) => parseFileId(file.id) === idAssetVersion);

                    if (!file) {
                        toast.error('Ingestion file not found');
                        throw new Error();
                    }

                    if (CaptureDataPhoto) {
                        const { identifiers, folders } = CaptureDataPhoto;
                        const stateIdentifiers: StateIdentifier[] = identifiers.map(
                            ({ identifier, identifierType }, index): StateIdentifier => ({
                                id: index,
                                identifier,
                                identifierType,
                                selected: true
                            })
                        );

                        metadataStep = {
                            file,
                            photogrammetry: {
                                ...defaultPhotogrammetryFields,
                                ...(CaptureDataPhoto && {
                                    ...CaptureDataPhoto,
                                    dateCaptured: new Date(CaptureDataPhoto.dateCaptured),
                                    folders: getStateFolders(folders),
                                    identifiers: stateIdentifiers
                                })
                            }
                        };
                        metadatas.push(metadataStep);
                    } else {
                        metadataStep = {
                            file,
                            photogrammetry: {
                                ...defaultPhotogrammetryFields
                            }
                        };
                        metadatas.push(metadataStep);
                    }
                }

                addSubjects(subjects);
                addProjects(projects);
                addItems(items);

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

                    if (!type) {
                        toast.error(`Vocabulary for file ${name} not found`);
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
                    refetchQueries: ['getUploadedAssetVersion'],
                    useUpload: true,
                    onProgress,
                    onCancel
                });

                const { uploadAsset }: UploadAssetMutation = data;

                if (uploadAsset) {
                    const { status, error } = uploadAsset;

                    if (status === UploadStatus.Complete) {
                        // ingestionDispatch(successAction(idAssetVersion));
                        toast.success(`Upload finished for ${file.name}`);
                    } else if (status === UploadStatus.Failed) {
                        const errorMessage = error || `Upload failed for ${file.name}`;
                        toast.error(errorMessage);
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

    const discardFiles = async (): Promise<void> => {
        const selectedFiles = getSelectedFiles();

        if (!selectedFiles.length) {
            toast.warn('Please select at least 1 file to discard');
            return;
        }

        const isConfirmed = global.confirm('Do you want to discard current items?');

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

                const discardFilesAction: IngestionDispatchAction = {
                    type: UPLOAD_ACTIONS.DISCARD_FILES
                };

                ingestionDispatch(discardFilesAction);

                toast.info('Selected files have been discarded');
                return;
            }
        } catch {
            toast.error('Failed to discard selected files');
        }
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
