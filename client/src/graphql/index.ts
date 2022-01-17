/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GraphQL Client
 *
 * This file configures and exports apollo client and apollo uploader client.
 */
import { ApolloClient, InMemoryCache, NormalizedCacheObject, OperationVariables, MutationOptions, FetchResult, QueryOptions, ApolloQueryResult, ApolloClientOptions, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { createUploadLink } from 'apollo-upload-client';
import { apolloFetch } from './utils';
import { DocumentNode } from 'graphql';
import { ROUTES } from '../constants';
import { authenticationFailureMessage } from '../types/server';
import API from '../api';

class PRApolloClient extends ApolloClient<NormalizedCacheObject> {
    constructor(options: ApolloClientOptions<NormalizedCacheObject>) { // eslint-disable-line @typescript-eslint/no-useless-constructor
        super(options);
    }

    async query<T = any, TVariables = OperationVariables>(options: QueryOptions<TVariables>): Promise<ApolloQueryResult<T>> {
        let retValue: any;
        try {
            retValue = await super.query(options);
        } catch (error) {
            this.handleException(error);
        }
        return retValue;
    }

    async mutate<T = any, TVariables = OperationVariables>(options: MutationOptions<T, TVariables>): Promise<FetchResult<T>> {
        // console.log('PRApolloClient.mutate');
        let retValue: any;
        try {
            retValue = await super.mutate(options);
        } catch (error) {
            this.handleException(error);
        }
        return retValue;
    }

    private handleException(error: any): void {
        const message: string = (error instanceof Error) ? `: ${error.message}` : '';
        console.log(`Apollo Client Error${message}`);
        throw error;
    }
}

const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
            console.log(`[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`);
            if (message.includes(authenticationFailureMessage)) {
                global.alert('The Packrat user is no longer authenticated. Please login.');
                window.location.href = ROUTES.LOGIN;
            }
        });
    }

    if (networkError) {
        console.log(`[Network error]: ${networkError}`);
        if (networkError.toString() !== 'TypeError: Failed to fetch') {
            global.alert('The Packrat user is no longer authenticated. Please login.');
            window.location.href = ROUTES.LOGIN;
        }
    }
});

function configureApolloClient(): ApolloClient<NormalizedCacheObject> {
    const serverEndpoint = API.serverEndpoint();
    const uri: string = `${serverEndpoint}/graphql`;
    console.log(`Packrat using server endpoint ${serverEndpoint} to access graphql @ ${uri}`);

    const uploadLink = createUploadLink({
        uri,
        credentials: 'include',
        fetch: apolloFetch
    });

    const client = new PRApolloClient({
        link: from([errorLink, uploadLink]),
        cache: new InMemoryCache()
    });

    return client;
}

const apolloClient = configureApolloClient();

interface IApolloUploader {
    mutation: DocumentNode;
    variables: unknown;
    useUpload: boolean;
    refetchQueries?: string[];
    onProgress: (event: ProgressEvent) => void;
    onCancel: (cancelHandler: () => void) => void;
}

async function apolloUploader(options: IApolloUploader): Promise<any> {
    const { mutation, variables, useUpload, refetchQueries, onProgress, onCancel } = options;

    // console.log('apolloUploader apolloClient.mutate');
    return await apolloClient.mutate({
        mutation,
        variables,
        refetchQueries,
        context: {
            fetchOptions: {
                useUpload,
                onProgress,
                onCancel
            }
        }
    });
}

export { apolloClient, apolloUploader };
