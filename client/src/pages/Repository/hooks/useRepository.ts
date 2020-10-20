import { ApolloQueryResult } from '@apollo/client';
import { apolloClient } from '../../../graphql';
import { GetObjectChildrenDocument, GetObjectChildrenQuery } from '../../../types/graphql';
import { eMetadata, eSystemObjectType } from '../../../types/server';

function getObjectChildrenForRoot(objectTypes: eSystemObjectType[], metadataColumns: eMetadata[]): Promise<ApolloQueryResult<GetObjectChildrenQuery>> {
    return apolloClient.query({
        query: GetObjectChildrenDocument,
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

export { getObjectChildrenForRoot, getObjectChildren };
