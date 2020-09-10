import { useContext } from 'react';
import { AppContext, StateItem, StateProject, StateIdentifier, defaultItem, IngestionDispatchAction, METADATA_ACTIONS } from '../../../context';
import useItem from './useItem';
import useProject from './useProject';
import useMetadata from './useMetadata';
import { IngestDataMutation, IngestIdentifier, IngestFolder, IngestPhotogrammetry, IngestDataDocument, IngestSubject } from '../../../types/graphql';
import { apolloClient } from '../../../graphql';
import lodash from 'lodash';
import { FetchResult } from '@apollo/client';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router';
import { HOME_ROUTES, resolveSubRoute, INGESTION_ROUTES_TYPE } from '../../../constants/routes';

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

    const ingestPhotogrammetryData = async (): Promise<boolean> => {
        let ingestProject = {};
        let ingestItem = {};

        const ingestPhotogrammetry: IngestPhotogrammetry[] = [];

        const ingestSubjects: IngestSubject[] = subjects.map(subject => ({
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

            const ingestIdentifiers: IngestIdentifier[] = [];
            const identifiers: StateIdentifier[] | undefined = getSelectedIdentifiers(metadata);

            if (identifiers) {
                lodash.forEach(identifiers, data => {
                    const { identifier, identifierType } = data;
                    if (!identifierType) {
                        throw Error('Identifer type is null');
                    }

                    const identifierData: IngestIdentifier = {
                        identifier,
                        identifierType
                    };
                    ingestIdentifiers.push(identifierData);
                });
            }

            const ingestFolders: IngestFolder[] = [];
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
                idAssetVersion: Number.parseInt(file.id, 10),
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
                clusterType,
                clusterGeometryFieldId
            };

            ingestPhotogrammetry.push(photogrammetryData);
        });

        const variables = {
            input: {
                subjects: ingestSubjects,
                project: ingestProject,
                item: ingestItem,
                photogrammetry: ingestPhotogrammetry
            }
        };

        try {
            const ingestDataMutation: FetchResult<IngestDataMutation> = await apolloClient.mutate({
                mutation: IngestDataDocument,
                variables
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
