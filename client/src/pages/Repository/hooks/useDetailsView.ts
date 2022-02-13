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
    RollbackAssetVersionDocument,
    GetLicenseListDocument,
    ClearLicenseAssignmentDocument,
    AssignLicenseDocument,
    PublishDocument,
    ClearLicenseAssignmentMutation,
    AssignLicenseMutation,
    PublishMutation,
    ExistingRelationship,
    DeleteMetadataDocument,
    GetUnitsFromNameSearchQueryResult,
    GetUnitsFromNameSearchDocument,
    GetEdanUnitsNamedQueryResult,
    GetEdanUnitsNamedDocument,
} from '../../../types/graphql';
import { eSystemObjectType, ePublishedState } from '@dpo-packrat/common';

export function useObjectDetails(idSystemObject: number): GetSystemObjectDetailsQueryResult {
    return useQuery(GetSystemObjectDetailsDocument, {
        variables: {
            input: {
                idSystemObject
            }
        },
        fetchPolicy: 'no-cache'
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
        },
        fetchPolicy: 'no-cache'
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
        },
        fetchPolicy: 'no-cache'
    });
}

export async function updateDetailsTabData(
    idSystemObject: number,
    idObject: number,
    objectType: eSystemObjectType,
    data: UpdateObjectDetailsDataInput
): Promise<FetchResult<UpdateObjectDetailsMutation>> {
    return await apolloClient.mutate({
        mutation: UpdateObjectDetailsDocument,
        variables: {
            input: {
                idSystemObject,
                idObject,
                objectType,
                data
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject', 'getAssetDetailsForSystemObject']
    });
}

export async function updateSourceObjects(idSystemObject: number, objectType: number, sources: ExistingRelationship[], PreviouslySelected: ExistingRelationship[]) {
    return await apolloClient.mutate({
        mutation: UpdateSourceObjectsDocument,
        variables: {
            input: {
                idSystemObject,
                ChildObjectType: objectType,
                Sources: sources,
                PreviouslySelected
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject'],
        awaitRefetchQueries: true
    });
}

export async function updateDerivedObjects(idSystemObject: number, objectType: number, derivatives: ExistingRelationship[], PreviouslySelected: ExistingRelationship[]) {
    return await apolloClient.mutate({
        mutation: UpdateDerivedObjectsDocument,
        variables: {
            input: {
                idSystemObject,
                ParentObjectType: objectType,
                Derivatives: derivatives,
                PreviouslySelected
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject'],
        awaitRefetchQueries: true
    });
}

export async function deleteObjectConnection(idSystemObjectMaster: number, objectTypeMaster: eSystemObjectType, idSystemObjectDerived: number, objectTypeDerived: eSystemObjectType) {
    return await apolloClient.mutate({
        mutation: DeleteObjectConnectionDocument,
        variables: {
            input: {
                idSystemObjectMaster,
                objectTypeMaster,
                idSystemObjectDerived,
                objectTypeDerived
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject'],
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
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}

export async function rollbackSystemObjectVersion(idSystemObjectVersion: number, rollbackNotes: string) {
    return await apolloClient.mutate({
        mutation: RollbackSystemObjectVersionDocument,
        variables: {
            input: {
                idSystemObjectVersion,
                rollbackNotes
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}

export async function rollbackAssetVersion(idAssetVersion: number, rollbackNotes: string) {
    return await apolloClient.mutate({
        mutation: RollbackAssetVersionDocument,
        variables: {
            input: {
                idAssetVersion,
                rollbackNotes
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
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject', 'getAssetDetailsForSystemObject']
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
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject', 'getAssetDetailsForSystemObject']
    });
}

export async function publish(idSystemObject: number, eState: ePublishedState): Promise<FetchResult<PublishMutation>> {
    return await apolloClient.mutate({
        mutation: PublishDocument,
        variables: {
            input: {
                idSystemObject,
                eState
            }
        },
        refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}

export async function deleteMetadata(idMetadata: number) {
    return await apolloClient.mutate({
        mutation: DeleteMetadataDocument,
        variables: {
            input: {
                idMetadata
            }
        },
        // refetchQueries: ['getSystemObjectDetails', 'getDetailsTabDataForObject']
    });
}

export function useAllUnits(): GetUnitsFromNameSearchQueryResult {
    return useQuery(GetUnitsFromNameSearchDocument, {
        variables: {
            input: {
                search: ''
            }
        },
        fetchPolicy: 'no-cache'
    });
}

export function useEdanUnitsNamed(): GetEdanUnitsNamedQueryResult {
    return useQuery(GetEdanUnitsNamedDocument, {
        variables: {
        },
        fetchPolicy: 'no-cache'
    });
}
