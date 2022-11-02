/* eslint-disable @typescript-eslint/no-explicit-any */
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
    GetAssetVersionsDetailsDocument,
    GetAssetVersionsDetailsQuery,
    GetContentsForAssetVersionsDocument,
    Project,
    GetIngestTitleDocument,
    GetIngestTitleQuery
} from '../../types/graphql';
import { eVocabularySetID } from '@dpo-packrat/common';
import { StateItem, useItemStore, StateProject } from '../item';
import { StateSubject, useSubjectStore } from '../subject';
import { FileId, IngestionFile, useUploadStore } from '../upload';
import { parseFileId, parseFoldersToState, parseIdentifiersToState, parseItemToState, parseProjectToState, parseSubjectUnitIdentifierToState, parseSubtitlesToState } from '../utils';
import { useVocabularyStore } from '../vocabulary';
import { defaultModelFields, defaultOtherFields, defaultPhotogrammetryFields, defaultSceneFields, ValidateFieldsSchema, defaultSceneAttachmentFields, subtitleFieldsSchema } from './metadata.defaults';
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
    SceneAttachmentFields,
    StateFolder,
    StateIdentifier,
    StateMetadata,
    ValidateFields,
    SubtitleFields
} from './metadata.types';
import { nullableSelectFields } from '../../utils/controls';

type MetadataStore = {
    metadatas: StateMetadata[];
    getInitialStateFolders: (folders: string[]) => StateFolder[];
    getSelectedIdentifiers: (identifiers: StateIdentifier[]) => StateIdentifier[] | undefined;
    getFieldErrors: (metadata: StateMetadata) => FieldErrors;
    validateFields: (fields: ValidateFields, schema: ValidateFieldsSchema) => boolean;
    getCurrentMetadata: (id: FileId) => StateMetadata | undefined;
    getMetadataInfo: (id: FileId) => MetadataInfo;
    updateMetadataSteps: (existingMetadata: any) => Promise<MetadataUpdate>;
    updateMetadataField: (metadataIndex: Readonly<number>, name: string, value: MetadataFieldValue, metadataType: MetadataType) => void;
    updateMetadataFolders: () => Promise<void>;
    initializeSubtitlesForModels: () => Promise<void>;
    updateCameraSettings: (metadatas: StateMetadata[]) => Promise<StateMetadata[]>;
    reset: () => void;
    getMetadatas: () => StateMetadata[];
    getSubtitlesError: (subtitles: SubtitleFields) => boolean;
};

export const useMetadataStore = create<MetadataStore>((set: SetState<MetadataStore>, get: GetState<MetadataStore>) => ({
    metadatas: [],
    getSelectedIdentifiers: (identifiers: StateIdentifier[]): StateIdentifier[] | undefined => identifiers,
    getFieldErrors: (metadata: StateMetadata): FieldErrors => {
        // Note: the field errors this function returns is how the UI renders error styling
        const { getAssetType } = useVocabularyStore.getState();
        const { getSubtitlesError } = get();
        const errors: FieldErrors = {
            photogrammetry: {
                dateCaptured: false,
                datasetType: false
            },
            model: {
                name: false,
                dateCreated: false,
                creationMethod: false,
                modality: false,
                units: false,
                purpose: false,
                modelFileType: false,
                subtitles: false,
            },
            scene: {
                subtitles: false
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
            errors.model.name = lodash.isNull(metadata.model.name) || metadata.model.name.length < 1;
            errors.model.dateCreated = lodash.isNull(metadata.model.dateCreated) || metadata.model.dateCreated.toString() === 'Invalid Date';
            errors.model.creationMethod = lodash.isNull(metadata.model.creationMethod);
            errors.model.modality = lodash.isNull(metadata.model.modality);
            errors.model.units = lodash.isNull(metadata.model.units);
            errors.model.purpose = lodash.isNull(metadata.model.purpose);
            errors.model.modelFileType = lodash.isNull(metadata.model.modelFileType);
            errors.model.subtitles = getSubtitlesError(metadata.model.subtitles);
        }

        if (assetType.scene) {
            errors.scene.subtitles = getSubtitlesError(metadata.scene.subtitles);
        }

        return errors;
    },
    validateFields: (fields: ValidateFields, schema: ValidateFieldsSchema): boolean => {
        let hasError: boolean = false;
        const options = {
            abortEarly: false
        };

        toast.dismiss();

        try {
            schema.validateSync(fields, options);
        } catch (error) {
            hasError = true;
            if (error instanceof yup.ValidationError) {
                for (const message of error.errors) {
                    toast.warn(message, { autoClose: false });
                }
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
    updateMetadataSteps: async (existingMetadata: any): Promise<MetadataUpdate> => {
        const { completed, getSelectedFiles } = useUploadStore.getState();
        const { getInitialEntry } = useVocabularyStore.getState();
        const { addSubjects } = useSubjectStore.getState();
        const { addItems } = useItemStore.getState();
        const { UpdatedAssetVersionMetadata, idAssetVersionsUpdatedSet } = (existingMetadata ? existingMetadata : { UpdatedAssetVersionMetadata: [], idAssetVersionsUpdatedSet: new Set<number>() });
        const selectedFiles = getSelectedFiles(completed, true);

        if (!selectedFiles.length) {
            return {
                valid: false,
                selectedFiles: false,
                error: false
            };
        }

        const idAssetVersions: number[] = lodash.map(selectedFiles, ({ id }) => parseFileId(id));


        const defaultIdentifierField: StateIdentifier[] = [];

        const defaultPhotogrammetry: PhotogrammetryFields = {
            ...defaultPhotogrammetryFields,
            datasetType: getInitialEntry(eVocabularySetID.eCaptureDataDatasetType),
            identifiers: defaultIdentifierField
        };

        const defaultModel: ModelFields = {
            ...defaultModelFields,
            identifiers: defaultIdentifierField,
            // creationMethod: getInitialEntry(eVocabularySetID.eModelCreationMethod),
            // modality: getInitialEntry(eVocabularySetID.eModelModality),
            // units: getInitialEntry(eVocabularySetID.eModelUnits),
            // purpose: getInitialEntry(eVocabularySetID.eModelPurpose),
            // modelFileType: getInitialEntry(eVocabularySetID.eModelFileType)
        };

        const defaultScene: SceneFields = {
            ...defaultSceneFields,
            identifiers: defaultIdentifierField
        };

        const defaultOther: OtherFields = {
            ...defaultOtherFields,
            identifiers: defaultIdentifierField
        };

        const defaultSceneAttachment: SceneAttachmentFields ={
            ...defaultSceneAttachmentFields,
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
                        Model,
                        Scene
                    } = Details[index];
                    const existingIdAssetVersion = idAssetVersionsUpdatedSet.has(idAssetVersion);
                    const updateModel = UpdatedAssetVersionMetadata.find((asset) => asset.idAssetVersion === idAssetVersion && asset?.Model)?.Model;
                    const updateScene = UpdatedAssetVersionMetadata.find((asset) => asset.idAssetVersion === idAssetVersion && asset?.Scene)?.Scene;
                    const updatePhoto = UpdatedAssetVersionMetadata.find((asset) => asset.idAssetVersion === idAssetVersion && asset?.CaptureDataPhoto)?.CaptureDataPhoto;

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
                        other: defaultOther,
                        sceneAttachment: defaultSceneAttachment
                    };

                    if (CaptureDataPhoto) {
                        const { identifiers, folders } = CaptureDataPhoto;
                        const stateIdentifiers: StateIdentifier[] = parseIdentifiersToState(identifiers, defaultIdentifierField);

                        metadataStep = {
                            ...metadataStep,
                            photogrammetry: {
                                ...metadataStep.photogrammetry,
                                ...(CaptureDataPhoto && {
                                    ...CaptureDataPhoto,
                                    dateCaptured: new Date(CaptureDataPhoto.dateCaptured),
                                    folders: parseFoldersToState(folders),
                                    identifiers: stateIdentifiers
                                })
                            }
                        };

                        metadatas.push(metadataStep);
                    } else if (Model) {
                        const { identifiers } = Model;
                        const stateIdentifiers: StateIdentifier[] = parseIdentifiersToState(identifiers, defaultIdentifierField);

                        metadataStep = {
                            ...metadataStep,
                            model: {
                                ...metadataStep.model,
                                ...(Model && {
                                    ...Model,
                                    dateCreated: new Date(Model.dateCreated),
                                    identifiers: stateIdentifiers
                                })
                            }
                        };
                        metadatas.push(metadataStep);
                    } else if (Scene) {
                        const { identifiers } = Scene;
                        const stateIdentifiers: StateIdentifier[] = parseIdentifiersToState(identifiers, defaultIdentifierField);

                        metadataStep = {
                            ...metadataStep,
                            scene: {
                                ...metadataStep.scene,
                                ...(Scene && {
                                    ...Scene,
                                    identifiers: stateIdentifiers
                                })
                            }
                        };
                        metadatas.push(metadataStep);
                    } else {
                        if (existingIdAssetVersion) {
                            metadataStep.photogrammetry.systemCreated = false; // don't default to requesting a system-created identifier, by default
                            metadataStep.model.systemCreated = false; // don't default to requesting a system-created identifier, by default
                            metadataStep.scene.systemCreated = false; // don't default to requesting a system-created identifier, by default
                            metadataStep.other.systemCreated = false; // don't default to requesting a system-created identifier, by default
                        }

                        if (existingIdAssetVersion && updatePhoto) {
                            const { datasetType, name, dateCaptured, description, cameraSettingUniform, datasetFieldId, itemPositionType, itemPositionFieldId, itemArrangementFieldId, focusType, lightsourceType, backgroundRemovalMethod, clusterType, clusterGeometryFieldId, folders } = updatePhoto;
                            if (datasetType) metadataStep.photogrammetry.datasetType = datasetType;
                            if (name) metadataStep.photogrammetry.name = name;
                            if (new Date(dateCaptured)) metadataStep.photogrammetry.dateCaptured = new Date(dateCaptured);
                            if (description) metadataStep.photogrammetry.description = description;
                            if (typeof cameraSettingUniform === 'boolean') metadataStep.photogrammetry.cameraSettingUniform = cameraSettingUniform;
                            if (datasetFieldId) metadataStep.photogrammetry.datasetFieldId = datasetFieldId;
                            if (itemPositionType) metadataStep.photogrammetry.itemPositionType = itemPositionType;
                            if (itemPositionFieldId) metadataStep.photogrammetry.itemPositionFieldId = itemPositionFieldId;
                            if (itemArrangementFieldId) metadataStep.photogrammetry.itemArrangementFieldId = itemArrangementFieldId;
                            if (focusType) metadataStep.photogrammetry.focusType = focusType;
                            if (lightsourceType) metadataStep.photogrammetry.lightsourceType = lightsourceType;
                            if (backgroundRemovalMethod) metadataStep.photogrammetry.backgroundRemovalMethod = backgroundRemovalMethod;
                            if (clusterType) metadataStep.photogrammetry.clusterType = clusterType;
                            if (clusterGeometryFieldId) metadataStep.photogrammetry.clusterGeometryFieldId = clusterGeometryFieldId;
                            if (folders) metadataStep.photogrammetry.folders = folders;
                        }
                        if (existingIdAssetVersion && updateModel) {
                            const { creationMethod, modality, units, purpose, modelFileType, name, dateCreated } = updateModel;
                            if (creationMethod) metadataStep.model.creationMethod = creationMethod;
                            if (modality) metadataStep.model.modality = modality;
                            if (units) metadataStep.model.units = units;
                            if (purpose) metadataStep.model.purpose = purpose;
                            if (modelFileType) metadataStep.model.creationMethod = creationMethod;
                            if (name) metadataStep.model.name = name;
                            if (dateCreated) metadataStep.model.dateCreated = dateCreated;
                        }
                        if (existingIdAssetVersion && updateScene) {
                            const { name, posedAndQCd, referenceModels, approvedForPublication } = updateScene;
                            if (name) metadataStep.scene.name = name;
                            if (typeof posedAndQCd === 'boolean') metadataStep.scene.posedAndQCd = posedAndQCd;
                            if (typeof approvedForPublication === 'boolean') metadataStep.scene.approvedForPublication = approvedForPublication;
                            if (referenceModels) metadataStep.scene.referenceModels = referenceModels;
                        }
                        metadatas.push(metadataStep);
                        // console.log(`useMetaStore metadataStep=${JSON.stringify(metadataStep)}`);
                    }
                }

                const uniqueSubjects = lodash.uniqBy(subjects, 'arkId');
                const uniqueItems = lodash.uniqBy(items, 'name');

                addSubjects(uniqueSubjects);
                addItems(uniqueItems);
                set({ metadatas });

                return {
                    valid: true,
                    selectedFiles: true,
                    error: false
                };
            }
        } catch (error) {
            toast.error('Failed to ingest selected files, please try again later');
            // console.log(`Failed to ingest selected files, please try again later: ${JSON.stringify(error)}`);
        }

        return {
            valid: false,
            selectedFiles: true,
            error: false
        };
    },
    updateMetadataField: (metadataIndex: Readonly<number>, name: string, value: MetadataFieldValue, metadataType: MetadataType) => {
        const { metadatas } = get();
        if (!(name in metadatas[metadataIndex][metadataType])) {
            toast.error(`Field ${name} doesn't exist on a ${metadataType} asset`);
            return;
        }

        if (value === -1 && nullableSelectFields.has(name)) value = null;

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
    initializeSubtitlesForModels: async (): Promise<void> => {
        const { metadatas } = get();
        const { getSelectedItem } = useItemStore.getState();
        const { subjects } = useSubjectStore.getState();
        const selectedItem = getSelectedItem();

        try {
            const { subtitle, name } = calculateNameAndSubtitle(selectedItem as StateItem, subjects);
            // const subtitle = Number(selectedItem?.id) > 0 ? selectedItem?.subtitle : subjects.length > 1 ? selectedItem?.subtitle : `${subjects[0].name}` + (selectedItem?.subtitle.length ? selectedItem?.subtitle : '');

            // console.log('subtitle', subtitle, 'name', name);
            const { data: { getIngestTitle: { ingestTitle } } }: ApolloQueryResult<GetIngestTitleQuery> = await apolloClient.query({
                query: GetIngestTitleDocument,
                variables: {
                    input: {
                        item: {
                            id: Number(selectedItem?.id) || -1,
                            /*
                                if there is a valid itemId (existing subject)
                                    -subtitle = selectedItem.subtitle
                                if there isn't (new subject)
                                    if there are 2+ subjects
                                        -subtitle = subtitle
                                    if there is 1 subject
                                        -subtitle = subjectname + subtitle
                            */
                            subtitle,
                            entireSubject: selectedItem?.entireSubject,
                            name
                        }
                    }
                }
            });

            if (!ingestTitle) {
                toast.error('Failed to fetch titles for ingestion items');
                return;
            }
            const metadatasCopy = lodash.cloneDeep(metadatas);
            const subtitleState = parseSubtitlesToState(ingestTitle);

            metadatasCopy.forEach(metadata => {
                if (metadata.model) {
                    metadata.model.subtitles = subtitleState;
                    metadata.model.name = ingestTitle.title;
                }
            });

            // console.log('metadatasCopy', metadatasCopy);
            set({ metadatas: metadatasCopy });
        } catch (error) {
            toast.error(`Failed to fetch titles for ingestion items ${error}`);
        }

    },
    getInitialStateFolders: (folders: string[]): StateFolder[] => {
        const { getInitialEntry, getEntries } = useVocabularyStore.getState();
        const stateFolders: StateFolder[] = folders.map((folder, index: number) => {
            let variantType = getInitialEntry(eVocabularySetID.eCaptureDataFileVariantType);
            const variantTypes = getEntries(eVocabularySetID.eCaptureDataFileVariantType);

            if (folder.search('raw') !== -1) variantType = variantTypes[0].idVocabulary;
            if (folder.search('processed') !== -1) variantType = variantTypes[1].idVocabulary;
            if (folder.search('camera') !== -1) variantType = variantTypes[2].idVocabulary;

            return  {
                id: index,
                name: folder,
                variantType
            };
        });

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
                        photogrammetry.folders = photogrammetry.folders.map((folder, index) => ({
                            ...folder,
                            id: index
                        }));
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
    },
    getMetadatas: () => {
        const { metadatas } = get();
        return metadatas;
    },
    getSubtitlesError: (subtitles: SubtitleFields): boolean => {
        let hasError: boolean = false;
        const options = {
            abortEarly: false
        };

        toast.dismiss();

        try {
            subtitleFieldsSchema.validateSync(subtitles, options);
        } catch (error) {
            hasError = true;
        }

        return hasError;
    }
}));

export * from './metadata.defaults';
export * from './metadata.types';

const calculateNameAndSubtitle = (selectedItem: StateItem, subjects: StateSubject[]) => {
    let subtitle = '';
    let name = '';

    if (Number(selectedItem?.id) > 0) {
        name = selectedItem?.subtitle;
    } else {
        if (subjects.length > 1) {
            name = selectedItem?.subtitle;
        } else {
            name = subjects?.[0]?.name;
            subtitle = selectedItem?.subtitle;
        }
    }

    return { subtitle, name };
};