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
    UpdateObjectDetailsMutation
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

export function updateDetailsTabData(idSystemObject: number, objectType: eSystemObjectType, data: UpdateObjectDetailsDataInput): Promise<FetchResult<UpdateObjectDetailsMutation>> {
    return apolloClient.mutate({
        mutation: UpdateObjectDetailsDocument,
        variables: {
            input: {
                idSystemObject,
                objectType,
                data
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}
