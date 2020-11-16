import { useQuery } from '@apollo/client';
import { GetSystemObjectDetailsDocument, GetSystemObjectDetailsQueryResult } from '../../../types/graphql';

export function useObjectDetails(idSystemObject: number): GetSystemObjectDetailsQueryResult {
    return useQuery(GetSystemObjectDetailsDocument, {
        variables: {
            input: {
                idSystemObject
            }
        }
    });
}