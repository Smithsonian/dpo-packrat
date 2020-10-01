import { eSystemObjectType, eMetadata } from '../../../types/server';
import { useQuery, useLazyQuery, ApolloError } from '@apollo/client';
import { GetObjectChildrenDocument, GetObjectChildrenQuery, GetObjectChildrenQueryVariables } from '../../../types/graphql';
import { RepositoryFilter } from '..';

interface UseGetRootObjects {
    getRootObjectsData: GetObjectChildrenQuery | undefined;
    getRootObjectsLoading: boolean;
    getRootObjectsError: ApolloError | undefined;
}


function useGetRootObjects(objectTypes: eSystemObjectType[], filter: RepositoryFilter): UseGetRootObjects {
    const { data: getRootObjectsData, loading: getRootObjectsLoading, error: getRootObjectsError } = useQuery<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>(
        GetObjectChildrenDocument,
        {
            variables: {
                input: {
                    idRoot: 0,
                    objectTypes,
                    metadataColumns: getMetadataColumnsForFilter(filter)
                }
            }
        }
    );

    return {
        getRootObjectsData,
        getRootObjectsLoading,
        getRootObjectsError
    };
}

interface UseGetObjectChildren {
    getObjectChildren: () => void;
    getObjectChildrenData: GetObjectChildrenQuery | undefined;
    getObjectChildrenLoading: boolean;
    getObjectChildrenError: ApolloError | undefined;
}

function useGetObjectChildren(idRoot: number, filter: RepositoryFilter): UseGetObjectChildren {
    const [getObjectChildren, { data: getObjectChildrenData, loading: getObjectChildrenLoading, error: getObjectChildrenError }] = useLazyQuery<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>(
        GetObjectChildrenDocument,
        {
            variables: {
                input: {
                    idRoot,
                    objectTypes: [],
                    metadataColumns: getMetadataColumnsForFilter(filter)
                }
            }
        }
    );

    return {
        getObjectChildren,
        getObjectChildrenData,
        getObjectChildrenLoading,
        getObjectChildrenError,
    };
}

function getMetadataColumnsForFilter(filter: RepositoryFilter): eMetadata[] {
    const metadataColumns: eMetadata[] = [eMetadata.eSubjectIdentifier, eMetadata.eItemName];

    if (filter.units || filter.projects) {
        metadataColumns.unshift(eMetadata.eUnitAbbreviation);
    }

    return metadataColumns;
}

export { useGetRootObjects, useGetObjectChildren };
