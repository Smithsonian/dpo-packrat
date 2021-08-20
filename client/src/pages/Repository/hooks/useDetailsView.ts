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
    UpdateObjectDetailsDocument,
    UpdateObjectDetailsDataInput,
    UpdateObjectDetailsMutation,
    UpdateSourceObjectsDocument,
    UpdateDerivedObjectsDocument,
    DeleteObjectConnectionDocument,
    DeleteIdentifierDocument,
    RollbackSystemObjectVersionDocument,
    GetLicenseListDocument,
    ClearLicenseAssignmentDocument,
    AssignLicenseDocument,
    ClearLicenseAssignmentMutation,
    AssignLicenseMutation
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

export async function getObjectAssets(idSystemObject: number) {
    return await apolloClient.query({
        query: GetAssetDetailsForSystemObjectDocument,
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

export async function getDetailsTabDataForObject(idSystemObject: number, objectType: eSystemObjectType) {
    return await apolloClient.query({
        query: GetDetailsTabDataForObjectDocument,
        variables: {
            input: {
                idSystemObject,
                objectType
            }
        }
    });
}

export function updateDetailsTabData(
    idSystemObject: number,
    idObject: number,
    objectType: eSystemObjectType,
    data: UpdateObjectDetailsDataInput
): Promise<FetchResult<UpdateObjectDetailsMutation>> {
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
        refetchQueries: [
            {
                query: GetSystemObjectDetailsDocument,
                variables: {
                    input: {
                        idSystemObject: type === 'Source' ? idSystemObjectDerived : idSystemObjectMaster
                    }
                }
            },
            {
                query: GetDetailsTabDataForObjectDocument,
                variables: {
                    input: {
                        idSystemObject: type === 'Source' ? idSystemObjectDerived : idSystemObjectMaster,
                        objectType: systemObjectType
                    }
                }
            }
        ],
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

export async function getLicenseList() {
    return await apolloClient.query({
        query: GetLicenseListDocument,
        variables: {
            input: {
                search: ''
            }
        },
        fetchPolicy: 'no-cache'
    });
}

export async function clearLicenseAssignment(idSystemObject: number, clearAll?: boolean): Promise<FetchResult<ClearLicenseAssignmentMutation>> {
    return await apolloClient.mutate({
        mutation: ClearLicenseAssignmentDocument,
        variables: {
            input: {
                idSystemObject,
                clearAll
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}

export async function assignLicense(idSystemObject: number, idLicense: number): Promise<FetchResult<AssignLicenseMutation>> {
    return await apolloClient.mutate({
        mutation: AssignLicenseDocument,
        variables: {
            input: {
                idLicense,
                idSystemObject
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}
