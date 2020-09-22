import { eSystemObjectType, eMetadata } from '../../../types/server';
import { useQuery, useLazyQuery, ApolloError } from '@apollo/client';
import { GetObjectChildrenDocument, GetObjectChildrenQuery, GetObjectChildrenQueryVariables } from '../../../types/graphql';

interface UseGetRootObjects {
    getRootObjectsData: GetObjectChildrenQuery | undefined;
    getRootObjectsLoading: boolean;
    getRootObjectsError: ApolloError | undefined;
}

function useGetRootObjects(objectTypes: eSystemObjectType[]): UseGetRootObjects {
    const { data: getRootObjectsData, loading: getRootObjectsLoading, error: getRootObjectsError } = useQuery<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>(
        GetObjectChildrenDocument,
        {
            variables: {
                input: {
                    idRoot: 0,
                    objectTypes,
                    metadataColumns: [eMetadata.eUnitAbbreviation, eMetadata.eSubjectIdentifier, eMetadata.eItemName]
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

function useGetObjectChildren(idRoot: number): UseGetObjectChildren {
    const [getObjectChildren, { data: getObjectChildrenData, loading: getObjectChildrenLoading, error: getObjectChildrenError }] = useLazyQuery<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>(
        GetObjectChildrenDocument,
        {
            variables: {
                input: {
                    idRoot,
                    objectTypes: [],
                    metadataColumns: [eMetadata.eUnitAbbreviation, eMetadata.eSubjectIdentifier, eMetadata.eItemName]
                }
            }
        }
    );

    return {
        getObjectChildren,
        getObjectChildrenData,
        getObjectChildrenLoading,
        getObjectChildrenError
    };
}

export { useGetRootObjects, useGetObjectChildren };
