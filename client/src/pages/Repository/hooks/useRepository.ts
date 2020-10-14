import { ApolloQueryResult, QueryResult, useQuery } from '@apollo/client';
import { apolloClient } from '../../../graphql';
import { GetObjectChildrenDocument, GetObjectChildrenQuery, GetObjectChildrenQueryVariables } from '../../../types/graphql';
import { eMetadata, eSystemObjectType } from '../../../types/server';

function useGetRootObjects(objectTypes: eSystemObjectType[], metadataColumns: eMetadata[]): QueryResult<GetObjectChildrenQuery> {
    return useQuery<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>(GetObjectChildrenDocument, {
        variables: {
            input: {
                idRoot: 0,
                objectTypes,
                metadataColumns
            }
        }
    });
}

function getObjectChildren(idRoot: number, metadataColumns: eMetadata[]): Promise<ApolloQueryResult<GetObjectChildrenQuery>> {
    return apolloClient.query({
        query: GetObjectChildrenDocument,
        variables: {
            input: {
                idRoot,
                objectTypes: [],
                metadataColumns
            }
        }
    });
}

export { useGetRootObjects, getObjectChildren };
