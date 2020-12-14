import { useQuery } from '@apollo/client';
import {
    GetAssetDetailsForSystemObjectDocument,
    GetAssetDetailsForSystemObjectQueryResult,
    GetSystemObjectDetailsDocument,
    GetSystemObjectDetailsQueryResult,
    GetVersionsForSystemObjectDocument,
    GetVersionsForSystemObjectQueryResult,
    GetDetailsTabDataForObjectDocument,
    GetDetailsTabDataForObjectQueryResult
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

