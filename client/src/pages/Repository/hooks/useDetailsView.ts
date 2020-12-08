import { useQuery } from '@apollo/client';
import { GetAssetDetailsForSystemObjectDocument, GetAssetDetailsForSystemObjectQueryResult, GetSystemObjectDetailsDocument, GetSystemObjectDetailsQueryResult, GetVersionsForSystemObjectDocument, GetVersionsForSystemObjectQueryResult } from '../../../types/graphql';

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

