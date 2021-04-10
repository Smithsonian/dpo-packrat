/**
 * Ingest Hook
 *
 * This custom hooks provides easy access ingestion functionality.
 */
import { FetchResult } from '@apollo/client';
import lodash from 'lodash';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';
import { HOME_ROUTES, INGESTION_ROUTES_TYPE, resolveSubRoute } from '../../../constants/routes';
import { apolloClient } from '../../../graphql';
import {
    defaultItem,
    isNewItem,
    parseFileId,
    StateFolder,
    StateIdentifier,
    StateItem,
    StateProject,
    useItemStore,
    useMetadataStore,
    useProjectStore,
    useSubjectStore,
    useUploadStore,
    useVocabularyStore
} from '../../../store';
import {
    IngestDataDocument,
    IngestDataInput,
    IngestDataMutation,
    IngestFolderInput,
    IngestIdentifierInput,
    IngestItemInput,
    IngestModelInput,
    IngestOtherInput,
    IngestPhotogrammetryInput,
    IngestProjectInput,
    IngestSceneInput,
    IngestSubjectInput,
} from '../../../types/graphql';
import { nonNullValue } from '../../../utils/shared';

interface UseIngest {
    ingestionStart: () => Promise<boolean>;
    ingestionComplete: () => void;
    ingestionReset: () => void;
}

function useIngest(): UseIngest {
    const [removeSelectedUploads, resetUploads] = useUploadStore(state => [state.removeSelectedUploads, state.reset]);
    const [subjects, resetSubjects] = useSubjectStore(state => [state.subjects, state.reset]);
    const [getSelectedProject, resetProjects] = useProjectStore(state => [state.getSelectedProject, state.reset]);
    const [getSelectedItem, resetItems] = useItemStore(state => [state.getSelectedItem, state.reset]);
    const [metadatas, getSelectedIdentifiers, resetMetadatas] = useMetadataStore(state => [state.metadatas, state.getSelectedIdentifiers, state.reset]);
    const getAssetType = useVocabularyStore(state => state.getAssetType);

    const history = useHistory();

    const ingestionStart = async (): Promise<boolean> => {
        try {
            const ingestSubjects: IngestSubjectInput[] = subjects.map(subject => ({
                ...subject,
                id: subject.id || null
            }));

            const project: StateProject = nonNullValue<StateProject>('project', getSelectedProject());

            const ingestProject: IngestProjectInput = {
                id: project.id,
                name: project.name
            };

            const item: StateItem = nonNullValue<StateItem>('item', getSelectedItem());

            const isDefaultItem = item.id === defaultItem.id;

            let ingestItemId: number | null = null;

            if (!isDefaultItem || isNewItem(item.id)) {
                ingestItemId = Number.parseInt(item.id, 10);
            }

            const ingestItem: IngestItemInput = {
                id: ingestItemId,
                name: item.name,
                entireSubject: item.entireSubject
            };

            const ingestPhotogrammetry: IngestPhotogrammetryInput[] = [];
            const ingestModel: IngestModelInput[] = [];
            const ingestScene: IngestSceneInput[] = [];
            const ingestOther: IngestOtherInput[] = [];

            lodash.forEach(metadatas, metadata => {
                const { file, photogrammetry, model, scene, other } = metadata;
                const { photogrammetry: isPhotogrammetry, model: isModel, scene: isScene, other: isOther } = getAssetType(file.type);

                if (isPhotogrammetry) {
                    const {
                        dateCaptured,
                        datasetType,
                        systemCreated,
                        description,
                        cameraSettingUniform,
                        datasetFieldId,
                        itemPositionType,
                        itemPositionFieldId,
                        itemArrangementFieldId,
                        focusType,
                        lightsourceType,
                        backgroundRemovalMethod,
                        clusterType,
                        clusterGeometryFieldId,
                        directory,
                        identifiers,
                        folders
                    } = photogrammetry;

                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);
                    const ingestFolders: IngestFolderInput[] = getIngestFolders(folders);

                    const photogrammetryData: IngestPhotogrammetryInput = {
                        idAssetVersion: parseFileId(file.id),
                        dateCaptured: dateCaptured.toISOString(),
                        datasetType: nonNullValue<number>('datasetType', datasetType),
                        systemCreated,
                        description,
                        cameraSettingUniform,
                        identifiers: ingestIdentifiers,
                        folders: ingestFolders,
                        datasetFieldId,
                        itemPositionType,
                        itemPositionFieldId,
                        itemArrangementFieldId,
                        focusType,
                        lightsourceType,
                        backgroundRemovalMethod,
                        directory,
                        clusterType,
                        clusterGeometryFieldId
                    };

                    ingestPhotogrammetry.push(photogrammetryData);
                }

                if (isModel) {
                    const {
                        identifiers,
                        sourceObjects,
                        systemCreated,
                        name,
                        dateCaptured,
                        creationMethod,
                        master,
                        authoritative,
                        modality,
                        units,
                        purpose,
                        modelFileType,
                        directory,
                    } = model;

                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);

                    const modelData: IngestModelInput = {
                        name,
                        idAssetVersion: parseFileId(file.id),
                        dateCaptured: dateCaptured.toISOString(),
                        identifiers: ingestIdentifiers,
                        creationMethod: nonNullValue<number>('creationMethod', creationMethod),
                        master,
                        authoritative,
                        modality: nonNullValue<number>('modality', modality),
                        units: nonNullValue<number>('units', units),
                        purpose: nonNullValue<number>('purpose', purpose),
                        modelFileType: nonNullValue<number>('modelFileType', modelFileType),
                        directory,
                        systemCreated,
                        sourceObjects,
                    };

                    ingestModel.push(modelData);
                }

                if (isScene) {
                    const { identifiers, systemCreated, referenceModels } = scene;

                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);

                    const sceneData: IngestSceneInput = {
                        idAssetVersion: parseFileId(file.id),
                        identifiers: ingestIdentifiers,
                        systemCreated,
                        referenceModels
                    };

                    ingestScene.push(sceneData);
                }

                if (isOther) {
                    const { identifiers, systemCreated } = other;

                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);

                    const otherData: IngestOtherInput = {
                        idAssetVersion: parseFileId(file.id),
                        identifiers: ingestIdentifiers,
                        systemCreated
                    };

                    ingestOther.push(otherData);
                }
            });

            const input: IngestDataInput = {
                subjects: ingestSubjects,
                project: ingestProject,
                item: ingestItem,
                photogrammetry: ingestPhotogrammetry,
                model: ingestModel,
                scene: ingestScene,
                other: ingestOther
            };

            const ingestDataMutation: FetchResult<IngestDataMutation> = await apolloClient.mutate({
                mutation: IngestDataDocument,
                variables: { input },
                refetchQueries: ['getUploadedAssetVersion']
            });

            const { data } = ingestDataMutation;

            if (data) {
                const { ingestData } = data;
                const { success } = ingestData;

                return success;
            }
        } catch (error) {
            toast.error(error);
        }

        return false;
    };

    const resetIngestionState = () => {
        resetSubjects();
        resetProjects();
        resetItems();
        resetMetadatas();
    };

    const ingestionComplete = (): void => {
        removeSelectedUploads();
        resetIngestionState();
        const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.UPLOADS);
        history.push(nextRoute);
    };

    const ingestionReset = (): void => {
        resetUploads();
        resetIngestionState();
    };

    const getIngestIdentifiers = (identifiers: StateIdentifier[]): IngestIdentifierInput[] => {
        const ingestIdentifiers: IngestIdentifierInput[] = [];
        const selectedIdentifiers: StateIdentifier[] | undefined = getSelectedIdentifiers(identifiers);

        if (selectedIdentifiers) {
            lodash.forEach(selectedIdentifiers, (data: StateIdentifier) => {
                const { identifier, identifierType } = data;

                const identifierData: IngestIdentifierInput = {
                    identifier,
                    identifierType: nonNullValue<number>('identifierType', identifierType)
                };
                ingestIdentifiers.push(identifierData);
            });
        }

        return ingestIdentifiers;
    };

    const getIngestFolders = (folders: StateFolder[]): IngestFolderInput[] => {
        const ingestFolders: IngestFolderInput[] = [];
        lodash.forEach(folders, (folder: StateFolder) => {
            const { name, variantType } = folder;

            const folderData: IngestFolderInput = {
                name,
                variantType: nonNullValue<number>('variantType', variantType)
            };

            ingestFolders.push(folderData);
        });

        return ingestFolders;
    };

    return {
        ingestionStart,
        ingestionComplete,
        ingestionReset
    };
}

export default useIngest;
