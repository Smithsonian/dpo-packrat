/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

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
    UpdateDerivedObjectsDocument,
    DeleteObjectConnectionDocument
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

export function updateSourceObjects(idSystemObject: number, sources: number[], PreviouslySelected: number[]) {
    return apolloClient.mutate({
        mutation: UpdateSourceObjectsDocument,
        variables: {
            input: {
                idSystemObject,
                Sources: sources,
                PreviouslySelected
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}

export function updateDerivedObjects(idSystemObject: number, derivatives: number[], PreviouslySelected: number[]) {
    return apolloClient.mutate({
        mutation: UpdateDerivedObjectsDocument,
        variables: {
            input: {
                idSystemObject,
                Derivatives: derivatives,
                PreviouslySelected
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}

export function deleteObjectConnection(idSystemObjectMaster: number, idSystemObjectDerived: number, type: string, systemObjectType: number) {
    return apolloClient.mutate({
        mutation: DeleteObjectConnectionDocument,
        variables: {
            input: {
                idSystemObjectMaster,
                idSystemObjectDerived
            }
        },
        refetchQueries: [{
            query: GetSystemObjectDetailsDocument,
            variables: {
                input: {
                    idSystemObject: type === 'Source' ? idSystemObjectDerived : idSystemObjectMaster
                }
            }
        }, {
            query: GetDetailsTabDataForObjectDocument,
            variables: {
                input: {
                    idSystemObject: type === 'Source' ? idSystemObjectDerived : idSystemObjectMaster,
                    objectType: systemObjectType
                }
            }
        }],
        awaitRefetchQueries: true
    })
}