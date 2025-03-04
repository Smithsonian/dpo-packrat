/**
 * Ingest Hook
 *
 * This custom hooks provides easy access ingestion functionality.
 */
import { FetchResult } from '@apollo/client';
import lodash from 'lodash';
import { useNavigate } from 'react-router';
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
    useItemStore,
    useMetadataStore,
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
    IngestSceneAttachmentInput,
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
    ingestionReset: (isFullReset?: boolean) => void;
}

function useIngest(): UseIngest {
    const [removeSelectedUploads, resetUploads, getSelectedFiles, completed] = useUploadStore(state => [state.removeSelectedUploads, state.reset, state.getSelectedFiles, state.completed]);
    const [subjects, resetSubjects] = useSubjectStore(state => [state.subjects, state.reset]);
    const [getSelectedItem, resetItems] = useItemStore(state => [state.getSelectedItem, state.reset]);
    const [metadatas, getSelectedIdentifiers, resetMetadatas, getMetadatas] = useMetadataStore(state => [state.metadatas, state.getSelectedIdentifiers, state.reset, state.getMetadatas]);
    const getAssetType = useVocabularyStore(state => state.getAssetType);

    const navigate = useNavigate();

    const ingestionStart = async (): Promise<IngestionStartResult> => {
        try {
            // This hash will act as an easy check if a selected file contains an idAsset
            const idToIdAssetMap: Map<string, number> = new Map<string, number>(); // map of file.id (idAssetVersion) -> file.idAsset
            const selectedFiles = getSelectedFiles(completed, true);
            selectedFiles.forEach(({ id, idAsset }) => {
                if (idAsset)
                    idToIdAssetMap.set(id, idAsset);
            });

            const ingestSubjects: IngestSubjectInput[] = subjects.map(({ id, arkId, name, unit, collectionId }) => ({
                id: id || null,
                arkId,
                collectionId,
                name,
                unit
            }));

            const item: StateItem = getSelectedItem() || { id: '', entireSubject: false, selected: false, subtitle: '', idProject: -1, projectName: '' };
            // console.log('item',item);

            const isDefaultItem = item.id === defaultItem.id;

            let ingestItemId: number | null = null;

            if (!isDefaultItem || isNewItem(item.id)) {
                ingestItemId = Number.parseInt(item.id, 10);
            }

            const ingestItem: IngestItemInput = {
                id: ingestItemId,
                subtitle: subjects && subjects.length > 1 ? '' : item.subtitle,
                entireSubject: item.entireSubject as boolean,
                name: subjects && subjects.length > 1 ? item.subtitle : subjects && subjects.length === 1 ? subjects[0].name : ''
            };

            const ingestProject: IngestProjectInput = {
                id: item.idProject,
                name: item.projectName
            };

            const ingestPhotogrammetry: IngestPhotogrammetryInput[] = [];
            const ingestModel: IngestModelInput[] = [];
            const ingestScene: IngestSceneInput[] = [];
            const ingestOther: IngestOtherInput[] = [];
            const ingestSceneAttachment: IngestSceneAttachmentInput[] = [];

            const metadatasList = metadatas.length === 0 ? getMetadatas() : metadatas;
            lodash.forEach(metadatasList, metadata => {
                // console.log('ingestionStart metadata',metadata);
                const { file, photogrammetry, model, scene, other, sceneAttachment } = metadata;
                const { photogrammetry: isPhotogrammetry, model: isModel, scene: isScene, attachment: isAttachment, other: isOther } = getAssetType(file.type);

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
                        derivedObjects,
                        updateNotes,
                        datasetUse,
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
                        derivedObjects,
                        datasetUse,
                    };

                    const idAsset: number | undefined = idToIdAssetMap.get(file.id);
                    if (idAsset) {
                        photogrammetryData.idAsset = idAsset;
                        photogrammetryData.updateNotes = updateNotes;
                    }

                    // console.log(`useIngest ingestionStart pushing photogrammetry ${JSON.stringify(photogrammetryData)}`);
                    ingestPhotogrammetry.push(photogrammetryData);
                }

                if (isModel) {
                    const {
                        identifiers,
                        systemCreated,
                        creationMethod,
                        modality,
                        units,
                        purpose,
                        modelFileType,
                        directory,
                        sourceObjects,
                        derivedObjects,
                        updateNotes,
                        subtitles,
                        skipSceneGenerate
                    } = model;

                    let {
                        dateCreated
                    } = model;

                    if (!dateCreated) {
                        dateCreated = '';
                    } else if (typeof dateCreated === 'object') {
                        dateCreated = nonNullValue<string>('dateCreated', dateCreated.toISOString());
                    }
                    // console.log('model',model);

                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);
                    const selectedSubtitle = subtitles.find(subtitle => subtitle.selected);
                    const modelData: IngestModelInput = {
                        subtitle: selectedSubtitle?.value as string,
                        idAssetVersion: parseFileId(file.id),
                        dateCreated,
                        identifiers: ingestIdentifiers,
                        creationMethod: nonNullValue<number>('creationMethod', creationMethod),
                        modality: nonNullValue<number>('modality', modality),
                        units: nonNullValue<number>('units', units),
                        purpose: nonNullValue<number>('purpose', purpose),
                        modelFileType: nonNullValue<number>('modelFileType', modelFileType),
                        directory,
                        systemCreated,
                        sourceObjects,
                        derivedObjects,
                        skipSceneGenerate
                    };
                    // console.log('modelData', modelData);

                    const idAsset: number | undefined = idToIdAssetMap.get(file.id);
                    if (idAsset) {
                        modelData.idAsset = idAsset;
                        modelData.updateNotes = updateNotes;
                    }

                    // console.log(`useIngest ingestionStart pushing model ${JSON.stringify(modelData)}`);
                    ingestModel.push(modelData);
                }

                if (isScene) {
                    const { identifiers, systemCreated, approvedForPublication, posedAndQCd, directory, sourceObjects,
                        derivedObjects, updateNotes, subtitles } = scene;
                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);
                    const selectedSubtitle = subtitles.find(subtitle => subtitle.selected);
                    const sceneData: IngestSceneInput = {
                        idAssetVersion: parseFileId(file.id),
                        identifiers: ingestIdentifiers,
                        systemCreated,
                        subtitle: selectedSubtitle?.value as string,
                        approvedForPublication,
                        posedAndQCd,
                        directory,
                        sourceObjects,
                        derivedObjects
                    };

                    const idAsset: number | undefined = idToIdAssetMap.get(file.id);
                    if (idAsset) {
                        sceneData.idAsset = idAsset;
                        sceneData.updateNotes = updateNotes;
                    }

                    // console.log(`useIngest ingestionStart pushing scene ${JSON.stringify(sceneData)}`);
                    ingestScene.push(sceneData);
                }

                if (isAttachment) {
                    const { type, category, units, modelType, fileType, gltfStandardized, dracoCompressed, title, idAssetVersion, systemCreated, identifiers } = sceneAttachment;
                    const ingestIdentifiers: IngestIdentifierInput[] = getIngestIdentifiers(identifiers);
                    const sceneAttachmentData: IngestSceneAttachmentInput = {
                        type,
                        category,
                        units,
                        modelType,
                        fileType,
                        gltfStandardized,
                        dracoCompressed,
                        title,
                        idAssetVersion,
                        systemCreated,
                        identifiers: ingestIdentifiers
                    };
                    // console.log(`useIngest ingestionStart pushing attachment ${JSON.stringify(sceneAttachmentData)}`);
                    ingestSceneAttachment.push(sceneAttachmentData);
                }

                if (isOther) {
                    const { identifiers, systemCreated, updateNotes } = other;

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
                        otherData.updateNotes = updateNotes;
                    }

                    // console.log(`useIngest ingestionStart pushing other ${JSON.stringify(otherData)}`);
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
                other: ingestOther,
                sceneAttachment: ingestSceneAttachment
            };
            console.log('** IngestDataInput',input);

            //This responsible for initiating sending data to the server.
            const ingestDataMutation: FetchResult<IngestDataMutation> = await apolloClient.mutate({
                mutation: IngestDataDocument,
                variables: { input },
                refetchQueries: ['getUploadedAssetVersion']
            });

            //Throws an error if the inges Data was successful or not.  Throws a toast.
            const { data } = ingestDataMutation;
            if (data) {
                const { ingestData } = data;
                const { success, message } = ingestData;

                return { success, message: message || '' };
            }
        //This error message is auto-generated.  It does not lead to a custom message unless there's a throw.
        } catch (error) {
            const message: string = (error instanceof Error) ? `: ${error.message}` : '';
            toast.error(`Ingestion failed ${message}`);
        }

        return { success: false, message: 'unable to start ingestion process' };
    };

    const resetIngestionState = () => {
        resetSubjects();
        resetItems();
        resetMetadatas();
    };

    const ingestionComplete = (): void => {
        removeSelectedUploads();
        resetIngestionState();
        const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.UPLOADS);
        navigate(nextRoute);
    };

    const ingestionReset = (isFullReset?: boolean): void => {
        isFullReset && resetUploads();
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
                variantType
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
