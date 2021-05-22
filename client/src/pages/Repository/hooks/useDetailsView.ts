/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { useQuery, FetchResult } from '@apollo/client';
import { apolloClient } from '../../../graphql';
import {
    GetAssetDetailsForSystemObjectDocument,
    GetAssetDetailsForSystemObjectQueryResult,
    GetSystemObjectDetailsDocument,
    GetSystemObjectDetailsQueryResult,
    GetVersionsForAssetDocument,
    GetVersionsForAssetQueryResult,
    GetDetailsTabDataForObjectDocument,
    GetDetailsTabDataForObjectQueryResult,
    UpdateObjectDetailsDocument,
    UpdateObjectDetailsDataInput,
    UpdateObjectDetailsMutation,
    UpdateSourceObjectsDocument,
    UpdateDerivedObjectsDocument,
    DeleteObjectConnectionDocument,
    DeleteIdentifierDocument,
    RollbackSystemObjectVersionDocument
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

export function useObjectVersions(idSystemObject: number): GetVersionsForAssetQueryResult {
    return useQuery(GetVersionsForAssetDocument, {
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

export async function deleteObjectConnection(idSystemObjectMaster: number, idSystemObjectDerived: number, type: string, systemObjectType: number) {
    return await apolloClient.mutate({
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
    });
}

export async function deleteIdentifier(idIdentifier: number) {
    return await apolloClient.mutate({
        mutation: DeleteIdentifierDocument,
        variables: {
            input: {
                idIdentifier
            }
        }
    });
}

export async function rollbackSystemObjectVersion(idSystemObjectVersion: number) {
    return await apolloClient.mutate({
        mutation: RollbackSystemObjectVersionDocument,
        variables: {
            input: {
                idSystemObjectVersion
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}
