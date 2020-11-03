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
import { apolloClient } from '../../graphql';
import {
    AreCameraSettingsUniformDocument,
    AssetVersionContent,
    GetAssetVersionDetailResult,
    GetAssetVersionsDetailsDocument,
    GetAssetVersionsDetailsQuery,
    GetContentsForAssetVersionsDocument,
    IngestFolder,
    Project
} from '../../types/graphql';
import { eVocabularySetID } from '../../types/server';
import { StateItem, useItemStore } from '../item';
import { StateProject, useProjectStore } from '../project';
import { StateSubject, useSubjectStore } from '../subject';
import { FileId, IngestionFile, useUploadStore } from '../upload';
import { parseFileId, parseItemToState, parseProjectToState, parseSubjectUnitIdentifierToState } from '../utils';
import { useVocabularyStore } from '../vocabulary';
import { defaultModelFields, defaultOtherFields, defaultPhotogrammetryFields, defaultSceneFields, ValidateFieldsSchema } from './metadata.defaults';
import {
    FieldErrors,
    MetadataFieldValue,
    MetadataInfo,
    MetadataType,
    MetadataUpdate,
    ModelFields,
    OtherFields,
    PhotogrammetryFields,
    SceneFields,
    StateFolder,
    StateIdentifier,
    StateMetadata,
    ValidateFields
} from './metadata.types';

type MetadataStore = {
    metadatas: StateMetadata[];
    getStateFolders: (folders: IngestFolder[]) => StateFolder[];
    getInitialStateFolders: (folders: string[]) => StateFolder[];
    getSelectedIdentifiers: (identifiers: StateIdentifier[]) => StateIdentifier[] | undefined;
    getFieldErrors: (metadata: StateMetadata) => FieldErrors;
    validateFields: (fields: ValidateFields, schema: ValidateFieldsSchema) => boolean;
    getCurrentMetadata: (id: FileId) => StateMetadata | undefined;
    getMetadataInfo: (id: FileId) => MetadataInfo;
    updateMetadataSteps: () => Promise<MetadataUpdate>;
    updateMetadataField: (metadataIndex: Readonly<number>, name: string, value: MetadataFieldValue, metadataType: MetadataType) => void;
    updateMetadataFolders: () => Promise<void>;
    updateCameraSettings: (metadatas: StateMetadata[]) => Promise<StateMetadata[]>;
    reset: () => void;
};

export const useMetadataStore = create<MetadataStore>((set: SetState<MetadataStore>, get: GetState<MetadataStore>) => ({
    metadatas: [],
    getSelectedIdentifiers: (identifiers: StateIdentifier[]): StateIdentifier[] | undefined => lodash.filter(identifiers, { selected: true }),
    getFieldErrors: (metadata: StateMetadata): FieldErrors => {
        const { getAssetType } = useVocabularyStore.getState();
        const errors: FieldErrors = {
            photogrammetry: {
                dateCaptured: false,
                datasetType: false
            },
            model: {
                dateCaptured: false,
                creationMethod: false,
                modality: false,
                units: false,
                purpose: false,
                modelFileType: false
            }
        };

        const { file } = metadata;
        const { type } = file;

        const assetType = getAssetType(type);

        if (assetType.photogrammetry) {
            errors.photogrammetry.dateCaptured = metadata.photogrammetry.dateCaptured.toString() === 'Invalid Date';
            errors.photogrammetry.datasetType = lodash.isNull(metadata.photogrammetry.datasetType);
        }

        if (assetType.model) {
            errors.model.dateCaptured = metadata.model.dateCaptured.toString() === 'Invalid Date';
            errors.model.creationMethod = lodash.isNull(metadata.model.creationMethod);
            errors.model.modality = lodash.isNull(metadata.model.modality);
            errors.model.units = lodash.isNull(metadata.model.units);
            errors.model.purpose = lodash.isNull(metadata.model.purpose);
            errors.model.modelFileType = lodash.isNull(metadata.model.modelFileType);
        }

        return errors;
    },
    validateFields: (fields: ValidateFields, schema: ValidateFieldsSchema): boolean => {
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

        const defaultPhotogrammetry: PhotogrammetryFields = {
            ...defaultPhotogrammetryFields,
            datasetType: getInitialEntry(eVocabularySetID.eCaptureDataDatasetType),
            identifiers: defaultIdentifierField
        };

        const defaultModel: ModelFields = {
            ...defaultModelFields,
            identifiers: defaultIdentifierField,
            creationMethod: getInitialEntry(eVocabularySetID.eModelCreationMethod),
            modality: getInitialEntry(eVocabularySetID.eModelModality),
            units: getInitialEntry(eVocabularySetID.eModelUnits),
            purpose: getInitialEntry(eVocabularySetID.eModelPurpose),
            modelFileType: getInitialEntry(eVocabularySetID.eModelGeometryFileModelFileType)
        };

        const defaultScene: SceneFields = {
            ...defaultSceneFields,
            identifiers: defaultIdentifierField
        };

        const defaultOther: OtherFields = {
            ...defaultOtherFields,
            identifiers: defaultIdentifierField
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
                        model: defaultModel,
                        scene: defaultScene,
                        other: defaultOther
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
                        // TODO: KARAN: update model fields after api implementation
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
    updateMetadataField: (metadataIndex: Readonly<number>, name: string, value: MetadataFieldValue, metadataType: MetadataType) => {
        const { metadatas } = get();
        const updatedMetadatas = lodash.map(metadatas, (metadata: StateMetadata, index: number) => {
            if (index === metadataIndex) {
                return {
                    ...metadata,
                    [metadataType]: {
                        ...metadata[metadataType],
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

export * from './metadata.defaults';
export * from './metadata.types';
