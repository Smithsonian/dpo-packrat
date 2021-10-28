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

type IngestionStartResult = {
    success: boolean;
    message: string;
};

interface UseIngest {
    ingestionStart: () => Promise<IngestionStartResult>;
    ingestionComplete: () => void;
    ingestionReset: () => void;
}

function useIngest(): UseIngest {
    const [removeSelectedUploads, resetUploads, getSelectedFiles, completed] = useUploadStore(state => [state.removeSelectedUploads, state.reset, state.getSelectedFiles, state.completed]);
    const [subjects, resetSubjects] = useSubjectStore(state => [state.subjects, state.reset]);
    const [getSelectedProject, resetProjects] = useProjectStore(state => [state.getSelectedProject, state.reset]);
    const [getSelectedItem, resetItems] = useItemStore(state => [state.getSelectedItem, state.reset]);
    const [metadatas, getSelectedIdentifiers, resetMetadatas, getMetadatas] = useMetadataStore(state => [state.metadatas, state.getSelectedIdentifiers, state.reset, state.getMetadatas]);
    const getAssetType = useVocabularyStore(state => state.getAssetType);

    const history = useHistory();

    const ingestionStart = async (): Promise<IngestionStartResult> => {
        try {
            // This hash will act as an easy check if a selected file contains an idAsset
            const idToIdAssetMap: Map<string, number> = new Map<string, number>(); // map of file.id (idAssetVersion) -> file.idAsset
            const selectedFiles = getSelectedFiles(completed, true);
            selectedFiles.forEach(({ id, idAsset }) => {
                if (idAsset)
                    idToIdAssetMap.set(id, idAsset);
            });

            const ingestSubjects: IngestSubjectInput[] = subjects.map(({ id, arkId, name, unit }) => ({
                id: id || null,
                arkId,
                name,
                unit
            }));

            const project: StateProject = getSelectedProject() || { id: 0, name: '', selected: false };

            const ingestProject: IngestProjectInput = {
                id: project.id,
                name: project.name
            };

            const item: StateItem = getSelectedItem() || { id: '', entireSubject: false, selected: false, name: '' };

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

            const metadatasList = metadatas.length === 0 ? getMetadatas() : metadatas;
            lodash.forEach(metadatasList, metadata => {
                console.log('ingestionStart metadata', metadata);
                const { file, photogrammetry, model, scene, other } = metadata;
                const { photogrammetry: isPhotogrammetry, model: isModel, scene: isScene, other: isOther } = getAssetType(file.type);

                if (isPhotogrammetry) {
                    const {
                        dateCaptured,
                        datasetType,
                        systemCreated,
                        name,
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
                        folders,
                        sourceObjects,
                        derivedObjects
                    } = photogrammetry;

                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);
                    const ingestFolders: IngestFolderInput[] = getIngestFolders(folders);

                    const photogrammetryData: IngestPhotogrammetryInput = {
                        idAssetVersion: parseFileId(file.id),
                        name,
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
                        clusterGeometryFieldId,
                        sourceObjects,
                        derivedObjects
                    };

                    const idAsset: number | undefined = idToIdAssetMap.get(file.id);
                    if (idAsset)
                        photogrammetryData.idAsset = idAsset;

                    ingestPhotogrammetry.push(photogrammetryData);
                }

                if (isModel) {
                    const {
                        identifiers,
                        systemCreated,
                        name,
                        creationMethod,
                        modality,
                        units,
                        purpose,
                        modelFileType,
                        directory,
                        sourceObjects,
                        derivedObjects
                    } = model;

                    let {
                        dateCaptured
                    } = model;

                    if (!dateCaptured) {
                        dateCaptured = '';
                    } else if (typeof dateCaptured === 'object') {
                        dateCaptured = nonNullValue<string>('datecaptured', dateCaptured.toISOString());
                    }

                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);

                    const modelData: IngestModelInput = {
                        name,
                        idAssetVersion: parseFileId(file.id),
                        dateCaptured,
                        identifiers: ingestIdentifiers,
                        creationMethod: nonNullValue<number>('creationMethod', creationMethod),
                        modality: nonNullValue<number>('modality', modality),
                        units: nonNullValue<number>('units', units),
                        purpose: nonNullValue<number>('purpose', purpose),
                        modelFileType: nonNullValue<number>('modelFileType', modelFileType),
                        directory,
                        systemCreated,
                        sourceObjects,
                        derivedObjects
                    };

                    const idAsset: number | undefined = idToIdAssetMap.get(file.id);
                    if (idAsset)
                        modelData.idAsset = idAsset;

                    ingestModel.push(modelData);
                }

                if (isScene) {
                    const { identifiers, systemCreated, approvedForPublication, posedAndQCd, name, directory, sourceObjects,
                        derivedObjects } = scene;
                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);

                    const sceneData: IngestSceneInput = {
                        idAssetVersion: parseFileId(file.id),
                        identifiers: ingestIdentifiers,
                        systemCreated,
                        name,
                        approvedForPublication,
                        posedAndQCd,
                        directory,
                        sourceObjects,
                        derivedObjects
                    };

                    const idAsset: number | undefined = idToIdAssetMap.get(file.id);
                    if (idAsset)
                        sceneData.idAsset = idAsset;

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

                    const idAsset: number | undefined = idToIdAssetMap.get(file.id);
                    if (idAsset) {
                        otherData.idAsset = idAsset;
                        otherData.systemCreated = false;
                    }
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
            console.log('** IngestDataInput', input);

            const ingestDataMutation: FetchResult<IngestDataMutation> = await apolloClient.mutate({
                mutation: IngestDataDocument,
                variables: { input },
                refetchQueries: ['getUploadedAssetVersion']
            });

            const { data } = ingestDataMutation;
            if (data) {
                const { ingestData } = data;
                const { success, message } = ingestData;

                return { success, message: message || '' };
            }

        } catch (error) {
            if (error instanceof Error)
                toast.error(error.toString());
        }

        return { success: false, message: 'unable to start ingestion process' };
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
                const { identifier, identifierType, idIdentifier } = data;

                const identifierData: IngestIdentifierInput = {
                    identifier,
                    idIdentifier,
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
