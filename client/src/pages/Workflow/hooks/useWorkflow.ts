import { ApolloQueryResult } from '@apollo/client';
import { apolloClient } from '../../../graphql';
import { GetWorkflowListDocument, GetWorkflowListInput, GetWorkflowListQuery } from '../../../types/graphql';

export async function getWorkflowList(filter: GetWorkflowListInput): Promise<ApolloQueryResult<GetWorkflowListQuery>> {
    return await apolloClient.query({
        query: GetWorkflowListDocument,
        fetchPolicy: 'no-cache',
        variables: {
            input: {
                ...filter
            }
        }
    });
}
