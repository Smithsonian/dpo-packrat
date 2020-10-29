/**
 * Metadata Store
 *
 * This store manages state for metadata used in Ingestion flow.
 */
import { ApolloQueryResult } from '@apollo/client';
import lodash from 'lodash';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import create, { GetState, SetState } from 'zustand';
import { apolloClient } from '../graphql';
import {
    AreCameraSettingsUniformDocument,
    AssetVersionContent,
    GetAssetVersionDetailResult,
    GetAssetVersionsDetailsDocument,
    GetAssetVersionsDetailsQuery,
    GetContentsForAssetVersionsDocument,
    IngestFolder,
    Project
} from '../types/graphql';
import { eVocabularySetID } from '../types/server';
import { StateItem, useItemStore } from './item';
import { StateProject, useProjectStore } from './project';
import { StateSubject, useSubjectStore } from './subject';
import { FileId, IngestionFile, useUploadStore } from './upload';
import { parseFileId, parseItemToState, parseProjectToState, parseSubjectUnitIdentifierToState } from './utils';
import { useVocabularyStore } from './vocabulary';

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

export type MetadataFieldValue = string | number | boolean | null | Date | StateIdentifier[] | StateFolder[];

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

const identifierSchema = yup.object().shape({
    id: yup.number().required(),
    identifier: yup
        .string()
        .trim()
        .when('selected', {
            is: true,
            then: yup.string().trim().required('Enter a valid identifier'),
            otherwise: yup.string().trim()
        }),
    identifierType: yup.number().nullable(true),
    selected: yup.boolean().required()
});

const folderSchema = yup.object().shape({
    id: yup.number().required(),
    name: yup.string().required(),
    variantType: yup.number().nullable(true)
});

const identifierValidation = {
    test: array => !!lodash.filter(array as StateIdentifier[], { selected: true }).length,
    message: 'Should select/provide at least 1 identifier'
};

const identifiersWhenValidation = {
    is: false,
    then: yup.array().of(identifierSchema).test(identifierValidation)
};

type PhotogrammetrySchemaType = typeof photogrammetryFieldsSchema;

export const photogrammetryFieldsSchema = yup.object().shape({
    systemCreated: yup.boolean().required(),
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation),
    folders: yup.array().of(folderSchema),
    description: yup.string().required('Description cannot be empty'),
    dateCaptured: yup.date().required(),
    datasetType: yup.number().required('Please select a valid dataset type'),
    datasetFieldId: yup.number().nullable(true),
    itemPositionType: yup.number().nullable(true),
    itemPositionFieldId: yup.number().nullable(true),
    itemArrangementFieldId: yup.number().nullable(true),
    focusType: yup.number().nullable(true),
    lightsourceType: yup.number().nullable(true),
    backgroundRemovalMethod: yup.number().nullable(true),
    clusterType: yup.number().nullable(true),
    clusterGeometryFieldId: yup.number().nullable(true),
    cameraSettingUniform: yup.boolean().required(),
    directory: yup.string().required()
});

export type ModelFields = {
    systemCreated: boolean;
    identifiers: StateIdentifier[];
};

export const defaultModelFields: ModelFields = {
    systemCreated: true,
    identifiers: []
};

type ModelSchemaType = typeof modelFieldsSchema;

export const modelFieldsSchema = yup.object().shape({
    systemCreated: yup.boolean().required(),
    identifiers: yup.array().of(identifierSchema).when('systemCreated', identifiersWhenValidation)
});

export type StateMetadata = {
    photogrammetry: PhotogrammetryFields;
    model: ModelFields;
    file: IngestionFile;
};

type MetadataStore = {
    metadatas: StateMetadata[];
    getStateFolders: (folders: IngestFolder[]) => StateFolder[];
    getInitialStateFolders: (folders: string[]) => StateFolder[];
    getSelectedIdentifiers: (metadata: StateMetadata) => StateIdentifier[] | undefined;
    getFieldErrors: (metadata: StateMetadata) => FieldErrors;
    validateFields: (fields: PhotogrammetryFields | ModelFields, schema: PhotogrammetrySchemaType | ModelSchemaType) => boolean;
    getCurrentMetadata: (id: FileId) => StateMetadata | undefined;
    getMetadataInfo: (id: FileId) => MetadataInfo;
    updateMetadataSteps: () => Promise<MetadataUpdate>;
    updatePhotogrammetryField: (metadataIndex: number, name: string, value: MetadataFieldValue) => void;
    updateModelField: (metadataIndex: number, name: string, value: MetadataFieldValue) => void;
    updateMetadataFolders: () => Promise<void>;
    updateCameraSettings: (metadatas: StateMetadata[]) => Promise<StateMetadata[]>;
    reset: () => void;
};

export const useMetadataStore = create<MetadataStore>((set: SetState<MetadataStore>, get: GetState<MetadataStore>) => ({
    metadatas: [],
    getSelectedIdentifiers: (metadata: StateMetadata): StateIdentifier[] | undefined => lodash.filter(metadata.photogrammetry.identifiers, { selected: true }),
    getFieldErrors: (metadata: StateMetadata): FieldErrors => {
        const { getAssetType } = useVocabularyStore.getState();
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
    validateFields: (fields: PhotogrammetryFields | ModelFields, schema: PhotogrammetrySchemaType | ModelSchemaType): boolean => {
        let hasError: boolean = false;
        const options: yup.ValidateOptions = {
            abortEarly: false
        };

        toast.dismiss();

        try {
            schema.validateSync(fields, options);
        } catch (error) {
            hasError = true;
            for (const message of error.errors) {
                toast.warn(message, { autoClose: false });
            }
        }

        return hasError;
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
        const { completed, getSelectedFiles } = useUploadStore.getState();
        const { getInitialEntry } = useVocabularyStore.getState();
        const { addSubjects } = useSubjectStore.getState();
        const { addProjects } = useProjectStore.getState();
        const { addItems } = useItemStore.getState();

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

        const defaultIdentifierField = [defaultIdentifier];

        const defaultPhotogrammetry = {
            ...defaultPhotogrammetryFields,
            datasetType: getInitialEntry(eVocabularySetID.eCaptureDataDatasetType),
            identifiers: defaultIdentifierField
        };

        const defaultModel = {
            ...defaultModelFields
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
                    const {
                        idAssetVersion,
                        SubjectUnitIdentifier: foundSubjectUnitIdentifier,
                        Project: foundProject,
                        Item: foundItem,
                        CaptureDataPhoto,
                        Model
                    }: GetAssetVersionDetailResult = Details[index];

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

                    const file = completed.find((file: IngestionFile) => parseFileId(file.id) === idAssetVersion);

                    if (!file) {
                        toast.error('Ingestion file not found');
                        throw new Error();
                    }

                    let metadataStep: StateMetadata = {
                        file,
                        photogrammetry: defaultPhotogrammetry,
                        model: defaultModel
                    };

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

                        const stateIdentifiers = parsedIdentifiers.length ? parsedIdentifiers : defaultIdentifierField;

                        metadataStep = {
                            ...metadataStep,
                            photogrammetry: {
                                ...metadataStep.photogrammetry,
                                ...(CaptureDataPhoto && {
                                    ...CaptureDataPhoto,
                                    dateCaptured: new Date(CaptureDataPhoto.dateCaptured),
                                    folders: getStateFolders(folders),
                                    identifiers: stateIdentifiers
                                })
                            }
                        };

                        metadatas.push(metadataStep);
                    } else if (Model) {
                        // TODO: KARAN: autofill model and stuff
                        metadatas.push(metadataStep);
                    } else {
                        metadatas.push(metadataStep);
                    }
                }

                const uniqueSubjects = lodash.uniqBy(subjects, 'arkId');
                const uniqueItems = lodash.uniqBy(items, 'name');

                addSubjects(uniqueSubjects);
                addProjects(projects);
                addItems(uniqueItems);

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
    updatePhotogrammetryField: (metadataIndex: number, name: string, value: MetadataFieldValue) => {
        const { metadatas } = get();
        const updatedMetadatas = lodash.map(metadatas, (metadata: StateMetadata, index: number) => {
            if (index === metadataIndex) {
                return {
                    ...metadata,
                    photogrammetry: {
                        ...metadata.photogrammetry,
                        [name]: value
                    }
                };
            }

            return metadata;
        });

        set({ metadatas: updatedMetadatas });
    },
    updateModelField: (metadataIndex: number, name: string, value: MetadataFieldValue) => {
        const { metadatas } = get();
        const updatedMetadatas = lodash.map(metadatas, (metadata: StateMetadata, index: number) => {
            if (index === metadataIndex) {
                return {
                    ...metadata,
                    model: {
                        ...metadata.model,
                        [name]: value
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
        const { getInitialEntry } = useVocabularyStore.getState();
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
        const { getAssetType } = useVocabularyStore.getState();

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
