import { useContext } from 'react';
import { AppContext, StateItem, StateProject, StateIdentifier, defaultItem, IngestionDispatchAction, METADATA_ACTIONS, parseFileId } from '../../../context';
import useItem from './useItem';
import useProject from './useProject';
import useMetadata from './useMetadata';
import { IngestDataMutation, IngestIdentifierInput, IngestFolderInput, IngestPhotogrammetryInput, IngestDataDocument, IngestSubjectInput } from '../../../types/graphql';
import { apolloClient } from '../../../graphql';
import lodash from 'lodash';
import { FetchResult } from '@apollo/client';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router';
import { HOME_ROUTES, resolveSubRoute, INGESTION_ROUTES_TYPE } from '../../../constants/routes';
import useVocabularyEntries from './useVocabularyEntries';

interface UseIngest {
    ingestPhotogrammetryData: () => Promise<boolean>;
    ingestionComplete: () => void;
}

function useIngest(): UseIngest {
    const {
        ingestion: { subjects, metadatas },
        ingestionDispatch
    } = useContext(AppContext);

    const history = useHistory();

    const { getSelectedProject } = useProject();
    const { getSelectedItem } = useItem();
    const { getSelectedIdentifiers } = useMetadata();
    const { getAssetType } = useVocabularyEntries();

    const ingestPhotogrammetryData = async (): Promise<boolean> => {
        try {
            let ingestProject = {};
            let ingestItem = {};

            const ingestPhotogrammetry: IngestPhotogrammetryInput[] = [];

            const ingestSubjects: IngestSubjectInput[] = subjects.map(subject => ({
                ...subject,
                id: subject.id || null
            }));

            const project: StateProject | undefined = getSelectedProject();

            if (project) {
                const { id, name } = project;
                ingestProject = {
                    id,
                    name
                };
            }

            const item: StateItem | undefined = getSelectedItem();

            if (item) {
                const { id, name, entireSubject } = item;

                const isDefaultItem = id === defaultItem.id;

                let ingestItemId: number | null = null;

                if (!isDefaultItem) {
                    ingestItemId = Number.parseInt(id, 10);
                }

                ingestItem = {
                    id: ingestItemId,
                    name,
                    entireSubject
                };
            }

            lodash.forEach(metadatas, metadata => {
                const { file, photogrammetry } = metadata;
                const { photogrammetry: isPhotogrammetry } = getAssetType(file.type);

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
                        clusterGeometryFieldId
                    } = photogrammetry;

                    const ingestIdentifiers: IngestIdentifierInput[] = [];
                    const identifiers: StateIdentifier[] | undefined = getSelectedIdentifiers(metadata);

                    if (identifiers) {
                        lodash.forEach(identifiers, data => {
                            const { identifier, identifierType } = data;
                            if (!identifierType) {
                                throw Error('Identifer type is null');
                            }

                            const identifierData: IngestIdentifierInput = {
                                identifier,
                                identifierType
                            };
                            ingestIdentifiers.push(identifierData);
                        });
                    }

                    const ingestFolders: IngestFolderInput[] = [];
                    lodash.forEach(photogrammetry.folders, folder => {
                        const { name, variantType } = folder;

                        if (!variantType) {
                            throw Error('Folder variantType type is null');
                        }

                        const folderData = {
                            name,
                            variantType
                        };

                        ingestFolders.push(folderData);
                    });

                    if (!datasetType) {
                        throw Error('Dataset Type type is null');
                    }

                    const photogrammetryData = {
                        idAssetVersion: parseFileId(file.id),
                        dateCaptured: dateCaptured.toISOString(),
                        datasetType,
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
                        directory: '', // TODO: Ques: what is directory and how do we get it?
                        clusterType,
                        clusterGeometryFieldId
                    };
                    ingestPhotogrammetry.push(photogrammetryData);
                }
            });

            const variables = {
                input: {
                    subjects: ingestSubjects,
                    project: ingestProject,
                    item: ingestItem,
                    photogrammetry: ingestPhotogrammetry
                }
            };

            const ingestDataMutation: FetchResult<IngestDataMutation> = await apolloClient.mutate({
                mutation: IngestDataDocument,
                variables,
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

    const ingestionComplete = (): void => {
        const ingestionCompleteAction: IngestionDispatchAction = {
            type: METADATA_ACTIONS.INGESTION_COMPLETE
        };

        ingestionDispatch(ingestionCompleteAction);

        const nextRoute = resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTES_TYPE.UPLOADS);
        history.push(nextRoute);
    };

    return {
        ingestPhotogrammetryData,
        ingestionComplete
    };
}

export default useIngest;
