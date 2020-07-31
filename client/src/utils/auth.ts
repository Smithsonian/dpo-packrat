import { apolloClient, QUERY_GET_CURRENT_USER } from '../graphql';
import { User } from '../types/graphql';
import { QueryOptions } from 'apollo-client';

export async function getAuthenticatedUser(): Promise<User | null> {
    const queryOptions: QueryOptions = {
        query: QUERY_GET_CURRENT_USER,
        fetchPolicy: 'network-only'
    };

    try {
        const { data } = await apolloClient.query(queryOptions);
        const { getCurrentUser } = data;

        return getCurrentUser.User;
    } catch {
        return null;
    }
}
