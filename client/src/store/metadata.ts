import { ApolloQueryResult } from '@apollo/client';
import lodash from 'lodash';
import { toast } from 'react-toastify';
import create, { SetState, GetState } from 'zustand';
import { apolloClient } from '../graphql';
import {
    AreCameraSettingsUniformDocument,
    AssetVersionContent,
    GetAssetVersionsDetailsDocument,
    GetAssetVersionsDetailsQuery,
    GetContentsForAssetVersionsDocument,
    IngestFolder,
    Project
} from '../types/graphql';
import { eVocabularySetID } from '../types/server';
import { useItem, StateItem } from './item';
import { useProject, StateProject } from './project';
import { useSubject, StateSubject } from './subject';
import { useUpload, FileId, IngestionFile } from './upload';
import { parseFileId, parseItemToState, parseProjectToState, parseSubjectUnitIdentifierToState } from './utils';
import { useVocabulary } from './vocabulary';

type MetadataInfo = {
    metadata: StateMetadata;
    metadataIndex: number;
    isLast: boolean;
};

type FieldErrors = {
    photogrammetry: {
        dateCaptured: boolean;
        datasetType: boolean;
    };
};

export type MetadataFieldValue = string | number | boolean | Date;

type MetadataUpdate = {
    valid: boolean;
    selectedFiles: boolean;
};

export type StateIdentifier = {
    id: number;
    identifier: string;
    identifierType: number | null;
    selected: boolean;
};

export type StateFolder = {
    id: number;
    name: string;
    variantType: number | null;
};

export type PhotogrammetryFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
    folders: StateFolder[];
    description: string;
    dateCaptured: Date;
    datasetType: number | null;
    datasetFieldId: number | null;
    itemPositionType: number | null;
    itemPositionFieldId: number | null;
    itemArrangementFieldId: number | null;
    focusType: number | null;
    lightsourceType: number | null;
    backgroundRemovalMethod: number | null;
    clusterType: number | null;
    clusterGeometryFieldId: number | null;
    cameraSettingUniform: boolean;
    directory: string;
};

export const defaultPhotogrammetryFields: PhotogrammetryFields = {
    systemCreated: true,
    identifiers: [],
    folders: [],
    description: '',
    dateCaptured: new Date(),
    datasetType: null,
    datasetFieldId: null,
    itemPositionType: null,
    itemPositionFieldId: null,
    itemArrangementFieldId: null,
    focusType: null,
    lightsourceType: null,
    backgroundRemovalMethod: null,
    clusterType: null,
    clusterGeometryFieldId: null,
    cameraSettingUniform: false,
    directory: ''
};

export type StateMetadata = {
    photogrammetry: PhotogrammetryFields;
    file: IngestionFile;
};

type MetadataStore = {
    metadatas: StateMetadata[];
    getStateFolders: (folders: IngestFolder[]) => StateFolder[];
    getInitialStateFolders: (folders: string[]) => StateFolder[];
    getSelectedIdentifiers: (metadata: StateMetadata) => StateIdentifier[] | undefined;
    getFieldErrors: (metadata: StateMetadata) => FieldErrors;
    getCurrentMetadata: (id: FileId) => StateMetadata | undefined;
    getMetadataInfo: (id: FileId) => MetadataInfo;
    updateMetadataSteps: () => Promise<MetadataUpdate>;
    updatePhotogrammetryFields: (metadataIndex: number, values: PhotogrammetryFields) => void;
    updateMetadataFolders: () => Promise<void>;
    updateCameraSettings: (metadatas: StateMetadata[]) => Promise<StateMetadata[]>;
    reset: () => void;
};

export const useMetadata = create<MetadataStore>((set: SetState<MetadataStore>, get: GetState<MetadataStore>) => ({
    metadatas: [],
    getSelectedIdentifiers: (metadata: StateMetadata): StateIdentifier[] | undefined => lodash.filter(metadata.photogrammetry.identifiers, { selected: true }),
    getFieldErrors: (metadata: StateMetadata): FieldErrors => {
        const { getAssetType } = useVocabulary.getState();
        const errors: FieldErrors = {
            photogrammetry: {
                dateCaptured: false,
                datasetType: false
            }
        };

        const { file } = metadata;
        const { type } = file;

        const assetType = getAssetType(type);

        if (assetType.photogrammetry) {
            errors.photogrammetry.dateCaptured = metadata.photogrammetry.dateCaptured.toString() === 'Invalid Date';
            errors.photogrammetry.datasetType = metadata.photogrammetry.datasetType === null;
        }

        return errors;
    },
    getCurrentMetadata: (id: FileId): StateMetadata | undefined => {
        const { metadatas } = get();
        return metadatas.find(({ file }) => file.id === id);
    },
    getMetadataInfo: (id: FileId): MetadataInfo => {
        const { metadatas } = get();
        const metadataLength = metadatas.length;
        const metadata: StateMetadata | undefined = metadatas.find(({ file }) => file.id === id);
        const metadataIndex = lodash.indexOf(metadatas, metadata);
        const isLast = metadataIndex + 1 === metadataLength;

        return {
            metadata: metadatas[metadataIndex],
            metadataIndex,
            isLast
        };
    },
    updateMetadataSteps: async (): Promise<MetadataUpdate> => {
        const { getStateFolders } = get();
        const { completed, getSelectedFiles } = useUpload.getState();
        const { getInitialEntry } = useVocabulary.getState();
        const { addSubjects } = useSubject.getState();
        const { addProjects } = useProject.getState();
        const { addItems } = useItem.getState();

        const selectedFiles = getSelectedFiles(completed, true);

        if (!selectedFiles.length) {
            return {
                valid: false,
                selectedFiles: false
            };
        }

        const idAssetVersions: number[] = lodash.map(selectedFiles, ({ id }) => parseFileId(id));

        const defaultIdentifier: StateIdentifier = {
            id: 0,
            identifier: '',
            identifierType: getInitialEntry(eVocabularySetID.eIdentifierIdentifierType),
            selected: false
        };

        const defaultVocabularyFields = {
            ...defaultPhotogrammetryFields,
            datasetType: getInitialEntry(eVocabularySetID.eCaptureDataDatasetType),
            identifiers: [defaultIdentifier]
        };

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

                const subjects: StateSubject[] = [];
                const projects: StateProject[] = [];
                const items: StateItem[] = [];
                const metadatas: StateMetadata[] = [];

                for (let index = 0; index < Details.length; index++) {
                    const { idAssetVersion, SubjectUnitIdentifier: foundSubjectUnitIdentifier, Project: foundProject, Item: foundItem, CaptureDataPhoto } = Details[index];

                    if (foundSubjectUnitIdentifier) {
                        const subject: StateSubject = parseSubjectUnitIdentifierToState(foundSubjectUnitIdentifier);
                        subjects.push(subject);
                    }

                    if (foundProject) {
                        const stateProjects: StateProject[] = foundProject.map((project: Project, index: number) => parseProjectToState(project, !index));
                        projects.push(...stateProjects);
                    }

                    if (foundItem) {
                        const item: StateItem = parseItemToState(foundItem, !index, index);
                        items.push(item);
                    }

                    let metadataStep: StateMetadata;
                    const file = completed.find((file: IngestionFile) => parseFileId(file.id) === idAssetVersion);

                    if (!file) {
                        toast.error('Ingestion file not found');
                        throw new Error();
                    }

                    if (CaptureDataPhoto) {
                        const { identifiers, folders } = CaptureDataPhoto;
                        const parsedIdentifiers: StateIdentifier[] = identifiers.map(
                            ({ identifier, identifierType }, index): StateIdentifier => ({
                                id: index,
                                identifier,
                                identifierType,
                                selected: true
                            })
                        );

                        const stateIdentifiers = parsedIdentifiers.length ? parsedIdentifiers : defaultVocabularyFields.identifiers;

                        metadataStep = {
                            file,
                            photogrammetry: {
                                ...defaultVocabularyFields,
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
                                ...defaultVocabularyFields
                            }
                        };
                        metadatas.push(metadataStep);
                    }
                }

                addSubjects(lodash.uniqBy(subjects, 'arkId'));
                addProjects(projects);
                addItems(lodash.uniqBy(items, 'name'));

                set({ metadatas });

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
    },
    updatePhotogrammetryFields: (metadataIndex: number, values: PhotogrammetryFields): void => {
        const { metadatas } = get();
        const updatedMetadatas = lodash.map([...metadatas], (metadata: StateMetadata, index: number) => {
            if (index === metadataIndex) {
                return {
                    ...metadata,
                    photogrammetry: {
                        ...values
                    }
                };
            }

            return metadata;
        });

        set({ metadatas: updatedMetadatas });
    },
    getStateFolders: (folders: IngestFolder[]): StateFolder[] => {
        const stateFolders: StateFolder[] = folders.map(({ name, variantType }, index: number) => ({
            id: index,
            name,
            variantType
        }));

        return stateFolders;
    },
    getInitialStateFolders: (folders: string[]): StateFolder[] => {
        const { getInitialEntry } = useVocabulary.getState();
        const stateFolders: StateFolder[] = folders.map((folder, index: number) => ({
            id: index,
            name: folder,
            variantType: getInitialEntry(eVocabularySetID.eCaptureDataFileVariantType)
        }));

        return stateFolders;
    },
    updateMetadataFolders: async (): Promise<void> => {
        const { metadatas, getInitialStateFolders, updateCameraSettings } = get();
        const idAssetVersions: number[] = metadatas.map(({ file: { id } }) => parseFileId(id));

        const variables = {
            input: {
                idAssetVersions
            }
        };

        const { data } = await apolloClient.query({
            query: GetContentsForAssetVersionsDocument,
            variables
        });

        const { getContentsForAssetVersions } = data;

        const { AssetVersionContent: foundAssetVersionContent } = getContentsForAssetVersions;

        let updatedMetadatas = await updateCameraSettings(metadatas);

        foundAssetVersionContent.forEach(({ idAssetVersion, folders }: AssetVersionContent) => {
            updatedMetadatas = updatedMetadatas.map(metadata => {
                const { file, photogrammetry } = metadata;
                const fileId = parseFileId(file.id);

                if (fileId === idAssetVersion) {
                    if (photogrammetry.folders.length) {
                        return metadata;
                    }

                    const stateFolders: StateFolder[] = getInitialStateFolders(folders);

                    return {
                        ...metadata,
                        photogrammetry: {
                            ...photogrammetry,
                            folders: stateFolders
                        }
                    };
                }

                return metadata;
            });
        });

        set({ metadatas: updatedMetadatas });
    },
    updateCameraSettings: async (metadatas: StateMetadata[]): Promise<StateMetadata[]> => {
        const { getAssetType } = useVocabulary.getState();

        const updatedMetadatas = metadatas.slice();

        for (let index = 0; index < updatedMetadatas.length; index++) {
            const metadata = updatedMetadatas[index];
            const { file, photogrammetry } = metadata;
            const idAssetVersion = parseFileId(file.id);

            const assetType = getAssetType(file.type);

            if (assetType.photogrammetry) {
                const variables = {
                    input: {
                        idAssetVersion
                    }
                };

                try {
                    const { data } = await apolloClient.query({
                        query: AreCameraSettingsUniformDocument,
                        variables
                    });

                    const { areCameraSettingsUniform } = data;
                    const { isUniform } = areCameraSettingsUniform;

                    photogrammetry.cameraSettingUniform = isUniform;
                } catch {
                    toast.error('Failed to retrieve camera settings details');
                }
            }
        }

        return updatedMetadatas;
    },
    reset: () => {
        set({ metadatas: [] });
    }
}));
