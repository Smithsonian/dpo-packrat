import { useQuery, FetchResult } from '@apollo/client';
import { apolloClient } from '../../../graphql';
import {
    GetAssetDetailsForSystemObjectDocument,
    GetAssetDetailsForSystemObjectQueryResult,
    GetSystemObjectDetailsDocument,
    GetSystemObjectDetailsQueryResult,
    GetVersionsForSystemObjectDocument,
    GetVersionsForSystemObjectQueryResult,
    GetDetailsTabDataForObjectDocument,
    GetDetailsTabDataForObjectQueryResult,
    UpdateObjectDetailsDocument,
    UpdateObjectDetailsDataInput,
    UpdateObjectDetailsMutation,
    UpdateSourceObjectsDocument,
    UpdateDerivedObjectsDocument

} from '../../../types/graphql';
import { eSystemObjectType } from '../../../types/server';

export function useObjectDetails(idSystemObject: number): GetSystemObjectDetailsQueryResult {
    return useQuery(GetSystemObjectDetailsDocument, {
        variables: {
            input: {
                idSystemObject
            }
        }
    });
}

export function useObjectAssets(idSystemObject: number): GetAssetDetailsForSystemObjectQueryResult {
    return useQuery(GetAssetDetailsForSystemObjectDocument, {
        variables: {
            input: {
                idSystemObject
            }
        }
    });
}

export function useObjectVersions(idSystemObject: number): GetVersionsForSystemObjectQueryResult {
    return useQuery(GetVersionsForSystemObjectDocument, {
        variables: {
            input: {
                idSystemObject
            }
        }
    });
}

export function useDetailsTabData(idSystemObject: number, objectType: eSystemObjectType): GetDetailsTabDataForObjectQueryResult {
    return useQuery(GetDetailsTabDataForObjectDocument, {
        variables: {
            input: {
                idSystemObject,
                objectType
            }
        }
    });
}

export function updateDetailsTabData(idSystemObject: number, idObject: number, objectType: eSystemObjectType, data: UpdateObjectDetailsDataInput): Promise<FetchResult<UpdateObjectDetailsMutation>> {
    return apolloClient.mutate({
        mutation: UpdateObjectDetailsDocument,
        variables: {
            input: {
                idSystemObject,
                idObject,
                objectType,
                data
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}

export function updateSourceObjects(idSystemObject: number, sources: number[]) {
    return apolloClient.mutate({
        mutation: UpdateSourceObjectsDocument,
        variables: {
            input: {
                idSystemObject,
                Sources: sources
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}

export function updateDerivedObjects(idSystemObject: number, derivatives: number[]) {
    return apolloClient.mutate({
        mutation: UpdateDerivedObjectsDocument,
        variables: {
            input: {
                idSystemObject,
                Derivatives: derivatives
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}